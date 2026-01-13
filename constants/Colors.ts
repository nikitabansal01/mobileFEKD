/**
 * Color constants used throughout the application
 * 
 * Defines color schemes for both light and dark modes.
 * These colors are used for consistent theming across the app.
 * 
 * IMPORTANT: All components should import colors from here
 * instead of defining inline COLORS objects.
 */

// =============================================================================
// BRAND COLORS - Primary gradient and accent colors
// =============================================================================
export const BRAND = {
  gradPurple: '#A29AEA',
  warmPurple: '#C17EC9',
  gradMid1: '#D482B9',
  gradMid2: '#E98BAC',
  gradPink: '#FDC6D1',
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
} as const;

// Brand gradient for LinearGradient components
export const BRAND_GRADIENT = {
  colors: ['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1'] as const,
  locations: [0, 0.3654, 0.571, 0.8336, 1.142] as const,
};

// =============================================================================
// TEXT COLORS
// =============================================================================
export const TEXT = {
  primary: '#000000',
  secondary: '#4A3D5C',
  muted: '#6B5B7A',
  grey: '#6F6F6F',
  greyLight: '#949494',
  white: '#FFFFFF',
  link: '#8B5CF6',
  danger: '#E74C3C',
  warning: '#F6C34C',
} as const;

// =============================================================================
// BACKGROUND COLORS
// =============================================================================
export const BACKGROUND = {
  white: '#FFFFFF',
  light: '#F5F5F5',
  lightGrey: '#F8F8F8',
  skeleton: '#E8E8E8',
  skeletonShimmer: '#F5F5F5',
  lightBlue: '#E0F6FF',
  lightViolet: '#F3F0FF',
  lightYellow: '#FFFCDE',
  lightPink: '#FFEDF7',
  purpleTint: '#F8F4FF',
  danger: '#FEF2F2',
} as const;

// =============================================================================
// BORDER COLORS
// =============================================================================
export const BORDER = {
  light: '#E8E1F0',
  grey: '#E5E5EA',
  greyLight: '#CFCFCF',
  outline: '#D7D5DE',
} as const;

// =============================================================================
// UI ELEMENT COLORS
// =============================================================================
export const UI = {
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
  shadowPurple: 'rgba(193, 126, 201, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  dangerRed: '#EF4444',
  successGreen: '#4CAF50',
  warningYellow: '#F6C34C',
} as const;

// =============================================================================
// LEGACY THEME SUPPORT (for existing code)
// =============================================================================
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// =============================================================================
// UNIFIED COLORS OBJECT FOR COMPONENT MIGRATION
// This matches the inline COLORS pattern used in components
// =============================================================================
export const COLORS = {
  // Basics
  white: BACKGROUND.white,
  black: TEXT.primary,

  // Material-ish surface tokens (used by chat/check-in UI)
  surface: '#FEF7FF',
  onSurface: '#1D1B20',
  surfaceDivider: '#E6E0E9',
  outlineVariant: BORDER.outline,
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#4F378A',

  // Brand
  warmPurple: BRAND.warmPurple,
  gradPurple: BRAND.gradPurple,
  gradPink: BRAND.gradPink,
  accent: BRAND.accent,

  // Text
  textPrimary: TEXT.secondary,
  textSecondary: TEXT.muted,
  greyMedium: TEXT.grey,
  greyLight: TEXT.greyLight,

  // Backgrounds
  background: BACKGROUND.white,
  lightBlue: BACKGROUND.lightBlue,
  lightViolet: BACKGROUND.lightViolet,
  lightYellow: BACKGROUND.lightYellow,

  // Borders
  border: BORDER.light,

  // UI
  shadow: UI.shadow,
  shadowDark: UI.shadowDark,
  shadowPurple: UI.shadowPurple,
  danger: UI.dangerRed,

  // States
  disabledGradient: '#E3B2C5',
} as const;

// =============================================================================
// HORMONE COLORS (for ActionPlanTimeline and HomeScreen)
// =============================================================================
export const HORMONE_COLORS: Record<string, string> = {
  androgens: '#A29AEA',
  progesterone: '#7DD3FC',
  estrogen: '#FF8BA7',
  thyroid: '#F6C34C',
  insulin: '#90EE90',
  cortisol: '#FFA07A',
  fsh: '#98FB98',
  lh: '#FFD700',
  prolactin: '#F6C34C',
  ghrelin: '#FF6B6B',
  testosterone: '#A29AEA',
} as const;

export default Colors;
