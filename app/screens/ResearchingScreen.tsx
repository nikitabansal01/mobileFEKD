import Images from "@/assets/images";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import { responsiveFontSize2 } from "@/globalFontSizeNew";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import OptionButtonsContainer from "@/components/customComponent/OptionButtonsContainer";
import FixedBottomContainer from "@/components/FixedBottomContainer";
import PrimaryButton from "@/components/PrimaryButton";
import GradientText from "@/components/GradientText";
import sessionService from "@/services/sessionService";

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
  const [step, setStep] = useState(0); // 0: 첫 텍스트, 1: 두번째 텍스트, 2: 질문
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [recommendationStatus, setRecommendationStatus] = useState<string>('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // 추천 생성 시작
  useEffect(() => {
    const startRecommendation = async () => {
      try {
        console.log('🚀 추천 생성 시작 시도...');
        const success = await sessionService.startRecommendationGeneration();
        if (success) {
          console.log('✅ 추천 생성 시작 성공');
          setRecommendationStatus('in_progress');
        } else {
          console.error('❌ 추천 생성 시작 실패');
          setRecommendationStatus('error');
        }
      } catch (error) {
        console.error('❌ 추천 생성 시작 중 오류:', error);
        setRecommendationStatus('error');
      }
    };

    // 컴포넌트 마운트 시 추천 생성 시작
    startRecommendation();
  }, []);

  // 추천 생성 상태 추적
  useEffect(() => {
    if (recommendationStatus === 'in_progress') {
      const interval = setInterval(async () => {
        try {
          const status = await sessionService.getRecommendationStatus();
          if (status) {
            console.log('추천 생성 상태 업데이트:', status.status);
            setRecommendationStatus(status.status);
            
            // 완료되면 상태 확인 중단
            if (status.status === 'completed') {
              console.log('🎉 추천 생성 완료!');
              console.log('추천 생성 결과 데이터:', status.data);
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
              }
            } else if (status.status === 'error') {
              console.log('❌ 추천 생성 중 오류 발생');
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
  }, [recommendationStatus]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  useEffect(() => {
    if (step < 2) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 2000);
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
    setStep(3); // Perfect!로 전환
    setTimeout(() => setShowLogin(true), 1000); // 1초 후 바텀시트
  };

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
                  fontSize: responsiveFontSize2(3.4),//24px
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
                fontSize: responsiveFontSize2(1.98),//14px
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
                  fontSize: responsiveFontSize2(3.4),//24
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
                fontSize: responsiveFontSize2(1.98),//14px
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
                text={finalTitle}
                textStyle={{
                  fontFamily: 'Poppins600',
                  fontSize: responsiveFontSize2(3.4),//24px
                  fontWeight: "600",
                  textAlign: 'center',
                  lineHeight: responsiveHeight(4),
                }}
              />
            </View>
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