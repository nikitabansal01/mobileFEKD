import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';

/**
 * Individual option button configuration
 */
interface OptionButton {
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
 * Input type for options - supports both string arrays and OptionButton objects for compatibility
 */
type OptionInput = string | OptionButton;

/**
 * Props for the OptionButtonsContainer component
 */
interface OptionButtonsContainerProps {
  /** Array of options to display as buttons */
  options: OptionInput[];
  /** Currently selected value(s) - string for single, array for multiple selection */
  selectedValue?: string | string[];
  /** Callback function when an option is selected */
  onSelect: (value: string) => void;
  /** Layout mode for button arrangement */
  layout?: 'default' | 'wrap' | 'row';
  /** Enable multiple selection mode */
  multiple?: boolean;
  /** Additional styles for the container */
  containerStyle?: any;
  /** Additional styles for individual buttons */
  buttonStyle?: any;
  /** Additional styles for button text */
  textStyle?: any;
  /** Custom button height */
  buttonHeight?: number;
  /** Custom button width */
  buttonWidth?: number;
  /** Custom button padding configuration */
  buttonPadding?: { vertical?: number; horizontal?: number };
  /** Custom button alignment configuration */
  buttonAlignment?: { justifyContent?: string; alignItems?: string };
  /** Text alignment within buttons */
  textAlignment?: string;
  /** Custom gap between buttons */
  containerGap?: number;
  /** Container alignment configuration */
  containerAlignment?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
}

/**
 * OptionButtonsContainer Component
 * 
 * A flexible option button container with multiple layout modes and extensive customization.
 * Supports default (vertical), wrap (multi-line), and row (horizontal) layouts with
 * custom styling, alignment, and spacing options.
 * 
 * @param props - Component props
 * @param props.options - Array of options to display
 * @param props.selectedValue - Currently selected value(s)
 * @param props.onSelect - Selection handler function
 * @param props.layout - Button layout mode
 * @param props.multiple - Multiple selection mode
 * @param props.containerStyle - Container styling
 * @param props.buttonStyle - Button styling
 * @param props.textStyle - Text styling
 * @param props.buttonHeight - Custom button height
 * @param props.buttonWidth - Custom button width
 * @param props.buttonPadding - Button padding configuration
 * @param props.buttonAlignment - Button alignment configuration
 * @param props.textAlignment - Text alignment
 * @param props.containerGap - Gap between buttons
 * @param props.containerAlignment - Container alignment
 * @returns JSX.Element
 */
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
  /**
   * Generates container styles based on layout and custom configurations
   * @returns Container style array
   */
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
    
    // Apply custom gap
    if (containerGap) {
      customStyles.push({ gap: containerGap });
    }
    
    // Apply custom alignment
    if (containerAlignment) {
      if (layout === 'default') {
        // Default layout is vertical, so use alignItems for horizontal alignment
        customStyles.push({ alignItems: containerAlignment });
      } else {
        // Wrap and row layouts are horizontal, so use justifyContent for horizontal alignment
        customStyles.push({ justifyContent: containerAlignment });
      }
    }
    
    return customStyles.length > 0 ? [baseStyle, ...customStyles] : baseStyle;
  };

  /**
   * Generates button styles based on selection state, description availability, and layout
   * @param isSelected - Whether the button is selected
   * @param hasDescription - Whether the button has a description
   * @returns Button style array
   */
  const getButtonStyle = (isSelected: boolean, hasDescription: boolean) => {
    const baseStyle = [
      createInputStyle(isSelected ? 'selected' : 'default', {
        height: buttonHeight, // Use buttonHeight if provided
        paddingVertical: buttonPadding?.vertical,
        paddingHorizontal: buttonPadding?.horizontal,
        justifyContent: buttonAlignment?.justifyContent,
        alignItems: buttonAlignment?.alignItems,
      }),
      buttonStyle,
    ];
    
    // Set button width
    if (buttonWidth) {
      baseStyle.push({ width: buttonWidth });
    }
    
    switch (layout) {
      case 'wrap':
        return [...baseStyle, styles.wrapButton];
      case 'row':
        return [...baseStyle, styles.rowButton];
      default:
        // In default layout, center alignSelf if containerAlignment is center
        if (containerAlignment === 'center') {
          return [...baseStyle, { alignSelf: 'center' as const }];
        }
        return baseStyle;
    }
  };

  /**
   * Generates text styles based on selection state and layout
   * @param isSelected - Whether the button is selected
   * @returns Text style array
   */
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
        // Convert string options to objects for consistent handling
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
  // Default Layout (vertical arrangement, full width)
  defaultContainer: {
    gap: responsiveHeight(1.5),
    alignSelf: 'stretch',
    alignItems: 'flex-start', // Default horizontal alignment
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
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    color: '#333333',
    textAlign: 'left',
  },
  optionTextSelected: {
    color: '#000000',
  },

  // Wrap Layout (multi-line arrangement)
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
    fontSize: responsiveFontSize(1.7), // 12px equivalent
  },

  // Row Layout (horizontal arrangement)
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
    fontSize: responsiveFontSize(1.7), // 12px equivalent
  },
  optionContent: {
    flex: 1,
    gap: responsiveHeight(0.5),
  },
  descriptionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), // 10px equivalent
    color: '#6f6f6f',
    lineHeight: responsiveHeight(1.8),
    marginTop: responsiveHeight(0.5),
  },
});

export default OptionButtonsContainer;
