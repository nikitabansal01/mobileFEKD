import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-specific color scheme hook with hydration support
 * 
 * This hook provides color scheme detection for web platforms with proper
 * hydration handling to support static rendering. Returns 'light' as default
 * during server-side rendering and switches to actual device preference after hydration.
 * 
 * @returns The current color scheme ('light' | 'dark' | null)
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
