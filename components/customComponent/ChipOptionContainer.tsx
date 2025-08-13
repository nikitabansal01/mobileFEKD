import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';

interface ChipOption {
  id: string;
  text: string;
  value: string;
}

interface ChipOptionContainerProps {
  options: ChipOption[];
  selectedValue?: string | string[];
  onSelect: (value: string) => void;
  multiple?: boolean;
  containerStyle?: any;
  chipStyle?: any;
  textStyle?: any;
}

const ChipOptionContainer: React.FC<ChipOptionContainerProps> = ({
  options,
  selectedValue,
  onSelect,
  multiple = false,
  containerStyle,
  chipStyle,
  textStyle,
}) => {
  const getChipStyle = (isSelected: boolean) => {
    const baseStyle = [
      styles.chip,
      isSelected && styles.chipSelected,
      chipStyle,
    ];
    return baseStyle;
  };

  const getTextStyle = (isSelected: boolean) => {
    const baseStyle = [
      styles.chipText,
      isSelected && styles.chipTextSelected,
      textStyle,
    ];
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option) => {
        const isSelected = multiple 
          ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
          : selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.id}
            style={getChipStyle(isSelected)}
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
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: responsiveHeight(5),
    // 글자 크기에 따라 자동으로 크기 조정
    alignSelf: 'flex-start',
  },
  chipSelected: {
    borderColor: '#c17ec9',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.5),
    color: '#333333',
    textAlign: 'center',
    // 글자 줄바꿈 허용
    flexWrap: 'wrap',
  },
  chipTextSelected: {
    color: '#000000',
    fontFamily: 'Inter500',
  },
});

export default ChipOptionContainer;
