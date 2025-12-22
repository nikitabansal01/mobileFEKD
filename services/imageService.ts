/**
 * Food Image Service for AUVRA
 * 
 * Handles image URL generation, prefetching, caching, and management
 * Optimized for Cloudflare R2 + expo-image
 */

import { Image } from 'expo-image';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageSources {
  thumbnail: string;
  medium: string;
  full: string;
  blurhash?: string;
  thumbhash?: string;
}

export type ImageSize = 'thumbnail' | 'medium' | 'full';

export interface ImageConfig {
  baseUrl: string;
  cdnUrl?: string;
  bucketPath: string;
  defaultQuality: Record<ImageSize, number>;
  dimensions: Record<ImageSize, { width: number; height: number }>;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'avif' | 'auto';
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: ImageConfig = {
  // Replace with your Cloudflare R2 public URL
  baseUrl: process.env.EXPO_PUBLIC_R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev',
  // Optional: Custom domain with Cloudflare CDN
  cdnUrl: process.env.EXPO_PUBLIC_CDN_URL || undefined,
  bucketPath: 'foods',
  defaultQuality: {
    thumbnail: 75,
    medium: 80,
    full: 85,
  },
  dimensions: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    full: { width: 800, height: 800 },
  },
};

// Default food blurhash (warm, appetizing colors)
const DEFAULT_FOOD_BLURHASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

// ============================================================================
// IMAGE SERVICE CLASS
// ============================================================================

class FoodImageService {
  private config: ImageConfig;
  private prefetchQueue: Set<string> = new Set();
  private isPrefetching: boolean = false;

