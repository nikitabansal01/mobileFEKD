import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import OthersOption from './OthersOption';

interface ChipOption {
  id: string;
  text: string;
  value: string;
  description?: string; // 옵션 설명 추가
}

// 기존 문자열 배열과의 호환성을 위한 타입
type ChipOptionInput = string | ChipOption;

interface ChipOptionContainerProps {
  options: ChipOptionInput[];
  selectedValue?: string | string[];
  onSelect: (value: string) => void;
  multiple?: boolean;
  containerStyle?: any;
  chipStyle?: any;
  textStyle?: any;
  // Others 옵션 관련 props
  showOthersOption?: boolean;
  othersOptionProps?: {
    questionKey: string;
    isSelected: boolean;
    onSelect: () => void;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
  };
}

const ChipOptionContainer: React.FC<ChipOptionContainerProps> = ({
  options,
  selectedValue,
  onSelect,
  multiple = false,
  containerStyle,
  chipStyle,
  textStyle,
  showOthersOption = false,
  othersOptionProps,
}) => {
  const getChipStyle = (isSelected: boolean, hasDescription: boolean) => {
    const baseStyle = [
      createInputStyle(isSelected ? 'selected' : 'default'),
      chipStyle,
    ];
    
    // 설명이 있고 선택되었을 때는 전체 너비와 좌측 정렬 적용
    if (hasDescription && isSelected) {
      baseStyle.push({ 
        // 가로 한 줄 전체 사용 (wrap 레이아웃 핵심)
        width: '100%',
        flexBasis: '100%',
        minWidth: 0,
        // 정렬
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      });
    }
    
    return baseStyle;
  };

  const getTextStyle = (isSelected: boolean) => {
    const baseStyle = [
      createInputTextStyle(isSelected ? 'selected' : 'default'),
      textStyle,
    ];
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option) => {
        // 문자열인 경우 객체로 변환
        const optionObj = typeof option === 'string' 
          ? { id: option, text: option, value: option }
          : option;
          
        const isSelected = multiple 
          ? Array.isArray(selectedValue) && selectedValue.includes(optionObj.value)
          : selectedValue === optionObj.value;

        const isExpanded = !!optionObj.description && isSelected;

        return (
          <React.Fragment key={optionObj.id}>
            {isExpanded && <View style={styles.rowBreak} />}
            <TouchableOpacity
              style={getChipStyle(isSelected, !!optionObj.description)}
              onPress={() => onSelect(optionObj.value)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.chipContent,
                isSelected && optionObj.description && { alignItems: 'flex-start' }
              ]}>
                <Text style={[
                  getTextStyle(isSelected),
                  isSelected && optionObj.description && { textAlign: 'left' }
                ]}>
                  {optionObj.text}
                </Text>
                {isSelected && optionObj.description && (
                  <Text style={styles.descriptionText}>
                    {optionObj.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            {isExpanded && <View style={styles.rowBreak} />}
          </React.Fragment>
        );
      })}
      
      {/* Others 옵션 - chip style로만 표시 */}
      {showOthersOption && othersOptionProps && (
        <React.Fragment>
          {othersOptionProps.isSelected && <View style={styles.rowBreak} />}
          <OthersOption
            {...othersOptionProps}
            useChipStyle={true} // 항상 chip 스타일 사용
            containerStyle={styles.othersContainer}
          />
          {othersOptionProps.isSelected && <View style={styles.rowBreak} />}
        </React.Fragment>
      )}
    </View>
  );
};
     const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap이 wrap과 함께 일부 기기에서 레이아웃 흔들릴 수 있어 column/rowGap 권장
    columnGap: responsiveWidth(2),
    rowGap: responsiveHeight(1),
    justifyContent: 'center',   // ✅ 가운데 정렬 유지
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
    backgroundColor: '#ffffff',
    justifyContent: 'center', // 중앙 정렬로 복원
    alignItems: 'center', // 중앙 정렬로 복원
    // height 제거하여 텍스트 내용에 따라 자동 조절
    alignSelf: 'flex-start', // 기본 상태에서는 내용에 맞춤
  },
  chipSelected: {
    borderColor: '#c17ec9',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),//12px
    color: '#333333',
    textAlign: 'center', // 중앙 정렬로 복원
    // 글자 줄바꿈 허용
    flexWrap: 'wrap',
  },
  chipTextSelected: {
    color: '#000000',
  },
  othersContainer: {
    // Others 옵션이 chip과 같은 줄에 표시되도록 스타일
    alignSelf: 'flex-start',
  },
  othersChipButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(5),
    alignSelf: 'flex-start',
  },
  expandedOthersContainer: {
    gap: responsiveHeight(1.5),
    alignSelf: 'stretch',
    marginTop: responsiveHeight(1),
  },
  othersExpandedButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textInputContainer: {
    alignSelf: 'stretch',
    width: '100%',
  },
  textInput: {
    width: '100%',
    alignSelf: 'stretch',
  },
  chipContent: {
    flex: 1,
    gap: responsiveHeight(0.5),
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
  },
  descriptionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), //10px
    color: '#6f6f6f',
    lineHeight: responsiveHeight(1.8),
    marginTop: responsiveHeight(0.5),
    textAlign: 'left', // 좌측 정렬로 변경
    alignSelf: 'stretch', // 전체 너비 사용
  },
  rowBreak: {
    // 줄바꿈용 스페이서: 이 View가 한 줄 전체를 차지하게 만들어
    // 확장 칩이 항상 독립된 줄(100% 폭)에 놓이도록 보장
    width: '100%',
    flexBasis: '100%',
    height: 0,
    minWidth: 0,
  },
});

export default ChipOptionContainer;
