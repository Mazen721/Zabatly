import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function OnboardingSplashScreen() {
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const taglinesOpacity = useSharedValue(0);
  const taglinesTranslateY = useSharedValue(12);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    taglinesOpacity.value = withDelay(450, withTiming(1, { duration: 800 }));
    taglinesTranslateY.value = withDelay(450, withSpring(0, { damping: 15, stiffness: 100 }));

    const timer = setTimeout(() => {
      router.replace('/onboarding/slides');
    }, 2500); // 2.5s allows users to appreciate the premium branding

    return () => clearTimeout(timer);
  }, [logoScale, logoOpacity, taglinesOpacity, taglinesTranslateY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglinesStyle = useAnimatedStyle(() => ({
    opacity: taglinesOpacity.value,
    transform: [{ translateY: taglinesTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.brandCenter}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Text style={styles.wordmark}>Zabatly</Text>
          <Text style={styles.arabic}>{'\u0632\u0628\u0637\u0644\u064a'}</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, taglinesStyle]}>
          <Text style={styles.taglineSub}>CONSIDER IT DONE.</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footerWrap, taglinesStyle]}>
        <Text style={styles.tagline}>{'\u0643\u0644\u0647 \u0645\u062a\u0638\u0628\u0637'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandCream,
  },
  brandCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.navy.default,
    fontFamily: fontFamily.extraBold,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1,
  },
  arabic: {
    color: colors.amber.default,
    fontFamily: fontFamily.arabicBold,
    fontSize: 38,
    lineHeight: 52,
  },
  taglineWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  taglineSub: {
    color: colors.navy.light,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 3,
    lineHeight: 18,
  },
  footerWrap: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
  },
  tagline: {
    color: colors.ashSecondary,
    fontFamily: fontFamily.arabicBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
});
