import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

import colors from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

const { width: screenWidth } = Dimensions.get('window');
const heroHeight = screenWidth * (9 / 16);

export default function VehicleDetailSkeleton() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      <View style={styles.hero} />
      <View style={styles.body}>
        <View style={styles.titleLine} />
        <View style={styles.metaLine} />
        <View style={styles.specsBlock} />
        <View style={styles.ownerBlock} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: screenWidth,
    height: heroHeight,
    backgroundColor: colors.warmLinen,
  },
  body: {
    padding: spacing.lg,
  },
  titleLine: {
    width: '70%',
    height: 26,
    borderRadius: radius.xs,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.sm,
  },
  metaLine: {
    width: '45%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.lg,
  },
  specsBlock: {
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.warmLinen,
    marginBottom: spacing.lg,
  },
  ownerBlock: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
});
