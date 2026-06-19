/**
 * Zabatly Mobile — Color System
 *
 * The exact Zabatly palette adapted for React Native.
 * Warm sand-tinted neutrals, committed navy, desert amber accents.
 * No pure black. No pure white. Every neutral leans warm.
 *
 * Scene sentence (impeccable theme check):
 * "A young Egyptian professional scrolling through car listings on their phone
 *  during a sunny afternoon commute, or a family browsing rentals from a cozy
 *  living room couch at night with warm overhead lighting."
 * → Light theme, warm canvas. The sand-cream warmth works in both contexts.
 */

const colors = {
  // ─── Primary ──────────────────────────────────────────────────────────
  // Midnight Navy carries the brand. It appears on every screen's primary
  // action, tab bar active state, and key interactive surfaces.
  navy: {
    deep:    '#0f1623',   // Deepest tone — footer-level surfaces, pressed states
    default: '#1b2b44',   // The identity color — primary buttons, active nav, CTAs
    light:   '#3a5e90',   // Secondary links, supporting text on dark, completed badges
  },

  // ─── Secondary ────────────────────────────────────────────────────────
  // Desert Amber — warmth of Egyptian sand and sunlight against the navy.
  amber: {
    muted:   '#c4701b',   // Pressed states, deep amber accents
    default: '#dd8f24',   // Signal buttons, highlights, recommended badges, Arabic branding
    bright:  '#e6a63c',   // Hover states, star ratings, accent dots
  },

  // ─── Neutral (warm-tinted, never gray) ────────────────────────────────
  sandCream:   '#faf8f5',   // Primary background — app canvas
  warmLinen:   '#f2efea',   // Secondary surfaces — input backgrounds, section fills
  stoneBorder: '#e6e1d9',   // Borders, dividers, card outlines
  duskText:    '#2c2723',   // Primary body text — deep warm brown
  ashSecondary:'#a49888',   // Secondary text, placeholders, metadata

  // ─── Extended neutrals for mobile depth ───────────────────────────────
  // Mobile needs more tonal steps for card/sheet layering.
  sand: {
    50:  '#faf8f5',   // = sandCream, for consistency with web token names
    100: '#f2efea',   // = warmLinen
    200: '#e6e1d9',   // = stoneBorder
    300: '#d4cec4',   // Disabled borders, subtle separators
    400: '#b8b0a3',   // Disabled text, inactive icons
    500: '#a49888',   // = ashSecondary
    600: '#8a7e6f',   // Mid-weight secondary text
    700: '#6b6155',   // Strong secondary text
    800: '#4a4139',   // High-contrast secondary
    900: '#2c2723',   // = duskText
  },

  // ─── Semantic status ──────────────────────────────────────────────────
  // Consistent across all surfaces. Tinted backgrounds, never text-only.
  status: {
    active: {
      bg:     '#f0fdf4',
      text:   '#15803d',
      border: '#bbf7d0',
    },
    pending: {
      bg:     '#fffbeb',
      text:   '#b45309',
      border: '#fde68a',
    },
    completed: {
      bg:     '#eef2f7',
      text:   '#3a5e90',
      border: '#b8c8e0',
    },
    cancelled: {
      bg:     '#f2efea',
      text:   '#8a7e6f',
      border: '#e6e1d9',
    },
    error: {
      bg:     '#fef2f2',
      text:   '#b91c1c',
      border: '#fecaca',
    },
  },

  // ─── Utility ──────────────────────────────────────────────────────────
  white:       '#fefdfb',   // Warm white — card surfaces, button text on navy
  black:       '#1a1613',   // Warm black — never pure #000
  overlay:     'rgba(15, 22, 35, 0.55)',  // Navy-tinted overlay for bottom sheets
  overlayLight:'rgba(15, 22, 35, 0.25)',  // Lighter overlay variant

  // ─── Transparent variants (for mobile shadows and glows) ──────────────
  transparent: {
    navy10:  'rgba(27, 43, 68, 0.10)',
    navy20:  'rgba(27, 43, 68, 0.20)',
    amber15: 'rgba(221, 143, 36, 0.15)',
    amber25: 'rgba(221, 143, 36, 0.25)',
  },
};

export default colors;
