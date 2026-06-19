import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import colors from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function VehicleListSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.image} />
      <View style={styles.titleLine} />
      <View style={styles.cityLine} />
      <View style={styles.priceLine} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.sm,
  },
  titleLine: {
    width: '55%',
    height: 18,
    borderRadius: radius.xs,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.xs,
  },
  cityLine: {
    width: '30%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.xs,
  },
  priceLine: {
    width: '40%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.warmLinen,
  },
});
