import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'zabatly_user';

const AuthContext = createContext(undefined);

/**
 * AuthProvider
 *
 * Persists { user, token } to AsyncStorage under 'zabatly_user'.
 * On mount, restores the session automatically so the user stays
 * logged in across app restarts.
 *
 * Exposes:
 *   user      — the user object (or null)
 *   token     — the JWT string (or null)
 *   isLoading — true while restoring session from storage
 *   login     — saves credentials and updates state
 *   logout    — clears credentials and resets state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on app start ──────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user ?? null);
          setToken(parsed.token ?? null);

          // Also store the raw token under 'token' so the API client
          // interceptor can read it without parsing the full object.
          if (parsed.token) {
            await AsyncStorage.setItem('token', parsed.token);
          }
        }
      } catch {
        // Corrupted or unavailable storage: start fresh where possible.
        try {
          await AsyncStorage.multiRemove([STORAGE_KEY, 'token']);
        } catch {
          // Native storage can be unavailable in a mismatched Expo Go runtime.
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────
  // Accepts the full response from POST /api/auth/login, which returns
  // { user: {...}, token: '...' } or { ...userData, token: '...' }.
  const login = useCallback(async (userData) => {
    // Normalize: the server might return the user data at the top level
    // with a token field, or nested under a `user` key.
    const tokenValue = userData.token;
    const userValue = userData.user ?? { ...userData, token: undefined };

    // Remove the token from the user object to keep storage clean
    if (userValue.token) {
      delete userValue.token;
    }

    setUser(userValue);
    setToken(tokenValue);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: userValue, token: tokenValue }),
      );
      // Store raw token separately for the API interceptor
      await AsyncStorage.setItem('token', tokenValue);
    } catch {
      // Storage write failed — state is still updated in memory
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);

    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, 'token']);
    } catch {
      // Best-effort clear
    }
  }, []);

  // ── Refresh user from API response (keeps existing token) ─────────────
  const refreshUser = useCallback(async (userData) => {
    const tokenValue = userData?.token ?? token ?? (await AsyncStorage.getItem('token'));
    const incoming = userData?.user ?? { ...userData, token: undefined };

    if (incoming?.token) {
      delete incoming.token;
    }

    let mergedUser = incoming;
    setUser((prev) => {
      mergedUser = { ...(prev || {}), ...(incoming || {}) };
      return mergedUser;
    });

    if (tokenValue) {
      setToken(tokenValue);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: mergedUser, token: tokenValue }),
        );
        await AsyncStorage.setItem('token', tokenValue);
      } catch {
        // Storage write failed — state is still updated in memory
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 *
 * Usage:
 *   const { user, token, login, logout, isLoading } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
