/**
 * Theme-aware color hook for light and dark mode support
 * 
 * This hook provides theme-aware color selection based on the current color scheme.
 * It prioritizes props-based colors over default theme colors.
 * 
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Hook to get theme-aware colors
 * 
 * @param props - Object containing light and dark color overrides
 * @param props.light - Color to use in light mode (optional)
 * @param props.dark - Color to use in dark mode (optional)
 * @param colorName - Name of the color from the Colors constant
 * @returns The appropriate color for the current theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
