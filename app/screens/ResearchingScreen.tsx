import Images from "@/assets/images";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import { responsiveFontSize2 } from "@/globalFontSizeNew";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { responsiveWidth, responsiveHeight } from "react-native-responsive-dimensions";

const firstTitle = "🔍 Researching 25000\nresearch papers...";
const secondTitle = "🎁 Personalizing based\non your needs";
const subText = "Crafting your unique action plan,\npersonalized to the whole you";

const questionTitle = "Tell us what feels easiest\nto do better this week?";
const questionSub = "While we craft your action plan...";
const options = [
  { key: "eat", label: "🥗 Eat" },
  { key: "move", label: "🚶‍♀️Move" },
  { key: "pause", label: "🧘 Pause" },
];

const finalTitle = "Perfect!\nYour personalized\naction plan is ready!";

const ResearchingScreen = () => {
  const [step, setStep] = useState(0); // 0: 첫 텍스트, 1: 두번째 텍스트, 2: 질문
  const [selected, setSelected] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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

  const handleSelect = (key: string) => {
    setSelected(prev => (prev === key ? null : key));
    setStep(3); // 무조건 Perfect!로 전환
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
            <Text
              style={{
                color: "#bb4471",
                fontSize: responsiveFontSize2(3.0),
                fontFamily: "Poppins600",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {firstTitle}
            </Text>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize2(1.9),
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
            <Text
              style={{
                color: "#bb4471",
                fontSize: responsiveFontSize2(3.0),
                fontFamily: "Poppins600",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {secondTitle}
            </Text>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize2(1.9),
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
          <>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize2(1.7),
                fontFamily: "Poppins400",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {questionSub}
            </Text>
            <Text
              style={{
                color: "#bb4471",
                fontSize: responsiveFontSize2(2.3),
                fontFamily: "Poppins600",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {questionTitle}
            </Text>
            <View style={{ width: '80%', gap: 10, zIndex: 10, position: 'relative', alignSelf: 'center' }}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleSelect(opt.key)}
                  style={{
                    borderWidth: 1.5,
                    borderColor: selected === opt.key ? '#bb4471' : 'rgba(0,0,0,0.3)',
                    borderRadius: 12,
                    paddingVertical: 8, // 더 작게
                    paddingHorizontal: 6, // 더 작게
                    marginBottom: 6,
                    backgroundColor: selected === opt.key ? '#FDF1F6' : '#fff',
                    alignItems: "center",
                    width: '100%',
                    alignSelf: "center",
                    zIndex: 10, // 각 버튼에도 zIndex
                  }}
                >
                  <Text
                    style={{
                      color: '#000',
                      fontFamily: 'Poppins400',
                      fontSize: responsiveFontSize2(1.6),
                      textAlign: "center",
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <Text
              style={{
                color: "#bb4471",
                fontSize: responsiveFontSize2(3.0),
                fontFamily: "Poppins600",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {finalTitle}
            </Text>
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
      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </SafeAreaView>
  );
};

export default ResearchingScreen; 