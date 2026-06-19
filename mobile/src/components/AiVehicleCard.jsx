import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function AiVehicleCard({ vehicle, onPress }) {
  const imageUrl = vehicle.images?.[0] || null;
  const transmission =
    vehicle.transmission === 'automatic'
      ? 'Automatic'
      : vehicle.transmission === 'manual'
        ? 'Manual'
        : vehicle.transmission || 'Auto';
  const capacity = vehicle.capacity ? `${vehicle.capacity} seats` : null;
  const meta = [vehicle.type, capacity, transmission].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="car-outline" size={24} color={colors.ashSecondary} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {vehicle.make} {vehicle.model}
        </Text>
        {!!meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>
            {(vehicle.price_per_day ?? vehicle.pricePerDay)?.toLocaleString('en-US') ?? '—'}
            <Text style={styles.priceUnit}> EGP/day</Text>
          </Text>
          <Text style={styles.link}>View</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.sandCream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stoneBorder,
    padding: spacing.sm,
  },
  image: {
    width: 96,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
  },
  imagePlaceholder: {
    width: 96,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontFamily: fontFamily.semiBold,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  price: {
    ...typography.bodyMedium,
    color: colors.navy.default,
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    fontFamily: fontFamily.regular,
  },
  link: {
    ...typography.labelSmall,
    color: colors.navy.light,
    fontFamily: fontFamily.semiBold,
  },
});
