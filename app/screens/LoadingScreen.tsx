import React from 'react';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import AuvraMessageScreen from '../../components/AuvraMessageScreen';

/**
 * Loading screen component that displays analysis message
 * Uses AuvraMessageScreen to show loading state with character animation
 */
const LoadingScreen = () => {
  return (
    <AuvraMessageScreen
      message={`I'm analyzing your\nroot cause...`}
      showBackButton={false}
      showContinueButton={false}
      characterSize={responsiveWidth(32)}
      messageFontSize={responsiveFontSize(2.27)}
      messageWidth={responsiveWidth(70)}
      messageHeight={responsiveHeight(8)}
    />
  );
};

export default LoadingScreen; 