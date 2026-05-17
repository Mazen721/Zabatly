---
name: Zabatly
description: AI-driven smart transportation rental platform that handles everything for you.
colors:
  midnight-navy: "#1b2b44"
  midnight-navy-deep: "#0f1623"
  midnight-navy-light: "#3a5e90"
  desert-amber: "#dd8f24"
  desert-amber-bright: "#e6a63c"
  desert-amber-muted: "#c4701b"
  sand-cream: "#faf8f5"
  warm-linen: "#f2efea"
  stone-border: "#e6e1d9"
  dusk-text: "#2c2723"
  ash-secondary: "#a49888"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 5vw + 0.5rem, 4rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  subtle: "6px"
  soft: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.subtle}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.midnight-navy-deep}"
    textColor: "#ffffff"
  button-signal:
    backgroundColor: "{colors.desert-amber}"
    textColor: "{colors.midnight-navy-deep}"
    rounded: "{rounded.subtle}"
    padding: "12px 28px"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.midnight-navy}"
    rounded: "{rounded.subtle}"
    padding: "12px 28px"
  button-outlined-hover:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
  button-inline-action:
    backgroundColor: "transparent"
    textColor: "{colors.midnight-navy-light}"
    rounded: "{rounded.subtle}"
    padding: "0"
  card-vehicle:
    backgroundColor: "{colors.sand-cream}"
    rounded: "{rounded.soft}"
    padding: "0"
  input-default:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.dusk-text}"
    rounded: "{rounded.subtle}"
    padding: "12px 16px"
  input-product:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.dusk-text}"
    rounded: "{rounded.subtle}"
    padding: "10px 12px"
  nav-bar:
    backgroundColor: "rgba(250, 248, 245, 0.9)"
    textColor: "{colors.dusk-text}"
    height: "56px"
  filter-active:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.subtle}"
    padding: "6px 14px"
  filter-inactive:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.ash-secondary}"
    rounded: "{rounded.subtle}"
    padding: "6px 14px"
  sidebar-nav:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
    width: "224px"
  sidebar-item:
    textColor: "#8aa2c8"
    rounded: "{rounded.subtle}"
    padding: "8px 12px"
  sidebar-item-active:
    backgroundColor: "rgba(255,255,255,0.12)"
    textColor: "#ffffff"
    rounded: "{rounded.subtle}"
    padding: "8px 12px"
  context-strip:
    backgroundColor: "{colors.warm-linen}"
    padding: "10px 24px"
  metric-tile:
    backgroundColor: "{colors.sand-cream}"
    padding: "14px 16px"
  data-table-header:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.ash-secondary}"
    padding: "8px 16px"
  status-badge-active:
    backgroundColor: "#f0fdf4"
    textColor: "#15803d"
    rounded: "{rounded.subtle}"
    padding: "2px 8px"
  status-badge-pending:
    backgroundColor: "{colors.signal-50}"
    textColor: "{colors.signal-700}"
    rounded: "{rounded.subtle}"
    padding: "2px 8px"
  status-badge-completed:
    backgroundColor: "#eef2f7"
    textColor: "{colors.midnight-navy-light}"
    rounded: "{rounded.subtle}"
    padding: "2px 8px"
  request-row:
    backgroundColor: "{colors.sand-cream}"
    rounded: "{rounded.soft}"
    padding: "12px 16px"
  chat-fab:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.soft}"
    size: "48px"
  chat-panel:
    backgroundColor: "{colors.sand-cream}"
    rounded: "{rounded.soft}"
    width: "384px"
    height: "480px"
  chat-bubble-user:
    backgroundColor: "{colors.midnight-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.subtle}"
    padding: "8px 14px"
  chat-bubble-assistant:
    backgroundColor: "{colors.warm-linen}"
    textColor: "{colors.dusk-text}"
    rounded: "{rounded.subtle}"
    padding: "8px 14px"
---

# Design System: Zabatly

## 1. Overview

**Creative North Star: "The Confident Companion"**

Zabatly's interface is a reliable friend who knows cars, knows the city, and sorts everything out without making you ask twice. Warm without being cute, precise without being cold, smart without showing off. Every screen communicates competence through clarity: the platform already knows what you need and stays one step ahead.

