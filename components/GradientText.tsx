import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Props for the GradientText component
 */
type Props = {
  /** Text content (alternative to text prop) */
  children?: string;
  /** Text content to display with gradient effect */
  text?: string;
  /** Styles for the text */
  textStyle?: TextStyle;
  /** Styles for the container */
  containerStyle?: any;
};

/**
 * Comprehensive emoji regex pattern with global flag
 * Covers various emoji ranges including faces, objects, symbols, etc.
 */
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1FA70}-\u{1FAFF}]/gu;

/**
 * Splits text into emoji and text parts for proper rendering
 * 
 * @param input - Input string to split
 * @returns Array of text and emoji parts
 */
function splitEmojiRuns(input: string) {
  const parts: Array<{ type: 'emoji' | 'text'; value: string }> = [];
  let lastIndex = 0;

  for (const match of input.matchAll(emojiRegex)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, idx) });
    }
    parts.push({ type: 'emoji', value: match[0] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) });
  }
  return parts;
}

/**
 * GradientText Component
 * 
 * Renders text with a beautiful gradient effect while preserving emoji rendering.
 * Uses MaskedView to apply gradient only to text parts, keeping emojis in their original colors.
 * 
 * @param props - Component props
 * @param props.children - Text content (alternative to text prop)
 * @param props.text - Text content to display
 * @param props.textStyle - Text styling
 * @param props.containerStyle - Container styling
 * @returns JSX.Element
 */
const GradientText: React.FC<Props> = ({ 
  children,
  text, 
  textStyle, 
  containerStyle 
}) => {
  const displayText = text || children || '';
  const parts = useMemo(() => splitEmojiRuns(displayText), [displayText]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Gradient mask: applies gradient only to text parts */}
      <MaskedView
        style={styles.mask}
        maskElement={
          <Text style={[textStyle]}>
            {parts.map((p, i) => (
              <Text key={i} style={p.type === 'emoji' ? styles.transparent : undefined}>
                {p.value}
              </Text>
            ))}
          </Text>
        }
      >
        <LinearGradient
          colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
          locations={[0, 0.32, 0.5, 0.73, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fill}
        />
      </MaskedView>

      {/* Overlay: renders emojis on top with original colors */}
      <View style={StyleSheet.absoluteFill}>
        <Text style={[textStyle]}>
          {parts.map((p, i) => (
            <Text key={i} style={p.type === 'emoji' ? undefined : styles.transparent}>
              {p.value}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  mask: { width: '100%', height: '100%' },
  fill: { width: '100%', height: '100%' },
  transparent: { color: 'transparent', opacity: 0 },
});

export default GradientText;
