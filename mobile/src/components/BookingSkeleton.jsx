import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import colors from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function BookingSkeleton() {
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
    <Animated.View style={[styles.row, { opacity: pulseAnim }]}>
      <View style={styles.thumb} />
      <View style={styles.content}>
        <View style={styles.lineWide} />
        <View style={styles.lineMid} />
        <View style={styles.lineShort} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.stoneBorder,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.stoneBorder,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  lineWide: {
    width: '70%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.stoneBorder,
  },
  lineMid: {
    width: '50%',
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.stoneBorder,
  },
  lineShort: {
    width: '35%',
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.stoneBorder,
  },
});
