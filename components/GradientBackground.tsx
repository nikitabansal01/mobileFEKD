import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { responsiveWidth, responsiveHeight } from 'react-native-responsive-dimensions';

/**
 * Props for the GradientBackground component
 */
interface GradientBackgroundProps {
  /** Child components to render inside the gradient background */
  children?: React.ReactNode;
  /** Additional styles for the container */
  style?: any;
  /** Layout event handler */
  onLayout?: (event: any) => void;
}

/**
 * GradientBackground Component
 * 
 * Creates a beautiful gradient background with multiple color layers and fade effects.
 * Used primarily in onboarding and welcome screens.
 * 
 * @param props - Component props
 * @param props.children - Child components to render
 * @param props.style - Additional container styles
 * @param props.onLayout - Layout event handler
 * @returns JSX.Element
 */
const GradientBackground = ({ children, style, onLayout }: GradientBackgroundProps) => {
  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* Main gradient background with multiple color stops */}
      <LinearGradient
        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
        locations={[0, 0.32, 0.5, 0.73, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      />

      {/* Top fade effect: white to transparent, vertical direction */}
      <LinearGradient
        colors={['white', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fadeTop}
        pointerEvents="none" // Prevent touch events
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: responsiveWidth(100), // Full width
    height: responsiveHeight(12), // Reduced height
    marginLeft: 0, // Remove left margin
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5, // Match SVG opacity="0.5"
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(8), // Increased top fade height
  },
});

export default GradientBackground; 