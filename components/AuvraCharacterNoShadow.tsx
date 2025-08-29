import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const AuvraAnimation = require('@/assets/animation/Auvra_Animation.json');

/**
 * Props for the AuvraCharacterNoShadow component
 */
type AuvraCharacterNoShadowProps = {
  /** Size of the character animation in pixels. Defaults to 55 */
  size?: number;
};

/**
 * AuvraCharacterNoShadow Component
 * 
 * Displays the Auvra character animation without shadow effect.
 * Used primarily in navigation bars and compact UI elements.
 * 
 * @param props - Component props
 * @param props.size - Optional size for the character animation
 * @returns JSX.Element
 */
const AuvraCharacterNoShadow: React.FC<AuvraCharacterNoShadowProps> = ({ 
  size = 55 
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={AuvraAnimation}
        autoPlay
        loop
        style={{ width: size * 0.8, height: size * 0.8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuvraCharacterNoShadow;

