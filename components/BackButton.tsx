import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import SVG from '@/assets/images/SVG';
import { useNavigation } from '@react-navigation/native';

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const navigation = useNavigation();

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (onPress) {
      onPress();
      return;
    }
    // React Navigation 뒤로가기
    if (navigation && typeof navigation.goBack === 'function' && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity onPress={handleBack} style={[styles.button, style]}>
      <SVG.BackButton />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
  },
}); 