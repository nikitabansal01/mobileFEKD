import React, { useState, useRef, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Images from "@/assets/images";
import SVG from "@/assets/images/SVG";
import HormonesSvg from "@/assets/images/SVG/OnboardingSVG/HormonesSvg";
import { LinearGradient } from 'expo-linear-gradient';
import PrimaryButton from "@/components/PrimaryButton";
import GradientBackground from "@/components/GradientBackground";
import FixedBottomContainer from "@/components/FixedBottomContainer";

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  LoginScreen: undefined;
};

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingScreen'>;

/**
 * Onboarding slides data with hormone graphics and app screenshots
 */
const slides = [
  {
    key: 1,
    render: () => (
      <View style={styles.slideContentWrapper}>
        
        {/* Hormone character graphics */}
        <View>
          {/* Testosterone - right middle star shape */}
          <View style={{
            position: 'absolute',
            top: responsiveHeight(15),
            right: responsiveWidth(2),
            width: responsiveWidth(36),
            aspectRatio: 1.195
          }}>
            <Image
              source={Images.GraphicTestosteroneDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          
          {/* FSH - center oval shape */}
          <View style={{ 
            position: 'absolute',
            top: responsiveHeight(23), 
            left: responsiveWidth(22),
            width: responsiveWidth(43),
            aspectRatio: 1.1835
          }}>
            <Image
              source={Images.GraphicFSHDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          
          {/* GnRH - left bottom triangle shape */}
          <View style={{ 
            position: 'absolute',
            top: responsiveHeight(39), 
            left: responsiveWidth(4),
            width: responsiveWidth(33),
            aspectRatio: 1
          }}>
            <Image
              source={Images.GraphicGnRHDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          
          {/* Progesterone - right bottom cloud shape */}
          <View style={{ 
            position: 'absolute',
            top: responsiveHeight(39), 
            right: responsiveWidth(3),
            width: responsiveWidth(42),
            aspectRatio: 1.56
          }}>
            <Image
              source={Images.GraphicProgesteroneDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          
          {/* LH - middle top square shape */}
          <View style={{ 
            position: 'absolute',
            top: responsiveHeight(5), 
            left: responsiveWidth(35),
            width: responsiveWidth(31),
            aspectRatio: 1.45
          }}>
            <Image
              source={Images.GraphicLHDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          
          {/* Estrogen - left top lightning shape */}
          <View style={{ 
            position: 'absolute',
            top: responsiveHeight(7), 
            left: responsiveWidth(2),
            width: responsiveWidth(24),
            aspectRatio: 0.46
          }}>
            <Image
              source={Images.GraphicEstrogenDefault}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    ),
    backgroundColor: "#EFF8E1",
  },
  {
    key: 2,
    render: () => (
      <View style={styles.slideContentWrapper}>
        <LinearGradient
          colors={['rgb(255, 238, 198)', 'rgb(251, 186, 119)']}
          locations={[0, 1.0017]}
          start={{ x: 0, y: 0.7 }}
          end={{ x: 1, y: 0 }}
          style={ styles.gradient }
        >
          {/* Graphic image */}
          <View
            style={{
              width: responsiveWidth(100),
              height: responsiveHeight(51),
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Container for image and SVGs */}
            <View style={{ 
              position: 'relative',
              alignItems: 'center',
            }}>
              {/* Main image */}
              <Image
                source={Images.GraphicAppscreenshot1}
                style={{
                  width: undefined,
                  height: responsiveHeight(40),
                  aspectRatio: 228 / 350,
                }}
              />
              
              {/* SVG 1 - outside top left of image */}
              <View
                style={{
                  position: 'absolute',
                  top: '-7%',
                  left: '-7%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle width={40} height={40} />
              </View>
              
              {/* SVG 2 - outside top right of image */}
              <View
                style={{
                  position: 'absolute',
                  bottom: '30%',
                  right: '-12%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle1 width={30} height={35} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    ),
    backgroundColor: "#FEEBD1",
  },
  {
    key: 3,
    render: () => (
      <View style={styles.slideContentWrapper}>
        <LinearGradient
          colors={['rgb(255, 238, 198)', 'rgb(251, 186, 119)']}
          locations={[0, 1.0017]}
          start={{ x: 0, y: 0.7 }}
          end={{ x: 1, y: 0 }}
          style={ styles.gradient }
        >
          {/* Graphic image */}
          <View
            style={{
              width: responsiveWidth(100),
              height: responsiveHeight(51),
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Container for image and SVGs */}
            <View style={{ 
              position: 'relative',
              alignItems: 'center',
            }}>
              {/* Main image */}
              <Image
                source={Images.GraphicAppscreenshot2}
                style={{
                  width: undefined,
                  height: responsiveHeight(40),
                  aspectRatio: 228 / 350,
                }}
              />
              
              {/* SVG 1 - outside top left of image */}
              <View
                style={{
                  position: 'absolute',
                  top: '-7%',
                  left: '-7%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle width={40} height={40} />
              </View>
              
              {/* SVG 2 - outside top right of image */}
              <View
                style={{
                  position: 'absolute',
                  bottom: '30%',
                  right: '-12%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle1 width={30} height={35} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    ),
    backgroundColor: "#FEFAFC",
  },
  {
    key: 4,
    render: () => (
      <View style={styles.slideContentWrapper}>
        <LinearGradient
            colors={[
              'rgba(120, 224, 226, 0.882)',
              'rgb(228, 248, 255)', 
              'rgba(218, 241, 247, 0.984)',
              'rgba(194, 224, 227, 0.94)'
            ]}
            locations={[0, 0.12177, 0.20509, 0.71649]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={ styles.gradient }
        >
          {/* Graphic image */}
          <View
            style={{
              width: responsiveWidth(100),
              height: responsiveHeight(51),
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Container for image and SVGs */}
            <View style={{ 
              position: 'relative',
              alignItems: 'center',
            }}>
              {/* Main image */}
              <Image
                source={Images.GraphicAppscreenshot3}
                style={{
                  width: undefined,
                  height: responsiveHeight(40),
                  aspectRatio: 228 / 355,
                }}
              />
              
              {/* SVG 1 - outside top left of image */}
              <View
                style={{
                  position: 'absolute',
                  top: '-7%',
                  left: '-7%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle width={40} height={40} />
              </View>
              
              {/* SVG 2 - outside top right of image */}
              <View
                style={{
                  position: 'absolute',
                  bottom: '30%',
                  right: '-12%',
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <SVG.GraphicSparkle1 width={30} height={35} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    ),
    backgroundColor: "#FEFAFC",
  },
];

/**
 * Onboarding screen component with auto-sliding introduction slides
 * Features hormone graphics and app screenshots with gradient backgrounds
 */
const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<AppIntroSlider>(null);
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const titleText = [
    "True healing starts with understanding your hormones.",
    "Daily tips for your hormones, powered by science.",
    "Personalized to you using 25+ health and lifestyle factors.",
    "Built on 25,000+ research studies. Co-created with women and experts.",
  ];
  const description = [
    "Auvra reveals hormone patterns others miss — helping you treat root causes, not just symptoms.",
    "Get nutrition, fitness, and wellbeing guidance—personalized for your cycle and health goals.",
    "From bloodwork to symptoms to diagnosis — your experience is unique, and so is your plan.",
    "Rooted in research. Refined by experts. Designed to help you truly heal.",
  ];

  /**
   * Handle next slide navigation
   */
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      sliderRef.current?.goToSlide(currentIndex + 1);
    }
  };

  /**
   * Handle completion of onboarding
   */
  const handleDone = () => {
    navigation.navigate('IntroScreen');
  }

  /**
   * Handle login navigation
   */
  const handleLogin = () => {
    navigation.navigate('LoginScreen');
  }

  // Auto-slide every 1.5 seconds (stops at the end)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < slides.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        sliderRef.current?.goToSlide(nextIndex);
      } else {
        // Clear timer when reaching the last slide
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: slides[0].backgroundColor }}>
      <AppIntroSlider
        ref={sliderRef}
        data={slides}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.slide}>
            {item.render ? item.render() : null}
          </View>
        )}
        onSlideChange={setCurrentIndex}
        showNextButton={false}
        showDoneButton={false}
        dotStyle={{ width: 0, height: 0 }}
        activeDotStyle={{ width: 0, height: 0 }}
        style={styles.slider}
      />
      <View style={styles.contentContainer}>
        <View style={styles.paginationWrapper}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
        <View style={{ width: "100%" }}>
          <Text style={styles.titleText}>{titleText[currentIndex]}</Text>
          <Text style={styles.description}>{description[currentIndex]}</Text>
        </View>
      </View>
      
      {/* Bottom gradient background and buttons */}
      <FixedBottomContainer>
        <PrimaryButton 
          title="Get Started" 
          onPress={handleDone}
          style={styles.buttonView}
        />
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={handleLogin}>LogIn</Text>
        </Text>
      </FixedBottomContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  slideContentWrapper: {
    width: responsiveWidth(100),
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
  },
  slider: {
    paddingBottom: responsiveHeight(26),
  },
  titleText: {
    fontFamily: "NotoSerif600",
    fontSize: responsiveFontSize(3.4),
    color: "#6E4B6F",
    textAlign: "left",
    marginBottom: responsiveHeight(2),
    lineHeight: responsiveFontSize(3.4)*1.2,
  },
  description: {
    height: responsiveHeight(5),
    fontFamily: "Inter400",
    fontSize: responsiveFontSize(1.98),
    color: "#6E4B6F",
    textAlign: "left",
    marginBottom: responsiveHeight(1),
    lineHeight: responsiveFontSize(1.98)*1.4,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: responsiveHeight(2),
    gap: responsiveHeight(1.5),
  },
  buttonView: {
    width: responsiveWidth(85),
    marginBottom: responsiveHeight(1.5),
  },
  loginText: {
    fontFamily: "Inter400",
    fontSize: responsiveFontSize(1.98),
    color: "#6E4B6F",
    textAlign: "center",
  },
  loginLink: {
    color: "#6D6DFF",
    textDecorationLine: "underline",
  },
  dotStyle: {
    backgroundColor: "#eee",
  },
  activeDotStyle: {
    backgroundColor: "#BB4471",
  },
  contentContainer: {
    position: "absolute",
    height: responsiveHeight(46),
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: responsiveWidth(5),
    borderTopRightRadius: responsiveWidth(5),
    paddingBottom: responsiveHeight(15),
    paddingTop: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(6),
    alignItems: "center",
    zIndex: 10,
  },
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: responsiveHeight(1.5),
    marginBottom: responsiveHeight(4),
  },
  dot: {
    width: responsiveWidth(2.2),
    height: responsiveWidth(2.2),
    borderRadius: responsiveWidth(1.1),
    backgroundColor: "#eee",
    marginHorizontal: responsiveWidth(1),
  },
  activeDot: {
    backgroundColor: "#BB4471",
  },
  gradient: {
    width: responsiveWidth(100),
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: responsiveWidth(6),
    backgroundColor: 'transparent',
    alignItems: 'center',
    gap: responsiveHeight(0.3),
    zIndex: 11,
  },
  backgroundCircles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  circle: {
    width: responsiveWidth(115),
    height: responsiveWidth(115),
    borderRadius: responsiveWidth(57.5),
    backgroundColor: 'rgba(242, 129, 172, 0.1)',
    position: 'absolute',
  },
});

export default OnboardingScreen; 