/**
 * FoodImageGrid Component
 * 
 * Optimized grid display for food images with prefetching and recycling
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import { OptimizedFoodImage } from './OptimizedFoodImage';
import { foodImageService } from '../services/imageService';

// ============================================================================
// TYPES
// ============================================================================

export interface FoodGridItem {
  id: string;
  imageId: string;
  name: string;
  blurhash?: string;
  calories?: number;
  category?: string;
}

interface FoodImageGridProps {
  /** Array of food items to display */
  foods: FoodGridItem[];
  /** Number of columns in the grid */
  numColumns?: number;
  /** Called when a food item is pressed */
  onFoodPress?: (food: FoodGridItem) => void;
  /** Called when a food item is long pressed */
  onFoodLongPress?: (food: FoodGridItem) => void;
  /** Show food name below image */
  showName?: boolean;
  /** Show calories below image */
  showCalories?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Content container style */
  contentContainerStyle?: ViewStyle;
  /** Gap between items */
  gap?: number;
  /** Horizontal padding */
  horizontalPadding?: number;
  /** Enable prefetching of thumbnails */
  enablePrefetch?: boolean;
  /** Number of items to prefetch ahead */
  prefetchAhead?: number;
  /** Empty state component */
  ListEmptyComponent?: React.ReactElement;
  /** Header component */
  ListHeaderComponent?: React.ReactElement;
  /** Footer component */
  ListFooterComponent?: React.ReactElement;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COMPONENT
// ============================================================================

export const FoodImageGrid: React.FC<FoodImageGridProps> = ({
  foods,
  numColumns = 3,
  onFoodPress,
  onFoodLongPress,
  showName = false,
  showCalories = false,
  style,
  contentContainerStyle,
  gap = 8,
  horizontalPadding = 16,
  enablePrefetch = true,
  prefetchAhead = 20,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  // Calculate item size based on screen width and columns
  const itemSize = useMemo(() => {
    const totalGaps = (numColumns - 1) * gap;
    const totalPadding = horizontalPadding * 2;
    return (SCREEN_WIDTH - totalPadding - totalGaps) / numColumns;
  }, [numColumns, gap, horizontalPadding]);

  // Prefetch thumbnails for visible items
  useEffect(() => {
    if (!enablePrefetch || foods.length === 0) return;

    const prefetchInitial = async () => {
      const thumbnailUrls = foods
        .slice(0, prefetchAhead)
        .map(food => foodImageService.getImageUrl(food.imageId, 'thumbnail'));

      await foodImageService.prefetch(thumbnailUrls, 'disk');
    };

    prefetchInitial();
  }, [foods, enablePrefetch, prefetchAhead]);

  // Handle viewable items change for progressive prefetching
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: FoodGridItem }> }) => {
      if (!enablePrefetch || viewableItems.length === 0) return;

      // Find the last visible index and prefetch ahead
      const lastVisibleIndex = Math.max(
        ...viewableItems.map((vi) => foods.findIndex((f) => f.id === vi.item.id))
      );

      const startIndex = lastVisibleIndex + 1;
      const endIndex = Math.min(startIndex + prefetchAhead, foods.length);

      if (startIndex < foods.length) {
        const urlsToPrefetch = foods
          .slice(startIndex, endIndex)
          .map(food => foodImageService.getImageUrl(food.imageId, 'thumbnail'));

        foodImageService.queueForPrefetch(urlsToPrefetch);
      }
    },
    [foods, enablePrefetch, prefetchAhead]
  );

  // Memoized viewability config
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
    }),
    []
  );

  // Render individual food item
  const renderItem = useCallback(
    ({ item, index }: { item: FoodGridItem; index: number }) => {
      const isLastInRow = (index + 1) % numColumns === 0;
      const marginRight = isLastInRow ? 0 : gap;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFoodPress?.(item)}
          onLongPress={() => onFoodLongPress?.(item)}
          style={[
            styles.itemContainer,
            {
              width: itemSize,
              marginRight,
              marginBottom: gap,
            },
          ]}
        >
          <OptimizedFoodImage
            imageId={item.imageId}
            size="thumbnail"
            blurhash={item.blurhash}
            recyclingKey={item.id}
            priority={index < 9 ? 'high' : 'normal'}
            width={itemSize}
            height={itemSize}
            borderRadius={12}
          />
          
          {(showName || showCalories) && (
            <View style={styles.infoContainer}>
              {showName && (
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
              )}
              {showCalories && item.calories !== undefined && (
                <Text style={styles.calories}>
                  {item.calories} cal
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [itemSize, gap, numColumns, onFoodPress, onFoodLongPress, showName, showCalories]
  );

  // Key extractor
  const keyExtractor = useCallback((item: FoodGridItem) => item.id, []);

  // Optimized getItemLayout for fixed-size items
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      const itemHeight = showName || showCalories ? itemSize + 40 : itemSize;
      const rowIndex = Math.floor(index / numColumns);
      return {
        length: itemHeight + gap,
        offset: (itemHeight + gap) * rowIndex,
        index,
      };
    },
    [itemSize, numColumns, gap, showName, showCalories]
  );

  return (
    <FlatList
      data={foods}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      style={style}
      contentContainerStyle={[
        styles.container,
        { paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={numColumns * 4}
      windowSize={5}
      initialNumToRender={numColumns * 5}
      getItemLayout={getItemLayout}
      // Viewability tracking for prefetch
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      // Components
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
    />
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  itemContainer: {
    overflow: 'hidden',
  },
  infoContainer: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  foodName: {
    fontSize: 12,
    fontFamily: 'Inter500',
    color: '#333',
  },
  calories: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
});

export default FoodImageGrid;
