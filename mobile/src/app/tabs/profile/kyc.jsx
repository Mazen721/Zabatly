import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';
import { submitKYC } from '@/api/client';
import { syncFullProfile } from '@/utils/profileSync';
import { getKycStatusMeta } from '@/utils/kycStatus';
import ProfileScreenHeader from '@/components/profile/ProfileScreenHeader';

const DOCUMENT_TYPES = [
  {
    id: 'national_id',
    title: 'National ID',
    desc: 'Egyptian national ID card',
    icon: 'card-outline',
  },
  {
    id: 'passport',
    title: 'Passport',
    desc: 'Passport photo page',
    icon: 'document-outline',
  },
];

function StatusBanner({ status }) {
  if (status === 'verified') {
    return (
      <View style={[styles.banner, styles.bannerVerified]}>
        <Ionicons name="checkmark-circle" size={32} color={colors.status.active.text} />
        <Text style={[styles.bannerTitle, { color: colors.status.active.text }]}>Account verified</Text>
        <Text style={[styles.bannerDesc, { color: colors.status.active.text }]}>
          Your identity checks are complete. You can book vehicles on Zabatly.
        </Text>
      </View>
    );
  }

  if (status === 'pending' || status === 'manual_review') {
    return (
      <View style={[styles.banner, styles.bannerPending]}>
        <Ionicons name="time-outline" size={32} color={colors.status.pending.text} />
        <Text style={[styles.bannerTitle, { color: colors.status.pending.text }]}>Under review</Text>
        <Text style={[styles.bannerDesc, { color: colors.status.pending.text }]}>
          We are reviewing your document. This usually takes up to 24 hours.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.bannerNeeded]}>
      <Text style={styles.bannerTitle}>Verification needed</Text>
      <Text style={styles.bannerDesc}>
        Upload a national ID or passport to unlock booking on Zabatly.
      </Text>
    </View>
  );
}

export default function KycScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [selectedDocType, setSelectedDocType] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const kycStatus = user?.kyc_status;
  const isVerified = kycStatus === 'verified';
  const isPending = kycStatus === 'pending' || kycStatus === 'manual_review';
  const showUploadFlow = !isVerified && !isPending;

  useFocusEffect(
    useCallback(() => {
      syncFullProfile(refreshUser).catch(() => {});
    }, [refreshUser]),
  );

  const pickImage = async (source) => {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera or photo access to upload your document.');
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.85,
              allowsEditing: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.85,
              allowsEditing: true,
            });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setSubmitError('');
      }
    } catch {
      Alert.alert('Error', 'Could not open the image picker.');
    }
  };

  const handleUploadPress = () => {
    Alert.alert('Upload document', 'Choose a source for your ID photo.', [
      { text: 'Take photo', onPress: () => pickImage('camera') },
      { text: 'Choose from gallery', onPress: () => pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!selectedDocType || !imageUri || uploading) return;

    try {
      setUploading(true);
      setSubmitError('');

      const formData = new FormData();
      formData.append('doc_type', selectedDocType);
      formData.append('file', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: 'document.jpg',
        type: 'image/jpeg',
      });

      await submitKYC(formData);
      await syncFullProfile(refreshUser);
      setImageUri(null);
      setSelectedDocType(null);
    } catch (err) {
      setSubmitError(err.message || 'Upload failed. Try a clearer photo.');
    } finally {
      setUploading(false);
    }
  };

  const statusMeta = getKycStatusMeta(kycStatus);

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <ProfileScreenHeader title="Verification" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatusBanner status={kycStatus} />

        {!showUploadFlow ? (
          <TouchableOpacity style={styles.backProfileBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backProfileText}>Back to profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Document type</Text>
            <View style={styles.docGroup}>
              {DOCUMENT_TYPES.map((type, index) => {
                const selected = selectedDocType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.docRow, index < DOCUMENT_TYPES.length - 1 && styles.docRowBorder]}
                    onPress={() => setSelectedDocType(type.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.docIcon, selected && styles.docIconSelected]}>
                      <Ionicons
                        name={type.icon}
                        size={20}
                        color={selected ? colors.navy.default : colors.ashSecondary}
                      />
                    </View>
                    <View style={styles.docCopy}>
                      <Text style={styles.docTitle}>{type.title}</Text>
                      <Text style={styles.docDesc}>{type.desc}</Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.navy.default} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDocType ? (
              <>
                <Text style={styles.sectionLabel}>Document photo</Text>
                {imageUri ? (
                  <View style={styles.previewWrap}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
                    <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadArea} onPress={handleUploadPress} activeOpacity={0.85}>
                    <Ionicons name="cloud-upload-outline" size={28} color={colors.navy.light} />
                    <Text style={styles.uploadText}>Tap to upload</Text>
                    <Text style={styles.uploadHint}>Use good lighting and keep the full document in frame.</Text>
                  </TouchableOpacity>
                )}

                {submitError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{submitError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitBtn, (!imageUri || uploading) && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!imageUri || uploading}
                  activeOpacity={0.85}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.sandCream} />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit for verification</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}

            <Text style={styles.statusNote}>Current status: {statusMeta.label}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  banner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  bannerVerified: {
    backgroundColor: colors.status.active.bg,
    borderColor: colors.status.active.border,
  },
  bannerPending: {
    backgroundColor: colors.status.pending.bg,
    borderColor: colors.status.pending.border,
  },
  bannerNeeded: {
    backgroundColor: colors.warmLinen,
    borderColor: colors.stoneBorder,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    ...typography.bodyMedium,
    fontFamily: fontFamily.semiBold,
    color: colors.duskText,
    textAlign: 'center',
  },
  bannerDesc: {
    ...typography.bodySmall,
    lineHeight: 20,
    textAlign: 'center',
  },
  backProfileBtn: {
    minHeight: touchTarget.button,
    borderRadius: radius.md,
    backgroundColor: colors.navy.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backProfileText: {
    ...typography.button,
    color: colors.sandCream,
    fontFamily: fontFamily.semiBold,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  docGroup: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  docRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconSelected: {
    backgroundColor: colors.status.completed.bg,
  },
  docCopy: {
    flex: 1,
  },
  docTitle: {
    ...typography.body,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  docDesc: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  uploadText: {
    ...typography.body,
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
    marginTop: spacing.xs,
  },
  uploadHint: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  previewWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    overflow: 'hidden',
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  removeBtn: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  removeBtnText: {
    ...typography.labelSmall,
    color: colors.status.error.text,
    fontFamily: fontFamily.semiBold,
  },
  errorBox: {
    backgroundColor: colors.status.error.bg,
    borderWidth: 1,
    borderColor: colors.status.error.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.text,
  },
  submitBtn: {
    backgroundColor: colors.navy.default,
    borderRadius: radius.md,
    minHeight: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    ...typography.button,
    color: colors.sandCream,
    fontFamily: fontFamily.semiBold,
  },
  statusNote: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
