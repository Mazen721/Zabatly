import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { register } from '@/api/client';
import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  city: '',
  gender: '',
  dateOfBirth: '',
  nationality: 'Egyptian',
};

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const opacity = useSharedValue(0);
  const slideX = useSharedValue(0);
  const contentWidth = Math.max(width - spacing.xl * 2, 280);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  useEffect(() => {
    slideX.value = withSpring(-step * contentWidth, { damping: 18, stiffness: 130 });
  }, [contentWidth, slideX, step]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateStepOne = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Fill in your name, email, and password.');
      return false;
    }

    if (!passwordStrength.isStrong) {
      setError('Password needs 8 characters, one uppercase letter, and one symbol.');
      return false;
    }

    setError('');
    return true;
  };

  const validateStepTwo = () => {
    if (!form.phone.trim() || !form.city.trim() || !form.gender || !form.dateOfBirth.trim() || !form.nationality.trim()) {
      setError('Complete your profile details.');
      return false;
    }

    setError('');
    return true;
  };

  const goNext = () => {
    if (validateStepOne()) {
      setStep(1);
    }
  };

  const submit = async () => {
    if (!validateStepTwo()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'renter', // Hardcoded as requested
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        gender: form.gender,
        city: form.city.trim(),
        nationality: form.nationality.trim(),
      });
      router.replace({ pathname: '/auth/login', params: { registered: '1' } });
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
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
            <Text style={styles.tagline}>Set up your rental profile</Text>
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.title}>{step === 0 ? 'Create account' : 'Your profile'}</Text>
            <View style={styles.progressDots}>
              <View style={[styles.progressDot, step === 0 && styles.progressDotActive]} />
              <View style={[styles.progressDot, step === 1 && styles.progressDotActive]} />
            </View>
          </View>

          <View style={[styles.sliderClip, { width: contentWidth }]}>
            <Animated.View style={[styles.slider, { width: contentWidth * 2 }, sliderStyle]}>
              <View style={[styles.stepPanel, { width: contentWidth }]}>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full name</Text>
                  <AuthInput
                    value={form.name}
                    onChangeText={(value) => updateField('name', value)}
                    focused={focusedField === 'name'}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your full name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <AuthInput
                    value={form.email}
                    onChangeText={(value) => updateField('email', value)}
                    focused={focusedField === 'email'}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="example@zabatly.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <AuthInput
                    value={form.password}
                    onChangeText={(value) => updateField('password', value)}
                    focused={focusedField === 'password'}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Create a password"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.strengthWrap}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: passwordStrength.width,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              </View>

              <View style={[styles.stepPanel, { width: contentWidth }]}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone number</Text>
                  <AuthInput
                    value={form.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    focused={focusedField === 'phone'}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="+20 100 000 0000"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City</Text>
                  <AuthInput
                    value={form.city}
                    onChangeText={(value) => updateField('city', value)}
                    focused={focusedField === 'city'}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Cairo"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    <GenderTile
                      label="Male"
                      selected={form.gender === 'male'}
                      onPress={() => updateField('gender', 'male')}
                    />
                    <GenderTile
                      label="Female"
                      selected={form.gender === 'female'}
                      onPress={() => updateField('gender', 'female')}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of birth</Text>
                  <AuthInput
                    value={form.dateOfBirth}
                    onChangeText={(value) => updateField('dateOfBirth', value)}
                    focused={focusedField === 'dateOfBirth'}
                    onFocus={() => setFocusedField('dateOfBirth')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nationality</Text>
                  <AuthInput
                    value={form.nationality}
                    onChangeText={(value) => updateField('nationality', value)}
                    focused={focusedField === 'nationality'}
                    onFocus={() => setFocusedField('nationality')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Egyptian"
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity onPress={() => setError('')} activeOpacity={0.8}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            {step === 1 && (
              <TouchableOpacity style={styles.backButton} disabled={isLoading} onPress={() => setStep(0)} activeOpacity={0.85}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              disabled={isLoading}
              onPress={step === 0 ? goNext : submit}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>{step === 0 ? 'Next' : 'Register'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchLink} onPress={() => router.push('/auth/login')} activeOpacity={0.85}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchAccent}>Login</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthInput({ focused, style, ...props }) {
  return (
    <TextInput
      {...props}
      style={[styles.input, focused && styles.inputFocused, style]}
      placeholderTextColor={colors.ashSecondary}
    />
  );
}

function GenderTile({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.genderTile, selected && styles.genderTileSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.genderText, selected && styles.genderTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getPasswordStrength(password) {
  const passedRules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (passedRules === 3) {
    return {
      label: 'Strong',
      width: '100%',
      color: colors.status.active.text,
      isStrong: true,
    };
  }

  if (passedRules >= 2) {
    return {
      label: 'Fair',
      width: '66%',
      color: colors.amber.default,
      isStrong: false,
    };
  }

  return {
    label: 'Weak',
    width: '33%',
    color: colors.status.error.text,
    isStrong: false,
  };
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.headline,
    color: colors.duskText,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.stoneBorder,
  },
  progressDotActive: {
    backgroundColor: colors.navy.default,
  },
  sliderClip: {
    overflow: 'hidden',
  },
  slider: {
    flexDirection: 'row',
  },
  stepPanel: {
    paddingRight: 0,
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
  strengthWrap: {
    marginTop: -spacing.xs,
  },
  strengthTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: colors.stoneBorder,
  },
  strengthFill: {
    height: 6,
    borderRadius: radius.full,
  },
  strengthLabel: {
    ...typography.labelSmall,
    marginTop: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderTile: {
    flex: 1,
    minHeight: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
  },
  genderTileSelected: {
    borderColor: colors.navy.default,
    backgroundColor: colors.transparent.navy10,
  },
  genderText: {
    ...typography.buttonSmall,
    color: colors.ashSecondary,
  },
  genderTextSelected: {
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backButton: {
    minHeight: touchTarget.button,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
  },
  backButtonText: {
    ...typography.button,
    color: colors.duskText,
  },
  primaryButton: {
    ...shadows.ambient,
    flex: 1,
    minHeight: touchTarget.button,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy.default,
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
