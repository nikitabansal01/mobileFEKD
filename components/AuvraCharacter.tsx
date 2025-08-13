import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import SVG from '@/assets/images/SVG';

const AuvraAnimation = require('@/assets/animation/Auvra_Animation.json');

type AuvraCharacterProps = {
  size?: number;
};

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
    gap: 10, // 그림자와 캐릭터 간의 간격 조정
  },
});

export default AuvraCharacter; 