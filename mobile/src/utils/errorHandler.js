import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

/**
 * handleApiError
 *
 * Maps network and server response codes to clean user-facing error banners
 * and automates logout redirects for 401 Unauthorized sessions.
 *
 * @param {Error} error - The captured API error
 * @param {Function} [logoutFn] - Optional callback to clear memory states in AuthContext
 */
export const handleApiError = async (error, logoutFn = null) => {
  let userMessage = 'Something went wrong. Please try again.';

  if (error) {
    const errorMsg = String(error.message || '').toLowerCase();
    const status = error.status || error.response?.status;

    // 1. Network / Timeout Errors
    if (
      errorMsg.includes('network') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('timeout')
    ) {
      userMessage = 'No internet connection. Please check your network.';
    }
    // 2. 401 Unauthorized Session Expired
    else if (status === 401 || errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
      userMessage = 'Session expired. Please log in again.';

      try {
        await AsyncStorage.multiRemove(['zabatly_user', 'token']);
      } catch (_) {
        // Safe fallback
      }

      if (logoutFn) {
        logoutFn();
      }

      router.replace('/auth/login');
      Alert.alert('Session Expired', userMessage);
      return userMessage;
    }
    // 3. 429 Rate Limits
    else if (status === 429 || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
      userMessage = 'Too many requests. Please wait a moment.';
    }
    // 4. 500 Server Failures
    else if (status === 500 || errorMsg.includes('500') || errorMsg.includes('server error')) {
      userMessage = 'Something went wrong. Please try again.';
    }
    // 5. Generic response messages
    else {
      userMessage = error.message || userMessage;
    }
  }

  Alert.alert('Error', userMessage);
  return userMessage;
};

export default handleApiError;
