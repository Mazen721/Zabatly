import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

import colors from '@/theme/colors';
import typography, { fontFamily } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 4;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

const visaLogo = require('../../assets/images/visa-logo.png');
const mastercardLogo = require('../../assets/images/creditcard-logo.png');

function getBrandGradient(brand) {
  if (brand === 'Visa') {
    return {
      colors: ['#1434cb', '#1b2b44', '#0f1623'],
      locations: [0, 0.58, 1],
    };
  }
  if (brand === 'Mastercard') {
    return {
      colors: ['#2c2723', '#151e30', '#c4701b'],
      locations: [0, 0.58, 1],
    };
  }
  return {
    colors: ['#1b2b44', '#0f1623'],
    locations: [0, 1],
  };
}

function BrandMark({ brand }) {
  if (brand === 'Visa') {
    return (
      <View style={styles.brandMark}>
        <Image source={visaLogo} style={styles.brandLogoVisa} contentFit="contain" />
      </View>
    );
  }
  if (brand === 'Mastercard') {
    return (
      <View style={styles.brandMark}>
        <Image source={mastercardLogo} style={styles.brandLogoMc} contentFit="contain" />
      </View>
    );
  }
  return (
    <View style={styles.brandMark}>
      <Ionicons name="card-outline" size={18} color={colors.navy.default} />
    </View>
  );
}

function CardChip() {
  return (
    <View style={styles.chip}>
      <View style={styles.chipInner} />
      <View style={styles.chipLineH} />
      <View style={styles.chipLineV} />
    </View>
  );
}

function BrandDecoration({ brand }) {
  if (brand === 'Mastercard') {
    return (
      <>
        <View style={[styles.mcCircle, styles.mcCircleRed]} />
        <View style={[styles.mcCircle, styles.mcCircleOrange]} />
      </>
    );
  }
  if (brand === 'Visa') {
    return <View style={styles.visaStripe} />;
  }
  return <View style={styles.defaultGlow} />;
}

