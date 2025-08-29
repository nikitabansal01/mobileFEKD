import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';

interface OptionButton {
  id: string;
  text: string;
  value: string;
  description?: string; // 옵션 설명 추가
}

// 기존 문자열 배열과의 호환성을 위한 타입
type OptionInput = string | OptionButton;

interface OptionButtonsContainerProps {
  options: OptionInput[];
  selectedValue?: string | string[];
  onSelect: (value: string) => void;
  layout?: 'default' | 'wrap' | 'row';
  multiple?: boolean;
  containerStyle?: any;
  buttonStyle?: any;
  textStyle?: any;
  // 커스텀 옵션들
  buttonHeight?: number;
  buttonWidth?: number; // 버튼 가로 길이 설정
  buttonPadding?: { vertical?: number; horizontal?: number };
  buttonAlignment?: { justifyContent?: string; alignItems?: string };
  textAlignment?: string;
  containerGap?: number;
  containerAlignment?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
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
  buttonHeight,
  buttonWidth,
  buttonPadding,
  buttonAlignment,
  textAlignment,
  containerGap,
  containerAlignment,
}) => {
  const getContainerStyle = () => {
    const baseStyle = (() => {
      switch (layout) {
        case 'wrap':
          return styles.wrapContainer;
        case 'row':
          return styles.rowContainer;
        default:
          return styles.defaultContainer;
      }
    })();
    
    const customStyles = [];
    
    // 커스텀 gap 적용
    if (containerGap) {
      customStyles.push({ gap: containerGap });
    }
    
    // 커스텀 alignment 적용
    if (containerAlignment) {
      if (layout === 'default') {
        // default layout은 세로 배치이므로 alignItems 사용 (가로 정렬)
        customStyles.push({ alignItems: containerAlignment });
      } else {
        // wrap, row layout은 가로 배치이므로 justifyContent 사용 (가로 정렬)
        customStyles.push({ justifyContent: containerAlignment });
      }
    }
    
    return customStyles.length > 0 ? [baseStyle, ...customStyles] : baseStyle;
  };

  const getButtonStyle = (isSelected: boolean, hasDescription: boolean) => {
    const baseStyle = [
      createInputStyle(isSelected ? 'selected' : 'default', {
        height: buttonHeight, // buttonHeight가 있으면 사용
        paddingVertical: buttonPadding?.vertical,
        paddingHorizontal: buttonPadding?.horizontal,
        justifyContent: buttonAlignment?.justifyContent,
        alignItems: buttonAlignment?.alignItems,
      }),
      buttonStyle,
    ];
    
    // 버튼 가로 길이 설정
    if (buttonWidth) {
      baseStyle.push({ width: buttonWidth });
    }
    
    switch (layout) {
      case 'wrap':
        return [...baseStyle, styles.wrapButton];
      case 'row':
        return [...baseStyle, styles.rowButton];
      default:
        // default layout에서 containerAlignment가 center면 alignSelf를 center로 변경
        if (containerAlignment === 'center') {
          return [...baseStyle, { alignSelf: 'center' as const }];
        }
        return baseStyle;
    }
  };

  const getTextStyle = (isSelected: boolean) => {
    const baseStyle = [
      createInputTextStyle(isSelected ? 'selected' : 'default'),
      textAlignment && { textAlign: textAlignment },
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
        // 문자열인 경우 객체로 변환
        const optionObj = typeof option === 'string' 
          ? { id: option, text: option, value: option }
          : option;
          
        const isSelected = multiple 
          ? Array.isArray(selectedValue) && selectedValue.includes(optionObj.value)
          : selectedValue === optionObj.value;
        return (
          <TouchableOpacity
            key={optionObj.id}
            style={getButtonStyle(isSelected, !!optionObj.description)}
            onPress={() => onSelect(optionObj.value)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={getTextStyle(isSelected)}>
                {optionObj.text}
              </Text>
              {isSelected && optionObj.description && (
                <Text style={styles.descriptionText}>
                  {optionObj.description}
                </Text>
              )}
            </View>
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
    alignItems: 'flex-start', // 가로 정렬 기본값
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
    fontSize: responsiveFontSize(1.7), //12px
    color: '#333333',
    textAlign: 'left',
  },
  optionTextSelected: {
    color: '#000000',
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
    fontSize: responsiveFontSize(1.7), //12px
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
    fontSize: responsiveFontSize(1.7), //12px
  },
  optionContent: {
    flex: 1,
    gap: responsiveHeight(0.5),
  },
  descriptionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), //10px
    color: '#6f6f6f',
    lineHeight: responsiveHeight(1.8),
    marginTop: responsiveHeight(0.5),
  },
});

export default OptionButtonsContainer;
