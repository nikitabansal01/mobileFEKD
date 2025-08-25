import Images from "@/assets/images";
import OptionButtonsContainer from "@/components/customComponent/OptionButtonsContainer";
import FixedBottomContainer from "@/components/FixedBottomContainer";
import GradientText from "@/components/GradientText";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import PrimaryButton from "@/components/PrimaryButton";

import { auth } from "@/config/firebase";
import sessionService from "@/services/sessionService";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { SafeAreaView } from "react-native-safe-area-context";

const firstTitle = "🔍 Researching 25000\nresearch papers...";
const secondTitle = "🎁 Personalizing based\non your needs";
const subText = "Crafting your unique action plan,\npersonalized to the whole you";

const questionTitle = "Tell us what feels easiest\nto do better this week?";
const questionSub = "Choose one or more options";
const options = [
  { id: "1", text: "🥗 Eat", value: "eat" },
  { id: "2", text: "🚶‍♀️Move", value: "move" },
  { id: "3", text: "🧘 Pause", value: "pause" },
];

const finalTitle = "Perfect!\nYour personalized\naction plan is ready!";

const ResearchingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [step, setStep] = useState(0); // 0: 첫 텍스트, 1: 두번째 텍스트, 2: 질문, 3: 완료 화면
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [recommendationStatus, setRecommendationStatus] = useState<string>('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [canProceedToFinal, setCanProceedToFinal] = useState(false); // API 완료 여부
  const [isPolling, setIsPolling] = useState(false); // 폴링 진행 여부
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // 사용자 로그인 상태
  const [hasStartedRecommendation, setHasStartedRecommendation] = useState(false); // 추천 생성 시작 여부

  // Firebase 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔐 사용자 로그인 감지:', user.email);
        setIsUserLoggedIn(true);
        setShowLogin(false); // 로그인되면 바텀시트 닫기
        
        // 이미 로그인된 상태라면 추천 생성을 건너뛰고 바로 홈으로 이동
        if (!hasStartedRecommendation) {
          console.log('🏠 이미 로그인된 상태 - 홈스크린으로 즉시 이동');
          navigation.navigate('HomeScreen');
          return;
        }
        
        // 로그인 과정 중이었다면 잠시 대기 후 홈스크린으로 이동
        setTimeout(() => {
          console.log('🏠 로그인 완료 - 홈스크린으로 이동');
          navigation.navigate('HomeScreen');
        }, 1000);
      } else {
        console.log('🔓 사용자 로그아웃 상태');
        setIsUserLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, [navigation, hasStartedRecommendation]);

  // 추천 생성 시작 - 로그인되지 않은 상태에서만 한 번 실행
  useEffect(() => {
    // 이미 로그인된 상태거나 이미 추천 생성을 시작했다면 건너뛰기
    if (isUserLoggedIn || hasStartedRecommendation) {
      console.log('⏭️ 추천 생성 건너뛰기:', { isUserLoggedIn, hasStartedRecommendation });
      if (isUserLoggedIn) {
        // 로그인된 상태면 바로 완료 처리
        console.log('✅ 로그인된 상태 - 추천 생성 완료로 처리');
        setCanProceedToFinal(true);
        setRecommendationStatus('completed');
      }
      return;
    }

    const startRecommendation = async () => {
      try {
        console.log('🚀 추천 생성 시작 시도...');
        setHasStartedRecommendation(true); // 중복 실행 방지
        const success = await sessionService.startRecommendationGeneration();
        if (success) {
          console.log('✅ 추천 생성 시작 성공');
          setRecommendationStatus('in_progress');
          setIsPolling(true); // 폴링 시작
        } else {
          console.error('❌ 추천 생성 시작 실패');
          setRecommendationStatus('error');
        }
      } catch (error: any) {
        console.error('❌ 추천 생성 시작 중 오류:', error);
        
        // 세션이 만료된 경우는 이미 로그인 완료된 상태일 가능성이 높음
        if (error.message && error.message.includes('Session not found')) {
          console.log('🔍 세션 만료 감지 - 이미 로그인 완료된 상태일 수 있음');
          // 추천 생성을 건너뛰고 완료 상태로 설정
          setCanProceedToFinal(true);
          setRecommendationStatus('completed');
          return;
        }
        
        setRecommendationStatus('error');
      }
    };

    // 컴포넌트 마운트 시 추천 생성 시작
    startRecommendation();
  }, [isUserLoggedIn, hasStartedRecommendation]);

  // 추천 생성 상태 추적 - 폴링이 시작되면 완료될 때까지 계속
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(async () => {
        try {
          const status = await sessionService.getRecommendationStatus();
          if (status) {
            console.log('✅ 상태 응답 받음:', status);
            console.log('추천 생성 상태 업데이트:', status.status);
            setRecommendationStatus(status.status);
            
            // 완료되면 상태 확인 중단
            if (status.status === 'completed') {
              console.log('🎉 추천 생성 완료!');
              console.log('추천 생성 결과 데이터:', status.data);
              console.log('🔄 canProceedToFinal을 true로 설정');
              setCanProceedToFinal(true); // API 완료 후 최종 단계로 진행 가능
              setIsPolling(false); // 폴링 중단
              console.log('⏹️ 상태 확인 인터벌 중단');
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
              }
            } else if (status.status === 'error') {
              console.log('❌ 추천 생성 중 오류 발생');
              setCanProceedToFinal(true); // 에러 발생해도 진행 가능하도록 설정
              setIsPolling(false); // 폴링 중단
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
              }
            } else if (status.status === 'pending') {
              console.log('⏳ 추천 생성 대기 중...');
            } else {
              console.log('🔄 추천 생성 진행 중...');
            }
          } else {
            console.log('⚠️ 추천 생성 상태 확인 실패 - 응답이 null');
          }
        } catch (error) {
          console.error('❌ 추천 생성 상태 확인 중 오류:', error);
        }
      }, 2000); // 2초마다 상태 확인

      setStatusCheckInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isPolling]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // 단계별 자동 전환 (더 천천히)
  useEffect(() => {
    if (step < 2) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 4000); // 2초에서 4초로 변경
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    console.log('showLogin:', showLogin);
  }, [showLogin]);

  // 추천 생성 상태 로깅
  useEffect(() => {
    console.log('현재 추천 생성 상태:', recommendationStatus);
  }, [recommendationStatus]);

  const handleOptionSelect = (key: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(key)) {
        return prev.filter(option => option !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleContinue = () => {
    if (canProceedToFinal && !isUserLoggedIn) {
      // API 완료되고 로그인되지 않은 경우만 바텀시트 표시
      setStep(3); // Perfect!로 전환
      setTimeout(() => setShowLogin(true), 1500); // 1.5초 후 바텀시트
    } else if (canProceedToFinal && isUserLoggedIn) {
      // 이미 로그인된 경우 홈스크린으로 이동
      setStep(3);
      console.log('✅ 이미 로그인된 상태 - 홈스크린으로 이동');
      setTimeout(() => navigation.navigate('HomeScreen'), 1500);
    } else {
      // API 미완료인 경우 대기 메시지 표시 후 완료 체크
      setStep(3); // 일단 최종 단계로 이동
      // API 완료될 때까지 로그인 바텀시트는 표시하지 않음
    }
  };

  // API 완료 후 로그인 바텀시트 표시 (로그인되지 않은 경우만)
  useEffect(() => {
    if (step === 3 && canProceedToFinal && !showLogin && !isUserLoggedIn) {
      console.log('📱 로그인 바텀시트 표시 예정 (1.5초 후)');
      const timer = setTimeout(() => {
        setShowLogin(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, canProceedToFinal, showLogin, isUserLoggedIn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* 상단 캐릭터 배치 (반응형) */}
      <View style={{ position: "relative", flex: 0.8 }}>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(8),
            left: responsiveWidth(0),
            width: responsiveWidth(23),
            aspectRatio: 0.46,
          }}
        >
          <Image 
            source={Images.GraphicEstrogenDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(0),
            right: responsiveWidth(18),
            width: responsiveWidth(38),
            aspectRatio: 1.45,
            transform: [{ rotate: "325deg" }],
          }}
        >
          <Image 
            source={Images.GraphicLHDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: responsiveHeight(3),
            right: responsiveWidth(-8),
            width: responsiveWidth(47),
            aspectRatio: 1.195,

          }}
        >
          <Image 
            source={Images.GraphicTestosteroneDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
      </View>
      {/* 메인 텍스트/질문 영역 */}
      <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center", width: '100%' }}>
        {step === 0 && (
          <>
            <View style={{ marginBottom: 8 }}>
              <GradientText
                text={firstTitle}
                textStyle={{
                  fontFamily: 'Poppins600',
                  fontSize: responsiveFontSize(3.4),//24px
                  fontWeight: "600",
                  textAlign: 'center',
                  lineHeight: responsiveHeight(4),
                }}
                containerStyle={{
                  width: responsiveWidth(85),
                  height: responsiveHeight(8),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </View>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize(1.98),//14px
                fontFamily: "Poppins400",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {subText}
            </Text>
            <ActivityIndicator size="large" color="#bb4471" />
          </>
        )}
        {step === 1 && (
          <>
            <View style={{ marginBottom: 8 }}>
              <GradientText
                text={secondTitle}
                textStyle={{
                  fontFamily: 'Poppins600',
                  fontSize: responsiveFontSize(3.4),//24
                  fontWeight: "600",
                  textAlign: 'center',
                  lineHeight: responsiveHeight(4),
                }}
                containerStyle={{
                  width: responsiveWidth(85),
                  height: responsiveHeight(8),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </View>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize(1.98),//14px
                fontFamily: "Poppins400",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {subText}
            </Text>
            <ActivityIndicator size="large" color="#bb4471" />
          </>
        )}
        {step === 2 && (
          <View style={{ 
            width: '100%', 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: responsiveWidth(5)
          }}>
            <View style={{ marginBottom: responsiveHeight(2) }}>
              <GradientText
                text={questionTitle}
                textStyle={{
                  fontFamily: 'NotoSerif600',
                  fontSize: responsiveFontSize(3.4), //24px
                  textAlign: 'center',
                  lineHeight: responsiveHeight(3),
                }}
                containerStyle={{
                  width: responsiveWidth(85),
                  height: responsiveHeight(6),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </View>
            
            <Text
              style={{
                color: "#6f6f6f",
                fontSize: responsiveFontSize(1.7), // 12px
                fontFamily: "Inter400",
                textAlign: "center",
                lineHeight: responsiveFontSize(1.7) * 1.25, // line-height 1.25
                marginBottom: responsiveHeight(2),
              }}
            >
              {questionSub}
            </Text>
            <OptionButtonsContainer
              options={options}
              selectedValue={selectedOptions}
              onSelect={handleOptionSelect}
              multiple={true}
              layout="default"
              buttonWidth={responsiveWidth(80)} // 버튼 가로 길이 설정
              buttonAlignment={{ justifyContent: 'center', alignItems: 'center' }}
              containerAlignment="center"
            />
          </View>
        )}
        {step === 3 && (
          <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <View style={{ marginBottom: 8, width: responsiveWidth(85), height: responsiveHeight(15) }}>
              <GradientText
                text={canProceedToFinal ? finalTitle : "🔬 Almost done!\nFinalizing your\npersonalized plan..."}
                textStyle={{
                  fontFamily: 'Poppins600',
                  fontSize: responsiveFontSize(3.4),//24px
                  fontWeight: "600",
                  textAlign: 'center',
                  lineHeight: responsiveHeight(4),
                }}
              />
            </View>
            {!canProceedToFinal && (
              <>
                <Text
                  style={{
                    color: "#6f6f6f",
                    fontSize: responsiveFontSize(1.98),//14px
                    fontFamily: "Poppins400",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Please wait while we complete your analysis
                </Text>
                <ActivityIndicator size="large" color="#bb4471" />
              </>
            )}
          </View>
        )}
      </View>
      {/* 하단 캐릭터 배치 (반응형) */}
      <View style={{ position: "relative", flex: 0.8 }}>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(3),
            left: responsiveWidth(-9),
            width: responsiveWidth(40),
            aspectRatio: 1.1835,
            transform: [{ rotate: "360deg" }],
          }}
        >
          <Image 
            source={Images.GraphicFSHDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(7),
            right: responsiveWidth(-8),
            width: responsiveWidth(53),
            aspectRatio: 1.56,
          }}
        >
          <Image 
            source={Images.GraphicProgesteroneDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: responsiveHeight(-3),
            left: responsiveWidth(20),
            width: responsiveWidth(38),
            aspectRatio: 1,
            transform: [{ rotate: "335deg" }],
          }}
        >
          <Image 
            source={Images.GraphicGnRHDefault} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
      </View>
      
      {/* 하단 버튼 - step 2에서만 표시 */}
      {step === 2 && (
        <FixedBottomContainer>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={selectedOptions.length === 0}
          />
        </FixedBottomContainer>
      )}
      
      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </SafeAreaView>
  );
};

export default ResearchingScreen; 