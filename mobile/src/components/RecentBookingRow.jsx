import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import colors from '@/theme/colors';
import typography from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import StatusBadge from './StatusBadge';

function formatDateRange(startStr, endStr) {
  const fmt = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  if (!startStr) return '';
  if (!endStr) return fmt(startStr);
  return `${fmt(startStr)} to ${fmt(endStr)}`;
}

export default function RecentBookingRow({ booking, isLast }) {
  if (!booking) return null;

  const vehicle = booking.vehicle;
  const title = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Driver service';
  const imageUrl = vehicle?.images?.[0];

  const handlePress = () => {
    if (vehicle?._id) {
      router.push({
        pathname: '/tabs/browse/[id]',
        params: { id: vehicle._id },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={handlePress}
      disabled={!vehicle?._id}
      activeOpacity={0.75}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name="car-outline" size={20} color={colors.ashSecondary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.dates}>{formatDateRange(booking.startDate, booking.endDate)}</Text>
      </View>
      <StatusBadge status={booking.status} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stoneBorder,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
  },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    color: colors.duskText,
    marginBottom: 2,
  },
  dates: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
  },
});
