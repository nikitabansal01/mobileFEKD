/**
 * Image Components Index
 * Export all image-related components for easy imports
 */

// Main components
export { 
  OptimizedFoodImage, 
  FoodThumbnail, 
  FoodMediumImage, 
  FoodFullImage,
  type OptimizedFoodImageProps,
} from './OptimizedFoodImage';

export { 
  FoodImageGrid,
  type FoodGridItem,
} from './FoodImageGrid';

// Re-export service for convenience
export { foodImageService } from '../services/imageService';
