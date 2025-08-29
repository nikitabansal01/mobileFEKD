/**
 * Color constants used throughout the application
 * 
 * Defines color schemes for both light and dark modes.
 * These colors are used for consistent theming across the app.
 * 
 * Alternative styling approaches include:
 * - [Nativewind](https://www.nativewind.dev/)
 * - [Tamagui](https://tamagui.dev/)
 * - [unistyles](https://reactnativeunistyles.vercel.app)
 */

/**
 * Primary tint color for light mode
 */
const tintColorLight = '#0a7ea4';

/**
 * Primary tint color for dark mode
 */
const tintColorDark = '#fff';

/**
 * Color scheme configuration for light and dark modes
 */
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
