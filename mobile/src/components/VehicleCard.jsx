import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

const VehicleCard = React.memo(function VehicleCard({ vehicle }) {
  if (!vehicle) return null;

  const imageUrl = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

  const handlePress = () => {
    router.push({
      pathname: '/tabs/browse/[id]',
      params: { id: vehicle._id },
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="car-outline" size={36} color={colors.ashSecondary} />
          </View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {vehicle.make} {vehicle.model}
        </Text>

        <Text style={styles.city} numberOfLines={1}>
          {vehicle.city || 'Egypt'}
        </Text>

        <Text style={styles.price}>
          {vehicle.price_per_day?.toLocaleString('en-US') ?? '—'} <Text style={styles.dayLabel}>EGP/day</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    ...shadows.card,
    flex: 1,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.stoneBorder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmLinen,
  },
  info: {
    padding: spacing.sm,
  },
  title: {
    ...typography.titleSmall,
    color: colors.duskText,
  },
  city: {
    ...typography.bodySmall,
    color: colors.ashSecondary,
    marginVertical: 2,
  },
  price: {
    ...typography.numeric,
    color: colors.amber.default,
  },
  dayLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
  },
});

export default VehicleCard;
