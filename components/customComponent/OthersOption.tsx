import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, TextInput, findNodeHandle } from 'react-native';
import { responsiveHeight, responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import TextInputContainer from './TextInputContainer';

/**
 * Props for the OthersOption component
 */
interface OthersOptionProps {
  /** Unique key for the question/form field */
  questionKey: string;
  /** Whether this option is currently selected */
  isSelected: boolean;
  /** Callback function when option is selected */
  onSelect: () => void;
  /** Placeholder text for the input field */
  placeholder: string;
  /** Current input value */
  value: string;
  /** Callback function when input text changes */
  onChangeText: (text: string) => void;
  /** Optional focus handler for the input */
  onFocus?: () => void;
  /** Additional styles for the container */
  containerStyle?: any;
  /** Whether to use chip-style appearance */
  useChipStyle?: boolean;
  /** Whether to use expanded mode (for chip-based expansion) */
  expandedMode?: boolean;
  /** Optional function to scroll to input when focused */
  scrollToInput?: (node: number | null) => void;
}

/**
 * OthersOption Component
 * 
 * A specialized option component that provides "Others (please specify)" functionality
 * with integrated text input. Supports both chip and expanded modes with automatic
 * focus and scroll management.
 * 
 * @param props - Component props
 * @param props.questionKey - Unique question identifier
 * @param props.isSelected - Selection state
 * @param props.onSelect - Selection handler
 * @param props.placeholder - Input placeholder text
 * @param props.value - Current input value
 * @param props.onChangeText - Input change handler
 * @param props.onFocus - Optional focus handler
 * @param props.containerStyle - Container styling
 * @param props.useChipStyle - Use chip appearance
 * @param props.expandedMode - Use expanded mode
 * @param props.scrollToInput - Scroll handler for input focus
 * @returns JSX.Element
 */
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

  // Force focus after selection to stabilize layout before scrolling
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
  // Don't render in expanded mode when not selected
  if (expandedMode && !isSelected) {
    return null;
  }

  return (
    <>
      {/* Others button */}
      {expandedMode && isSelected && <View style={styles.rowBreak} />}
      <TouchableOpacity
        style={[
          createInputStyle(isSelected ? 'selected' : 'default'),
          expandedMode ? styles.othersExpandedButton : 
          useChipStyle ? styles.othersChipButton : styles.othersButton,
          // Use full width when expanded mode is selected
          expandedMode && isSelected && {
            width: '100%',
            flexBasis: '100%',
            minWidth: 0,
          },
          // Expand horizontally only when chip style is selected
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
      
      {/* Text input field - shown only when selected (separate container) */}
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
    alignItems: 'center', // Center alignment for chip style
    // Height removed for automatic adjustment based on text content
    alignSelf: 'flex-start', // Same alignment as chips
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
    marginTop: 0, // Remove spacing from Others button
  },
  textInput: {
    width: '100%',
    alignSelf: 'stretch',
  },
  rowBreak: {
    // Line break spacer: Ensures expanded Others option takes full row width
    width: '100%',
    flexBasis: '100%',
    height: 0,
    minWidth: 0,
  },

});

export default OthersOption;
