import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, TextInput, findNodeHandle } from 'react-native';
import { responsiveHeight, responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import TextInputContainer from './TextInputContainer';

interface OthersOptionProps {
  questionKey: string;
  isSelected: boolean;
  onSelect: () => void;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  containerStyle?: any;
  useChipStyle?: boolean; // chip 스타일 사용 여부
  expandedMode?: boolean; // 확장 모드 (chip에서 확장되는 경우)
  scrollToInput?: (node: number | null) => void;
}

const OthersOption: React.FC<OthersOptionProps> = ({
  questionKey,
  isSelected,
  onSelect,
  placeholder,
  value,
  onChangeText,
  onFocus,
  containerStyle,
  useChipStyle = false,
  expandedMode = false,
  scrollToInput,
}) => {
  const inputRef = useRef<TextInput>(null);

  // 선택 직후 한 틱 뒤에 강제로 포커스하여 레이아웃 안정화 후 스크롤 유도
  useEffect(() => {
    if (isSelected && inputRef.current) {
      const t1 = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      const t2 = setTimeout(() => {
        if (scrollToInput) {
          const node = findNodeHandle(inputRef.current);
          scrollToInput(node);
        }
      }, 220);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isSelected]);
  // expandedMode이고 선택되지 않았으면 렌더링하지 않음
  if (expandedMode && !isSelected) {
    return null;
  }

  return (
    <>
      {/* Others 버튼 */}
      {expandedMode && isSelected && <View style={styles.rowBreak} />}
      <TouchableOpacity
        style={[
          createInputStyle(isSelected ? 'selected' : 'default'),
          expandedMode ? styles.othersExpandedButton : 
          useChipStyle ? styles.othersChipButton : styles.othersButton,
          // expandedMode이고 선택되었으면 전체 너비 사용
          expandedMode && isSelected && {
            width: '100%',
            flexBasis: '100%',
            minWidth: 0,
          },
          // chip 스타일이고 선택되었으면 가로만 확장
          useChipStyle && isSelected && {
            width: '100%',
            flexBasis: '100%',
            minWidth: 0,
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          },
          containerStyle
        ]}
        onPress={onSelect}
      >
        <Text style={[
          createInputTextStyle(isSelected ? 'selected' : 'default'),
          useChipStyle && isSelected && { textAlign: 'left' }
        ]}>
          Others (please specify)
        </Text>
      </TouchableOpacity>
      {expandedMode && isSelected && <View style={styles.rowBreak} />}
      
      {/* 텍스트 입력창 - 선택되었을 때만 표시 (별도 컨테이너) */}
      {isSelected && (
        <View style={styles.textInputContainer} onLayout={() => {
          if (isSelected && inputRef.current && scrollToInput) {
            const node = findNodeHandle(inputRef.current);
            setTimeout(() => scrollToInput(node), 0);
          }
        }}>
          <TextInputContainer
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            containerStyle={styles.textInput}
            onFocus={onFocus}
            autoFocus={true}
            inputRef={inputRef}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: responsiveHeight(1.5),
    alignSelf: 'stretch',
  },
  othersButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  othersChipButton: {
    justifyContent: 'center',
    alignItems: 'center', // chip 스타일은 중앙정렬
    // height 제거하여 텍스트 내용에 따라 자동 조절
    alignSelf: 'flex-start', // chip과 동일한 정렬
  },
  expandedContainer: {
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
    marginTop: 0, // Others 버튼과의 간격 제거
  },
  textInput: {
    width: '100%',
    alignSelf: 'stretch',
  },
  rowBreak: {
    // 줄바꿈용 스페이서: 확장된 Others 옵션이 한 줄 전체를 차지하도록 보장
    width: '100%',
    flexBasis: '100%',
    height: 0,
    minWidth: 0,
  },

});

export default OthersOption;
