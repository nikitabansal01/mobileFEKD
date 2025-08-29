import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { INPUT_STATES, InputState } from '../constants/InputStates';

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
  // height가 지정되면 사용, 아니면 자동 조절
  ...(customProps?.height !== undefined ? { height: customProps.height } : {}),
  justifyContent: (customProps?.justifyContent ?? 'center') as 'center' | 'flex-start' | 'flex-end',
  alignItems: (customProps?.alignItems ?? 'flex-start') as 'center' | 'flex-start' | 'flex-end',
  alignSelf: 'stretch' as const, // 버튼 자체는 전체 너비 유지
});

export const createInputTextStyle = (state: InputState) => ({
  fontFamily: 'Inter400',
  fontSize: responsiveFontSize(1.7), //12px
  color: INPUT_STATES[state].text,
});
