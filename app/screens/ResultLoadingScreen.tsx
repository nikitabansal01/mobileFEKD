import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResultLoadingScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      (navigation.navigate as any)('screens/ResearchingScreen');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <BackButton />
      </View>
      
      {/* Center Content */}
      <View style={styles.centerContent}>
        <View style={styles.characterWrapper}>
          <AuvraCharacter size={responsiveWidth(32)} />
        </View>
        <Text style={styles.title}>
          Together, we'll{"\n"}bring them back{"\n"}into balance❤️
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButtonContainer: {
    position: 'absolute',
    top: responsiveHeight(6),
    left: responsiveWidth(5),
    zIndex: 1,
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
    fontSize: responsiveFontSize(3),
    color: '#bb4471',
    textAlign: 'center',
    width: responsiveWidth(70),
    lineHeight: responsiveFontSize(3.6),
  },
});

export default ResultLoadingScreen; 