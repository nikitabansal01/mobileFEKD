import { createInputStyle } from '@/utils/inputStyles';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight } from 'react-native-responsive-dimensions';

/**
 * Props for the TextInputContainer component
 */
interface TextInputContainerProps {
  /** Placeholder text for the input field */
  placeholder: string;
  /** Current input value */
  value: string;
  /** Callback function when input text changes */
  onChangeText: (text: string) => void;
  /** Type of keyboard to display */
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  /** Whether to hide input text (for passwords) */
  secureTextEntry?: boolean;
  /** Additional styles for the container */
  containerStyle?: any;
  /** Additional styles for the input */
  inputStyle?: any;
  /** Additional styles for the text */
  textStyle?: any;
  /** Callback function when input gains focus */
  onFocus?: () => void;
  /** Callback function when input loses focus */
  onBlur?: () => void;
  /** Whether to automatically focus on mount */
  autoFocus?: boolean;
  /** Reference to the TextInput component */
  inputRef?: React.RefObject<TextInput>;
}

/**
 * TextInputContainer Component
 * 
 * A custom text input component with floating label, clear button, and enhanced styling.
 * Features automatic focus/blur states, secure text entry support, and responsive design.
 * 
 * @param props - Component props
 * @param props.placeholder - Placeholder/label text
 * @param props.value - Current input value
 * @param props.onChangeText - Text change handler
 * @param props.keyboardType - Keyboard type
 * @param props.secureTextEntry - Password mode
 * @param props.containerStyle - Container styling
 * @param props.inputStyle - Input styling
 * @param props.textStyle - Text styling
 * @param props.onFocus - Focus handler
 * @param props.onBlur - Blur handler
 * @param props.autoFocus - Auto focus behavior
 * @param props.inputRef - Input reference
 * @returns JSX.Element
 */
const TextInputContainer: React.FC<TextInputContainerProps> = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  containerStyle,
  inputStyle,
  textStyle,
  onFocus,
  onBlur,
  autoFocus,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(!!value);

  // Update isFilled when value prop changes
  useEffect(() => {
    setIsFilled(!!value);
  }, [value]);

  /**
   * Handles input focus event
   */
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.(); // Call onFocus prop if provided
  };

  /**
   * Handles input blur event
   */
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  /**
   * Handles text input changes and updates filled state
   * @param text - New input text
   */
  const handleChangeText = (text: string) => {
    setIsFilled(!!text);
    onChangeText(text);
  };

  /**
   * Clears the input field
   */
  const handleClearInput = () => {
    setIsFilled(false);
    onChangeText('');
  };

  return (
    <View style={[
      createInputStyle((isFocused || isFilled) ? 'selected' : 'default', {
        paddingVertical: responsiveHeight(0),
      }),
      {
        minHeight: responsiveHeight(7.6), // Larger height for TextInputContainer only
        justifyContent: 'center',
        alignItems: 'flex-start', // Left-align text
      },
      containerStyle
    ]}>
      {/* Floating Label - shown when focused or filled */}
      {(isFocused || isFilled) && (
        <Text style={styles.floatingLabel}>
          {placeholder}
        </Text>
      )}
      
      {/* Input Text - only show when not focused to avoid double text */}
      {!isFocused && isFilled && (
        <Text style={[styles.inputText, textStyle]}>
          {secureTextEntry ? '•'.repeat(value.length) : value}
        </Text>
      )}
      
      {/* Default Placeholder - shown when not focused and not filled */}
      {!isFocused && !isFilled && (
        <Text style={styles.defaultPlaceholder}>
          {placeholder}
        </Text>
      )}
      
      {/* TextInput for actual input - more visible on iOS */}
      <TextInput
        style={[styles.visibleTextInput, inputStyle]}
        placeholder=""
        placeholderTextColor="transparent"
        keyboardType={keyboardType}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        ref={inputRef}
        secureTextEntry={secureTextEntry}
        editable={true}
        selectTextOnFocus={true}
        caretHidden={false}
      />
      
      {/* Clear Button */}
      {isFilled && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearInput}
        >
          <Text style={styles.clearButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textInputContainer: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: 8,
    left: 20,
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), // 10px equivalent
    color: '#b3b3b3',
    zIndex: 1,
  },
  inputText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.98), // 14px equivalent
    color: '#000000',
    marginTop: 8,
  },
  visibleTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    // Apply same styles as Text component
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.98), // 14px equivalent
    paddingLeft: 20, // Same position as Text component
    paddingTop: 8, // Same effect as marginTop
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
    // iOS-specific properties for better keyboard handling
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#000000',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    padding: 5, // Expand touch area
  },
  clearButtonText: {
    fontSize: responsiveFontSize(4.0),
    color: '#b3b3b3', // Same color as placeholder
    fontWeight: 'normal',
  },
  defaultPlaceholder: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.98), // 14px equivalent - same as input text
    color: '#b3b3b3',
    position: 'absolute',
    left: 20,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: responsiveHeight(7.6), // Match the container height for vertical centering
  },
});

export default TextInputContainer;


