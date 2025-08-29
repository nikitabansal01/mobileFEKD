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

/**
 * Researching screen component for recommendation generation process
 * Features multi-step progress with API polling and user authentication
 */
const ResearchingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [step, setStep] = useState(0); // 0: first text, 1: second text, 2: question, 3: completion screen
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [recommendationStatus, setRecommendationStatus] = useState<string>('pending');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [canProceedToFinal, setCanProceedToFinal] = useState(false); // API completion status
  const [isPolling, setIsPolling] = useState(false); // Polling status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // User login status
  const [hasStartedRecommendation, setHasStartedRecommendation] = useState(false); // Recommendation generation start status

  // Firebase login state detection
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsUserLoggedIn(true);
        setShowLogin(false); // Close bottom sheet when logged in
        
        // If already logged in, skip recommendation generation and go directly to home
        if (!hasStartedRecommendation) {
          navigation.navigate('HomeScreen');
          return;
        }
        
        // If in login process, wait briefly then navigate to home screen
        setTimeout(() => {
          navigation.navigate('HomeScreen');
        }, 1000);
      } else {
        setIsUserLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, [navigation, hasStartedRecommendation]);

  // Start recommendation generation - only execute once when not logged in
  useEffect(() => {
    // Skip if already logged in or recommendation generation already started
    if (isUserLoggedIn || hasStartedRecommendation) {
      if (isUserLoggedIn) {
        // If logged in, treat as completed
        setCanProceedToFinal(true);
        setRecommendationStatus('completed');
      }
      return;
    }

    const startRecommendation = async () => {
      try {
        setHasStartedRecommendation(true); // Prevent duplicate execution
        const success = await sessionService.startRecommendationGeneration();
        if (success) {
          setRecommendationStatus('in_progress');
          setIsPolling(true); // Start polling
        } else {
          setRecommendationStatus('error');
        }
      } catch (error: any) {
        // If session expired, user may already be logged in
        if (error.message && error.message.includes('Session not found')) {
          // Skip recommendation generation and set as completed
          setCanProceedToFinal(true);
          setRecommendationStatus('completed');
          return;
        }
        
        setRecommendationStatus('error');
      }
    };

    // Start recommendation generation on component mount
    startRecommendation();
  }, [isUserLoggedIn, hasStartedRecommendation]);

  // Track recommendation generation status - continue polling until completion
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(async () => {
        try {
          const status = await sessionService.getRecommendationStatus();
          if (status) {
            setRecommendationStatus(status.status);
            
            // Stop status checking when completed
            if (status.status === 'completed') {
              setCanProceedToFinal(true); // Allow progression to final step after API completion
              setIsPolling(false); // Stop polling
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
              }
            } else if (status.status === 'error') {
              setCanProceedToFinal(true); // Allow progression even on error
              setIsPolling(false); // Stop polling
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
              }
            }
          }
        } catch (error) {
          console.error('Error checking recommendation status:', error);
        }
      }, 2000); // Check status every 2 seconds

      setStatusCheckInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isPolling]);

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Automatic step transition (slower pace)
  useEffect(() => {
    if (step < 2) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 4000); // Changed from 2 seconds to 4 seconds
      return () => clearTimeout(timer);
    }
  }, [step]);

  /**
   * Handle option selection for multiple choice
   */
  const handleOptionSelect = (key: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(key)) {
        return prev.filter(option => option !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    if (canProceedToFinal && !isUserLoggedIn) {
      // Show bottom sheet only when API completed and not logged in
      setStep(3); // Switch to "Perfect!"
      setTimeout(() => setShowLogin(true), 1500); // Show bottom sheet after 1.5 seconds
    } else if (canProceedToFinal && isUserLoggedIn) {
      // Navigate to home screen if already logged in
      setStep(3);
      setTimeout(() => navigation.navigate('HomeScreen'), 1500);
    } else {
      // Show waiting message if API not completed
      setStep(3); // Move to final step anyway
      // Don't show login bottom sheet until API completion
    }
  };

  // Show login bottom sheet after API completion (only if not logged in)
  useEffect(() => {
    if (step === 3 && canProceedToFinal && !showLogin && !isUserLoggedIn) {
      const timer = setTimeout(() => {
        setShowLogin(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, canProceedToFinal, showLogin, isUserLoggedIn]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* Top character layout (responsive) */}
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
      {/* Main text/question area */}
      <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center", width: '100%' }}>
        {step === 0 && (
          <>
            <View style={{ marginBottom: 8 }}>
              <GradientText
                text={firstTitle}
                textStyle={{
                  fontFamily: 'Poppins600',
                  fontSize: responsiveFontSize(3.4), //24px
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
                fontSize: responsiveFontSize(1.98), //14px
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
                  fontSize: responsiveFontSize(3.4), //24px
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
                fontSize: responsiveFontSize(1.98), //14px
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
              buttonWidth={responsiveWidth(80)} // Set button width
              buttonHeight={responsiveHeight(5.2)} // Set minimum height
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
                  fontSize: responsiveFontSize(3.4), //24px
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
                    fontSize: responsiveFontSize(1.98), //14px
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
      {/* Bottom character layout (responsive) */}
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
      
      {/* Bottom button - only show in step 2 */}
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