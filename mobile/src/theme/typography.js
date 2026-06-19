/**
 * Zabatly Mobile — Typography System
 *
 * Manrope for Latin, Cairo for Arabic. Both loaded via expo-font.
 * Mobile-native sizing: fixed pixel values (no clamp/vw — React Native
 * doesn't support CSS functions). Sizes are tuned for phone screens
 * where 375pt width is the baseline.
 *
 * Weight mapping (React Native requires string weights):
 *   ExtraBold → '800'
 *   Bold      → '700'
 *   SemiBold  → '600'
 *   Medium    → '500'
 *   Regular   → '400'
 */

// ─── Font Families ──────────────────────────────────────────────────────
// Use these constants everywhere. When fonts aren't loaded yet,
// the app should show a splash/loading state — never fall back silently.
export const fontFamily = {
  // Latin — Manrope
  regular:   'Manrope_400Regular',
  medium:    'Manrope_500Medium',
  semiBold:  'Manrope_600SemiBold',
  bold:      'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',

  // Arabic — Cairo (The Cairo-Only Rule: all Arabic text uses Cairo, always)
  arabicBold:      'Cairo_700Bold',
  arabicExtraBold: 'Cairo_800ExtraBold',
  arabicBlack:     'Cairo_900Black',
};

// ─── Type Scale ─────────────────────────────────────────────────────────
// Each level is a complete React Native style object. Import and spread.
// Scale ratio ≈ 1.25 between major steps for clear hierarchy.
const typography = {
  // Hero headlines — onboarding, feature intros
  // 32pt on mobile gives commanding presence without overwhelming
  display: {
    fontFamily: fontFamily.extraBold,
    fontSize: 32,
    lineHeight: 36,       // 1.12 ratio — tight, confident
    letterSpacing: -0.8,  // -0.025em equivalent at 32pt
  },

  // Section headers — screen titles, major section breaks
  headline: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,       // 1.25 ratio
    letterSpacing: -0.5,  // -0.02em equivalent at 24pt
  },

  // Card titles, vehicle names, subsection headings
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,       // 1.33 ratio
    letterSpacing: -0.2,
  },

  // Slightly smaller title for dense contexts (list items, compact cards)
  titleSmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  // Primary body text — descriptions, reviews, chat messages
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,       // 1.6 ratio — generous for readability on mobile
    letterSpacing: 0,
  },

  // Body with emphasis — prices, important inline values
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Secondary body — slightly smaller for supporting text
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Navigation items, form labels, metadata, filter labels, specs
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,  // +0.01em equivalent — airy at small sizes
  },

  // Micro labels — badge text, timestamps, secondary metadata
  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Section divider labels — uppercase, wide tracking
  // (The No-Shout Rule: uppercase only for these + spec labels)
  overline: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,   // Wide tracking for uppercase readability
    textTransform: 'uppercase',
  },

  // Large numeric displays — prices, metric values
  numericLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    // Note: apply fontVariant: ['tabular-nums'] at usage site
    // (The Tabular-Nums Rule)
  },

  // Standard numeric — inline prices, counts
  numeric: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Button text — firm, immediate, never uppercase (No-Shout Rule)
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Compact button text — for inline/secondary actions
  buttonSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
};

export default typography;
