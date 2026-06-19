import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import shadows from '@/theme/shadows';
import { spacing, radius, touchTarget } from '@/theme/spacing';

const { width: screenWidth } = Dimensions.get('window');

// Individual Confetti Particle Component
function ConfettiParticle({ index }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue((Math.random() - 0.5) * 160); // Random side drift
  const opacity = useSharedValue(1);
  const scale = useSharedValue(Math.random() * 0.8 + 0.4);

  useEffect(() => {
    // Tasteful upward float transition
    translateY.value = withTiming(-350 - Math.random() * 150, {
      duration: 1800 + Math.random() * 1200,
    });
    // Smooth fade out
    opacity.value = withTiming(0, {
      duration: 1800 + Math.random() * 1200,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Curated premium color options (warm amber, gold, linen sand, ash gray)
  const colorsList = [
    colors.amber.default,
    colors.amber.bright,
    colors.ashSecondary,
    colors.warmLinen,
    '#d4cec4',
  ];
  const color = colorsList[index % colorsList.length];

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        { backgroundColor: color },
      ]}
    />
  );
}

export default function SuccessScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Reanimated checkmark spring scale
  const checkmarkScale = useSharedValue(0);

  useEffect(() => {
    checkmarkScale.value = withSpring(1, {
      damping: 10,
      stiffness: 80,
    });
  }, []);

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      {/* Tasteful Confetti Particles (Non-blocking) */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {Array.from({ length: 15 }).map((_, i) => (
          <ConfettiParticle key={i} index={i} />
        ))}
      </View>

      {/* Main Success Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.checkmarkCircle, checkmarkAnimatedStyle]}>
          <Ionicons name="checkmark-circle" size={90} color={colors.amber.default} />
        </Animated.View>

        <Text style={styles.title}>Booking Confirmed!</Text>

        <Text style={styles.subtitle}>
          Your ride is locked in. The host has been notified.
        </Text>

        {bookingId && (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>Booking ID</Text>
            <Text style={styles.idValue} selectTextOnFocus={true}>
              {bookingId}
            </Text>
          </View>
        )}
      </View>

      {/* Stacked Action Buttons */}
      <View style={styles.buttonContainer}>
        {/* Browse More Cars Button */}
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.replace('/tabs/browse')}
          activeOpacity={0.85}
        >
          <Text style={styles.browseButtonText}>Browse More Cars</Text>
        </TouchableOpacity>

        {/* View My Bookings Button */}
        <TouchableOpacity
          style={styles.bookingsButton}
          onPress={() => router.replace('/tabs/bookings')}
          activeOpacity={0.85}
        >
          <Text style={styles.bookingsButtonText}>View My Bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sandCream,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    marginBottom: spacing.md,
    ...shadows.card,
    borderRadius: radius.full,
    backgroundColor: colors.sandCream,
  },
  title: {
    ...typography.display,
    color: colors.duskText,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: colors.ashSecondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.md,
  },
  idCard: {
    backgroundColor: colors.warmLinen,
    borderColor: colors.stoneBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    minWidth: 200,
  },
  idLabel: {
    ...typography.labelSmall,
    color: colors.ashSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  idValue: {
    ...typography.bodyMedium,
    color: colors.duskText,
    fontWeight: '700',
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  browseButton: {
    width: '100%',
    backgroundColor: colors.amber.default,
    borderRadius: radius.sm,
    height: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ambient,
  },
  browseButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  bookingsButton: {
    width: '100%',
    backgroundColor: colors.navy.default,
    borderRadius: radius.sm,
    height: touchTarget.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingsButtonText: {
    ...typography.button,
    color: colors.sandCream,
    fontWeight: '700',
  },
});
