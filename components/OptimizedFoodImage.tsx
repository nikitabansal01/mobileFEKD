/**
 * OptimizedFoodImage Component
 * 
 * A performant image component optimized for food images in AUVRA
 * Features: caching, blurhash placeholders, error handling, loading states
 */

import React, { memo, useCallback, useState } from 'react';
import { Image, ImageLoadEventData, ImageContentFit } from 'expo-image';
import { StyleSheet, View, ActivityIndicator, ViewStyle } from 'react-native';
import { foodImageService, ImageSources, ImageSize } from '../services/imageService';

// ============================================================================
// TYPES
// ============================================================================

export interface OptimizedFoodImageProps {
  /** Image ID (filename without path) - will generate all URLs automatically */
  imageId?: string;
  /** Pre-computed image sources (alternative to imageId) */
  sources?: ImageSources;
  /** Direct image URL (alternative to imageId) */
  uri?: string;
  /** Image size variant */
  size?: ImageSize;
  /** Blurhash placeholder string */
  blurhash?: string;
  /** Thumbhash placeholder string (takes precedence over blurhash) */
  thumbhash?: string;
  /** Show loading indicator overlay */
  showLoadingIndicator?: boolean;
  /** Loading priority */
  priority?: 'low' | 'normal' | 'high';
  /** How the image should fit its container */
  contentFit?: ImageContentFit;
  /** Transition duration in ms */
  transitionDuration?: number;
  /** Cache policy */
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  /** Unique key for recycling in lists (prevents showing old images) */
  recyclingKey?: string;
  /** Custom width (overrides size preset) */
  width?: number;
  /** Custom height (overrides size preset) */
  height?: number;
  /** Container style */
  style?: ViewStyle;
  /** Image border radius */
  borderRadius?: number;
  /** Called when image loads successfully */
  onLoad?: (event: ImageLoadEventData) => void;
  /** Called when image fails to load */
  onError?: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_DIMENSIONS: Record<ImageSize, { width: number; height: number }> = {
  thumbnail: { width: 80, height: 80 },
  medium: { width: 200, height: 200 },
  full: { width: 400, height: 400 },
};

// Default warm food-colored blurhash
const DEFAULT_FOOD_BLURHASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

// ============================================================================
// COMPONENT
// ============================================================================

const OptimizedFoodImageComponent: React.FC<OptimizedFoodImageProps> = ({
  imageId,
  sources,
  uri,
  size = 'medium',
  blurhash,
  thumbhash,
  showLoadingIndicator = false,
  priority = 'normal',
  contentFit = 'cover',
  transitionDuration = 200,
  cachePolicy = 'memory-disk',
  recyclingKey,
  width,
  height,
  style,
  borderRadius = 8,
  onLoad,
  onError,
  accessibilityLabel = 'Food image',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine dimensions
  const defaultDimensions = SIZE_DIMENSIONS[size];
  const dimensions = {
    width: width ?? defaultDimensions.width,
    height: height ?? defaultDimensions.height,
  };

  // Get image source URL
  const getSourceUrl = useCallback((): string | null => {
    // Priority: uri > sources > imageId
    if (uri) return uri;
    
    if (sources) {
      switch (size) {
        case 'thumbnail': return sources.thumbnail;
        case 'medium': return sources.medium;
        case 'full': return sources.full;
        default: return sources.medium;
      }
    }
    
    if (imageId) {
      return foodImageService.getImageUrl(imageId, size);
    }
    
    return null;
  }, [uri, sources, imageId, size]);

  // Get placeholder (thumbhash > blurhash > sources.blurhash > default)
  const getPlaceholder = useCallback(() => {
    if (thumbhash) {
      return { thumbhash };
    }
    
    const hash = blurhash || sources?.blurhash || DEFAULT_FOOD_BLURHASH;
    return { blurhash: hash };
  }, [thumbhash, blurhash, sources?.blurhash]);

  const sourceUrl = getSourceUrl();
  const placeholder = getPlaceholder();

  // Event handlers
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoad = useCallback((event: ImageLoadEventData) => {
    setIsLoading(false);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Fallback source for errors
  const fallbackSource = require('../assets/images/food-placeholder.png');

  // Show placeholder if no source
  if (!sourceUrl && !hasError) {
    return (
      <View style={[dimensions, styles.placeholder, { borderRadius }, style]}>
        <Image
          source={fallbackSource}
          style={[dimensions, { borderRadius }]}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View style={[dimensions, { borderRadius }, style]}>
      <Image
        source={hasError ? fallbackSource : sourceUrl}
        placeholder={placeholder}
        placeholderContentFit="cover"
        contentFit={contentFit}
        transition={transitionDuration}
        cachePolicy={cachePolicy}
        priority={priority}
        recyclingKey={recyclingKey || imageId}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        style={[dimensions, styles.image, { borderRadius }]}
        accessibilityLabel={accessibilityLabel}
        alt={accessibilityLabel}
      />
      
      {showLoadingIndicator && isLoading && !hasError && (
        <View style={[dimensions, styles.loadingOverlay, { borderRadius }]}>
          <ActivityIndicator size="small" color="#FF6B35" />
        </View>
      )}
    </View>
  );
};

// ============================================================================
// MEMOIZED EXPORT
// ============================================================================

/**
 * Memoized OptimizedFoodImage component
 * Prevents unnecessary re-renders in lists
 */
export const OptimizedFoodImage = memo(OptimizedFoodImageComponent);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * Pre-configured thumbnail image
 */
export const FoodThumbnail: React.FC<Omit<OptimizedFoodImageProps, 'size'>> = (props) => (
  <OptimizedFoodImage {...props} size="thumbnail" />
);

/**
 * Pre-configured medium image
 */
export const FoodMediumImage: React.FC<Omit<OptimizedFoodImageProps, 'size'>> = (props) => (
  <OptimizedFoodImage {...props} size="medium" />
);

/**
 * Pre-configured full-size image
 */
export const FoodFullImage: React.FC<Omit<OptimizedFoodImageProps, 'size'>> = (props) => (
  <OptimizedFoodImage {...props} size="full" priority="high" />
);

export default OptimizedFoodImage;
