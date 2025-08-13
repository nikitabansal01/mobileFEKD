import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import AuvraCharacter from '@/components/AuvraCharacter';
import PrimaryButton from '@/components/PrimaryButton';
import GradientBackground from '@/components/GradientBackground';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';

const IntroScreen = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();

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
      router.push({ pathname: '/screens/QuestionScreen' });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <View style={styles.backButtonContainer}>
        <BackButton style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Auvra 캐릭터 */}
        <View style={styles.characterContainer}>
          <AuvraCharacter />
        </View>
        
        {/* 텍스트 컨테이너 */}
        <View style={styles.textContainer}>
          {currentStep === 0 ? (
            // 첫 번째 화면: "Hi! I'm Auvra"
            <>
              <Text style={styles.greetingText}>Hi! I'm</Text>
              <View style={styles.maskedViewContainer}>
                <MaskedView
                  maskElement={
                    <Text style={styles.nameText}>Auvra</Text>
                  }
                  style={styles.maskedView}
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                    locations={[0, 0.32, 0.5, 0.73, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientText}
                  />
                </MaskedView>
              </View>
            </>
          ) : currentStep === 1 ? (
            // 두 번째 화면: 그라디언트 텍스트
            <View style={styles.maskedViewContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.descriptionText}>
                    {"I'm your personal hormone\nguide to help you feel more in\ncontrol of your body."}
                  </Text>
                }
                style={styles.maskedView}
              >
                <LinearGradient
                  colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                  locations={[0, 0.32, 0.5, 0.73, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientText}
                />
              </MaskedView>
            </View>
          ) : (
            // 세 번째 화면: 새로운 텍스트
            <View style={styles.maskedViewContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.descriptionText}>
                    {"I'll ask you 6 quick questions\nto start creating your\npersonalized action plan."}
                  </Text>
                }
                style={styles.maskedView}
              >
                <LinearGradient
                  colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                  locations={[0, 0.32, 0.5, 0.73, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientText}
                />
              </MaskedView>
            </View>
          )}
        </View>
      </View>

      {/* 두 번째, 세 번째 화면에서만 하단 버튼과 그라디언트 표시 */}
      {(currentStep === 1 || currentStep === 2) && (
        <FixedBottomContainer>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
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
  backButton: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(10),
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
  },
  textContainer: {
    alignItems: 'center',
  },
  greetingText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.2),
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveHeight(2.2),
  },
  maskedViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    width: responsiveWidth(80),
    height: responsiveHeight(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientText: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(2.4),
    textAlign: 'center',
    lineHeight: responsiveHeight(3),
  },
  descriptionText: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(2.0),
    textAlign: 'center',
    lineHeight: responsiveHeight(2.4),
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: responsiveHeight(2),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  continueButton: {
    width: responsiveWidth(88),
  },
});

export default IntroScreen; 