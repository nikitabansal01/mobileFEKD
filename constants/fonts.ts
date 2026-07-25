/**
 * Font Configuration for React Native
 * 
 * STANDARDIZED FONT NAMING CONVENTIONS:
 * - Use 'Inter400', 'Inter500', 'Inter600' for Inter font weights
 * - Use 'NotoSerif400', 'NotoSerif500', 'NotoSerif600' for NotoSerif font weights
 * 
 * IMPORTANT: All font references should use these constants
 * to ensure consistency across the app.
 */

// =============================================================================
// FONT FAMILIES - Standard naming with weight suffix
// =============================================================================
export const FONTS = {
  // Inter variants (sans-serif)
  'Inter-Regular': 'Inter400',
  'Inter-Medium': 'Inter500',
  'Inter-SemiBold': 'Inter600',
  'Inter-Bold': 'Inter700',

  // NotoSerif variants (serif)
  'NotoSerif-Regular': 'NotoSerif400',
  'NotoSerif-Medium': 'NotoSerif500',
  'NotoSerif-SemiBold': 'NotoSerif600',
  'NotoSerif-Bold': 'NotoSerif700',
} as const;

// =============================================================================
// FONT FAMILIES MAPPING (Legacy support for FONT_FAMILIES import)
// Maps the dash-format names to actual font names
// =============================================================================
export const FONT_FAMILIES = {
  // Property aliases retained for components written before the standardized keys.
  regular: 'Inter400',
  medium: 'Inter500',
  semiBold: 'Inter600',
  bold: 'Inter700',
  // Inter variants - using system fonts as fallback
  'Inter-Regular': 'Inter400',
  'Inter-Medium': 'Inter500',
  'Inter-SemiBold': 'Inter600',
  'Inter-Bold': 'Inter700',

  // Noto Serif variants
  'NotoSerif-Regular': 'NotoSerif400',
  'NotoSerif-Medium': 'NotoSerif500',
  'NotoSerif-SemiBold': 'NotoSerif600',
  'NotoSerif-Bold': 'NotoSerif700',
} as const;

// =============================================================================
// DIRECT FONT NAMES (for inline usage without mapping)
// =============================================================================
export const FONT_INTER = {
  regular: 'Inter400',
  medium: 'Inter500',
  semiBold: 'Inter600',
  bold: 'Inter700',
} as const;

export const FONT_SERIF = {
  regular: 'NotoSerif400',
  medium: 'NotoSerif500',
  semiBold: 'NotoSerif600',
  bold: 'NotoSerif700',
} as const;

// =============================================================================
// TYPOGRAPHY PRESETS (common text styles)
// =============================================================================
export const TYPOGRAPHY = {
  // Headers
  h1: {
    fontFamily: 'NotoSerif600',
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontFamily: 'NotoSerif500',
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontFamily: 'NotoSerif500',
    fontSize: 16,
    lineHeight: 24,
  },

  // Body text
  body: {
    fontFamily: 'Inter400',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: 'Inter500',
    fontSize: 14,
    lineHeight: 20,
  },

  // Small text
  caption: {
    fontFamily: 'Inter400',
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: 'Inter500',
    fontSize: 12,
    lineHeight: 16,
  },

  // Button text
  button: {
    fontFamily: 'Inter500',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonSmall: {
    fontFamily: 'Inter500',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

// =============================================================================
// HOOK - for font loading (simplified as we're using system fonts)
// =============================================================================
export const useAppFonts = () => {
  // Return true immediately since fonts are bundled with app
  return true;
};

export default FONTS;
