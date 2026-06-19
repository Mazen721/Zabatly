import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { login } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

export default function LoginScreen() {
  const { registered } = useLocalSearchParams();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(registered ? 'Account created. You can log in now.' : '');
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const submit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      await authLogin(response.data);
      router.replace('/tabs');
    } catch (err) {
      setError(err.message || 'Login failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.logo}>Zabatly</Text>
            <Text style={styles.tagline}>Your smart rental companion</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="example@zabatly.com"
              placeholderTextColor={colors.ashSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.passwordInput, focusedField === 'password' && styles.inputFocused]}>
              <TextInput
                style={styles.passwordField}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                placeholderTextColor={colors.ashSecondary}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsPasswordVisible((value) => !value)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.ashSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
            onPress={submit}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity onPress={() => setError('')} activeOpacity={0.8}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {!!success && (
            <View style={styles.successBanner}>
              <Text style={styles.successMessage}>{success}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.switchLink} onPress={() => router.push('/auth/register')} activeOpacity={0.85}>
            <Text style={styles.switchText}>
              Don&apos;t have an account? <Text style={styles.switchAccent}>Register</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 1.5,
    paddingBottom: spacing.xxxl,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    ...typography.display,
    fontSize: 32,
    color: colors.navy.default,
    fontFamily: fontFamily.extraBold,
  },
  tagline: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    color: colors.ashSecondary,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xl,
    color: colors.duskText,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    color: colors.sand[700],
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    minHeight: touchTarget.input,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.duskText,
    backgroundColor: colors.warmLinen,
  },
  inputFocused: {
    borderColor: colors.navy.default,
  },
  passwordInput: {
    minHeight: touchTarget.input,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    paddingLeft: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmLinen,
  },
  passwordField: {
    ...typography.body,
    flex: 1,
    color: colors.duskText,
  },
  iconButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    ...shadows.ambient,
    minHeight: touchTarget.button,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy.default,
    marginTop: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
  },
  errorMessage: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.status.error.text,
  },
  errorDismiss: {
    ...typography.bodySmall,
    fontFamily: fontFamily.semiBold,
    color: colors.status.error.text,
    textDecorationLine: 'underline',
    marginLeft: spacing.md,
  },
  successBanner: {
    marginTop: spacing.lg,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.status.active.bg,
    borderWidth: 1,
    borderColor: colors.status.active.border,
  },
  successMessage: {
    ...typography.bodySmall,
    color: colors.status.active.text,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: 'auto',
  },
  switchText: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
  switchAccent: {
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
  },
});
