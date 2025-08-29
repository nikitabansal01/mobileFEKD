import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { INPUT_STATES, InputState } from '../constants/InputStates';

/**
 * Creates input container styles based on state and custom properties
 * 
 * @param state - The input state (default, selected, focused, error)
 * @param customProps - Optional custom styling properties
 * @param customProps.height - Custom height for the input
 * @param customProps.minHeight - Minimum height for the input
 * @param customProps.paddingVertical - Custom vertical padding
 * @param customProps.paddingHorizontal - Custom horizontal padding
 * @param customProps.justifyContent - Content justification
 * @param customProps.alignItems - Item alignment
 * @returns Style object for input container
 */
export const createInputStyle = (state: InputState, customProps?: {
  height?: number;
  minHeight?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  justifyContent?: string;
  alignItems?: string;
}) => ({
  borderWidth: INPUT_STATES[state].borderWidth,
  borderColor: INPUT_STATES[state].border,
  backgroundColor: INPUT_STATES[state].background,
  borderRadius: 10,
  paddingVertical: customProps?.paddingVertical ?? responsiveHeight(1.5),
  paddingHorizontal: customProps?.paddingHorizontal ?? responsiveWidth(5),
  // Use specified height if provided, otherwise auto-adjust
  ...(customProps?.height !== undefined ? { height: customProps.height } : {}),
  justifyContent: (customProps?.justifyContent ?? 'center') as 'center' | 'flex-start' | 'flex-end',
  alignItems: (customProps?.alignItems ?? 'flex-start') as 'center' | 'flex-start' | 'flex-end',
  alignSelf: 'stretch' as const, // Button maintains full width
});

/**
 * Creates input text styles based on state
 * 
 * @param state - The input state (default, selected, focused, error)
 * @returns Style object for input text
 */
export const createInputTextStyle = (state: InputState) => ({
  fontFamily: 'Inter400',
  fontSize: responsiveFontSize(1.7), // 12px equivalent
  color: INPUT_STATES[state].text,
});
