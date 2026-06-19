import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

const VehicleListCard = React.memo(function VehicleListCard({ vehicle }) {
  if (!vehicle) return null;

  const imageUrl = vehicle.images?.length > 0 ? vehicle.images[0] : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/tabs/browse/[id]',
          params: { id: vehicle._id },
        })
      }
      activeOpacity={0.88}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="car-outline" size={32} color={colors.ashSecondary} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {vehicle.make} {vehicle.model}
      </Text>
      <Text style={styles.city} numberOfLines={1}>
        {vehicle.city || 'Egypt'}
      </Text>
      <Text style={styles.price}>
        {vehicle.price_per_day?.toLocaleString('en-US') ?? '—'} EGP/day
      </Text>
    </TouchableOpacity>
  );
});

export default VehicleListCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 17,
    color: colors.duskText,
    marginBottom: 2,
  },
  city: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginBottom: 4,
  },
  price: {
    ...typography.bodyMedium,
    color: colors.navy.default,
    fontVariant: ['tabular-nums'],
  },
});