function CardShell({ brand, children }) {
  const gradient = getBrandGradient(brand);

  return (
    <View style={[styles.cardShell, { backgroundColor: gradient.colors[0] }]}>
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BrandDecoration brand={brand} />
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function CardFront({ brand, displayNumber, displayName, displayExpiry }) {
  return (
    <CardShell brand={brand}>
      <View style={styles.cardHeader}>
        <Text style={styles.payLabel}>Zabatly Pay</Text>
        <BrandMark brand={brand} />
      </View>
      <CardChip />
      <Text style={styles.cardNumber}>{displayNumber}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerCol}>
          <Text style={styles.footerMeta}>Cardholder</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={[styles.footerCol, styles.footerColRight]}>
          <Text style={styles.footerMeta}>Expires</Text>
          <Text style={styles.footerValue}>{displayExpiry}</Text>
        </View>
      </View>
    </CardShell>
  );
}

function CardBack({ brand, displayCvv }) {
  return (
    <CardShell brand={brand}>
      <View style={styles.magneticStrip} />
      <View style={styles.cvvBlock}>
        <Text style={styles.footerMeta}>Security code</Text>
        <View style={styles.cvvRow}>
          <View style={styles.cvvPlaceholder} />
          <Text style={styles.cvvValue}>{displayCvv}</Text>
        </View>
      </View>
      <View style={styles.cardHeader}>
        <Text style={styles.payLabel}>Zabatly Pay</Text>
        <BrandMark brand={brand} />
      </View>
    </CardShell>
  );
}

export default function CreditCardPreview({
  brand,
  cardNumber,
  cardName,
  cardExpiry,
  cardCvv,
  isFlipped,
}) {
  const progress = useSharedValue(isFlipped ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFlipped ? 1 : 0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [isFlipped, progress]);

  const frontStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'android') {
      return {
        opacity: interpolate(progress.value, [0, 1], [1, 0]),
      };
    }
    const rotate = interpolate(progress.value, [0, 1], [0, 180]);
    return {
      opacity: interpolate(progress.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]),
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'android') {
      return {
        opacity: interpolate(progress.value, [0, 1], [0, 1]),
      };
    }
    const rotate = interpolate(progress.value, [0, 1], [180, 360]);
    return {
      opacity: interpolate(progress.value, [0, 0.49, 0.5, 1], [0, 0, 1, 1]),
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
    };
  });

  const displayNumber = cardNumber || '0000 0000 0000 0000';
  const displayName = cardName.trim() || 'Your Name';
  const displayExpiry = cardExpiry || 'MM/YY';
  const displayCvv = cardCvv || '•••';

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.face, frontStyle]}>
        <CardFront
          brand={brand}
          displayNumber={displayNumber}
          displayName={displayName}
          displayExpiry={displayExpiry}
        />
      </Animated.View>

      <Animated.View style={[styles.face, backStyle]}>
        <CardBack brand={brand} displayCvv={displayCvv} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardShell: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 22, 35, 0.3)',
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  mcCircle: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  mcCircleRed: {
    top: -32,
    right: -32,
    backgroundColor: 'rgba(235, 0, 27, 0.35)',
  },
  mcCircleOrange: {
    top: -32,
    right: 32,
    backgroundColor: 'rgba(247, 158, 27, 0.35)',
  },
  visaStripe: {
    position: 'absolute',
    right: -40,
    top: 0,
    bottom: 0,
    width: 128,
    backgroundColor: 'rgba(250, 248, 245, 0.12)',
    transform: [{ skewX: '-18deg' }],
  },
  defaultGlow: {
    position: 'absolute',
    top: -48,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(221, 143, 36, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  payLabel: {
    ...typography.labelSmall,
    color: 'rgba(250, 248, 245, 0.92)',
    fontFamily: fontFamily.semiBold,
  },
  brandMark: {
    minWidth: 48,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: colors.sandCream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  brandLogoVisa: {
    width: 40,
    height: 16,
  },
  brandLogoMc: {
    width: 36,
    height: 22,
  },
  chip: {
    width: 44,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(221, 143, 36, 0.5)',
    backgroundColor: colors.amber.bright,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  chipInner: {
    width: 28,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(107, 97, 85, 0.3)',
  },
  chipLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(107, 97, 85, 0.25)',
  },
  chipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(107, 97, 85, 0.25)',
  },
  cardNumber: {
    ...typography.bodyMedium,
    fontSize: 17,
    color: colors.sandCream,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 1.2,
    marginTop: spacing.md,
    fontVariant: ['tabular-nums'],
    zIndex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    zIndex: 1,
  },
  footerCol: {
    flex: 1,
    minWidth: 0,
  },
  footerColRight: {
    alignItems: 'flex-end',
  },
  footerMeta: {
    ...typography.overline,
    fontSize: 9,
    color: 'rgba(250, 248, 245, 0.72)',
    letterSpacing: 0.8,
  },
  footerValue: {
    ...typography.label,
    color: colors.sandCream,
    fontFamily: fontFamily.semiBold,
    marginTop: 2,
  },
  magneticStrip: {
    height: 40,
    backgroundColor: colors.navy.deep,
    marginTop: spacing.lg,
    marginHorizontal: -spacing.md,
  },
  cvvBlock: {
    paddingTop: spacing.lg,
    zIndex: 1,
  },
  cvvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cvvPlaceholder: {
    flex: 1,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(250, 248, 245, 0.85)',
  },
  cvvValue: {
    minWidth: 56,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: colors.sandCream,
    textAlign: 'right',
    paddingHorizontal: spacing.sm,
    paddingTop: 9,
    ...typography.label,
    color: colors.navy.default,
    fontFamily: fontFamily.semiBold,
    fontVariant: ['tabular-nums'],
  },
});
