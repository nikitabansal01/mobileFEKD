import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuvraMessageScreen from '../../components/AuvraMessageScreen';
import OptionButtonsContainer from '../../components/customComponent/OptionButtonsContainer';
import FixedBottomContainer from '../../components/FixedBottomContainer';
import PrimaryButton from '../../components/PrimaryButton';
import BackButton from '../../components/BackButton';
import AuvraCharacter from '../../components/AuvraCharacter';
import sessionService from '../../services/sessionService';

const questionTitle = "Tell us what feels easiest\nto do better today?";
const questionSub = "Choose one or more options";
const lifestyleOptions = [
  { id: "1", text: "🥗 Eat", value: "eat" },
  { id: "2", text: "🚶‍♀️Move", value: "move" },
  { id: "3", text: "🧘 Pause", value: "pause" },
];

/**
 * Result loading screen component
 * Step 1: User selects Eat/Move/Pause preferences
 * Step 2: Shows transition message and navigates to ResearchingScreen
 * 
 * This flow ensures backend can start generating recommendations with correct lifestyle_focus
 */
const ResultLoadingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [step, setStep] = useState(0); // 0: lifestyle question, 1: transition message
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  /**
   * Handle option selection for lifestyle focus
   */
  const handleOptionSelect = async (key: string) => {
    const newOptions = selectedOptions.includes(key)
      ? selectedOptions.filter(option => option !== key)
      : [...selectedOptions, key];

    setSelectedOptions(newOptions);
  };

  /**
   * Handle continue after selection - save and move to transition
   */
  const handleContinue = async () => {
    try {
      // Save lifestyle focus to AsyncStorage for ResearchingScreen
      await AsyncStorage.setItem('lifestyle_focus', JSON.stringify(selectedOptions));
      console.log('💾 [ResultLoadingScreen] Lifestyle focus saved:', selectedOptions);

      // Also save to backend session immediately
      const updateSuccess = await sessionService.updateSessionLifestyleFocus(selectedOptions);
      console.log('✅ [ResultLoadingScreen] Lifestyle focus synced to backend');

      if (updateSuccess) {
        // OPTIMIZATION: Start generation HERE immediately instead of waiting for next screen
        // This utilizes the 2.5s transition animation time for backend processing
        console.log('🚀 [ResultLoadingScreen] Pre-starting recommendation generation to reduce latency...');
        sessionService.startRecommendationGeneration().catch(err =>
          console.log('⚠️ [ResultLoadingScreen] Background generation start warning:', err)
        );
      }
    } catch (error) {
      console.error('❌ [ResultLoadingScreen] Failed to save lifestyle focus:', error);
    }

    // Move to transition message step
    setStep(1);
  };

  // Auto-navigate to ResearchingScreen after showing transition message
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        // Navigate with the selected options
        navigation.navigate('ResearchingScreen', { lifestyleFocus: selectedOptions });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, navigation, selectedOptions]);

  // Step 0: Lifestyle Focus Question
  if (step === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Back button */}
        <View style={styles.backButtonContainer}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Auvra character */}
          <View style={styles.characterContainer}>
            <AuvraCharacter size={responsiveWidth(25)} />
          </View>

          {/* Question title with gradient */}
          <View style={styles.questionContainer}>
            <MaskedView
              style={styles.maskedView}
              maskElement={
                <Text style={styles.questionTitle}>
                  {questionTitle}
                </Text>
              }
            >
              <LinearGradient
                colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, width: '100%', height: '100%' }}
              />
            </MaskedView>
          </View>

          {/* Subtitle */}
          <Text style={styles.questionSub}>{questionSub}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <OptionButtonsContainer
              options={lifestyleOptions}
              selectedValue={selectedOptions}
              onSelect={handleOptionSelect}
              multiple={true}
              layout="default"
              buttonWidth={responsiveWidth(80)}
              buttonHeight={responsiveHeight(6)}
              buttonAlignment={{ justifyContent: 'center', alignItems: 'center' }}
              containerAlignment="center"
            />
          </View>
        </View>

        {/* Continue button */}
        <FixedBottomContainer>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={selectedOptions.length === 0}
          />
        </FixedBottomContainer>
      </SafeAreaView>
    );
  }

  // Step 1: Transition message
  return (
    <AuvraMessageScreen
      message="Together, we'll bring them back into balance ❤️"
      onBack={() => setStep(0)}
      showBackButton={false}
      showContinueButton={false}
      autoContinue={true}
      autoContinueDelay={2500}
      characterSize={responsiveWidth(35)}
      messageFontSize={responsiveFontSize(2.27)}
      messageWidth={responsiveWidth(65)}
      messageHeight={responsiveHeight(10)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButtonContainer: {
    position: 'absolute',
    top: responsiveHeight(6),
    left: responsiveWidth(4),
    zIndex: 30,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(15),
  },
  characterContainer: {
    marginBottom: responsiveHeight(3),
  },
  questionContainer: {
    marginBottom: responsiveHeight(1.5),
  },
  maskedView: {
    width: responsiveWidth(85),
    height: responsiveHeight(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTitle: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(3.4),
    textAlign: 'center',
    lineHeight: responsiveHeight(4),
  },
  questionSub: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),
    color: '#6f6f6f',
    textAlign: 'center',
    marginBottom: responsiveHeight(3),
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default ResultLoadingScreen; 