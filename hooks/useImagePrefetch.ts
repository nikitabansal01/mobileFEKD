/**
 * Image Prefetch Hooks for AUVRA
 * 
 * Custom hooks for managing image prefetching and cache lifecycle
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Image } from 'expo-image';
import { foodImageService } from '../services/imageService';

// ============================================================================
// useImagePrefetch - Prefetch images on mount
// ============================================================================

interface PrefetchConfig {
  /** URLs to prefetch */
  urls: string[];
  /** Whether prefetching is enabled */
  enabled?: boolean;
  /** Delay before starting prefetch (ms) */
  delay?: number;
  /** Cache policy */
  cachePolicy?: 'disk' | 'memory' | 'memory-disk';
}

/**
 * Hook to prefetch images on component mount
 */
export const useImagePrefetch = ({
  urls,
  enabled = true,
  delay = 500,
  cachePolicy = 'disk',
}: PrefetchConfig) => {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!enabled || hasPrefetched.current || urls.length === 0) return;

    const prefetchImages = async () => {
      try {
        await foodImageService.prefetch(urls, cachePolicy);
        hasPrefetched.current = true;
        console.log(`[Prefetch] Prefetched ${urls.length} images`);
      } catch (error) {
        console.warn('[Prefetch] Failed:', error);
      }
    };

    // Delay prefetch to not block initial render
    const timer = setTimeout(prefetchImages, delay);

    return () => clearTimeout(timer);
  }, [urls, enabled, delay, cachePolicy]);

  // Reset on URL changes
  useEffect(() => {
    hasPrefetched.current = false;
  }, [urls]);
};

// ============================================================================
// useFoodPrefetch - Prefetch food images by ID
// ============================================================================

interface FoodPrefetchConfig {
  /** Food image IDs to prefetch */
  imageIds: string[];
  /** Whether prefetching is enabled */
  enabled?: boolean;
  /** Which sizes to prefetch */
  sizes?: ('thumbnail' | 'medium' | 'full')[];
}

/**
 * Hook to prefetch food images by their IDs
 */
export const useFoodPrefetch = ({
  imageIds,
  enabled = true,
  sizes = ['thumbnail'],
}: FoodPrefetchConfig) => {
  useEffect(() => {
    if (!enabled || imageIds.length === 0) return;

    const prefetch = async () => {
      const urls = imageIds.flatMap(id =>
        sizes.map(size => foodImageService.getImageUrl(id, size))
      );

      await foodImageService.prefetch(urls, 'disk');
    };

    const timer = setTimeout(prefetch, 300);
    return () => clearTimeout(timer);
  }, [imageIds, enabled, sizes]);
};

// ============================================================================
// useAppStateCache - Manage cache based on app state
// ============================================================================

interface AppStateCacheConfig {
  /** Clear memory cache when backgrounded */
  clearOnBackground?: boolean;
  /** Callback when app becomes active */
  onActive?: () => void;
  /** Callback when app goes to background */
  onBackground?: () => void;
}

/**
 * Hook to manage image cache based on app state
 */
export const useAppStateCache = ({
  clearOnBackground = true,
  onActive,
  onBackground,
}: AppStateCacheConfig = {}) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App coming to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onActive?.();
      }

      // App going to background
      if (nextAppState === 'background') {
        if (clearOnBackground) {
          await Image.clearMemoryCache();
        }
        onBackground?.();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription.remove();
  }, [clearOnBackground, onActive, onBackground]);
};

// ============================================================================
// useCacheStatus - Check cache status for URLs
// ============================================================================

interface CacheStatus {
  url: string;
  isCached: boolean;
  cachePath: string | null;
}

/**
 * Hook to check cache status for a list of URLs
 */
export const useCacheStatus = (urls: string[]) => {
  const [status, setStatus] = React.useState<CacheStatus[]>([]);
  const [isChecking, setIsChecking] = React.useState(false);

  const checkCache = useCallback(async () => {
    if (urls.length === 0) return;

    setIsChecking(true);

    try {
      const results = await Promise.all(
        urls.map(async (url) => {
          const cachePath = await foodImageService.getCachePath(url);
          return {
            url,
            isCached: cachePath !== null,
            cachePath,
          };
        })
      );

      setStatus(results);
    } finally {
      setIsChecking(false);
    }
  }, [urls]);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  return { status, isChecking, refresh: checkCache };
};

// ============================================================================
// useCacheManager - Full cache management
// ============================================================================

/**
 * Hook for managing the image cache
 */
export const useCacheManager = () => {
  const clearAll = useCallback(async () => {
    await foodImageService.clearAllCache();
  }, []);

  const clearMemory = useCallback(async () => {
    await foodImageService.clearMemoryCache();
  }, []);

  const clearDisk = useCallback(async () => {
    await foodImageService.clearDiskCache();
  }, []);

  const prefetch = useCallback(
    async (urls: string[], policy: 'disk' | 'memory' | 'memory-disk' = 'disk') => {
      return foodImageService.prefetch(urls, policy);
    },
    []
  );

  const isCached = useCallback(async (url: string) => {
    return foodImageService.isCached(url);
  }, []);

  return {
    clearAll,
    clearMemory,
    clearDisk,
    prefetch,
    isCached,
  };
};

// ============================================================================
// useProgressivePrefetch - Prefetch as user scrolls
// ============================================================================

interface ProgressivePrefetchConfig {
  /** All URLs that could be prefetched */
  allUrls: string[];
  /** Current visible range [start, end] */
  visibleRange: [number, number];
  /** How many items ahead to prefetch */
  prefetchAhead?: number;
  /** Whether prefetching is enabled */
  enabled?: boolean;
}

/**
 * Hook for progressive prefetching based on scroll position
 */
export const useProgressivePrefetch = ({
  allUrls,
  visibleRange,
  prefetchAhead = 10,
  enabled = true,
}: ProgressivePrefetchConfig) => {
  const prefetchedIndices = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled || allUrls.length === 0) return;

    const [, endIndex] = visibleRange;
    const startPrefetch = endIndex + 1;
    const endPrefetch = Math.min(startPrefetch + prefetchAhead, allUrls.length);

    // Get URLs that haven't been prefetched yet
    const urlsToPrefetch: string[] = [];
    for (let i = startPrefetch; i < endPrefetch; i++) {
      if (!prefetchedIndices.current.has(i)) {
        urlsToPrefetch.push(allUrls[i]);
        prefetchedIndices.current.add(i);
      }
    }

    if (urlsToPrefetch.length > 0) {
      foodImageService.queueForPrefetch(urlsToPrefetch);
    }
  }, [allUrls, visibleRange, prefetchAhead, enabled]);

  // Reset when URLs change
  useEffect(() => {
    prefetchedIndices.current.clear();
  }, [allUrls]);
};

// ============================================================================
// React import for useCacheStatus state
// ============================================================================

import React from 'react';

export default {
  useImagePrefetch,
  useFoodPrefetch,
  useAppStateCache,
  useCacheStatus,
  useCacheManager,
  useProgressivePrefetch,
};
