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
    // 1초 후 두 번째 화면으로 전환
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (currentStep === 1) {
      // 두 번째 화면에서 Continue 누르면 세 번째 화면으로
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // 세 번째 화면에서 Continue 누르면 QuestionScreen으로
      navigation.navigate('QuestionScreen');
    }
  };

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

  const getSpecialMessage = () => {
    if (currentStep === 0) {
      return {
        prefix: "Hi! I'm",
        mainText: "Auvra",
        prefixFontSize: responsiveFontSize(1.2),
        mainTextFontSize: responsiveFontSize(3.2),
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
      messageFontSize={responsiveFontSize(2.0)}
      messageWidth={responsiveWidth(80)}
      messageHeight={responsiveHeight(8)}
    />
  );
};

// 스타일이 AuvraMessageScreen 컴포넌트로 이동되었으므로 여기서는 제거

export default IntroScreen; 