import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children?: string;
  text?: string;
  textStyle?: TextStyle;
  containerStyle?: any;
};

// 이모티콘 정규식 (기본적인 이모티콘 패턴) - g 플래그 추가
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1FA70}-\u{1FAFF}]/gu;

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
      {/* 1) 그라디언트 + (텍스트만 보이는) 마스크 */}
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

      {/* 2) 위에 이모지만 보이게 다시 그리기 */}
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
