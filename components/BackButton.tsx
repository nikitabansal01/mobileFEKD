import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import SVG from '@/assets/images/SVG';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();
  const navigation = useNavigation();

  // 자동 뒤로가기 핸들러
  const handleBack = () => {
    if (onPress) {
      onPress();
      return;
    }
    // react-navigation이 스택에 있을 때만 goBack() (isFocused로 체크)
    if (navigation && typeof navigation.goBack === 'function' && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // expo-router fallback
    if (router && typeof router.back === 'function') {
      router.back();
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