import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import GradientText from "@/components/GradientText";
import AuvraCharacter from '@/components/AuvraCharacter';
import PrimaryButton from '@/components/PrimaryButton';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';

/**
 * Props for the AuvraMessageScreen component
 */
interface AuvraMessageScreenProps {
  /** Main message text to display */
  message: string;
  /** Function to call when continue button is pressed */
  onContinue?: () => void;
  /** Function to call when back button is pressed */
  onBack?: () => void;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Whether to show the continue button */
  showContinueButton?: boolean;
  /** Whether to automatically continue after delay */
  autoContinue?: boolean;
  /** Delay in milliseconds before auto-continue */
  autoContinueDelay?: number;
  /** Size of the Auvra character */
  characterSize?: number;
  /** Font size for the message text */
  messageFontSize?: number;
  /** Width of the message container */
  messageWidth?: number;
  /** Height of the message container */
  messageHeight?: number;
  /** Text for the continue button */
  continueButtonText?: string;
  /** Special message format with prefix and main text */
  specialMessage?: {
    prefix: string;
    mainText: string;
    prefixFontSize?: number;
    mainTextFontSize?: number;
    prefixColor?: string;
  };
}

/**
 * AuvraMessageScreen Component
 * 
 * A screen component that displays messages with the Auvra character.
 * Supports both regular and special message formats with gradient text effects.
 * 
 * @param props - Component props
 * @param props.message - Main message text
 * @param props.onContinue - Continue button handler
 * @param props.onBack - Back button handler
 * @param props.showBackButton - Back button visibility
 * @param props.showContinueButton - Continue button visibility
 * @param props.autoContinue - Auto-continue functionality
 * @param props.autoContinueDelay - Auto-continue delay
 * @param props.characterSize - Character size
 * @param props.messageFontSize - Message font size
 * @param props.messageWidth - Message container width
 * @param props.messageHeight - Message container height
 * @param props.continueButtonText - Continue button text
 * @param props.specialMessage - Special message format
 * @returns JSX.Element
 */
const AuvraMessageScreen: React.FC<AuvraMessageScreenProps> = ({
  message,
  onContinue,
  onBack,
  showBackButton = true,
  showContinueButton = false,
  autoContinue = false,
  autoContinueDelay = 1000,
  characterSize = responsiveWidth(25),
  messageFontSize = responsiveFontSize(2.0),
  messageWidth = responsiveWidth(80),
  messageHeight = responsiveHeight(8),
  continueButtonText = "Continue",
  specialMessage
}) => {
  useEffect(() => {
    if (autoContinue && onContinue) {
      const timer = setTimeout(() => {
        onContinue();
      }, autoContinueDelay);

      return () => clearTimeout(timer);
    }
  }, [autoContinue, autoContinueDelay, onContinue]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Back button */}
      {showBackButton && onBack && (
        <View style={styles.backButtonContainer}>
          <BackButton onPress={onBack} />
        </View>
      )}

      {/* Main content */}
      <View style={styles.content}>
        {/* Auvra character */}
        <View style={styles.characterContainer}>
          <AuvraCharacter size={characterSize} />
        </View>
        
        {/* Text container */}
        <View style={styles.textContainer}>
          {specialMessage ? (
            // Special message format (e.g., "Hi! I'm" + "Auvra")
            <>
              <Text style={[
                styles.prefixText, 
                { 
                  fontSize: specialMessage.prefixFontSize || responsiveFontSize(1.2),
                  color: specialMessage.prefixColor || '#6f6f6f'
                }
              ]}>
                {specialMessage.prefix}
              </Text>
              <View style={styles.maskedViewContainer}>
                <GradientText
                  text={specialMessage.mainText}
                  textStyle={[
                    styles.mainText, 
                    { fontSize: specialMessage.mainTextFontSize || responsiveFontSize(2.4) }
                  ]}
                  containerStyle={[styles.maskedView, { width: messageWidth, height: messageHeight }]}
                />
              </View>
            </>
          ) : (
            // Regular message format
            <View style={styles.maskedViewContainer}>
              <GradientText
                text={message.replace(/\\n/g, '\n')}
                textStyle={[
                  styles.messageText, 
                  { 
                    fontSize: messageFontSize,
                    lineHeight: messageFontSize * 1.2
                  }
                ]}
                containerStyle={[styles.maskedView, { width: messageWidth, height: messageHeight }]}
              />
            </View>
          )}
        </View>
      </View>

      {/* Bottom button */}
      {showContinueButton && onContinue && (
        <FixedBottomContainer>
          <PrimaryButton
            title={continueButtonText}
            onPress={onContinue}
          />
        </FixedBottomContainer>
      )}
    </SafeAreaView>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(10),
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(4),
  },
  textContainer: {
    alignItems: 'center',
  },
  maskedViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientText: {
    width: '100%',
    height: '100%',
  },
  messageText: {
    fontFamily: 'NotoSerif600',
    textAlign: 'center',
  },
  prefixText: {
    fontFamily: 'Inter400',
    textAlign: 'center',
    lineHeight: responsiveHeight(2.2),
  },
  mainText: {
    fontFamily: 'NotoSerif600',
    textAlign: 'center',
    lineHeight: responsiveHeight(3),
  },

});

export default AuvraMessageScreen;
