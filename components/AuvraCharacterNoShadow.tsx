import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const AuvraAnimation = require('@/assets/animation/Auvra_Animation.json');

type AuvraCharacterNoShadowProps = {
  size?: number;
};

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
