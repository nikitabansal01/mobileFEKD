import React from 'react';
import { Text, View, TextStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { responsiveWidth, responsiveHeight } from "react-native-responsive-dimensions";

interface GradientTextProps {
  text: string;
  colors?: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  textStyle?: TextStyle;
  containerStyle?: any;
}

const GradientText: React.FC<GradientTextProps> = ({
  text,
  colors = ['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1'],
  locations = [0, 0.32, 0.5, 0.73, 1],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  textStyle,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <MaskedView
        maskElement={
          <Text style={[styles.maskText, textStyle]}>{text}</Text>
        }
        style={styles.maskedView}
      >
        <LinearGradient
          colors={colors}
          locations={locations}
          start={start}
          end={end}
          style={styles.gradient}
        />
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    width: responsiveWidth(60),
    height: responsiveHeight(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskText: {
    backgroundColor: 'transparent',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});

export default GradientText;