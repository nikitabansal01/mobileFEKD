import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import SVG from '@/assets/images/SVG';

const AuvraAnimation = require('@/assets/animation/Auvra_Animation.json');

/**
 * Props for the AuvraCharacter component
 */
type AuvraCharacterProps = {
  /** Size of the character animation in pixels. Defaults to 118 */
  size?: number;
};

/**
 * AuvraCharacter Component
 * 
 * Displays the Auvra character animation with shadow effect.
 * Used in main screens and prominent UI elements.
 * 
 * @param props - Component props
 * @param props.size - Optional size for the character animation
 * @returns JSX.Element
 */
const AuvraCharacter = ({ size = 118 }: AuvraCharacterProps) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={AuvraAnimation}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      <SVG.GraphicShadow width={size * 0.7} height={size * 0.15} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10, // Spacing between shadow and character
  },
});

export default AuvraCharacter; 