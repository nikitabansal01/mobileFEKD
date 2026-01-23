import { createInputStyle } from '@/utils/inputStyles';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { responsiveHeight } from 'react-native-responsive-dimensions';
import { moderateScale } from 'react-native-size-matters';

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

  /** TextInput auto-capitalization behavior */
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Whether to enable auto-correct */
  autoCorrect?: boolean;
  /** iOS textContentType / Android autofill hints */
  textContentType?: TextInputProps['textContentType'];
  /** Android/iOS autoComplete hint */
  autoComplete?: TextInputProps['autoComplete'];
  /** Return key type */
  returnKeyType?: TextInputProps['returnKeyType'];
  /** Submit handler */
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
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
  autoCapitalize,
  autoCorrect,
  textContentType,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
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
        paddingVertical: responsiveHeight(1.2),
      }),
      {
        minHeight: moderateScale(50, 1.5), // Larger height for TextInputContainer only
        justifyContent: 'center',
        alignItems: 'stretch',
      },
      containerStyle
    ]}>
      {/* Floating label shown when focused or filled */}
      {(isFocused || isFilled) ? (
        <Text style={[styles.floatingLabel, textStyle]}>{placeholder}</Text>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.textInput,
            (isFocused || isFilled) ? styles.textInputWithLabel : styles.textInputWithoutLabel,
            inputStyle,
          ]}
          placeholder={(!isFocused && !isFilled) ? placeholder : ''}
          placeholderTextColor="#b3b3b3"
          keyboardType={keyboardType}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          ref={inputRef}
          secureTextEntry={secureTextEntry}
          editable={true}
          caretHidden={false}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />

        {isFilled ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearInput}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${placeholder}`}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingLabel: {
    fontFamily: 'Inter400',
    fontSize: moderateScale(10, 1.5), // 10px equivalent
    color: '#b3b3b3',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter400',
    fontSize: moderateScale(14, 1.5), // 14px equivalent
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: Platform.OS === 'android',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#000000',
  },
  textInputWithLabel: {
    paddingVertical: 0,
  },
  textInputWithoutLabel: {
    paddingVertical: 0,
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5, // Expand touch area
  },
  clearButtonText: {
    fontSize: moderateScale(16, 1.5),
    color: '#b3b3b3', // Same color as placeholder
    fontFamily: 'Inter400',
  },
});

export default TextInputContainer;