The visual system uses committed navy and warm amber across a sand-tinted canvas. Manrope provides clean, confident typography with just enough warmth. Cairo handles Arabic display text with thick, assured strokes. Motion is responsive: transitions give feedback, nothing choreographs itself for spectacle.

The system spans two registers. Brand surfaces (the landing page) use committed Midnight Navy and Desert Amber with editorial boldness, large typography, and atmospheric motifs like the Circular Arabic Badge and oversized Arabic overlays. Product surfaces (Explore Fleet, Vehicle Details, Dashboard, Profile, Add Vehicle, Chat) use a restrained palette where Midnight Navy anchors primary actions and Sand Cream provides a warm, workable canvas. The transition between registers is seamless because the token vocabulary is shared.

Product surfaces share a consistent shell: a fixed 224px Midnight Navy sidebar on desktop, a slide-in overlay on mobile, a context strip for live status, and a sand-tinted content area. Data is presented in flat table rows, not card grids. Metrics use tiled strips, not hero-metric cards. Status is communicated through tinted badge pills. The overall density is medium: enough information to feel productive, enough breathing room to stay calm.

The system rejects generic SaaS templates (stock photos, "Get Started Free" hero sections), childish interfaces (mascots, candy colors, rounded-everything), bureaucratic UI (stiff forms, formal language), and ride-hailing clones. Zabatly has its own identity.

**Key Characteristics:**
- Confident, not loud. The interface leads; it doesn't hedge.
- Warm, not cute. Tinted neutrals, approachable spacing. No mascots.
- Smart, not showy. AI is embedded naturally, never spotlighted.
- Egyptian roots, global craft. Local character without cliches.
- Tactile and firm. Clear shapes, immediate feedback, no ambiguity.
- Dense but calm. Dashboards show useful data without overwhelming.

## 2. Colors

A deep navy palette with warm, sand-tinted neutrals and desert amber accents. The navy is authoritative without being corporate. Neutrals lean warm to prevent clinical coldness.

