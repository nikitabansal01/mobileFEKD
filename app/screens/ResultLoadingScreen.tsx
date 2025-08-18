import React, { useEffect } from 'react';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuvraMessageScreen from '../../components/AuvraMessageScreen';

const ResultLoadingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const handleContinue = () => {
    navigation.navigate('ResearchingScreen');
  };

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
      messageFontSize={responsiveFontSize(3)}
      messageWidth={responsiveWidth(65)}
      messageHeight={responsiveHeight(10)}
    />
  );
};

export default ResultLoadingScreen; 