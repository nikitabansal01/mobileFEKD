import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { responsiveWidth, responsiveHeight } from 'react-native-responsive-dimensions';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  style?: any;
  onLayout?: (event: any) => void;
}

const GradientBackground = ({ children, style, onLayout }: GradientBackgroundProps) => {
  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* 🎨 배경 전체 그라디언트 */}
      <LinearGradient
        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
        locations={[0, 0.32, 0.5, 0.73, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      />

      {/* 🧢 위쪽 페이드: 흰색 → 투명, 수직 방향 */}
      <LinearGradient
        colors={['white', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fadeTop}
        pointerEvents="none" // 클릭 차단
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: responsiveWidth(100), // 좌우 확장 제거
    height: responsiveHeight(12), // 높이 더 줄임
    marginLeft: 0, // 왼쪽 확장 제거
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5, // SVG에서 opacity="0.5" 설정
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(8), // 위쪽 페이드 높이 증가 (전체 높이)
  },
});

export default GradientBackground; 