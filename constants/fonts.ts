// Simple Font Configuration for React Native
// Using system fonts and web-safe fonts for better compatibility

// Font family mappings for easy usage
export const FONT_FAMILIES = {
    // Inter variants - using system fonts
    'Inter-Regular': 'System',
    'Inter-Medium': 'System',
    'Inter-SemiBold': 'System',
    'Inter-Bold': 'System',
    
    // Noto Serif variants - using serif system fonts
    'NotoSerif-Regular': 'serif',
    'NotoSerif-Bold': 'serif',
  } as const;
  
  // Hook to load fonts - simplified
  export const useAppFonts = () => {
    // Return true immediately since we're using system fonts
    return true;
  };
  