import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius, touchTarget } from '@/theme/spacing';
import ProfileScreenHeader from '@/components/profile/ProfileScreenHeader';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from '@/utils/notificationPrefs';

function PrefRow({ label, description, value, onValueChange, isLast = false }) {
  return (
    <View style={[styles.prefRow, !isLast && styles.prefRowBorder]}>
      <View style={styles.prefCopy}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.stoneBorder, true: colors.navy.light }}
        thumbColor={colors.sandCream}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNotificationPrefs().then((loaded) => {
        if (active) {
          setPrefs(loaded);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const updatePref = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await saveNotificationPrefs(next);
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <ProfileScreenHeader title="Notifications" onBack={() => router.back()} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.navy.default} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Choose what Zabatly can notify you about. These preferences are saved on this device.
          </Text>

          <View style={styles.group}>
            <PrefRow
              label="Booking updates"
              description="Confirmations, trip reminders, and status changes"
              value={prefs.bookingUpdates}
              onValueChange={(value) => updatePref('bookingUpdates', value)}
            />
            <PrefRow
              label="Promotions and tips"
              description="Deals, savings tips, and product updates"
              value={prefs.promotions}
              onValueChange={(value) => updatePref('promotions', value)}
              isLast
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  lead: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  group: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: touchTarget.listItem,
  },
  prefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  prefCopy: {
    flex: 1,
  },
  prefLabel: {
    ...typography.body,
    color: colors.duskText,
    fontFamily: fontFamily.medium,
  },
  prefDesc: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
