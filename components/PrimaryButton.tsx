import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";


/**
 * Props for the PrimaryButton component
 */
type PrimaryButtonProps = {
  /** Button text to display */
  title: string;
  /** Function to call when button is pressed */
  onPress: () => void;
  /** Additional styles for the button */
  style?: StyleProp<ViewStyle>;
  /** Whether the button is disabled */
  disabled?: boolean;
};

/**
 * PrimaryButton Component
 * 
 * A reusable primary button component with consistent styling.
 * Features white background, rounded corners, and shadow effects.
 * 
 * @param props - Component props
 * @param props.title - Button text
 * @param props.onPress - Press handler function
 * @param props.style - Additional button styles
 * @param props.disabled - Disabled state
 * @returns JSX.Element
 */
const PrimaryButton = ({ title, onPress, style, disabled = false }: PrimaryButtonProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        style, 
        disabled && styles.buttonDisabled
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        disabled && styles.buttonTextDisabled
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 100,
    width: responsiveWidth(88), // Default width
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveHeight(4),
    // marginBottom: responsiveHeight(0),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.98), // 14px
    color: '#000000',
  },
  buttonTextDisabled: {
    color: '#6f6f6f',
  },
});

export default PrimaryButton; 