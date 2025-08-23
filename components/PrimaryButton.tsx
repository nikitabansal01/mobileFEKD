import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

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
    width: responsiveWidth(88), // 기본 가로 길이 설정
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveHeight(4),
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
    fontSize: responsiveFontSize(1.98), //14px
    color: '#000000',
  },
  buttonTextDisabled: {
    color: '#6f6f6f',
  },
});

export default PrimaryButton; 