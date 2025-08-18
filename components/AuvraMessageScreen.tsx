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

interface AuvraMessageScreenProps {
  message: string;
  onContinue?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  autoContinue?: boolean;
  autoContinueDelay?: number;
  characterSize?: number;
  messageFontSize?: number;
  messageWidth?: number;
  messageHeight?: number;
  continueButtonText?: string;
  // 특별한 메시지 형식을 위한 props
  specialMessage?: {
    prefix: string;
    mainText: string;
    prefixFontSize?: number;
    mainTextFontSize?: number;
    prefixColor?: string;
  };
}

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
      {/* 뒤로가기 버튼 */}
      {showBackButton && onBack && (
        <View style={styles.backButtonContainer}>
          <BackButton onPress={onBack} />
        </View>
      )}

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        {/* Auvra 캐릭터 */}
        <View style={styles.characterContainer}>
          <AuvraCharacter size={characterSize} />
        </View>
        
        {/* 텍스트 컨테이너 */}
        <View style={styles.textContainer}>
          {specialMessage ? (
            // 특별한 메시지 형식 (예: "Hi! I'm" + "Auvra")
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
            // 일반 메시지 형식
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

      {/* 하단 버튼 */}
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
