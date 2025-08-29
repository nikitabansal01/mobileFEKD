import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import homeService, { AssignmentsResponse, CyclePhaseResponse } from '@/services/homeService';
import apiPromiseManager from '@/services/apiPromiseManager';

const GiftBoxAnimation = require('@/assets/animation/Gift_Box_Bouncing.json');
const MovingGlowAnimation = require('@/assets/animation/Moving_glow.json');
const GiftUnboxingAnimation = require('@/assets/animation/Gift_unboxing.json');

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

type ActionCompletedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActionCompletedScreen'>;

interface ActionCompletedScreenProps {
  route?: { params?: { action?: string; }; };
}

const ActionCompletedScreen: React.FC<ActionCompletedScreenProps> = ({ route }) => {
  const navigation = useNavigation<ActionCompletedScreenNavigationProp>();
  const actionParam = route?.params?.action;

  // 상태 관리
  const [currentPhase, setCurrentPhase] = useState<'initial' | 'white' | 'gift' | 'final'>('initial');
      const [showContent, setShowContent] = useState(false);
    const [todayAssignments, setTodayAssignments] = useState<AssignmentsResponse | null>(null);
    const [cyclePhaseData, setCyclePhaseData] = useState<CyclePhaseResponse | null>(null);
    const [unboxingFinished, setUnboxingFinished] = useState(false);
    
    // 애니메이션 값들
  const fadeAnim = new Animated.Value(1); // 0에서 1로 변경
  const scaleAnim = new Animated.Value(1); // 0.8에서 1로 변경

  // action 객체 생성
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

  // 호르몬 이름 가져오기 (첫 번째 호르몬 사용)
  const getHormoneName = (hormones: string[]) => {
    if (hormones.length > 0) {
      const hormone = hormones[0];
      // 첫 글자만 대문자로 변환
      return hormone.charAt(0).toUpperCase() + hormone.slice(1);
    }
    return 'Progesterone';
  };

  // 디버깅용 로그
  console.log('ActionCompletedScreen - currentPhase:', currentPhase);
  console.log('ActionCompletedScreen - showContent:', showContent);
  console.log('ActionCompletedScreen - action:', action);
  console.log('ActionCompletedScreen - hormones:', action?.hormones);
  console.log('ActionCompletedScreen - hormone name:', getHormoneName(action?.hormones || []));

  // API 호출 함수들
  const callBackgroundAPIs = async () => {
    try {
      console.log('🔄 백그라운드 API 호출 시작');
      
      // assignment ID 가져오기
      if (!action?.id) {
        console.warn('⚠️ Assignment ID가 없음');
        return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
      }

      // 1. 할당 작업 완료 API 호출
      console.log('🔄 할당 작업 완료 API 호출 중...');
      const completeSuccess = await homeService.completeAssignment(action.id);
      
      if (completeSuccess) {
        console.log('✅ 할당 작업 완료 성공');
        
        // 2. 병렬로 오늘의 액션 플랜과 사이클 페이즈 새로고침
        console.log('🔄 오늘의 액션 플랜과 사이클 페이즈 새로고침 중...');
        const [refreshedAssignments, refreshedCyclePhase] = await Promise.all([
          homeService.getTodayAssignments(),
          homeService.getCyclePhase()
        ]);
        
        if (refreshedAssignments) {
          console.log('✅ 오늘의 액션 플랜 새로고침 성공');
          setTodayAssignments(refreshedAssignments);
        } else {
          console.log('❌ 오늘의 액션 플랜 새로고침 실패');
        }

        if (refreshedCyclePhase) {
          console.log('✅ 사이클 페이즈 새로고침 성공');
          setCyclePhaseData(refreshedCyclePhase);
        } else {
          console.log('❌ 사이클 페이즈 새로고침 실패');
        }

        return { 
          success: true, 
          assignmentCompleted: true, 
          todayAssignments: refreshedAssignments,
          cyclePhaseData: refreshedCyclePhase
        };
      } else {
        console.log('❌ 할당 작업 완료 실패');
        return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
      }
    } catch (error) {
      console.error('❌ 백그라운드 API 호출 오류:', error);
      return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
    }
  };

  useEffect(() => {
    // 1초 후 흰색 배경으로 전환 & API 호출 시작
    const timer1 = setTimeout(() => {
      setCurrentPhase('white');
      
      // 백그라운드에서 API 호출 - Promise 등록하고 기다리지 않음
      if (action?.id) {
        const apiPromise = callBackgroundAPIs();
        apiPromiseManager.setActivePromise(action.id, apiPromise);
        console.log('🔄 API Promise 등록됨:', action.id);
      }
    }, 1000);

    // 2초 후 gift 단계로 전환
    const timer2 = setTimeout(() => {
      setCurrentPhase('gift');
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [action?.id]);

  const handleContinue = () => {
    // HomeScreen으로 이동 (API 완료 여부와 관계없이)
    if (todayAssignments && cyclePhaseData) {
      // API가 이미 완료된 경우 - 데이터 전달
      console.log('✅ API 완료됨 - 데이터와 함께 HomeScreen으로 이동');
      // @ts-ignore - navigation params 타입 체크 무시
      navigation.navigate('HomeScreen', { 
        refreshedData: todayAssignments,
        cyclePhaseData: cyclePhaseData,
        skipLoading: true 
      });
    } else if (todayAssignments) {
      // Today API만 완료된 경우 - 부분 데이터 전달
      console.log('✅ Today API만 완료됨 - 부분 데이터와 함께 HomeScreen으로 이동');
      // @ts-ignore - navigation params 타입 체크 무시
      navigation.navigate('HomeScreen', { 
        refreshedData: todayAssignments,
        skipTodayLoading: true 
      });
    } else {
      // API가 아직 진행 중이거나 실패한 경우 - Promise 전달 신호만
      console.log('🔄 API 진행 중 - HomeScreen에서 Promise 처리');
      navigation.navigate('HomeScreen');
    }
  };

  // 초기 보라색 배경
  if (currentPhase === 'initial') {
    return (
      <View style={styles.initialContainer}>
        {/* 여기에 나중에 Lottie 애니메이션이 들어갈 예정 */}
      </View>
    );
  }

  // 흰색 배경 (애니메이션 대기)
  if (currentPhase === 'white') {
    return (
      <View style={styles.whiteContainer}>
        {/* 여기에 나중에 Lottie 애니메이션이 들어갈 예정 */}
      </View>
    );
  }

  // Gift 단계 (터치 대기)
  if (currentPhase === 'gift') {
    return (
      <View style={styles.giftContainer}>
        {/* Gift Box bouncing animation */}
        <View style={styles.giftAnimationContainer}>
          <LottieView
            source={GiftBoxAnimation}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
        
        {/* Tap to unlock your gift! 텍스트 */}
        <Text style={styles.tapToUnlockText}>Tap to unlock your gift!</Text>
        
        {/* 터치 영역 */}
        <TouchableOpacity 
          style={styles.touchArea}
          onPress={() => {
            setCurrentPhase('final');
            setShowContent(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.touchOverlay} />
        </TouchableOpacity>
      </View>
    );
  }

  // 최종 화면
  return (
    <View style={styles.container}>
      {/* 배경 이미지들 */}
      <View style={styles.backgroundContainer}>
        {/* Moving Glow 애니메이션 - unboxing이 끝난 후에만 표시 */}
        {unboxingFinished && (
          <LottieView
            source={MovingGlowAnimation}
            autoPlay
            loop={false}
            style={styles.movingGlowAnimation}
          />
        )}
        {/* Gift Unboxing 애니메이션 - 항상 표시 (마지막 장면 유지) */}
        <LottieView
          source={GiftUnboxingAnimation}
          autoPlay
          loop={false}
          style={styles.giftUnboxingAnimation}
          onAnimationFinish={() => {
            setUnboxingFinished(true);
            setShowContent(true);
          }}
        />
      </View>

      {/* 메인 콘텐츠 - unboxing이 끝난 후에만 표시 */}
      {unboxingFinished && (
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* 텍스트 섹션 - 하단 */}
          <View style={styles.textSection}>
            <Text style={styles.title}>
              You brought {getHormoneName(action?.hormones || [])} one step closer to harmony!
            </Text>
            <Text style={styles.subtitle}>
              This helps support calm, clear-headed days through your luteal phase.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 하단 버튼 - unboxing이 끝난 후에만 표시 */}
      {unboxingFinished && (
        <FixedBottomContainer>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
          />
        </FixedBottomContainer>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // 초기 보라색 배경
  initialContainer: {
    flex: 1,
    backgroundColor: '#DDC2E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 흰색 배경
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gift 단계
  giftContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  giftAnimationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
  },

  giftBox: {
    fontSize: responsiveFontSize(20),
    textAlign: 'center',
  },

  lottieAnimation: {
    width: responsiveWidth(50), // 180px (360px 기준)
    height: responsiveWidth(50), // 180px (360px 기준)
  },

  tapToUnlockText: {
    fontSize: responsiveFontSize(1.98), //14px (프로젝트 기준)
    fontFamily: 'Inter400', // Inter Regular
    color: '#000000',
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: responsiveHeight(2.5),
  },

  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  touchOverlay: {
    width: '100%',
    height: '100%',
  },

  // 최종 화면
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 여기에 나중에 배경 이미지들이 들어갈 예정
  },

  movingGlowAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  giftUnboxingAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start', // flex-start로 변경하여 상단부터 배치
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
    paddingTop: responsiveHeight(15), // 상단 여백 유지
  },



  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: responsiveHeight(50), // Figma 디자인 기준 top-[526px]에 맞춰 조정
    //marginBottom: responsiveHeight(15), // 하단 여백 유지
  },

  title: {
    fontSize: responsiveFontSize(3.12), //22px (프로젝트 기준)
    fontFamily: 'NotoSerif600', // Noto Serif SemiBold
    color: '#000000', // Black
    textAlign: 'center',
    lineHeight: responsiveHeight(3.9), // 1.25 line height
    marginBottom: responsiveHeight(2.5), // 21px → 2.5% (360px 기준)
  },

  subtitle: {
    fontSize: responsiveFontSize(1.7), //12px (프로젝트 기준)
    fontFamily: 'Inter400', // Inter Regular
    color: '#404040', // Grey Dark (Figma 기준)
    textAlign: 'center',
    lineHeight: responsiveHeight(2.1), // 1.25 line height
  },
});

export default ActionCompletedScreen;
