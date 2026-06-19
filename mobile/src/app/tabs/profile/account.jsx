import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/api/client';
import { syncFullProfile } from '@/utils/profileSync';
import { toDateKey, formatDisplayDate, toServerDateString } from '@/utils/bookingDates';
import ProfileScreenHeader from '@/components/profile/ProfileScreenHeader';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function toDateInput(value) {
  if (!value) return '';
  return toDateKey(value);
}

function buildFormFromUser(user) {
  return {
    phone: user?.phone || '',
    city: user?.city || '',
    nationality: user?.nationality || '',
    gender: user?.gender || '',
    dateOfBirth: toDateInput(user?.dateOfBirth),
    emergencyContactName: user?.emergencyContact?.name || '',
    emergencyContactPhone: user?.emergencyContact?.phone || '',
    emergencyContactRelation: user?.emergencyContact?.relation || '',
  };
}

function FormField({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function AccountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState(buildFormFromUser(user));
  const [initialForm, setInitialForm] = useState(buildFormFromUser(user));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const allowLeaveRef = useRef(false);
  const isDirtyRef = useRef(false);
  const firstLoadRef = useRef(true);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await syncFullProfile(refreshUser);
      const next = buildFormFromUser(data);
      setForm(next);
      setInitialForm(next);
    } catch (err) {
      if (firstLoadRef.current) {
        Alert.alert('Could not load profile', err.message || 'Try again later.');
      }
    } finally {
      firstLoadRef.current = false;
      setLoading(false);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      allowLeaveRef.current = false;
      if (!isDirtyRef.current) {
        loadProfile();
      }
    }, [loadProfile]),
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = useCallback(
    async (navigateBack = false) => {
      try {
        setSaving(true);
        const payload = {
          phone: form.phone.trim(),
          city: form.city.trim(),
          nationality: form.nationality.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth || undefined,
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
          emergencyContactRelation: form.emergencyContactRelation.trim(),
        };

        await updateProfile(payload);
        const data = await syncFullProfile(refreshUser);
        const next = buildFormFromUser(data);
        setForm(next);
        setInitialForm(next);

        if (navigateBack) {
          allowLeaveRef.current = true;
          router.back();
        }
      } catch (err) {
        Alert.alert('Save failed', err.message || 'Could not save profile.');
      } finally {
        setSaving(false);
      }
    },
    [form, refreshUser],
  );

  const confirmLeave = useCallback(() => {
    Alert.alert('Unsaved changes', 'Save your changes before leaving this screen?', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: "Don't save",
        style: 'destructive',
        onPress: () => {
          allowLeaveRef.current = true;
          router.back();
        },
      },
      {
        text: 'Save',
        onPress: () => handleSave(true),
      },
    ]);
  }, [handleSave]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current || !isDirty || saving) return;
      event.preventDefault();
      confirmLeave();
    });
    return unsubscribe;
  }, [navigation, isDirty, saving, confirmLeave]);

  const handleBack = () => {
    if (isDirty) {
      confirmLeave();
      return;
    }
    allowLeaveRef.current = true;
    router.back();
  };

  const handleAvatarPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingPhoto(true);
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('profilePhoto', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });

      await updateProfile(formData);
      await syncFullProfile(refreshUser);
    } catch (err) {
      Alert.alert('Upload failed', err.message || 'Could not update profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const dobDate = form.dateOfBirth
    ? new Date(`${form.dateOfBirth}T12:00:00`)
    : new Date(2000, 0, 1);
  const photoUrl = user?.profilePhoto || user?.profilePicture || null;

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <ProfileScreenHeader title="Account details" onBack={handleBack} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.navy.default} />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                isDirty && { paddingBottom: spacing.xxxl + touchTarget.button },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.avatarSection}>
                <ProfileAvatar
                  name={user?.name}
                  photoUrl={photoUrl}
                  size={72}
                  editable
                  loading={uploadingPhoto}
                  onPress={handleAvatarPress}
                />
                <View style={styles.avatarMeta}>
                  <Text style={styles.readOnlyName}>{user?.name}</Text>
                  <Text style={styles.readOnlyEmail}>{user?.email}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Contact</Text>
              <View style={styles.section}>
                <FormField label="Phone">
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v)}
                    placeholder="Phone number"
                    placeholderTextColor={colors.ashSecondary}
                    keyboardType="phone-pad"
                  />
                </FormField>
                <FormField label="City">
                  <TextInput
                    style={styles.input}
                    value={form.city}
                    onChangeText={(v) => updateField('city', v)}
                    placeholder="Current city"
                    placeholderTextColor={colors.ashSecondary}
                  />
                </FormField>
                <FormField label="Nationality">
                  <TextInput
                    style={styles.input}
                    value={form.nationality}
                    onChangeText={(v) => updateField('nationality', v)}
                    placeholder="e.g. Egyptian"
                    placeholderTextColor={colors.ashSecondary}
                  />
                </FormField>
              </View>

              <Text style={styles.sectionLabel}>Personal</Text>
              <View style={styles.section}>
                <FormField label="Gender">
                  <View style={styles.chipRow}>
                    {GENDER_OPTIONS.map((option) => {
                      const selected = form.gender === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => updateField('gender', option.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </FormField>

                <FormField label="Date of birth">
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.inputButtonText,
                        !form.dateOfBirth && styles.inputPlaceholder,
                      ]}
                    >
                      {formatDisplayDate(form.dateOfBirth)}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker ? (
                    <DateTimePicker
                      value={dobDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(event, selected) => {
                        if (Platform.OS !== 'ios') setShowDatePicker(false);
                        if (event.type === 'dismissed') return;
                        if (selected) updateField('dateOfBirth', toServerDateString(selected));
                      }}
                    />
                  ) : null}
                  {Platform.OS === 'ios' && showDatePicker ? (
                    <TouchableOpacity
                      style={styles.dateDoneBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.dateDoneText}>Done</Text>
                    </TouchableOpacity>
                  ) : null}
                </FormField>
              </View>

              <Text style={styles.sectionLabel}>Emergency contact (optional)</Text>
              <View style={styles.section}>
                <FormField label="Name">
                  <TextInput
                    style={styles.input}
                    value={form.emergencyContactName}
                    onChangeText={(v) => updateField('emergencyContactName', v)}
                    placeholder="Contact name"
                    placeholderTextColor={colors.ashSecondary}
                  />
                </FormField>
                <FormField label="Phone">
                  <TextInput
                    style={styles.input}
                    value={form.emergencyContactPhone}
                    onChangeText={(v) => updateField('emergencyContactPhone', v)}
                    placeholder="Contact phone"
                    placeholderTextColor={colors.ashSecondary}
                    keyboardType="phone-pad"
                  />
                </FormField>
                <FormField label="Relation">
                  <TextInput
                    style={styles.input}
                    value={form.emergencyContactRelation}
                    onChangeText={(v) => updateField('emergencyContactRelation', v)}
                    placeholder="e.g. Brother"
                    placeholderTextColor={colors.ashSecondary}
                  />
                </FormField>
              </View>
            </ScrollView>

            {isDirty ? (
              <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={() => handleSave(false)}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.sandCream} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarMeta: {
    flex: 1,
    minWidth: 0,
  },
  readOnlyName: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  readOnlyEmail: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  section: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
  input: {
    ...typography.body,
    color: colors.duskText,
    backgroundColor: colors.sandCream,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: touchTarget.input,
  },
  inputButton: {
    backgroundColor: colors.sandCream,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    minHeight: touchTarget.input,
    justifyContent: 'center',
  },
  inputButtonText: {
    ...typography.body,
    color: colors.duskText,
  },
  inputPlaceholder: {
    color: colors.ashSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    backgroundColor: colors.sandCream,
  },
  chipSelected: {
    borderColor: colors.navy.default,
    backgroundColor: colors.navy.default,
  },
  chipText: {
    ...typography.labelSmall,
    color: colors.duskText,
    fontFamily: fontFamily.medium,
  },
  chipTextSelected: {
    color: colors.sandCream,
  },
  dateDoneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  dateDoneText: {
    ...typography.label,
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
  },
  saveBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stoneBorder,
    backgroundColor: colors.sandCream,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.md,
    minHeight: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.sandCream,
    fontFamily: fontFamily.semiBold,
  },
});
