import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/api/client';
import { syncFullProfile } from '@/utils/profileSync';
import { getKycStatusMeta } from '@/utils/kycStatus';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileSettingsRow from '@/components/profile/ProfileSettingsRow';

function formatMemberSince(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function RolePill() {
  return (
    <View style={styles.rolePill}>
      <Text style={styles.rolePillText}>Renter</Text>
    </View>
  );
}

function KycChip({ status }) {
  const meta = getKycStatusMeta(status);
  return (
    <View style={[styles.kycChip, { backgroundColor: meta.bg, borderColor: meta.border }]}>
      <Text style={[styles.kycChipText, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
}

export default function ProfileHubScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const syncProfile = useCallback(async () => {
    try {
      await syncFullProfile(refreshUser);
    } catch {
      // Keep cached user if sync fails offline
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      syncProfile();
    }, [syncProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await syncProfile();
    setRefreshing(false);
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

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of Zabatly?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const photoUrl = user?.profilePhoto || user?.profilePicture || null;
  const memberSince = formatMemberSince(user?.createdAt);
  const kycMeta = getKycStatusMeta(user?.kyc_status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy.light} />
        }
      >
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.identityBlock}>
          <ProfileAvatar
            name={user?.name}
            photoUrl={photoUrl}
            editable
            loading={uploadingPhoto}
            onPress={handleAvatarPress}
          />
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || 'Zabatly user'}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email || ''}
          </Text>
          <View style={styles.metaRow}>
            <RolePill />
            {user?.kyc_status === 'verified' ? <KycChip status="verified" /> : null}
          </View>
          {memberSince ? (
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          ) : null}
        </View>

        <View style={styles.group}>
          <ProfileSettingsRow
            label="Verification"
            value={kycMeta.label}
            icon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.navy.light} />}
            onPress={() => router.push('/tabs/profile/kyc')}
          />
          <ProfileSettingsRow
            label="Account details"
            value="Phone, city, personal info"
            icon={<Ionicons name="person-outline" size={20} color={colors.navy.light} />}
            onPress={() => router.push('/tabs/profile/account')}
            isLast
          />
        </View>

        <View style={styles.group}>
          <ProfileSettingsRow
            label="Notifications"
            value="Booking updates and tips"
            icon={<Ionicons name="notifications-outline" size={20} color={colors.navy.light} />}
            onPress={() => router.push('/tabs/profile/notifications')}
          />
          <ProfileSettingsRow
            label="Log out"
            icon={<Ionicons name="log-out-outline" size={20} color={colors.status.error.text} />}
            onPress={handleLogout}
            destructive
            showChevron={false}
            isLast
          />
        </View>
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
  },
  screenTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.duskText,
    marginBottom: spacing.lg,
  },
  identityBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.headline,
    fontSize: 20,
    color: colors.duskText,
    marginTop: spacing.md,
    textAlign: 'center',
    maxWidth: '100%',
  },
  email: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
    maxWidth: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  rolePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
  },
  rolePillText: {
    ...typography.labelSmall,
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kycChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  kycChipText: {
    ...typography.labelSmall,
    fontFamily: fontFamily.semiBold,
  },
  memberSince: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: spacing.sm,
  },
  group: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
});