  constructor(config?: Partial<ImageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // URL Generation
  // --------------------------------------------------------------------------

  /**
   * Get the base URL for images (CDN if available, otherwise R2)
   */
  private getBaseUrl(): string {
    return this.config.cdnUrl || this.config.baseUrl;
  }

  /**
   * Get all image sources for a food item
   * @param imageId - The image filename (e.g., "pizza.webp" or just "pizza")
   * @param blurhash - Optional pre-computed blurhash
   */
  getImageSources(imageId: string, blurhash?: string): ImageSources {
    const base = this.getBaseUrl();
    const { bucketPath } = this.config;
    
    // Ensure WebP extension
    const filename = imageId.includes('.') ? imageId : `${imageId}.webp`;

    return {
      thumbnail: `${base}/${bucketPath}/thumb/${filename}`,
      medium: `${base}/${bucketPath}/medium/${filename}`,
      full: `${base}/${bucketPath}/full/${filename}`,
      blurhash: blurhash || DEFAULT_FOOD_BLURHASH,
    };
  }

  /**
   * Get a single image URL for a specific size
   */
  getImageUrl(imageId: string, size: ImageSize = 'medium'): string {
    const sources = this.getImageSources(imageId);
    return sources[size];
  }

  /**
   * Get Cloudflare Images transformation URL (if using Cloudflare Images)
   * This allows on-the-fly image transformations
   */
  getTransformedUrl(imageId: string, options: TransformOptions = {}): string {
    const {
      width = 400,
      height = 400,
      quality = 80,
      format = 'webp',
      fit = 'cover',
    } = options;

    const base = this.getBaseUrl();
    const { bucketPath } = this.config;

    // Cloudflare Images transformation URL format
    return `${base}/cdn-cgi/image/width=${width},height=${height},quality=${quality},format=${format},fit=${fit}/${bucketPath}/${imageId}`;
  }

  /**
   * Get responsive image sources for different screen densities
   */
  getResponsiveSources(imageId: string): { uri: string; width: number; height: number }[] {
    const { dimensions } = this.config;
    
    return [
      {
        uri: this.getImageUrl(imageId, 'thumbnail'),
        width: dimensions.thumbnail.width,
        height: dimensions.thumbnail.height,
      },
      {
        uri: this.getImageUrl(imageId, 'medium'),
        width: dimensions.medium.width,
        height: dimensions.medium.height,
      },
      {
        uri: this.getImageUrl(imageId, 'full'),
        width: dimensions.full.width,
        height: dimensions.full.height,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // Caching & Prefetching
  // --------------------------------------------------------------------------

  /**
   * Prefetch images for quick display
   * @param urls - Single URL or array of URLs to prefetch
   * @param cachePolicy - Where to cache ('disk' | 'memory' | 'memory-disk')
   */
  async prefetch(
    urls: string | string[],
    cachePolicy: 'disk' | 'memory' | 'memory-disk' = 'disk'
  ): Promise<boolean> {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    if (urlArray.length === 0) return true;

    try {
      return await Image.prefetch(urlArray, { cachePolicy });
    } catch (error) {
      console.warn('[ImageService] Prefetch failed:', error);
      return false;
    }
  }

  /**
   * Prefetch food images by ID (fetches all sizes)
   */
  async prefetchFood(imageId: string): Promise<boolean> {
    const sources = this.getImageSources(imageId);
    return this.prefetch([sources.thumbnail, sources.medium], 'memory-disk');
  }

  /**
   * Prefetch multiple food thumbnails (for lists/grids)
   */
  async prefetchThumbnails(imageIds: string[]): Promise<boolean> {
    const urls = imageIds.map(id => this.getImageUrl(id, 'thumbnail'));
    return this.prefetch(urls, 'disk');
  }

  /**
   * Queue images for background prefetching
   */
  queueForPrefetch(urls: string[]): void {
    urls.forEach(url => this.prefetchQueue.add(url));
    this.processPrefetchQueue();
  }

  /**
   * Process the prefetch queue in batches
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.size === 0) return;

    this.isPrefetching = true;

    try {
      // Process in batches of 10
      const batchSize = 10;
      const urls = Array.from(this.prefetchQueue).slice(0, batchSize);
      
      await this.prefetch(urls, 'disk');
      
      // Remove processed URLs from queue
      urls.forEach(url => this.prefetchQueue.delete(url));
    } finally {
      this.isPrefetching = false;
      
      // Continue processing if more items in queue
      if (this.prefetchQueue.size > 0) {
        setTimeout(() => this.processPrefetchQueue(), 100);
      }
    }
  }

  /**
   * Check if an image is cached
   */
  async isCached(url: string): Promise<boolean> {
    try {
      const path = await Image.getCachePathAsync(url);
      return path !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the cache path for an image (if cached)
   */
  async getCachePath(url: string): Promise<string | null> {
    try {
      return await Image.getCachePathAsync(url);
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Cache Management
  // --------------------------------------------------------------------------

  /**
   * Clear all image caches (memory + disk)
   */
  async clearAllCache(): Promise<void> {
    await Promise.all([
      Image.clearMemoryCache(),
      Image.clearDiskCache(),
    ]);
    console.log('[ImageService] All caches cleared');
  }

  /**
   * Clear memory cache only (use for low memory situations)
   */
  async clearMemoryCache(): Promise<void> {
    await Image.clearMemoryCache();
    console.log('[ImageService] Memory cache cleared');
  }

  /**
   * Clear disk cache only
   */
  async clearDiskCache(): Promise<void> {
    await Image.clearDiskCache();
    console.log('[ImageService] Disk cache cleared');
  }

  // --------------------------------------------------------------------------
  // Blurhash Generation
  // --------------------------------------------------------------------------

  /**
   * Generate blurhash from an image URL
   * Note: This is CPU-intensive, better done on server
   */
  async generateBlurhash(
    imageUrl: string,
    components: [number, number] = [4, 3]
  ): Promise<string | null> {
    try {
      return await Image.generateBlurhashAsync(imageUrl, components);
    } catch (error) {
      console.warn('[ImageService] Blurhash generation failed:', error);
      return null;
    }
  }

  /**
   * Generate thumbhash from an image URL
   * Thumbhash is newer and produces slightly higher quality placeholders
   */
  async generateThumbhash(imageUrl: string): Promise<string | null> {
    try {
      return await Image.generateThumbhashAsync(imageUrl);
    } catch (error) {
      console.warn('[ImageService] Thumbhash generation failed:', error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  /**
   * Get default blurhash for food images
   */
  getDefaultBlurhash(): string {
    return DEFAULT_FOOD_BLURHASH;
  }

  /**
   * Get image dimensions for a size
   */
  getDimensions(size: ImageSize): { width: number; height: number } {
    return this.config.dimensions[size];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ImageConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const foodImageService = new FoodImageService();

// Also export the class for testing or custom instances
export { FoodImageService };
