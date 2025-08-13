import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';

interface TextInputContainerProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  containerStyle?: any;
  inputStyle?: any;
  textStyle?: any;
  onFocus?: () => void;
}

const TextInputContainer: React.FC<TextInputContainerProps> = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  containerStyle,
  inputStyle,
  textStyle,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFilled, setIsFilled] = useState(!!value);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.(); // onFocus prop이 있으면 호출
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChangeText = (text: string) => {
    setIsFilled(!!text);
    onChangeText(text);
  };

  const handleClearInput = () => {
    setIsFilled(false);
    onChangeText('');
  };

  return (
    <View style={[
      styles.textInputContainer,
      (isFocused || isFilled) && styles.textInputContainerFocused,
      containerStyle
    ]}>
      {/* Floating Label */}
      {(isFocused || isFilled) && (
        <Text style={styles.floatingLabel}>
          {placeholder}
        </Text>
      )}
      
      {/* Input Text */}
      {(isFocused || isFilled) && (
        <Text style={[styles.inputText, textStyle]}>
          {value}
        </Text>
      )}
      
      {/* Default Placeholder */}
      {!isFocused && !isFilled && (
        <Text style={styles.defaultPlaceholder}>
          {placeholder}
        </Text>
      )}
      
      {/* Hidden TextInput for actual input */}
      <TextInput
        style={[styles.hiddenTextInput, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor="transparent"
        keyboardType={keyboardType}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    width: responsiveWidth(80),
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    position: 'relative',
  },
  textInputContainerFocused: {
    borderColor: '#c17ec9',
    backgroundColor: '#F5F5F5',
  },
  floatingLabel: {
    position: 'absolute',
    top: 8,
    left: 20,
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.3),
    color: '#b3b3b3',
    zIndex: 1,
  },
  inputText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.8),
    color: '#000000',
    marginTop: 8,
  },
  hiddenTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  clearButtonText: {
    fontSize: responsiveFontSize(1.4),
    color: '#666666',
    fontWeight: 'bold',
  },
  defaultPlaceholder: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),
    color: '#b3b3b3',
    position: 'absolute',
    left: 20,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});

export default TextInputContainer;
