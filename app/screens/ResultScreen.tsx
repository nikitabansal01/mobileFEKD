import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import GradientText from "@/components/GradientText";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import PrimaryButton from '@/components/PrimaryButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import GraphicProgesterone1 from '@/assets/images/SVG/GraphicProgesterone1';
import GraphicTestosterone1 from '@/assets/images/SVG/GraphicTestosterone1';

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
};

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResultScreen'>;

const ResultScreen = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();

  const handleContinue = () => {
    navigation.navigate('ResultLoadingScreen');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <View style={styles.backButtonContainer}>
        <BackButton onPress={handleBack} />
      </View>

      {/* 메인 컨텐츠 */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.mainContent,
          { minHeight: '100%' }
        ]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={0}
        extraHeight={0}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Auvra 캐릭터와 제목 */}
          <View style={styles.headerSection}>
            <View style={styles.characterContainer}>
              <AuvraCharacter size={responsiveWidth(15)} />
            </View>
            
            <View style={styles.titleContainer}>
              <GradientText
                text="Some of your hormone buddies are feeling off"
                textStyle={styles.title}
                containerStyle={styles.maskedView}
              />
            </View>
          </View>

          {/* 호르몬 카드들 */}
          <View style={styles.cardsContainer}>
            {/* Progesterone 카드 */}
            <View style={styles.cardWrapper}>
              <View style={styles.hormoneCard}>
                <View style={styles.cardContent}>
                  <View style={styles.textSection}>
                    <Text style={styles.hormoneName}>
                      Progesterone, <Text style={styles.hormoneSubtitle}>The calmer</Text>
                    </Text>
                    <Text style={styles.hormoneDescription}>
                      🔻 Lower levels may be contributing to{' '}
                      <Text style={styles.underlineText}>painful periods</Text>
                      , and{' '}
                      <Text style={styles.underlineText}>mood changes</Text>.
                    </Text>
                  </View>
                                  <View style={[styles.graphicSection, styles.progesteroneGraphic]}>
                  <GraphicProgesterone1 
                    width={responsiveWidth(50)} 
                    height={responsiveWidth(50)} 
                  />
                </View>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>High Priority</Text>
              </View>
            </View>

            {/* Testosterone 카드 */}
            <View style={styles.cardWrapper}>
              <View style={styles.hormoneCard}>
                <View style={styles.cardContent}>
                  <View style={styles.textSection}>
                    <Text style={styles.hormoneName}>
                      Testosterone, <Text style={styles.hormoneSubtitle}>The titan</Text>
                    </Text>
                    <Text style={styles.hormoneDescription}>
                      🔺 Higher levels may be contributing to{' '}
                      <Text style={styles.underlineText}>acne</Text>
                      ,{' '}
                      <Text style={styles.underlineText}>excess hair</Text>
                      , and{' '}
                      <Text style={styles.underlineText}>mood swings</Text>
                      , common in{' '}
                      <Text style={styles.underlineText}>PCOS</Text>.
                    </Text>
                  </View>
                                  <View style={[styles.graphicSection, styles.testosteroneGraphic]}>
                  <GraphicTestosterone1 
                    width={responsiveWidth(50)} 
                    height={responsiveWidth(50)} 
                  />
                </View>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Moderate</Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* 하단 고정 영역 */}
      <FixedBottomContainer>
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This analysis is for informational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.
          </Text>
        </View>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
        />
      </FixedBottomContainer>
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
  mainContent: {
    alignItems: 'center',
    paddingTop: responsiveHeight(8), // Auvra character 위치를 위로 올림
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(20), // 하단 버튼을 위한 충분한 공간
    flexGrow: 1, // 콘텐츠가 적을 때도 전체 높이 사용
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    width: responsiveWidth(80),
    height: responsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientText: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(2.6),
    textAlign: 'center',
    lineHeight: responsiveHeight(2.8),
  },
  cardsContainer: {
    width: responsiveWidth(78),
    gap: responsiveHeight(2.7),
  },
  cardWrapper: {
    position: 'relative',
    marginTop: responsiveHeight(1), // High Priority 태그를 위한 여백
  },
  hormoneCard: {
    backgroundColor: '#FFFBFC',
    borderRadius: 12,
    padding: responsiveWidth(6),
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#cfcfcf',
    elevation: 3,
    overflow: 'hidden', // 카드 영역 밖으로 나가는 부분을 잘라냄
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(3.5),
    position: 'relative', // 절대 위치 요소들의 기준점
  },
  textSection: {
    flex: 1,
    gap: responsiveHeight(0.5),
    maxWidth: responsiveWidth(40), // 텍스트 영역 최대 너비 제한
    zIndex: 2, // 이미지(zIndex: 1)보다 위에 표시
  },
  hormoneName: {
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(1.6),
    color: '#000000',
    lineHeight: responsiveHeight(2),
    fontWeight: '600',
  },
  hormoneSubtitle: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.3),
    color: '#6f6f6f',
  },
  hormoneDescription: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.3),
    color: '#6f6f6f',
    lineHeight: responsiveHeight(1.8),
    marginTop: responsiveHeight(0.5),
  },
  underlineText: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(0,0,0,0.5)',
  },
  graphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute', // 절대 위치로 설정
    zIndex: 1, // 텍스트 뒤에 배치
  },
  progesteroneGraphic: {
    right: responsiveWidth(-18), // Progesterone 이미지 위치
    top: responsiveHeight(-5),
  },
  testosteroneGraphic: {
    right: responsiveWidth(-21), // Testosterone 이미지 위치 (더 오른쪽)
    top: responsiveHeight(-3), // Testosterone 이미지 위치 (더 위쪽)
  },
  priorityBadge: {
    position: 'absolute',
    top: responsiveHeight(-1.3), // 카드 위로 약간 올라가도록
    left: responsiveWidth(4),
    backgroundColor: '#F2F0F2',
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.3),
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    elevation: 1,
    zIndex: 10, // 이미지(zIndex: 1)보다 위에 표시되도록 높은 zIndex 설정
  },
  priorityText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.3),
    color: '#6f6f6f',
    textAlign: 'center',
    fontWeight: '500',
  },
  disclaimerContainer: {
    marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
  },
  disclaimerText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.0),
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveHeight(1.5),
  },

});

export default ResultScreen; 