/**
 * Example Usage: Food Image Components
 * 
 * This file demonstrates how to use the image loading system
 * in your AUVRA mobile app
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import the image components and services
import { OptimizedFoodImage, FoodThumbnail, FoodFullImage } from '../components/OptimizedFoodImage';
import { FoodImageGrid, FoodGridItem } from '../components/FoodImageGrid';
import { foodImageService } from '../services/imageService';
import {
  useImagePrefetch,
  useFoodPrefetch,
  useAppStateCache,
  useCacheManager,
} from '../hooks/useImagePrefetch';

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_FOODS: FoodGridItem[] = [
  { id: '1', imageId: 'apple', name: 'Apple', calories: 95, blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' },
  { id: '2', imageId: 'banana', name: 'Banana', calories: 105, blurhash: 'LPP5];~W9u-;WCWBs:xu~qj[Rjt6' },
  { id: '3', imageId: 'orange', name: 'Orange', calories: 62, blurhash: 'LMGu?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '4', imageId: 'grapes', name: 'Grapes', calories: 62, blurhash: 'LPF5?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '5', imageId: 'strawberry', name: 'Strawberry', calories: 32, blurhash: 'LMGu?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '6', imageId: 'chicken-breast', name: 'Chicken Breast', calories: 165, blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' },
  { id: '7', imageId: 'salmon', name: 'Salmon', calories: 208, blurhash: 'LPP5];~W9u-;WCWBs:xu~qj[Rjt6' },
  { id: '8', imageId: 'broccoli', name: 'Broccoli', calories: 55, blurhash: 'LMGu?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '9', imageId: 'rice', name: 'Rice', calories: 206, blurhash: 'LPF5?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '10', imageId: 'pizza', name: 'Pizza', calories: 285, blurhash: 'LMGu?A~q9ZxuoLofM|WB9FxvIoRj' },
  { id: '11', imageId: 'burger', name: 'Burger', calories: 354, blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' },
  { id: '12', imageId: 'salad', name: 'Salad', calories: 35, blurhash: 'LPP5];~W9u-;WCWBs:xu~qj[Rjt6' },
];

// Common food URLs to prefetch on app startup
const COMMON_FOOD_URLS = SAMPLE_FOODS.slice(0, 6).map(
  food => foodImageService.getImageUrl(food.imageId, 'thumbnail')
);

// ============================================================================
// EXAMPLE 1: Basic Food Image
// ============================================================================

export const BasicImageExample: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Food Image</Text>
      
      {/* Using imageId - generates URLs automatically */}
      <OptimizedFoodImage
        imageId="apple"
        size="medium"
        showLoadingIndicator
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 2: Different Sizes
// ============================================================================

export const SizesExample: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Different Sizes</Text>
      <View style={styles.row}>
        {/* Thumbnail - 80x80 */}
        <View style={styles.sizeItem}>
          <FoodThumbnail imageId="banana" />
          <Text style={styles.label}>Thumbnail</Text>
        </View>
        
        {/* Medium - 200x200 */}
        <View style={styles.sizeItem}>
          <OptimizedFoodImage imageId="banana" size="medium" />
          <Text style={styles.label}>Medium</Text>
        </View>
      </View>
      
      {/* Full - 400x400 */}
      <View style={styles.sizeItem}>
        <FoodFullImage imageId="banana" />
        <Text style={styles.label}>Full</Text>
      </View>
    </View>
  );
};

// ============================================================================
// EXAMPLE 3: Food Image Grid
// ============================================================================

export const GridExample: React.FC = () => {
  const handleFoodPress = (food: FoodGridItem) => {
    Alert.alert(food.name, `Calories: ${food.calories}`);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Food Grid</Text>
      <FoodImageGrid
        foods={SAMPLE_FOODS}
        numColumns={3}
        showName
        showCalories
        onFoodPress={handleFoodPress}
        style={{ height: 400 }}
      />
    </View>
  );
};

// ============================================================================
// EXAMPLE 4: With Prefetching Hook
// ============================================================================

