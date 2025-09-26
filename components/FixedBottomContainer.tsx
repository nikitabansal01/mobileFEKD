import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Props for the FixedBottomContainer component
 */
interface FixedBottomContainerProps {
  /** Child components to render in the bottom container */
  children: React.ReactNode;
  /** Additional styles for the container */
  style?: any;
  /** Horizontal padding for the container */
  paddingHorizontal?: number;
  /** Gap between child elements */
  gap?: number;
  /** Whether to avoid keyboard. Default: true, set to false for specific screens (KASV) to prevent duplicate avoidance */
  avoidKeyboard?: boolean;
}

/**
 * FixedBottomContainer Component
 * 
 * A fixed bottom container with gradient background and keyboard avoidance.
 * Provides a consistent bottom area for buttons and controls across screens.
 * 
 * @param props - Component props
 * @param props.children - Child components to render
 * @param props.style - Additional container styles
 * @param props.paddingHorizontal - Horizontal padding
 * @param props.gap - Gap between child elements
 * @param props.avoidKeyboard - Keyboard avoidance behavior
 * @returns JSX.Element
 */
const FixedBottomContainer = ({ 
  children, 
  style, 
  paddingHorizontal = responsiveWidth(6),
  gap = responsiveHeight(0.3),
  avoidKeyboard = true
}: FixedBottomContainerProps) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      {/* Background gradient - exact match from Figma design */}
      {/* Background Gradients */}
      <LinearGradient
        colors={[
          "#A29AEA",   // lavender
          "#C17EC9",   // purple-pink
          "#D482B9",
          "#E98BAC",
          "#FDC6D1",
          // "#ffffff"  // soft pink
        ]}
        locations={[0, 0.3, 0.55, 0.75, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBase}
      />
      <LinearGradient
        colors={[
          "rgba(255,255,255,1)",  // strong white at top
          "rgba(255,255,255,0.9)",// softer white
          "rgba(255,255,255,0.7)",// subtle haze
          "rgba(255,255,255,0)"   // fully transparent
        ]}
        locations={[0, 0.2, 0.4, 1]}
        style={styles.gradientFade}
      />
      {/* <LinearGradient
        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
        locations={[0, 0.32, 0.5, 0.73, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          StyleSheet.absoluteFill, 
          { 
            opacity: Platform.OS === 'ios' ? 0.5 : 0.5 
          }
        ]}
      />

      
      <LinearGradient
        colors={['white', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.fadeTop,
          Platform.OS === 'ios' && { height: responsiveHeight(0) }
        ]}
        pointerEvents="none"
      /> */}

      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: insets.bottom > 0 ? insets.bottom + responsiveHeight(2) : responsiveHeight(2),
              paddingHorizontal,
              alignItems: 'center',
              gap,
              zIndex: 20,
              // Web-specific fixes
              ...(Platform.OS === 'web' && {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
              }),
            },
            style
          ]}
        >
          {children}
        </KeyboardAvoidingView>
      ) : (
        <View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: insets.bottom > 0 ? insets.bottom + responsiveHeight(2) : responsiveHeight(2),
              paddingHorizontal,
              alignItems: 'center',
              gap,
              zIndex: 20,
              // Web-specific fixes
              ...(Platform.OS === 'web' && {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                // marginBottom: responsiveHeight(2),
              }),
            },
            style
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: responsiveWidth(100),
    height: responsiveHeight(10),
    zIndex: 10,
    // Web-specific fixes
    ...(Platform.OS === 'web' && {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
    }),
  },
  // fadeTop: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   height: responsiveHeight(8),
  // },
    // Background gradients
    gradientBase: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: responsiveHeight(15),
      // height: verticalScale(124),
      zIndex: -1,
    },
    gradientFade: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: responsiveHeight(15),
      // height: verticalScale(124),
      zIndex: -1,
    },
});

export default FixedBottomContainer;
