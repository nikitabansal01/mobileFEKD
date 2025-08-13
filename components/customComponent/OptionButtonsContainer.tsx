import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';

interface OptionButton {
  id: string;
  text: string;
  value: string;
}

interface OptionButtonsContainerProps {
  options: OptionButton[];
  selectedValue?: string | string[];
  onSelect: (value: string) => void;
  layout?: 'default' | 'wrap' | 'row';
  multiple?: boolean;
  containerStyle?: any;
  buttonStyle?: any;
  textStyle?: any;
}

const OptionButtonsContainer: React.FC<OptionButtonsContainerProps> = ({
  options,
  selectedValue,
  onSelect,
  layout = 'default',
  multiple = false,
  containerStyle,
  buttonStyle,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (layout) {
      case 'wrap':
        return styles.wrapContainer;
      case 'row':
        return styles.rowContainer;
      default:
        return styles.defaultContainer;
    }
  };

  const getButtonStyle = (isSelected: boolean) => {
    const baseStyle = [
      styles.optionButton,
      isSelected && styles.optionButtonSelected,
      buttonStyle,
    ];
    
    switch (layout) {
      case 'wrap':
        return [...baseStyle, styles.wrapButton];
      case 'row':
        return [...baseStyle, styles.rowButton];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (isSelected: boolean) => {
    const baseStyle = [
      styles.optionText,
      isSelected && styles.optionTextSelected,
      textStyle,
    ];
    
    switch (layout) {
      case 'wrap':
        return [...baseStyle, styles.wrapText];
      case 'row':
        return [...baseStyle, styles.rowText];
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {options.map((option) => {
        const isSelected = multiple 
          ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
          : selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.id}
            style={getButtonStyle(isSelected)}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text style={getTextStyle(isSelected)}>
              {option.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Default Layout (세로 배치, 전체 너비)
  defaultContainer: {
    gap: responsiveHeight(1.5),
    alignSelf: 'stretch',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
    backgroundColor: '#ffffff',
    height: responsiveHeight(5),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  optionButtonSelected: {
    borderColor: '#c17ec9',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
  },
  optionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.5),
    color: '#333333',
    textAlign: 'left',
  },
  optionTextSelected: {
    color: '#000000',
    fontFamily: 'Inter500',
  },

  // Wrap Layout (여러 줄 배치)
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
    justifyContent: 'flex-start',
  },
  wrapButton: {
    flex: 0,
    minWidth: responsiveWidth(40),
    maxWidth: responsiveWidth(80),
  },
  wrapText: {
    fontSize: responsiveFontSize(1.4),
  },

  // Row Layout (가로 배치)
  rowContainer: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    justifyContent: 'space-between',
  },
  rowButton: {
    flex: 1,
    minWidth: 0,
  },
  rowText: {
    fontSize: responsiveFontSize(1.4),
  },
});

export default OptionButtonsContainer;
