import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import colors from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function VehicleSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.contentPlaceholder}>
        <View style={styles.titlePlaceholder} />
        <View style={styles.cityPlaceholder} />
        <View style={styles.pricePlaceholder} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warmLinen,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    flex: 1,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.stoneBorder,
  },
  contentPlaceholder: {
    padding: spacing.sm,
  },
  titlePlaceholder: {
    width: '75%',
    height: 16,
    backgroundColor: colors.stoneBorder,
    borderRadius: radius.xs,
    marginBottom: 8,
  },
  cityPlaceholder: {
    width: '45%',
    height: 12,
    backgroundColor: colors.stoneBorder,
    borderRadius: radius.xs,
    marginBottom: 8,
  },
  pricePlaceholder: {
    width: '60%',
    height: 14,
    backgroundColor: colors.stoneBorder,
    borderRadius: radius.xs,
  },
});
