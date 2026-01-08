import Images from "@/assets/images";
import FixedBottomContainer from "@/components/FixedBottomContainer";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import PrimaryButton from "@/components/PrimaryButton";
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from "@/config/firebase";
import sessionService from "@/services/sessionService";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Platform, Text, View } from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { SafeAreaView } from "react-native-safe-area-context";

// Route params type
type ResearchingScreenParams = {
  lifestyleFocus?: string[];
};

const firstTitle = "🔍 Researching 25000\nresearch papers...";
const secondTitle = "🎁 Personalizing based\non your needs";
const subText = "Crafting your unique action plan,\npersonalized to the whole you";

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
  const route = useRoute<RouteProp<{ params: ResearchingScreenParams }, 'params'>>();
  
  // Get lifestyle focus from route params (set by ResultLoadingScreen)
  const lifestyleFocus = route.params?.lifestyleFocus || [];
  
  // Steps: 0: first animation, 1: second animation, 2: completion screen
  // (Question step removed - now handled by ResultLoadingScreen)
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [recommendationStatus, setRecommendationStatus] = useState<string>('pending');
  const [canProceedToFinal, setCanProceedToFinal] = useState(false); // API completion status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // User login status
  const [hasStartedRecommendation, setHasStartedRecommendation] = useState(false); // Recommendation generation start status
  const [authChecked, setAuthChecked] = useState(false); // Auth state check status
  
  // Use refs for interval to avoid state update loops
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Log the lifestyle focus received
  useEffect(() => {
    console.log('🎯 [ResearchingScreen] Received lifestyle focus from ResultLoadingScreen:', lifestyleFocus);
  }, []);

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

  // Helper function to start recommendation generation
  const startRecommendationGeneration = async () => {
    if (hasStartedRecommendation) return;
    
    try {
      console.log('🚀 [ResearchingScreen] Starting recommendation generation with lifestyle_focus:', lifestyleFocus);
      
      setHasStartedRecommendation(true);
      const success = await sessionService.startRecommendationGeneration();
      if (success) {
        console.log('✅ [ResearchingScreen] Recommendation started, beginning polling');
        setRecommendationStatus('in_progress');
        startPolling();
      } else {
        console.error('❌ [ResearchingScreen] Failed to start recommendation');
        setRecommendationStatus('error');
        setCanProceedToFinal(true);
      }
    } catch (error: any) {
      if (error.message && error.message.includes('Session not found')) {
        console.log('⚠️ [ResearchingScreen] Session not found - may be logged in user');
        setCanProceedToFinal(true);
        setRecommendationStatus('completed');
        return;
      }
      
      console.error('❌ [ResearchingScreen] Recommendation start error:', error);
      setRecommendationStatus('error');
      setCanProceedToFinal(true);
    }
  };

  // START recommendations IMMEDIATELY on mount
  // Backend already has lifestyle_focus saved by ResultLoadingScreen
  // So it will generate with correct distribution!
  useEffect(() => {
    if (isUserLoggedIn || hasStartedRecommendation) return;
    
    // Start immediately - lifestyle_focus was already saved by ResultLoadingScreen
    console.log('⚡ [ResearchingScreen] Starting recommendations immediately with lifestyle_focus:', lifestyleFocus);
    startRecommendationGeneration();
  }, [isUserLoggedIn, hasStartedRecommendation]);
  
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
    }, 3500); // Check every 3.5 seconds (optimized: less API load, still responsive)
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

  // Automatic step transition: 0 (animation 1) -> 1 (animation 2) -> 2 (completion)
  // Steps are now: 0, 1, 2 (removed question step since it's in ResultLoadingScreen)
  useEffect(() => {
    if (step < 2) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 4000); // 4 seconds per animation
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-show login when animations complete AND API is done
  useEffect(() => {
    if (step === 2 && canProceedToFinal && !showLogin && !isUserLoggedIn) {
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
        {/* Step 2: Completion screen (was step 3, question step removed) */}
        {step === 2 && (
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
      
      {/* No bottom button needed - login sheet shows automatically after animations + API completion */}
      
      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </SafeAreaView>
  );
};

export default ResearchingScreen; 