import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveFontSize } from 'react-native-responsive-dimensions';

interface NotSureButtonProps {
  text: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
}

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
    fontSize: responsiveFontSize(1.6),
    color: '#6f6f6f',
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
});

export default NotSureButton;
