import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import SVG from '@/assets/images/SVG';
import { useNavigation } from '@react-navigation/native';

/**
 * Props for the BackButton component
 */
interface BackButtonProps {
  /** Custom onPress handler. If provided, overrides default navigation behavior */
  onPress?: () => void;
  /** Additional styles for the button */
  style?: ViewStyle;
}

/**
 * BackButton Component
 * 
 * A reusable back button component that handles navigation.
 * Uses React Navigation's goBack() by default, or custom onPress handler if provided.
 * 
 * @param props - Component props
 * @param props.onPress - Optional custom press handler
 * @param props.style - Optional additional styles
 * @returns JSX.Element
 */
export default function BackButton({ onPress, style }: BackButtonProps) {
  const navigation = useNavigation();

  /**
   * Handles the back button press
   * Prioritizes custom onPress handler, falls back to navigation.goBack()
   */
  const handleBack = () => {
    if (onPress) {
      onPress();
      return;
    }
    // Use React Navigation's goBack if available and can go back
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