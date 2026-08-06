/**
 * Shakir Design System tokens, ported to React Native.
 *
 * Values are lifted from the handoff bundle's token files
 * (dr-evide-doctor-discovery/project/_ds/shakir-.../tokens/*.css) with the
 * project's teal re-skin applied, so the app and the website resolve to the
 * same palette. CSS custom properties don't exist here, so they become a
 * plain object.
 *
 * Deviations from the design system, stated per its own rule:
 *   1. Accent is teal #0f766e rather than Flare coral — coral reads as an alert
 *      in a medical context. Light surfaces only; both mock files use them.
 *   2. textFaint and warningText are darkened past the DS values to reach WCAG
 *      AA. Kept identical to apps/web/src/styles/theme.css so a doctor card
 *      reads the same on both.
 */

export const color = {
  // Surfaces (light theme)
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surface2: "#F3F2ED",
  text: "#161618",
  textMuted: "#4E4B43",
  /**
   * The DS value (#938F84) measures 3.1:1 on bg, under the 4.5:1 AA needs for
   * body text. This token carries hints, disclaimers and the "not yet verified"
   * note — the copy that most has to survive a cheap screen in daylight. One
   * rung down the same neutral ramp gives 5.1:1.
   */
  textFaint: "#6E6A60",
  border: "#D6D3C9",
  borderStrong: "#B9B5AA",

  // Teal re-skin
  accent: "#0f766e",
  accentHover: "#0c5d57",
  accentPress: "#0a4a45",
  accentText: "#0f766e",
  accentContrast: "#ffffff",
  accent2: "#137A52",
  accent2Text: "#0B4E36",
  flare50: "#effcf8",
  flare200: "#a6e6da",

  // Semantic
  success: "#1E9E63",
  warning: "#D98A0B",
  /**
   * warning as a text colour on its own 12% wash is 2.7:1. It marks records as
   * fictional and flags the offline fallback, so it must not be the quietest
   * thing on screen. Fills and borders keep `warning`; only glyphs use this.
   */
  warningText: "#7A4E06",
  danger: "#D92D20",
  info: "#2D6BE0",

  /** Emergency screen field — from the mock's screen 4. */
  emergency: "#B4231A",

  /** Tint used for the accent-2 pills; color-mix() has no RN equivalent. */
  accent2Wash: "rgba(19, 122, 82, 0.12)",
  accent2Edge: "rgba(19, 122, 82, 0.30)",
  warningWash: "rgba(217, 138, 11, 0.12)",
  warningEdge: "rgba(217, 138, 11, 0.30)",
} as const;

/** 8px grid. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

/** Sharp structure, soft touch — never round a panel, never sharpen a button. */
export const radius = {
  panel: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Font family keys. These strings must match the names registered in
 * app/_layout.tsx via useFonts.
 */
export const font = {
  displayCaps: "Anton",
  display: "ClashDisplay",
  body: "GeneralSans",
  bodyMedium: "GeneralSansMedium",
  bodySemibold: "GeneralSansSemibold",
  mono: "JetBrainsMono",
  monoBold: "JetBrainsMonoBold",
  malayalam: "NotoSansMalayalam",
} as const;

export const text = {
  "2xl": 24,
  xl: 20,
  lg: 18,
  base: 16,
  sm: 14,
  xs: 12,
} as const;

/** Nothing heavier than shadow-md is allowed by the design system. */
export const shadow = {
  sm: {
    shadowColor: "#0E0E10",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#0E0E10",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

/** Quiet uppercase label that sits above one loud display line. */
export const eyebrow = {
  fontFamily: font.bodySemibold,
  fontSize: text.xs,
  textTransform: "uppercase" as const,
  letterSpacing: 0.96, // 0.08em at 12px
  color: color.textMuted,
};
