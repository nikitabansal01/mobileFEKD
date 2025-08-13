import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import AuvraCharacter from '@/components/AuvraCharacter';

const LoadingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.characterWrapper}>
          <AuvraCharacter size={responsiveWidth(32)} />
        </View>
        <Text style={styles.title}>Analyzing your{'\n'}root cause</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(4),
  },
  title: {
    fontFamily: 'Poppins600',
    fontSize: responsiveFontSize(2.5),
    color: '#bb4471',
    textAlign: 'center',
    width: responsiveWidth(70),
    lineHeight: responsiveFontSize(3.2),
  },
});

export default LoadingScreen; 