### Primary
- **Midnight Navy** (#1b2b44): The identity color. Primary buttons, active navigation, active filter states, booking CTAs, focus rings, key UI anchors, sidebar background, chat FAB, user message bubbles. Carries 30-40% of interactive surfaces on brand pages, used as the sole accent on product surfaces.
- **Midnight Navy Deep** (#0f1623): Footer backgrounds, AI showcase section, darkest surfaces, hover states on primary buttons.
- **Midnight Navy Light** (#3a5e90): Secondary text on dark backgrounds, supporting links, selection background, completed status badges, sidebar section divider labels.

### Secondary
- **Desert Amber** (#dd8f24): Secondary actions, highlights, Arabic branding typography, "Recommended" badges on vehicle cards, verification-required CTAs, "List Vehicle" button for agencies, sidebar badge counters. The warmth of Egyptian sand and sunlight against the navy.
- **Desert Amber Bright** (#e6a63c): Hover states on amber elements, star ratings, the dot in "Consider it done."
- **Desert Amber Muted** (#c4701b): Pressed states, deep amber accents.

### Neutral
- **Sand Cream** (#faf8f5): Primary background across all surfaces, dashboard content area, metric tile background, chat panel background. Warm off-white, never pure white.
- **Warm Linen** (#f2efea): Secondary surfaces, input field backgrounds, inactive filter pills, context strip background, data table headers, assistant chat bubbles, sidebar sections.
- **Stone Border** (#e6e1d9): Borders, dividers, card borders, filter bar separators, metric strip frames, data table row dividers. Subtle, low-contrast.
- **Dusk Text** (#2c2723): Primary body text. Deep warm brown, never pure black.
- **Ash Secondary** (#a49888): Secondary text, metadata, placeholders, date labels, filter section headings, table header labels, metric tile labels.

### Semantic Status Colors
Product surfaces use a consistent status vocabulary across dashboards and admin panels:
- **Active/Online:** green-50 background, green-700 text, green-200 border. Reserved for live states (active bookings, online drivers, available vehicles).
- **Pending/Warning:** signal-50 background, signal-700 text, signal-200 border. Uses the amber/signal family for attention items (pending requests, awaiting verification).
- **Completed/Info:** primary-50 background, primary-700 text, primary-200 border. Uses the navy family for resolved states.
- **Cancelled/Neutral:** sand-100 background, sand-600 text, sand-200 border. Muted, for dismissed or inactive items.
- **Error/Destructive:** red-50 background, red-700 text, red-200 border. For errors, rejections, destructive confirmations.

### Named Rules
**The Committed Navy Rule.** Midnight Navy is not a timid accent. It appears on primary buttons, the navbar login button, active filter pills, booking CTAs, active tabs, key headers, the sidebar, and the hero heading. If a screen has no navy, something is missing.

**The Warm Neutral Rule.** No pure grays. Every neutral carries a warm tint toward sand/amber. Pure `#000` and `#fff` are forbidden.

**The Selection Rule.** Text selection uses Midnight Navy Light (#b8c8e0) background with Midnight Navy Deep (#0f1623) text.

**The Status Tint Rule.** Status is always communicated through background-tinted pills, never through colored text alone or colored borders on containers. The tint is role-specific: green for live, amber for pending, navy for resolved, sand for inactive.

## 3. Typography

**Display Font:** Manrope (with system-ui, -apple-system fallbacks)
**Arabic Display Font:** Cairo (weights 700-900, for branding overlays, the circular badge, and the navbar logo)
**Body Font:** Manrope, lighter weights

**Character:** Clean and confident with geometric-humanist warmth. Manrope's slightly rounded terminals prevent coldness while its even spacing maintains professionalism. Cairo provides thick, assured Arabic letterforms for branding moments.

### Hierarchy
- **Display** (ExtraBold 800, clamp(2.25rem, 5vw + 0.5rem, 4rem), line-height 1.08, tracking -0.025em): Hero headlines on brand pages. Tight leading, confident presence.
- **Headline** (Bold 700, clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem), line-height 1.2, tracking -0.02em): Section headers on brand pages and page titles on product surfaces.
- **Title** (SemiBold 600, 1.25rem, line-height 1.35): Card titles, vehicle names, section headings within product pages, dashboard page headings.
- **Body** (Regular 400, 1rem, line-height 1.65): All running text. Max width 65-75ch.
- **Label** (Medium 500, 0.8125rem, line-height 1.4, tracking +0.01em): Navigation items, metadata, form labels, filter labels, spec labels, price captions, sidebar items, context strip text, data table cell text.

Product surfaces also use fixed sizes outside the fluid scale: `0.95rem` for vehicle names in cards and section subheadings, `0.875rem` for table row content and form inputs, `0.85rem` for secondary info, `0.8rem` for compact UI elements, `0.75rem` for filter section headings, spec labels, and inline action links, `0.7rem` for micro-labels (metric tile labels, table header labels, status badge text, sidebar section dividers), and `0.65rem` for sidebar divider labels and badge counters. These maintain density without forcing the fluid display scale into task UI.

### Named Rules
**The No-Shout Rule.** Uppercase is reserved for filter section headings, spec labels, footer category headers, metric tile labels, data table header labels, and sidebar section dividers. Never on headings, never on buttons. Always paired with wide tracking (0.04em-0.08em) and semibold weight at small sizes (0.65rem-0.7rem).

**The Cairo-Only Rule.** All Arabic text uses Cairo, never system-ui or Manrope. This includes the navbar logo, circular badge, hero overlay, auth page brand motifs, sidebar logo, and any future Arabic copy.

**The Tabular-Nums Rule.** All numeric values in data tables, metric tiles, prices, and earnings use `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) so columns align precisely. No proportional figures in data contexts.

## 4. Elevation

Flat by default. Depth through tonal layering (Sand Cream vs. Warm Linen backgrounds) rather than shadows. Shadows appear only as state response: the navbar's backdrop-blur on scroll, hover lifts on vehicle cards, focus rings on inputs.

The navbar uses `backdrop-blur-md` with a semi-transparent Sand Cream background, the only persistent elevation on product surfaces. Auth pages use a gradient overlay on the brand image panel (transparent to Midnight Navy Deep) for depth without shadow. The chat panel uses `shadow-lg` as a structural anchor: a floating panel needs anchoring to distinguish it from the page beneath.

Product dashboard surfaces achieve depth through three tonal layers: the Midnight Navy sidebar (darkest), the Warm Linen context strip (medium), and the Sand Cream content area (lightest). This gradient from left to right creates natural spatial hierarchy without a single shadow.

### Named Rules
**The Flat-at-Rest Rule.** Surfaces are flat at rest. Shadows appear only as state response (hover, focus, elevation change). If a shadow is visible on page load, justify it or remove it. The navbar's blur and the chat panel's shadow are the two exceptions: both need visual separation from content beneath them.

**The Three-Layer Rule.** Product surfaces use exactly three tonal layers for spatial hierarchy: Midnight Navy (sidebar, 224px), Warm Linen (context strip, metadata headers), Sand Cream (content area). No additional background colors needed for depth.

## 5. Components

### Buttons
- **Shape:** Gently squared corners (subtle, 6px). Not pill-shaped, not sharp.
- **Primary:** Midnight Navy fill, white text, 12px 28px padding. Firm and immediate. Used for booking CTAs, sign-in, sign-up, "View details" on vehicle cards, and dashboard primary actions (New Booking, Accept, Save, Finish Ride).
- **Hover:** Darkens to Midnight Navy Deep. 150ms color transition.
- **Compact Primary:** Same colors but 10px 16px padding, 0.8125rem text. Used inside dashboard rows and action bars where full-size buttons waste space.
- **Outlined:** 2px Midnight Navy border, Midnight Navy text. Fills to Midnight Navy on hover with white text. Used for hero CTAs on the landing page.
- **Secondary/Ghost:** Sand-100 background, sand-200 border, sand-800 text. Hover shifts to sand-200/60. Used for Quick Action links, Decline buttons, secondary dashboard navigation.
- **Signal:** Desert Amber fill, Midnight Navy Deep text. Used for verification-required CTAs and "List Vehicle" for agencies. Hover darkens to amber-muted.
- **Inline Action:** No background, primary-600/700 text, underline or weight for affordance. Hover darkens to primary-800/900. Used for "View all", "Book again", "Return", "Dismiss" text links inside data rows.
- **Destructive Inline:** No background, red-600 text, hover to red-800. Used for "Remove" and "Delete Account" actions.
- **Disabled:** Sand-200 background, sand-500 text, no pointer. Used for "Unavailable", "Currently rented", and locked controls during active rides.

### Vehicle Cards (Explore Fleet)
- **Corner style:** Soft (10px radius).
- **Background:** Sand Cream with Sand-200 border.
- **Image:** 4:3 aspect ratio, object-cover, carousel with prev/next arrows on hover.
- **Type badge:** Sand-50 with backdrop-blur, positioned top-left of image, capitalize.
- **Recommended badge:** Desert Amber fill, Midnight Navy Deep text, positioned top-right. No sparkle icon, no explanation text.
- **Rented overlay:** Semi-transparent Sand Cream with backdrop-blur, centered "Rented" pill in Midnight Navy.
- **Hover:** Card lifts 0.5px with subtle shadow. Image scales 1.05x over 500ms with ease-out-quart.
- **Content:** Make/model (0.95rem semibold), address (0.75rem sand-500), price (0.95rem bold navy), spec pills (transmission, seats, driver), CTA button.

### Dashboard Shell
The shared layout for all authenticated product surfaces (Renter, Owner, Driver, Admin dashboards and Profile).
- **Sidebar:** Fixed 224px (w-56) Midnight Navy panel, full viewport height, left-anchored. Contains Zabatly/زبطلي logo at top (1.2rem, extrabold white + signal-500 Cairo), scrollable nav section, and bottom actions section separated by a `border-white/8` divider.
- **Nav Items:** 16px SVG icons + 0.8125rem medium text, 8px 12px padding, subtle radius. Inactive: primary-300 text, hover to white + `bg-white/5`. Active: white text, `bg-white/12`. Transition 150ms.
- **Badge Counters:** Signal-500 background, primary-950 text, 0.65rem bold, subtle radius, min-width 1.25rem. Used for pending request counts.
- **Section Dividers:** 0.65rem semibold uppercase tracking-[0.08em] text in primary-400. Creates logical groupings without visible lines.
- **Mobile:** Sidebar collapses off-screen (translate-x-full). Hamburger icon in a sticky top bar (sand-50 bg, sand-200 bottom border). Overlay with primary-950/60 backdrop. Slide-in transition 200ms ease-out-quart.
- **Logout:** Always at sidebar bottom, primary-300 text, hover to red-400. SVG door-arrow icon.

### Context Strip
A thin horizontal bar between the sidebar header area and the main content, providing live status at a glance.
- **Background:** Warm Linen (sand-100), bottom border in Stone Border (sand-200).
- **Padding:** 10px vertical, 24px horizontal.
- **Content:** 0.8125rem label text. Typically contains a status dot (green pulsing for active, signal for pending), a semibold entity name, a middle-dot separator, and a status badge or action link.
- **Variations:** Renter shows active booking vehicle + dates. Owner shows pending request count with "Review now" link. Driver shows availability toggle + active ride client. Admin shows total pending verification count.

### Metric Strip
Horizontal row of adjacent tiles showing key numbers. Not cards (no individual borders, no shadows, no gaps between tiles).
- **Container:** `gap-px` with sand-200 background creates 1px visual dividers between tiles. Outer frame: sand-200 border, soft radius, overflow hidden.
- **Tile:** Sand Cream background, 14px 16px padding. Label (0.7rem semibold uppercase tracking-[0.04em] sand-500) above value (1.35rem bold tracking-tight tabular-nums sand-900).
- **Accent state:** Value text shifts to green-700 (for "Available" count) or signal-600 (for "Pending" count) when the metric represents something actionable.
- **Placement:** Always full-width of the content area. 2-4 tiles per strip, flex-1 so tiles share space equally.

### Data Tables
Flat row-based data presentation for bookings, vehicles, transactions, and verification queues. No card wrappers around individual rows.
- **Container:** Sand-50 background, sand-200 border, soft radius, overflow hidden.
- **Header Row:** Sand-100 (Warm Linen) background, sand-200 bottom border. Labels are 0.7rem semibold uppercase tracking-[0.04em] sand-500. Hidden on mobile (md:grid).
- **Content Rows:** Divided by sand-100 borders. Grid layout matching header columns. Hover shifts to sand-100/60 (100ms transition). Text is 0.875rem medium sand-900 for primary content, 0.8125rem regular sand-600 for secondary.
- **Thumbnail:** 48x36px (w-12 h-9) rounded rectangle, object-cover, sand-100 fallback background. Left-aligned in the first column beside the entity name.
- **Action Column:** Right-aligned. Inline action links (0.75rem semibold primary-700) or compact buttons. Never full-width buttons inside table rows.
- **Mobile Collapse:** Grid columns collapse to stacked layout on small screens. Each row becomes a vertical stack with natural reading order.

### Status Badges
Small tinted pills indicating the state of bookings, vehicles, verifications, and driver availability.
- **Shape:** Subtle radius (6px), 2px 8px padding, 0.7rem semibold, capitalize.
- **Active:** green-50 bg, green-700 text, green-200 border.
- **Pending:** signal-50 bg, signal-700 text, signal-200 border.
- **Completed:** primary-50 bg, primary-700 text, primary-200 border.
- **Cancelled/Neutral:** sand-100 bg, sand-600 text, sand-200 border.
- **Verified:** green-50 bg, green-700 text, green-200 border (same as Active).
- **Rejected:** red-50 bg, red-700 text, red-200 border.

### Request/Action Rows
Inline actionable rows for pending booking requests and ride requests. Not modals, not separate pages.
- **Container:** Sand-50 background, sand-200 border, soft radius, 12px 16px padding. Hover to sand-100/60.
- **Content:** Flex row with thumbnail (if vehicle) or avatar initial, requester name (0.875rem medium sand-900), context text (sand-500 normal weight inline), price (0.8125rem semibold sand-800 tabular-nums).
- **Actions:** Two buttons, right-aligned: Accept (compact primary button) and Decline (sand-100 bg, sand-200 border, sand-600 text; hover shifts to red-50/red-700/red-200).

### Empty States
Centered message displayed when a section has no data. Not illustrated, not animated.
- **Padding:** 48px vertical (py-12).
- **Message:** 0.875rem sand-500 text, centered. One sentence, actionable when possible ("You haven't saved any vehicles yet. Tap the heart on any listing to save it here.").
- **CTA:** Optional primary button below the message (4px margin-top). Same styling as compact primary button.

### Inline Feedback
Error and success messages displayed within the page flow, replacing `alert()` calls across all product surfaces.
- **Error banner:** red-50 bg, red-200 border, red-700 text, subtle radius, 0.8125rem. Includes a "Dismiss" link (semibold underline) for clearable errors.
- **Success toast:** Internal state toast (auto-dismiss 4s). Green-50/green-700 for success, red-50/red-700 for error. Positioned contextually near the triggering action, not as a global floating notification.
- **Placement:** Always inline within the content area, above the relevant section. Never overlaid, never modal.

### Toggle Switch (Driver Dashboard)
A custom toggle for driver availability status.
- **Track:** 36x20px rounded-full. Off: sand-400. On: green-500. Disabled (in-ride): sand-300 with not-allowed cursor.
- **Thumb:** 16x16px white circle with subtle shadow. Translates 18px on activation. Transition 200ms ease-out-quart.
- **Label:** Adjacent 0.8125rem semibold text. "Online" (sand-800) / "Offline" (sand-800) / "In Ride" (sand-800, with disabled toggle).

### Chat Widget
Floating AI assistant accessible from any page.
- **FAB (closed state):** 48x48px Midnight Navy square with soft radius (10px), positioned bottom-right (20px inset). Contains a 20px chat bubble SVG icon in white. Subtle shadow. No hover scale animation.
- **Panel (open state):** 384px wide (320px on mobile), 480px tall. Sand Cream background, soft radius, sand-200 border, shadow-lg anchor. Positioned above the FAB with 12px gap.
- **Header:** Midnight Navy background, "Zabatly" in 0.875rem semibold white. Close button: white X SVG icon.
- **User bubbles:** Midnight Navy background, white text, subtle radius, 8px 14px padding. Right-aligned.
- **Assistant bubbles:** Warm Linen background, Dusk Text, sand-200 border, subtle radius. Left-aligned.
- **Vehicle recommendation rows:** Compact horizontal rows (not cards). Vehicle name, type, price in Midnight Navy, chevron right. Hover shifts background to sand-100.
- **Savings tips:** Signal-50 background, signal-200 border, signal-700 text. No emoji, no icon.
- **Input bar:** Sand-100 background, sand-200 border, subtle radius. Send button: small Midnight Navy square (32x32) with paper plane SVG. Auto-focus on panel open.
- **Loading:** "Thinking..." in sand-500 with CSS pulse animation.

### Filter Sidebar (Explore Fleet)
- **Position:** Left sidebar (224px) on desktop, slide-in overlay on mobile.
- **Search:** Sand-100 input with search icon, focus ring in primary-600.
- **Filter sections:** Uppercase label headings (0.75rem, sand-500), stacked radio-style buttons.
- **Active filter:** Midnight Navy fill, white text.
- **Inactive filter:** Transparent background, sand-700 text, hover sand-100.
- **Price slider:** Range input with accent-primary-800, min/max number inputs.
- **Clear all:** Primary-700 text link.

### Navigation (App Shell)
- **Style:** Sticky, full-width, 56px height. Sand Cream at 90% opacity with backdrop-blur-md and bottom border.
- **Logo:** "Zabatly" in Manrope ExtraBold + "زبطلي" in Cairo Bold, both at 1.35rem. Navy/amber colors.
- **Links:** 0.82rem, medium weight, sand-700 default, primary-700 on hover. 200ms transition.
- **Login button:** Midnight Navy fill with white text and user icon. Matches landing page exactly.
- **Logged-in state:** User name as text link, "Log out" in sand-500 with red-600 hover.

### Auth Pages (Login / Register)
- **Layout:** 50/50 split on desktop. Left: brand image with gradient overlay and Arabic motif. Right: form on Sand Cream.
- **Mobile:** Image collapses; compact logo above form.
- **Inputs:** Sand-100 background, sand-200 border, primary-600 focus ring. Visible labels above each field.
- **Role selector (Register):** 3-column grid of pill buttons with label + micro-description. Active: Midnight Navy fill. Inactive: sand-100 with sand-200 border.
- **Error:** Inline banner in red-50/red-200/red-700, not alert().

### Vehicle Details Page
- **Layout:** Two-column (flex-1 + w-80) on desktop, stacked on mobile.
- **Gallery:** 16:9 hero image with prev/next arrows on hover, image counter bottom-right, thumbnail strip below.
- **Specs:** Horizontal flow of labeled values with uppercase labels (0.7rem sand-400) and values (0.85rem sand-800). Separated by top/bottom borders, not grid cards.
- **Owner:** Inline row with avatar, name, verified badge, star rating. Not a centered card.
- **Booking card:** Sticky (top-20), sand-50 background, sand-200 border. Price (1.5rem bold navy), date inputs (2-column grid), driver toggle (sand-100 section), price breakdown (when dates selected), CTA varies by verification state.
- **Reviews:** Vertical list separated by sand-100 bottom borders. Reviewer avatar, name, star rating (signal-500 filled, sand-300 empty), date, comment.

### Profile Page
Organized into the Dashboard Shell with three sections: Account, Verification, Danger Zone.
- **Account section:** Profile picture (64px circle with sand-100 fallback, primary-100 bg with initial letter), age input, save button. "Become a Host" banner for renters: signal-50 background, signal-200 border, signal-700 text with a primary button CTA.
- **Verification section (KYC):** Checklist of document types (national ID, passport, driving license, car license). Each item: status dot (green for verified, signal for pending, red for rejected, sand for missing) + document label + status badge. Upload form: select dropdown for doc type + file input trigger + submit button.
- **Danger Zone:** Separated by extra margin. red-50 border, red-700 heading, red-600 delete button with confirmation.

### Add Vehicle Page
Standalone page (not inside Dashboard Shell) with a simplified header and back-link to dashboard.
- **Header:** Sand-50 background, sand-200 bottom border. Back arrow link to /dashboard, page title "Add Vehicle" in 1.25rem semibold.
- **Form layout:** Max-width 640px centered. Sections separated by labeled fieldsets. Two-column grid for related fields (make/model, year/type, capacity/transmission).
- **Inputs:** Sand-100 background, sand-200 border, subtle radius, 10px 12px padding. Labels are 0.8125rem medium sand-700, positioned above. Focus: primary-500 border + ring-1.
- **Image upload:** Grid of thumbnail previews (96x96px, soft radius, object-cover). Primary image has a signal-500 ring. Add button: dashed sand-300 border, sand-400 icon, hover to sand-400 border.
- **Map:** Leaflet map with custom marker, 256px height, soft radius, sand-200 border. Address auto-populated from reverse geocoding.
- **Submit:** Full-width primary button at form bottom.

### Skeleton Loading
Animated placeholder elements shown while data loads. Matches the structure of the actual content.
- **Shape:** Rounded rectangles matching the dimensions of the content they replace (text lines, thumbnails, badges).
- **Color:** Sand-200 for primary elements, sand-100 for secondary. No gray.
- **Animation:** CSS `animate-pulse` (opacity oscillation). No shimmer gradients, no skeleton-specific colors.
- **Behavior:** Multiple skeleton rows displayed in table/list contexts (3-5 rows). Single skeleton block for overview sections.

### Circular Arabic Badge (Landing)
- **Shape:** SVG circle with `textPath` for rotating Arabic text around the circumference.
- **Center text:** "زبطلي و ورتاح بالي" in Cairo Black/ExtraBold.
- **Rotation:** 20s linear infinite spin.
- **Outer text:** Cairo Bold, Midnight Navy, tracking +3.

### Scroll-Reveal Animation (Landing)
- **Entry:** 20px translateY + opacity 0 to visible. 600ms ease-out-quart.
- **Stagger:** 80ms increments (delay-1, delay-2, delay-3).
- **Reduced motion:** Instant, no animation.

## 6. Do's and Don'ts

### Do:
- **Do** use Midnight Navy on every screen's primary action. Consistency builds recognition.
- **Do** tint all neutral surfaces warm. The warmth is subliminal but critical.
- **Do** use Cairo for all Arabic text, including branding overlays, the circular badge, and the navbar logo.
- **Do** write UI copy in casual English: short sentences, simple words, like texting a reliable friend.
- **Do** embed AI recommendations naturally. A small "Recommended" badge is enough; no explanatory text needed.
- **Do** show real vehicle photos from the API, verified badges, and transparent pricing. Trust through clarity.
- **Do** respect `prefers-reduced-motion`. Moderate animation is default; reduced-motion users get instant state changes.
- **Do** use ease-out-quart (`cubic-bezier(0.25, 1, 0.5, 1)`) for all UI transitions.
- **Do** keep spacing tight and purposeful. No large empty gaps between sections.
- **Do** use inline error banners instead of `alert()` for form errors and action failures.
- **Do** use skeleton loading states (matching page structure) instead of centered spinners.
- **Do** use the split-layout pattern (brand image + form) for authentication pages.
- **Do** use a left sidebar for filters on browsing surfaces, not horizontal pill bars.
- **Do** use the Dashboard Shell (sidebar + context strip + content area) for all authenticated product surfaces.
- **Do** present tabular data in flat table rows with a Warm Linen header row and sand-100 dividers. Rows, not cards.
- **Do** use Metric Strips (gap-px tiles in a bordered frame) for numeric summaries. One strip per section maximum.
- **Do** use Status Badges (tinted pills) for every status indicator. Consistent color mapping across all surfaces.
- **Do** use `tabular-nums` on all numeric values in data contexts (prices, counts, dates in tables).
- **Do** use inline SVG icons at 16x16px with 1.5 stroke width in the sidebar and action rows. Consistent stroke style, no filled icons.
- **Do** keep empty states centered, one-sentence, and actionable with an optional CTA button.
- **Do** show Accept/Decline actions inline in request rows, not in modals or separate pages.

### Don't:
- **Don't** use boring/generic startup templates. No interchangeable hero sections with stock photos and "Get Started Free" buttons. Zabatly is immediately distinguishable.
- **Don't** use childish/cartoonish elements. No mascots, no candy colors, no excessive illustrations. Friendly, not juvenile.
- **Don't** use government/bureaucratic UI. No stiff forms, no formal language, no dated layouts. Casual and modern.
- **Don't** clone ride-hailing apps. Zabatly is not an Uber/Careem skin.
- **Don't** use identical card grids. Vary the rhythm.
- **Don't** use gradient text, side-stripe borders (>1px colored accent), or glassmorphism as decoration.
- **Don't** use pure `#000` or `#fff`. Tint toward brand warmth.
- **Don't** spotlight AI features with sparkle icons, purple gradients, or "Powered by AI" labels. Smart features feel obvious, not marketed.
- **Don't** use em dashes in any UI copy.
- **Don't** use system-ui or Manrope for Arabic text. Cairo only.
- **Don't** add excessive whitespace between hero elements. The layout should feel filled and alive, not sparse.
- **Don't** use emoji as UI icons. Use inline SVGs or text.
- **Don't** use pill-shaped buttons (fully rounded). Subtle (6px) radius only.
- **Don't** use old blue/slate/indigo Tailwind defaults. The palette is sand/primary/signal exclusively.
- **Don't** wrap forms or content in heavy card containers with large shadows. Flat at rest.
- **Don't** wrap individual data rows in cards. Use flat table rows with dividers instead.
- **Don't** use hero-metric cards (big number, small label, gradient accent) for dashboard metrics. Use the Metric Strip pattern (gap-px tiles in a shared frame).
- **Don't** use modals for accept/decline, status changes, or quick actions. Inline or expandable patterns first.
- **Don't** use colored left-border stripes on alerts, callouts, or status indicators. Use background tints instead.
- **Don't** use different sidebar widths or backgrounds across product surfaces. 224px Midnight Navy is universal.
- **Don't** mix status badge color mappings. Green is always active/verified, signal is always pending, navy is always completed, sand is always neutral/cancelled, red is always error/rejected.
- **Don't** add dark mode classes. The system is light-only. Sand-tinted warmth is the identity.
