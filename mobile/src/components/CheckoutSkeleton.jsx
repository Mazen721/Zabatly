import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import colors from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function CheckoutSkeleton() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={[styles.wrap, { opacity: pulse }]}>
      <View style={styles.recap} />
      <View style={styles.block} />
      <View style={styles.blockTall} />
      <View style={styles.methodRow} />
      <View style={styles.methodRow} />
      <View style={styles.methodRow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  recap: {
    height: 112,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
  block: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
  blockTall: {
    height: 168,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
  methodRow: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.warmLinen,
  },
});
