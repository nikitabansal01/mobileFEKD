import React, { useEffect } from 'react';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuvraMessageScreen from '../../components/AuvraMessageScreen';

/**
 * Result loading screen component for displaying transition message
 * Features auto-navigation to researching screen after delay
 */
const ResultLoadingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  /**
   * Handle continue navigation to researching screen
   */
  const handleContinue = () => {
    navigation.navigate('ResearchingScreen');
  };

  // Auto-navigate after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleContinue();
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <AuvraMessageScreen
      message="Together, we'll bring them back into balance ❤️"
      onBack={() => navigation.goBack()}
      showBackButton={true}
      showContinueButton={false}
      autoContinue={true}
      autoContinueDelay={3000}
      characterSize={responsiveWidth(30)}
      messageFontSize={responsiveFontSize(2.27)} //16px
      messageWidth={responsiveWidth(65)}
      messageHeight={responsiveHeight(10)}
    />
  );
};

export default ResultLoadingScreen; 