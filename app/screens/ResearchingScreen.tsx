import Images from "@/assets/images";
import OptionButtonsContainer from "@/components/customComponent/OptionButtonsContainer";
import FixedBottomContainer from "@/components/FixedBottomContainer";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import PrimaryButton from "@/components/PrimaryButton";
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from "@/config/firebase";
import sessionService from "@/services/sessionService";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Platform, Text, View } from "react-native";
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
 * Custom Loading Spinner Component
 * Creates a circular progress indicator with smooth gradient effect using SVG
 */
const CustomLoadingSpinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Animated.View
        style={{
          width: 60,
          height: 60,
          transform: [{ rotate }],
        }}
      >
        <Svg width="60" height="60">
          <Defs>
            <SvgLinearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#F293B7" stopOpacity="1" />
              <Stop offset="30%" stopColor="#F293B7" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#F293B7" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#F293B7" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx="30"
            cy="30"
            r="26"
            stroke="url(#spinnerGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="120 200"
            strokeDashoffset="0"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

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
  const [canProceedToFinal, setCanProceedToFinal] = useState(false); // API completion status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // User login status
  const [hasStartedRecommendation, setHasStartedRecommendation] = useState(false); // Recommendation generation start status
  const [authChecked, setAuthChecked] = useState(false); // Auth state check status
  
  // Use refs for interval to avoid state update loops
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Firebase login state detection
  useEffect(() => {
    console.log('🔐 [ResearchingScreen] Setting up auth listener');
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      setAuthChecked(true);
      
      if (user) {
        setIsUserLoggedIn(true);
        setShowLogin(false); // Close bottom sheet when logged in
        
        // Stop polling if still running
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          isPollingRef.current = false;
        }
        
        // Check if LoginBottomSheet is handling navigation via SignupLoadingScreen
        // If session_link_complete is 'pending', LoginBottomSheet started the session link
        // and SignupLoadingScreen will handle navigation - DON'T double-navigate
        const sessionLinkStatus = await AsyncStorage.getItem('session_link_complete');
        if (sessionLinkStatus === 'pending') {
          console.log('⏳ [ResearchingScreen] Session link in progress, SignupLoadingScreen will handle navigation');
          return; // Let SignupLoadingScreen handle navigation
        }
        
        console.log('✅ [ResearchingScreen] User logged in, navigating to MainScreenTabs');
        // If user is already logged in (returning user), navigate directly to home
        navigation.navigate('MainScreenTabs');
      } else {
        setIsUserLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Start recommendation generation ONLY after user selects lifestyle_focus options
  // This ensures recommendations are personalized to eat/move/pause preference
  // Debounced by 1.5 seconds to allow user to select multiple options
  useEffect(() => {
    // Skip if already logged in
    if (isUserLoggedIn) {
      return;
    }
    
    // Skip if recommendation generation already started
    if (hasStartedRecommendation) {
      return;
    }

    // CRITICAL: Wait until user has selected at least one option
    // User sees eat/move/pause question at step 2
    if (selectedOptions.length === 0) {
      console.log('⏳ [ResearchingScreen] Waiting for user to select lifestyle options...');
      return;
    }

    // Debounce: Wait 1.5 seconds after selection to allow user to select multiple options
    const debounceTimer = setTimeout(async () => {
      // Double-check we haven't started yet (race condition protection)
      if (hasStartedRecommendation) {
        return;
      }

      try {
        console.log('🎯 [ResearchingScreen] User selected options:', selectedOptions);
        
        // STEP 1: Update session with lifestyle_focus BEFORE generating recommendations
        console.log('📝 [ResearchingScreen] Updating session with lifestyle_focus...');
        const updateSuccess = await sessionService.updateSessionLifestyleFocus(selectedOptions);
        if (!updateSuccess) {
          console.warn('⚠️ [ResearchingScreen] Failed to update lifestyle_focus, continuing anyway');
        }
        
        // STEP 2: Now start recommendation generation (will use the lifestyle_focus)
        console.log('🚀 [ResearchingScreen] Starting recommendation generation with lifestyle_focus');
        setHasStartedRecommendation(true); // Prevent duplicate execution
        const success = await sessionService.startRecommendationGeneration();
        if (success) {
          console.log('✅ [ResearchingScreen] Recommendation started, beginning polling');
          setRecommendationStatus('in_progress');
          startPolling(); // Start polling with ref-based approach
        } else {
          console.error('❌ [ResearchingScreen] Failed to start recommendation');
          setRecommendationStatus('error');
        }
      } catch (error: any) {
        // If session expired, user may already be logged in
        if (error.message && error.message.includes('Session not found')) {
          console.log('⚠️ [ResearchingScreen] Session not found - may be logged in user');
          // Skip recommendation generation and set as completed
          setCanProceedToFinal(true);
          setRecommendationStatus('completed');
          return;
        }
        
        console.error('❌ [ResearchingScreen] Recommendation start error:', error);
        setRecommendationStatus('error');
      }
    }, 1500); // 1.5 second debounce for multiple selections

    // Cleanup timer if selections change before debounce completes
    return () => clearTimeout(debounceTimer);
  }, [isUserLoggedIn, hasStartedRecommendation, selectedOptions]);
  
  // Start polling function (uses refs to avoid re-render loops)
  const startPolling = () => {
    // Prevent double polling
    if (isPollingRef.current || pollingIntervalRef.current) {
      console.log('⏭️ [ResearchingScreen] Polling already active, skipping');
      return;
    }
    
    isPollingRef.current = true;
    console.log('🔄 [ResearchingScreen] Starting status polling (every 2.5s)');
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await sessionService.getRecommendationStatus();
        if (status) {
          setRecommendationStatus(status.status);
          
          // Stop status checking when completed
          if (status.status === 'completed') {
            console.log('✅ [ResearchingScreen] Recommendations completed!');
            setCanProceedToFinal(true);
            stopPolling();
          } else if (status.status === 'error') {
            console.log('⚠️ [ResearchingScreen] Recommendations error, allowing progression');
            setCanProceedToFinal(true);
            stopPolling();
          }
        }
      } catch (error) {
        console.error('❌ [ResearchingScreen] Error checking status:', error);
      }
    }, 2500); // Check every 2.5 seconds (slightly longer to reduce load)
  };
  
  // Stop polling function
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('🛑 [ResearchingScreen] Stopping status polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 [ResearchingScreen] Cleanup - stopping polling');
      stopPolling();
    };
  }, []);

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
  const handleOptionSelect = async (key: string) => {
    const newOptions = selectedOptions.includes(key)
      ? selectedOptions.filter(option => option !== key)
      : [...selectedOptions, key];
    
    setSelectedOptions(newOptions);
    
    // Save lifestyle focus to AsyncStorage for session linking
    try {
      await AsyncStorage.setItem('lifestyle_focus', JSON.stringify(newOptions));
      console.log('💾 Lifestyle focus saved:', newOptions);
    } catch (error) {
      console.error('❌ Failed to save lifestyle focus:', error);
    }
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

  // Show loading while checking auth state
  if (!authChecked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF", justifyContent: 'center', alignItems: 'center' }}>
        <CustomLoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* Top character layout (responsive) */}
      <View style={{ position: "relative", flex: 0.8 }}>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(3),
            left: responsiveWidth(0),
            width: responsiveWidth(30),
            aspectRatio: 0.46,
          }}
        >
          <Image 
            // source={Images.GraphicEstrogenDefault} 
            source={Images.EstrogenBothHand} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            top: responsiveHeight(2),
            right: responsiveWidth(20),
            width: responsiveWidth(28),
            aspectRatio: 1.45,
            transform: [{ rotate: "340deg" }],
          }}
        >
          <Image 
            source={Images.LHCharacterBothHand} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: responsiveHeight(8),
            right: responsiveWidth(-3),
            width: responsiveWidth(30),
            aspectRatio: 1.195,

          }}
        >
          <Image 
            source={Images.TestosteroneBothHand} 
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
              <View style={{
                width: responsiveWidth(85),
                height: responsiveHeight(8),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaskedView
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  maskElement={
                    <Text style={{
                      fontFamily: 'NotoSerif600',
                      fontSize: responsiveFontSize(3.4), //24px
                      fontFamily: "Inter600",
                      textAlign: 'center',
                      lineHeight: responsiveHeight(4),
                      backgroundColor: 'transparent'
                    }}>
                      {firstTitle}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                  />
                </MaskedView>
              </View>
            </View>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize(1.98), //14px
                fontFamily: "Inter400",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {subText}
            </Text>
            <CustomLoadingSpinner />
          </>
        )}
        {step === 1 && (
          <>
            <View style={{ marginBottom: 8 }}>
              <View style={{
                width: responsiveWidth(85),
                height: responsiveHeight(8),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaskedView
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  maskElement={
                    <Text style={{
                      fontFamily: 'NotoSerif600',
                      fontSize: responsiveFontSize(3.4), //24px
                      fontFamily: "Inter600",
                      textAlign: 'center',
                      lineHeight: responsiveHeight(4),
                      backgroundColor: 'transparent'
                    }}>
                      {secondTitle}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                  />
                </MaskedView>
              </View>
            </View>
            <Text
              style={{
                color: "#000",
                fontSize: responsiveFontSize(1.98), //14px
                fontFamily: "Inter400", 
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {subText}
            </Text>
            <CustomLoadingSpinner />
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
              <View style={{
                width: responsiveWidth(85),
                height: responsiveHeight(10),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaskedView
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  maskElement={
                    <Text style={{
                      fontFamily: 'NotoSerif600',
                      fontSize: responsiveFontSize(3.4), //24px
                      textAlign: 'center',
                      lineHeight: responsiveHeight(3),
                      backgroundColor: 'transparent'
                    }}>
                      {questionTitle}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                  />
                </MaskedView>
              </View>
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
              buttonHeight={responsiveHeight(6)} // Increased height to prevent cropping
              buttonAlignment={{ justifyContent: 'center', alignItems: 'center' }}
              containerAlignment="center"
            />
          </View>
        )}
        {step === 3 && (
          <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
            <View style={{ marginBottom: 8, width: responsiveWidth(85), height: responsiveHeight(15) }}>
              <MaskedView
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                maskElement={
                  <Text style={{
                    fontFamily: 'NotoSerif600',
                    fontSize: responsiveFontSize(3.4), //24px
                    fontFamily: "Inter600",
                    textAlign: 'center',
                    lineHeight: responsiveHeight(4),
                    backgroundColor: 'transparent'
                  }}>
                    {canProceedToFinal ? finalTitle : "🔬 Almost done!\nFinalizing your\npersonalized plan..."}
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, width: '100%', height: '100%' }}
                />
              </MaskedView>
            </View>
            {!canProceedToFinal && (
              <>
                <Text
                  style={{
                    color: "#6f6f6f",
                    fontSize: responsiveFontSize(1.98), //14px
                    fontFamily: "Inter400",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Please wait while we complete your analysis
                </Text>
                <CustomLoadingSpinner />
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
            top: responsiveHeight(8),
            right: responsiveWidth(-5),
            width: responsiveWidth(30),
            aspectRatio: 1.56,
          }}
        >
          <Image 
            source={Images.ProgesteroneBothHand} 
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
            style={{
              ...(Platform.OS === 'web' && {
                backgroundColor: '#ffffff',
                borderRadius: 100,
                width: responsiveWidth(88),
                paddingVertical: responsiveHeight(1.5),
                paddingHorizontal: responsiveHeight(4),
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
                zIndex: 1000,
                position: 'relative',
              })
            }}
          />
        </FixedBottomContainer>
      )}
      
      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </SafeAreaView>
  );
};

export default ResearchingScreen; 