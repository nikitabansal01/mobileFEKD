import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, } from 'react-native';
import AppIntroSlider from "react-native-app-intro-slider";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import GradientText from '@/components/GradientText';

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
  ActionDetailScreen: { action?: string; };
  ActionCompletedScreen: { action?: string; };
};

type ActionDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActionDetailScreen'>;

interface ActionDetailScreenProps {
  route?: { params?: { action?: string; }; };
}

const ActionDetailScreen: React.FC<ActionDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<ActionDetailScreenNavigationProp>();
  const actionParam = route?.params?.action;

  // 상태 관리
  const [isHowMode, setIsHowMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // 뒤로가기 제스처 비활성화 (AppIntroSlider 사용 시)
  useFocusEffect(
    React.useCallback(() => {
      // 화면 포커스 시 뒤로가기 제스처 비활성화
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        // 화면 언포커스 시 뒤로가기 제스처 재활성화
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );

  // action 객체 생성 (이미 객체이거나 JSON 문자열일 수 있음)
  const action = actionParam ? (typeof actionParam === 'string' ? JSON.parse(actionParam) : actionParam) as {
    id: number;
    title: string;
    purpose: string;
    hormones: string[];
    image?: string;
    conditions?: string[];
    symptoms?: string[];
    specific_action?: string;
    advices?: Array<{
      type: string;
      title: string;
      image?: string;
    }>;
  } : null;

  // 디버깅용 로그
  console.log('ActionDetailScreen - actionParam:', actionParam);
  console.log('ActionDetailScreen - parsed action:', action);
  console.log('ActionDetailScreen - action title:', action?.title);
  console.log('ActionDetailScreen - action purpose:', action?.purpose);
  console.log('ActionDetailScreen - action hormones:', action?.hormones);
  console.log('ActionDetailScreen - action specific_action:', action?.specific_action);
  console.log('ActionDetailScreen - action conditions:', action?.conditions);
  console.log('ActionDetailScreen - action symptoms:', action?.symptoms);
  console.log('ActionDetailScreen - action advices:', action?.advices);
  console.log('ActionDetailScreen - advices count:', action?.advices?.length);

  // 호르몬별 설명 텍스트
  const getHormoneDescription = (hormones: string[]) => {
    if (hormones.includes('progesterone')) {
      return "I'm Progesterone — in your luteal phase, I tend to dip, causing mood swings or cramps.";
    }
    // 다른 호르몬들에 대한 설명은 나중에 추가
    return "";
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleTellMeMore = () => {
    // "Tell me best ways to consume" 버튼 클릭 시 동작
    console.log('Tell me best ways to consume clicked');
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        {isHowMode ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setIsHowMode(false)}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>How?</Text>
            </View>
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Why?</Text>
            </View>
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
          {isHowMode ? (
            // How Mode Content
            <>
              {/* Title and Image Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <GradientText
                    text={action?.specific_action || ''}
                    textStyle={styles.title}
                    containerStyle={styles.gradientContainer}
                    key={`how-title-${action?.specific_action || 'default'}`}
                  />
                </View>
                <View style={styles.imageContainer}>
                  <View style={styles.actionImage}>
                    <Text style={styles.imageText}>📋</Text>
                  </View>
                  <View style={styles.imageBorder} />
                </View>
              </View>

              {/* Conditions and Symptoms */}
              <View style={styles.conditionsSection}>
                <Text style={styles.conditionsSubtitle}>
                  Eating suggestions based on your preferences and concerns
                </Text>
                <View style={styles.conditionsTags}>
                  {[...(action?.conditions || []), ...(action?.symptoms || [])].map((condition, index) => (
                    <View key={index} style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Advice Slider */}
              {action?.advices && action.advices.length > 0 && (
                <View style={styles.adviceSection}>
                  <View 
                    style={styles.sliderContainer}
                    onTouchStart={() => setScrollEnabled(false)}
                    onTouchEnd={() => setScrollEnabled(true)}
                  >
                    <AppIntroSlider
                      data={action.advices}
                      keyExtractor={(item, index) => `advice-${index}`}
                      renderItem={({ item, index }) => (
                        <View style={styles.adviceSlideWrapper}>
                          <View style={styles.adviceCard}>
                            {/* Background Image */}
                            <View style={styles.adviceBackgroundImage}>
                              <Text style={styles.adviceBackgroundText}>
                                {item.image || '🍽️'}
                              </Text>
                            </View>
                            
                            {/* Type Badge - 좌측상단 */}
                            <View style={styles.adviceTypeBadge}>
                              <Text style={styles.adviceTypeBadgeText}>
                                {item.type || 'Easy'}
                              </Text>
                            </View>
                            
                            {/* Title - 좌측하단 */}
                            <View style={styles.adviceTitleContainer}>
                              <Text style={styles.adviceTitle}>
                                {item.title || 'Roasted pumpkin seeds'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                      showSkipButton={false}
                      showNextButton={false}
                      showDoneButton={false}
                      showPrevButton={false}
                      dotStyle={styles.sliderDot}
                      activeDotStyle={styles.sliderDotActive}
                      onSlideChange={(index) => setCurrentSlideIndex(index)}
                      bottomButton={false}
                      pagingEnabled={true}
                      horizontal={true}
                      nestedScrollEnabled={true}
                      renderPagination={(activeIndex) => (
                        <View style={styles.customPagination}>
                          {action?.advices?.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.sliderDot,
                                index === activeIndex && styles.sliderDotActive
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            // Why Mode Content
            <>
              {/* Title and Image Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <GradientText
                    text={`💡 Why ${action?.title || 'Pumpkin Seeds'}?`}
                    textStyle={styles.title}
                    containerStyle={styles.gradientContainer}
                    key={`action-title-${action?.title || 'default'}`}
                  />
                </View>
                <View style={styles.imageContainer}>
                  <View style={styles.actionImage}>
                    <Text style={styles.imageText}>📋</Text>
                  </View>
                  <View style={styles.imageBorder} />
                </View>
                
                {/* Hormone Graphic */}
                <View style={styles.hormoneGraphic}>
                  <Text style={styles.hormoneGraphicText}>🧬</Text>
                </View>
              </View>

              {/* Description Card */}
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {getHormoneDescription(action?.hormones || [])}
                  {'\n\n'}
                  {action?.purpose || 'This action helps support your hormone balance.'}
                </Text>
              </View>

              {/* Study Details */}
              <View style={styles.studyDetails}>
                <TouchableOpacity style={styles.studyDetailsButton}>
                  <Text style={styles.studyDetailsText}>View study details</Text>
                  <Text style={styles.studyDetailsArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Container */}
      <FixedBottomContainer>
        {isHowMode ? (
          <View style={styles.bottomButtonsContainer}>
            <PrimaryButton
              title="Mark as complete ✅"
              onPress={() => {
                console.log('Mark as complete clicked');
                navigation.navigate('ActionCompletedScreen', { 
                  action: JSON.stringify(action) 
                });
              }}
            />
            <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={() => {
                setIsHowMode(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.backToHomeButtonText}>Back to homescreen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PrimaryButton
            title="Tell me best ways to consume →"
            onPress={() => setIsHowMode(true)}
          />
        )}
      </FixedBottomContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBar: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    height: responsiveHeight(10), // 40px로 조정
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10), // 헤더 높이와 동일
  },
  backButton: {
    position: 'absolute',
    left: responsiveWidth(5),
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10), // 헤더 높이와 동일
    width: responsiveWidth(10), // 40px
  },
  backButtonText: {
    fontSize: responsiveFontSize(3.5), // 적절한 크기
    color: '#000000',
  },
  closeButtonContainer: {
    position: 'absolute',
    right: responsiveWidth(5),
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10), // 헤더 높이와 동일
  },
  headerTitle: {
    fontSize: responsiveFontSize(1.7), // 12px (Figma 기준)
    color: '#6F6F6F', // Grey Medium (Figma 기준)
    fontFamily: 'Inter400', // 올바른 폰트 이름으로 수정
    textAlign: 'center',
    textAlignVertical: 'center', // 세로 중앙정렬
    includeFontPadding: false, // 폰트 패딩 제거
    lineHeight: responsiveFontSize(1.7), // 폰트 사이즈와 동일한 lineHeight
  },
  closeButton: {
    width: responsiveWidth(10), // 40px로 조정
    height: responsiveHeight(10), // 40px로 조정
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: responsiveFontSize(3.5), // 적절한 크기로 조정
    color: '#6F6F6F',
    includeFontPadding: false, // 폰트 패딩 제거
    textAlignVertical: 'center', // 세로 중앙정렬
    lineHeight: responsiveFontSize(3.5), // 폰트 사이즈와 동일한 lineHeight
  },
  content: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(7), // 8 → 4로 줄임 (헤더와 그라디언트 제목 간격 감소)
    width: '100%',
  },
  title: {
    fontSize: responsiveFontSize(2.27), // 16px (Figma 기준)
    fontFamily: 'NotoSerif600', // 올바른 폰트 이름으로 수정
    textAlign: 'center',
    lineHeight: responsiveHeight(2.4), // 1.5 line height
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(5),
    width: '100%',
  },
  gradientContainer: {
    width: responsiveWidth(85),
    height: responsiveHeight(5),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: responsiveWidth(27.78), // 100px → 27.78% (360px 기준)
    height: responsiveWidth(27.78), // 100px → 27.78% (360px 기준)
    borderRadius: responsiveWidth(27.78) / 2, // 정확한 반지름 계산
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  actionImage: {
    width: responsiveWidth(18), // 80px → 22.22% (360px 기준)
    height: responsiveWidth(18), // 80px → 22.22% (360px 기준)
    borderRadius: responsiveWidth(18) / 2, // 정확한 반지름 계산
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: responsiveFontSize(6),
  },
  imageBorder: {
    position: 'absolute',
    top: -responsiveWidth(5.56), // -20px → -5.56% (360px 기준)
    left: -responsiveWidth(5.56), // -20px → -5.56% (360px 기준)
    right: -responsiveWidth(5.56), // -20px → -5.56% (360px 기준)
    bottom: -responsiveWidth(5.56), // -20px → -5.56% (360px 기준)
    borderWidth: responsiveWidth(5.56), // 20px → 5.56% (360px 기준)
    borderColor: '#FCDDEC',
    borderRadius: responsiveWidth(27.78) / 2 + responsiveWidth(5.56), // 정확한 반지름 계산
  },
  hormoneGraphic: {
    width: responsiveWidth(36.67), // 132px → 36.67% (360px 기준)
    height: responsiveHeight(20), // 121px → 33.61% (360px 기준)
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: responsiveWidth(6.11), // 22px → 6.11% (360px 기준)
    elevation: 5,
    alignSelf: 'center',
  },
  hormoneGraphicText: {
    fontSize: responsiveFontSize(6),
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(5.56), // 20px → 5.56% (360px 기준)
    padding: responsiveWidth(5.56), // 20px → 5.56% (360px 기준)
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#949494',
    marginBottom: responsiveHeight(2.5),
    alignSelf: 'center',
  },
  descriptionText: {
    fontSize: responsiveFontSize(1.7), // 12px (Figma 기준)
    fontFamily: 'Inter400', // 올바른 폰트 이름으로 수정
    color: '#000000',
    lineHeight: responsiveHeight(1.8), // 1.5 line height
  },
  studyDetails: {
    width: '100%',
    paddingVertical: responsiveHeight(2.5),
    alignSelf: 'center',
  },
  studyDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  studyDetailsText: {
    fontSize: responsiveFontSize(1.7), // 12px (Figma 기준)
    fontFamily: 'Inter400', // 올바른 폰트 이름으로 수정
    color: '#C17EC9',
  },
  studyDetailsArrow: {
    fontSize: responsiveFontSize(1.7), // 12px (Figma 기준)
    color: '#C17EC9',
    transform: [{ rotate: '270deg' }],
  },
  // How Mode Styles
  conditionsSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(7), // 5 → 3으로 줄임
    width: '100%',
  },
  conditionsSubtitle: {
    fontSize: responsiveFontSize(1.42), // 10px
    color: '#949494',
    fontFamily: 'Inter500', // 올바른 폰트 이름으로 수정
    marginBottom: responsiveHeight(1), // 2.5 → 4로 증가 (텍스트와 태그 간격 증가)
    textAlign: 'center',
    opacity: 0.7, // 투명도 추가
  },
  conditionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: responsiveWidth(1.5),
  },
  conditionTag: {
    backgroundColor: 'rgba(218, 214, 219, 0.37)',
    paddingHorizontal: responsiveWidth(1.5),
    paddingVertical: responsiveHeight(0.5), // 1 → 1.5로 증가 (tag 높이 증가)
    borderRadius: responsiveWidth(2.78), // 10px
  },
  conditionTagText: {
    fontSize: responsiveFontSize(1.7), // 12px
    color: '#6F6F6F',
    fontFamily: 'Inter400', // 올바른 폰트 이름으로 수정
  },
  adviceSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(2), // 4 → 2로 줄임
    width: '100%',
  },
  adviceCard: {
    width: '100%',
    height: responsiveHeight(18), // 150px
    backgroundColor: '#F0F0F0',
    borderRadius: responsiveWidth(2.78), // 10px
    position: 'relative',
    overflow: 'hidden', // 이미지가 카드 경계를 넘지 않도록
  },
  adviceBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // 배경색
  },
  adviceBackgroundText: {
    fontSize: responsiveFontSize(8), // 배경 이미지 크기
    color: '#CCCCCC',
  },
  adviceTypeBadge: {
    position: 'absolute',
    top: responsiveHeight(0.75), // 3px로 조정하여 더 위로 올림
    left: responsiveWidth(1.75), // 7px
    backgroundColor: '#FFFFFF',
    paddingHorizontal: responsiveWidth(1.5),
    paddingVertical: responsiveHeight(0.75),
    borderRadius: responsiveWidth(2.78), // 10px
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adviceTypeBadgeText: {
    fontSize: responsiveFontSize(1.4), // 10px
    color: '#000000',
    fontFamily: 'Inter500', // 올바른 폰트 이름으로 수정
    fontWeight: '500',
  },
  adviceTitleContainer: {
    position: 'absolute',
    bottom: responsiveHeight(1.75), // 7px
    left: responsiveWidth(1.75), // 7px
    right: responsiveWidth(1.75), // 7px
  },
  adviceTitle: {
    fontSize: responsiveFontSize(1.7), // 12px
    color: '#000000',
    fontFamily: 'Inter500', // 올바른 폰트 이름으로 수정
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderContainer: {
    width: '100%',
    height: responsiveHeight(25), // 카드 + dot 공간 포함
    position: 'relative',
  },
  adviceSlideWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  sliderPagination: {
    bottom: responsiveHeight(2), // dot 위치 조정
  },
  customPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: responsiveHeight(2),
    left: 0,
    right: 0,
    gap: responsiveWidth(1),
  },
  sliderDot: {
    width: responsiveWidth(2), // 8px
    height: responsiveWidth(2), // 8px
    borderRadius: responsiveWidth(1), // 4px
    backgroundColor: '#C17EC9',
    opacity: 0.3,
    marginHorizontal: responsiveWidth(1), // dot 간격
  },
  sliderDotActive: {
    opacity: 1,
    backgroundColor: '#C17EC9',
  },
  bottomButtonsContainer: {
    gap: responsiveHeight(2),
    alignItems: 'center',
    width: '100%',
  },
  backToHomeButton: {
    paddingVertical: responsiveHeight(1.25),
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: responsiveFontSize(1.98), // 14px
    color: '#6F6F6F',
    fontFamily: 'Inter500', // 올바른 폰트 이름으로 수정
  },
});

export default ActionDetailScreen;
