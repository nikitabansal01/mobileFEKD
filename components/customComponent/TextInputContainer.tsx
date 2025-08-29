import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { createInputStyle } from '@/utils/inputStyles';
import { INPUT_STATES } from '@/constants/InputStates';

interface TextInputContainerProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  containerStyle?: any;
  inputStyle?: any;
  textStyle?: any;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  inputRef?: React.RefObject<TextInput>;
}

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

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.(); // onFocus prop이 있으면 호출
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
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
      createInputStyle((isFocused || isFilled) ? 'selected' : 'default', {
        paddingVertical: responsiveHeight(0),
      }),
      {
        minHeight: responsiveHeight(7.6),// TextInputContainer만 더 큰 높이
        justifyContent: 'center',
        alignItems: 'flex-start', // 텍스트를 왼쪽 정렬
      },
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
          {secureTextEntry ? '•'.repeat(value.length) : value}
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
    fontSize: responsiveFontSize(1.42), //10px
    color: '#b3b3b3',
    zIndex: 1,
  },
  inputText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.98), //14px
    color: '#000000',
    marginTop: 8,
  },
  hiddenTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01, // 아주 작은 투명도로 설정하여 커서가 보이도록 함
    zIndex: 2,
    // Text 컴포넌트와 동일한 스타일 적용
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.98), //14px
    paddingLeft: 20, // Text 컴포넌트와 동일한 위치
    paddingTop: 8, // marginTop과 동일한 효과
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    padding: 5, // 터치 영역 확대
  },
  clearButtonText: {
    fontSize: responsiveFontSize(4.0),
    color: '#b3b3b3', // placeholder와 동일한 색상
    fontWeight: 'normal',
  },
  defaultPlaceholder: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), //12px
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
