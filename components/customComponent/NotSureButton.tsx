import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

/**
 * Props for the NotSureButton component
 */
interface NotSureButtonProps {
  /** Button text to display */
  text: string;
  /** Function to call when button is pressed */
  onPress: () => void;
  /** Additional styles for the button container */
  style?: any;
  /** Additional styles for the button text */
  textStyle?: any;
}

/**
 * NotSureButton Component
 * 
 * A specialized button component that displays underlined text with right alignment.
 * Typically used for "not sure" or skip-type actions in forms.
 * 
 * @param props - Component props
 * @param props.text - Button text to display
 * @param props.onPress - Press handler function
 * @param props.style - Additional container styles
 * @param props.textStyle - Additional text styles
 * @returns JSX.Element
 */
const NotSureButton: React.FC<NotSureButtonProps> = ({
  text,
  onPress,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  text: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    color: '#6f6f6f',
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
});

export default NotSureButton;

