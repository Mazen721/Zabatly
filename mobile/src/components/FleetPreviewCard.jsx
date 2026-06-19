import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import colors from '@/theme/colors';
import typography from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

const CARD_WIDTH = 156;

const FleetPreviewCard = React.memo(function FleetPreviewCard({ vehicle }) {
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
            <Ionicons name="car-outline" size={26} color={colors.ashSecondary} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {vehicle.make} {vehicle.model}
      </Text>
      <Text style={styles.price}>
        {vehicle.price_per_day?.toLocaleString('en-US') ?? '—'} EGP/day
      </Text>
    </TouchableOpacity>
  );
});

export default FleetPreviewCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
  imageWrap: {
    width: '100%',
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.xs,
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
    ...typography.bodyMedium,
    fontSize: 14,
    color: colors.duskText,
    marginBottom: 2,
  },
  price: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    fontVariant: ['tabular-nums'],
  },
});