export const PrefetchExample: React.FC = () => {
  // Prefetch common food images on mount
  useImagePrefetch({
    urls: COMMON_FOOD_URLS,
    enabled: true,
    delay: 500,
  });

  // Also prefetch specific foods
  useFoodPrefetch({
    imageIds: ['pizza', 'burger', 'salad'],
    sizes: ['thumbnail', 'medium'],
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Prefetched Images</Text>
      <Text style={styles.description}>
        These images were prefetched and load instantly!
      </Text>
      <View style={styles.row}>
        <FoodThumbnail imageId="apple" />
        <FoodThumbnail imageId="banana" />
        <FoodThumbnail imageId="orange" />
      </View>
    </View>
  );
};

// ============================================================================
// EXAMPLE 5: Cache Management
// ============================================================================

export const CacheManagementExample: React.FC = () => {
  const { clearAll, clearMemory, prefetch, isCached } = useCacheManager();
  const [cacheStatus, setCacheStatus] = useState<Record<string, boolean>>({});

  // Manage cache based on app state
  useAppStateCache({
    clearOnBackground: true,
    onActive: () => console.log('App active'),
    onBackground: () => console.log('App backgrounded, cleared memory cache'),
  });

  const checkCache = async () => {
    const status: Record<string, boolean> = {};
    for (const food of SAMPLE_FOODS.slice(0, 3)) {
      const url = foodImageService.getImageUrl(food.imageId, 'thumbnail');
      status[food.name] = await isCached(url);
    }
    setCacheStatus(status);
    Alert.alert('Cache Status', JSON.stringify(status, null, 2));
  };

  const prefetchAll = async () => {
    const urls = SAMPLE_FOODS.map(f => foodImageService.getImageUrl(f.imageId, 'thumbnail'));
    const success = await prefetch(urls);
    Alert.alert('Prefetch', success ? 'All images prefetched!' : 'Some images failed');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cache Management</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={checkCache}>
          <Text style={styles.buttonText}>Check Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={prefetchAll}>
          <Text style={styles.buttonText}>Prefetch All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearMemory}>
          <Text style={styles.buttonText}>Clear Memory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAll}>
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// EXAMPLE 6: Custom Styling
// ============================================================================

export const CustomStylingExample: React.FC = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Custom Styling</Text>
      
      <View style={styles.row}>
        {/* Rounded */}
        <OptimizedFoodImage
          imageId="strawberry"
          size="thumbnail"
          borderRadius={40}
        />
        
        {/* Square corners */}
        <OptimizedFoodImage
          imageId="grapes"
          size="thumbnail"
          borderRadius={0}
        />
        
        {/* Custom size */}
        <OptimizedFoodImage
          imageId="orange"
          width={100}
          height={60}
          borderRadius={8}
        />
      </View>
    </View>
  );
};

// ============================================================================
// EXAMPLE 7: Direct URL Usage
// ============================================================================

export const DirectUrlExample: React.FC = () => {
  // Generate URLs manually
  const pizzaUrl = foodImageService.getImageUrl('pizza', 'medium');
  const sources = foodImageService.getImageSources('burger');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Direct URL Usage</Text>
      
      {/* Using uri prop directly */}
      <OptimizedFoodImage
        uri={pizzaUrl}
        size="medium"
      />
      
      {/* Using pre-computed sources */}
      <OptimizedFoodImage
        sources={sources}
        size="thumbnail"
      />
    </View>
  );
};

// ============================================================================
// MAIN DEMO SCREEN
// ============================================================================

export const FoodImageDemoScreen: React.FC = () => {
  // Prefetch on app startup
  useImagePrefetch({ urls: COMMON_FOOD_URLS });
  useAppStateCache({ clearOnBackground: true });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Food Image Examples</Text>
        
        <BasicImageExample />
        <SizesExample />
        <GridExample />
        <PrefetchExample />
        <CacheManagementExample />
        <CustomStylingExample />
        <DirectUrlExample />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  sizeItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default FoodImageDemoScreen;
