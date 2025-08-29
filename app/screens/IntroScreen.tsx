import React, { useEffect, useState } from 'react';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuvraMessageScreen from '../../components/AuvraMessageScreen';

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
};

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'IntroScreen'>;

const IntroScreen = () => {
  const navigation = useNavigation<IntroScreenNavigationProp>();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Transition to second screen after 1 second
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle continue button press - navigate through intro steps
   */
  const handleContinue = () => {
    if (currentStep === 1) {
      // Second screen: Continue to third screen
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Third screen: Navigate to QuestionScreen
      navigation.navigate('QuestionScreen');
    }
  };

  /**
   * Get message text based on current step
   * @returns Message string for current step
   */
  const getMessage = () => {
    switch (currentStep) {
      case 1:
        return "I'm your personal hormone\nguide to help you feel more in\ncontrol of your body.";
      case 2:
        return "I'll ask you 6 quick questions\nto start creating your\npersonalized action plan.";
      default:
        return "";
    }
  };

  /**
   * Get special message configuration for step 0 (Auvra introduction)
   * @returns Special message object or undefined
   */
  const getSpecialMessage = () => {
    if (currentStep === 0) {
      return {
        prefix: "Hi! I'm",
        mainText: "Auvra",
        prefixFontSize: responsiveFontSize(1.7),
        mainTextFontSize: responsiveFontSize(3.4),
        prefixColor: '#6f6f6f'
      };
    }
    return undefined;
  };

  return (
    <AuvraMessageScreen
      message={getMessage()}
      specialMessage={getSpecialMessage()}
      onBack={() => navigation.goBack()}
      showBackButton={true}
      showContinueButton={currentStep === 1 || currentStep === 2}
      onContinue={handleContinue}
      autoContinue={currentStep === 0}
      autoContinueDelay={1000}
      characterSize={responsiveWidth(25)}
      messageFontSize={responsiveFontSize(2.27)}
      messageWidth={responsiveWidth(80)}
      messageHeight={responsiveHeight(9)}
    />
  );
};

export default IntroScreen; 