import { Platform } from 'react-native';
import colors from './colors';

/**
 * Zabatly Mobile — Shadow & Elevation System
 *
 * Mobile-native depth. The web uses tonal layering (flat-at-rest).
 * Mobile needs real shadows for physical card separation, because
 * cards float above the scroll canvas and users expect tactile depth.
 *
 * Three tiers:
 *   1. cardShadow    — subtle lift for content cards (vehicles, bookings)
 *   2. ambientShadow — amber glow for primary CTA buttons
 *   3. navShadow     — upward shadow on bottom tab bar
 *
 * Plus utility shadows for bottom sheets, floating buttons, and overlays.
 *
 * Android uses `elevation` (integer). iOS uses shadow* properties.
 * We provide both in each shadow object for cross-platform consistency.
 */

const shadows = {
  // ─── Card Shadow ──────────────────────────────────────────────────────
  // Soft, warm-tinted shadow. 0.08 opacity keeps it subtle enough
  // that the sand-cream canvas still feels calm, not busy.
  card: {
    shadowColor: colors.navy.deep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Elevated card — hover equivalent on mobile (pressed state, featured items)
  cardLifted: {
    shadowColor: colors.navy.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },

  // ─── Ambient Shadow (CTA Glow) ───────────────────────────────────────
  // Desert Amber glow behind primary CTA buttons. The amber warmth
  // draws the eye without screaming. 12px blur keeps it diffused.
  ambient: {
    shadowColor: colors.amber.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  // Intensified amber glow — for pressed/active CTA states
  ambientStrong: {
    shadowColor: colors.amber.default,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },

  // ─── Navigation Shadow ────────────────────────────────────────────────
  // Upward shadow on the bottom tab bar. Negative Y offset pushes
  // the shadow above the bar, creating a natural "floating" edge.
  nav: {
    shadowColor: colors.navy.deep,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },

  // ─── Bottom Sheet ─────────────────────────────────────────────────────
  // Strong upward shadow for bottom sheets (replaces web modals).
  // Higher elevation gives the sheet clear dominance over content.
  bottomSheet: {
    shadowColor: colors.navy.deep,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  // ─── Floating Action Button ───────────────────────────────────────────
  // Chat FAB, floating add button, etc. Needs enough lift to feel
  // tappable and separate from the content layer.
  fab: {
    shadowColor: colors.navy.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  // ─── Input Focus ──────────────────────────────────────────────────────
  // Subtle ring-like glow when inputs are focused. Navy-tinted
  // to match the brand, not generic blue.
  inputFocus: {
    shadowColor: colors.navy.light,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 0,    // No Android elevation for focus rings
  },

  // ─── None ─────────────────────────────────────────────────────────────
  // Explicit "no shadow" reset — useful for toggling states.
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ─── Spacing Scale ────────────────────────────────────────────────────────
// 4-point grid for consistent rhythm. Mobile needs generous touch targets
// and comfortable thumb-zone spacing.
export const spacing = {
  xxs: 4,    // Tight internal padding, icon margins
  xs:  8,    // Badge padding, compact gaps
  sm:  12,   // Between related elements within a card
  md:  16,   // Standard internal padding, form field gaps
  lg:  20,   // Horizontal screen margins (thumb-friendly)
  xl:  24,   // Section padding, card-to-card gaps
  xxl: 32,   // Major section breaks
  xxxl:48,   // Screen top/bottom breathing room
};

// ─── Border Radius ────────────────────────────────────────────────────────
// More generous than web's 6px — rounded corners feel native on mobile.
export const radius = {
  xs:    4,    // Badges, micro-elements
  sm:    8,    // Buttons, inputs, status pills
  md:   12,    // Cards, sheets, image containers
  lg:   16,    // Bottom sheet handles, featured cards
  xl:   20,    // Large modals, onboarding cards
  full: 9999,  // Circles (avatars, dots)
};

// ─── Touch Targets ────────────────────────────────────────────────────────
// Minimum sizes for thumb-friendly interaction. Apple HIG: 44pt, Material: 48dp.
// We use 48 as minimum throughout for comfortable tapping.
export const touchTarget = {
  min:     48,   // Absolute minimum tappable area
  button:  52,   // Standard button height
  input:   48,   // Text input height
  listItem:56,   // List row minimum height
  tabBar:  60,   // Bottom tab bar height (includes safe area consideration)
};

export default shadows;
