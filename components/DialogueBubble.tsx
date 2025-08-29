import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { responsiveWidth, responsiveHeight } from 'react-native-responsive-dimensions';

/**
 * Props for the DialogueBubble component
 */
type DialogueBubbleProps = {
  /** Content to display inside the bubble */
  children: React.ReactNode;
  /** Visual variant of the bubble: 'tail' or 'corner' */
  variant?: 'tail' | 'corner';
  /** Corner position for 'corner' variant */
  cornerPosition?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  /** Width of the bubble */
  width?: DimensionValue;
  /** Additional styles for the bubble */
  style?: StyleProp<ViewStyle>;
};

/**
 * DialogueBubble Component
 * 
 * A customizable dialogue bubble component with two variants:
 * - 'tail': Bubble with a speech tail pointing upward
 * - 'corner': Corner-cut bubble for different visual effects
 * 
 * @param props - Component props
 * @param props.children - Content to display
 * @param props.variant - Visual variant type
 * @param props.cornerPosition - Corner position for corner variant
 * @param props.width - Bubble width
 * @param props.style - Additional styles
 * @returns JSX.Element
 */
const DialogueBubble = ({
  children,
  variant = 'tail',
  cornerPosition = 'topLeft',
  width = responsiveWidth(75),
  style,
}: DialogueBubbleProps) => {
  const bubbleStyle = { width };

  if (variant === 'corner') {
    const cornerStyle: ViewStyle = {};
    if (cornerPosition === 'topLeft') cornerStyle.borderTopLeftRadius = 0;
    if (cornerPosition === 'topRight') cornerStyle.borderTopRightRadius = 0;
    if (cornerPosition === 'bottomLeft') cornerStyle.borderBottomLeftRadius = 0;
    if (cornerPosition === 'bottomRight') cornerStyle.borderBottomRightRadius = 0;

    return (
      <View style={[styles.cornerBubble, bubbleStyle, cornerStyle, style]}>
        {children}
      </View>
    );
  }

  // Default variant is 'tail'
  return (
    <View style={[styles.tailContainer, style]}>
      <View style={styles.dialogueTail} />
      <View style={[styles.tailBubble, bubbleStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles for 'tail' variant
  tailContainer: {
    position: 'relative',
    paddingTop: 15,
    alignItems: 'center',
  },
  dialogueTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(174, 175, 247, 0.4)',
  },
  tailBubble: {
    backgroundColor: 'rgba(174, 175, 247, 0.4)',
    borderRadius: 30,
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
    justifyContent: 'center',
    minHeight: responsiveHeight(6.7), // Minimum height only, not fixed height
  },
  // Styles for 'corner' variant
  cornerBubble: {
    backgroundColor: '#E4E3F3',
    borderRadius: 30,
    minHeight: responsiveHeight(6.7), // Minimum height only, not fixed height
    // Padding and justification controlled by parent component as needed
  },
});

export default DialogueBubble; 