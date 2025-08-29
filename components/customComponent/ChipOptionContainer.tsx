import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import OthersOption from './OthersOption';

/**
 * Individual chip option configuration
 */
interface ChipOption {
  /** Unique identifier for the option */
  id: string;
  /** Display text for the option */
  text: string;
  /** Value to be used when option is selected */
  value: string;
  /** Optional description shown when option is selected */
  description?: string;
}

/**
 * Input type for options - supports both string arrays and ChipOption objects for compatibility
 */
type ChipOptionInput = string | ChipOption;

/**
 * Props for the ChipOptionContainer component
 */
interface ChipOptionContainerProps {
  /** Array of options to display as chips */
  options: ChipOptionInput[];
  /** Currently selected value(s) - string for single, array for multiple selection */
  selectedValue?: string | string[];
  /** Callback function when an option is selected */
  onSelect: (value: string) => void;
  /** Enable multiple selection mode */
  multiple?: boolean;
  /** Additional styles for the container */
  containerStyle?: any;
  /** Additional styles for individual chips */
  chipStyle?: any;
  /** Additional styles for chip text */
  textStyle?: any;
  /** Whether to show the 'Others' option */
  showOthersOption?: boolean;
  /** Configuration for the 'Others' option */
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

/**
 * ChipOptionContainer Component
 * 
 * A flexible chip-based option selector with support for descriptions and 'Others' input.
 * Features expandable descriptions for selected chips and integrates with custom input handling.
 * 
 * @param props - Component props
 * @param props.options - Array of options to display
 * @param props.selectedValue - Currently selected value(s)
 * @param props.onSelect - Selection handler function
 * @param props.multiple - Multiple selection mode
 * @param props.containerStyle - Container styling
 * @param props.chipStyle - Individual chip styling
 * @param props.textStyle - Chip text styling
 * @param props.showOthersOption - Show 'Others' option
 * @param props.othersOptionProps - 'Others' option configuration
 * @returns JSX.Element
 */
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
  /**
   * Generates chip styles based on selection state and description availability
   * 
   * @param isSelected - Whether the chip is selected
   * @param hasDescription - Whether the chip has a description
   * @returns Combined style array
   */
  const getChipStyle = (isSelected: boolean, hasDescription: boolean) => {
    const baseStyle = [
      createInputStyle(isSelected ? 'selected' : 'default'),
      chipStyle,
    ];
    
    // Apply full width and left alignment when chip has description and is selected
    if (hasDescription && isSelected) {
      baseStyle.push({ 
        // Use full row width (key for wrap layout)
        width: '100%',
        flexBasis: '100%',
        minWidth: 0,
        // Left alignment for description display
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      });
    }
    
    return baseStyle;
  };

  /**
   * Generates text styles based on selection state
   * 
   * @param isSelected - Whether the chip is selected
   * @returns Combined text style array
   */
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
        // Convert string options to objects for consistent handling
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
      
      {/* Others option - displayed in chip style */}
      {showOthersOption && othersOptionProps && (
        <React.Fragment>
          {othersOptionProps.isSelected && <View style={styles.rowBreak} />}
          <OthersOption
            {...othersOptionProps}
            useChipStyle={true} // Always use chip style
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
    // Use columnGap/rowGap instead of gap to prevent layout issues on some devices with wrap
    columnGap: responsiveWidth(2),
    rowGap: responsiveHeight(1),
    justifyContent: 'center', // Maintain center alignment
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
    justifyContent: 'center', // Center alignment restored
    alignItems: 'center', // Center alignment restored
    // Height removed for automatic adjustment based on text content
    alignSelf: 'flex-start', // Fit content in default state
  },
  chipSelected: {
    borderColor: '#c17ec9',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    color: '#333333',
    textAlign: 'center', // Center alignment restored
    // Allow text wrapping
    flexWrap: 'wrap',
  },
  chipTextSelected: {
    color: '#000000',
  },
  othersContainer: {
    // Style to display Others option in same line as chips
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
    fontSize: responsiveFontSize(1.42), // 10px equivalent
    color: '#6f6f6f',
    lineHeight: responsiveHeight(1.8),
    marginTop: responsiveHeight(0.5),
    textAlign: 'left', // Left alignment for descriptions
    alignSelf: 'stretch', // Use full width
  },
  rowBreak: {
    // Line break spacer: Forces this View to take full row width
    // Ensures expanded chips are always placed on independent rows (100% width)
    width: '100%',
    flexBasis: '100%',
    height: 0,
    minWidth: 0,
  },
});

export default ChipOptionContainer;
