import Images from '@/assets/images';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import apiPromiseManager from '@/services/apiPromiseManager';
import homeService, { AssignmentsResponse, CyclePhaseResponse } from '@/services/homeService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

const { height: screenHeight } = Dimensions.get('window');

const GiftBoxAnimation = require('@/assets/animation/Gift_Box_Bouncing.json');
// const MovingGlowAnimation = require('@/assets/animation/Moving_glow.json');
const MovingGlowAnimation = require('@/assets/animation/moving-purple-glow-3.json');
// const MovingGlowAnimation = require('@/assets/animation/confetti-1.json');
// const MovingGlowAnimation = require('@/assets/animation/confetti-1.json');


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
  MainScreenTabs: { 
    refreshedData?: AssignmentsResponse;
    cyclePhaseData?: CyclePhaseResponse;
    skipLoading?: boolean;
    skipTodayLoading?: boolean;
  };
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

  // State management
  const [currentPhase, setCurrentPhase] = useState<'initial' | 'white' | 'gift' | 'final'>('gift');
  const [showContent, setShowContent] = useState(false);
  const [todayAssignments, setTodayAssignments] = useState<AssignmentsResponse | null>(null);
  const [cyclePhaseData, setCyclePhaseData] = useState<CyclePhaseResponse | null>(null);
  const [unboxingFinished, setUnboxingFinished] = useState(false);
  const [showHormoneIcon, setShowHormoneIcon] = useState(false);
  const [playUnboxing, setPlayUnboxing] = useState(false);
  const [showMovingGlow, setShowMovingGlow] = useState(false);
  
  // Animation values - use useRef to persist across renders
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const unboxingFadeAnim = useRef(new Animated.Value(1)).current;
  const hormoneIconFadeAnim = useRef(new Animated.Value(0)).current;
  const hormoneIconScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Parse action object from route params
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

  const getHormoneName = (hormones: string[]) => {
    if (hormones.length > 0) {
      const hormone = hormones[0];
      return hormone.charAt(0).toUpperCase() + hormone.slice(1);
    }
    return 'Progesterone';
  };

  const getHormoneIcon = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return '💪';
      case 'progesterone': return Images.ProgesteroneBothHand;
      case 'estrogen': return Images.EstrogenBothHand;
      case 'thyroid': return Images.ThyroidBothHand;
      case 'insulin': return Images.InsulinBothHand;
      case 'cortisol': return Images.CortisolBothHand;
      case 'fsh': return '🌱';
      case 'lh': return '🌿';
      case 'prolactin': return '🤱';
      case 'ghrelin': return '🍽️';
      case 'testosterone': return Images.TestosteroneBothHand;
      default: return '💊';
    }
  };

  const callBackgroundAPIs = async () => {
    try {
      if (!action?.id) {
        return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
      }

      const completeSuccess = await homeService.completeAssignment(action.id);
      
      if (completeSuccess) {
        const [refreshedAssignments, refreshedCyclePhase] = await Promise.all([
          homeService.getTodayAssignments(),
          homeService.getCyclePhase()
        ]);
        
        if (refreshedAssignments) {
          setTodayAssignments(refreshedAssignments);
        }

        if (refreshedCyclePhase) {
          setCyclePhaseData(refreshedCyclePhase);
        }

        return { 
          success: true, 
          assignmentCompleted: true, 
          todayAssignments: refreshedAssignments,
          cyclePhaseData: refreshedCyclePhase
        };
      } else {
        return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
      }
    } catch (error) {
      return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
    }
  };

  useEffect(() => {
    // Call API immediately in background, no blank screens
    if (action?.id) {
      const apiPromise = callBackgroundAPIs();
      apiPromiseManager.setActivePromise(action.id, apiPromise);
    }
  }, [action?.id]);

  // Show moving glow 500ms after unboxing animation starts
  useEffect(() => {
    if (playUnboxing) {
      console.log('🎁 Unboxing started, starting 500ms delay for moving glow');
      const timer = setTimeout(() => {
        console.log('✨ 500ms passed, showing moving glow');
        setShowMovingGlow(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [playUnboxing]);

  // 2-second delay for hormone icon
  useEffect(() => {
    if (playUnboxing) {
      console.log('✨ Unboxing finished, starting 2-second delay');
      const timer = setTimeout(() => {
        console.log('⏰ 2 seconds passed, showing hormone icon');
        setShowHormoneIcon(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [playUnboxing]);

  // Animate hormone icon when it appears
  useEffect(() => {
    console.log('🔄 Animation effect triggered. showHormoneIcon:', showHormoneIcon);
    
    if (showHormoneIcon) {
      console.log('🎯 Starting hormone icon animation');
      
      hormoneIconFadeAnim.setValue(0);
      hormoneIconScaleAnim.setValue(0.8);
      
      Animated.parallel([
        Animated.timing(hormoneIconFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(hormoneIconScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('✅ Hormone icon animation completed');
      });
    }
  }, [showHormoneIcon]);

  const handleContinue = () => {
    if (todayAssignments && cyclePhaseData) {
      navigation.navigate('MainScreenTabs', { 
        refreshedData: todayAssignments,
        cyclePhaseData: cyclePhaseData,
        skipLoading: true 
      });
    } else if (todayAssignments) {
      navigation.navigate('MainScreenTabs', { 
        refreshedData: todayAssignments,
        skipTodayLoading: true 
      });
    } else {
      navigation.navigate('MainScreenTabs', {});
    }
  };

  if (currentPhase === 'initial') {
    return <View style={styles.initialContainer} />;
  }

  if (currentPhase === 'white') {
    return <View style={styles.whiteContainer} />;
  }

  if (currentPhase === 'gift') {
    return (
      <View style={styles.giftContainer}>
        <View style={styles.giftAnimationContainer}>
          <LottieView
            source={GiftBoxAnimation}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
        
        <Text style={styles.tapToUnlockText}>Tap to unlock your gift!</Text>
        
        <TouchableOpacity 
          style={styles.touchArea}
          onPress={() => {
            setCurrentPhase('final');
            setShowContent(true);
            setPlayUnboxing(true); // Start unboxing animation
          }}
          activeOpacity={0.8}
        >
          <View style={styles.touchOverlay} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        {/* Moving Glow appears 500ms after unboxing animation starts */}
        {showMovingGlow && (
          <View style={[styles.movingGlowAnimation, { pointerEvents: 'none' }]}>
            <LottieView
              source={MovingGlowAnimation}
              autoPlay
              loop={true}
              resizeMode="cover"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </View>
        )}
        
        {/* Only show unboxing animation when playUnboxing is true */}
        {playUnboxing && (
          <Animated.View style={[styles.giftUnboxingAnimation, { opacity: unboxingFadeAnim }]}>
            <LottieView
              source={GiftUnboxingAnimation}
              autoPlay
              loop={false}
              style={styles.giftUnboxingAnimation}
              onAnimationFinish={() => {
                console.log('🎁 Unboxing animation finished');
                setUnboxingFinished(true);
                
                // Fade out the unboxing animation
                Animated.timing(unboxingFadeAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              }}
            />
          </Animated.View>
        )}
      </View>

      {showHormoneIcon && action?.hormones && action.hormones.length > 0 && (
        <View style={styles.hormoneIconOverlay}>
          {typeof getHormoneIcon(action.hormones[0]) === 'string' ? (
            <Animated.Text 
              style={[
                styles.hormoneIconEmoji,
                {
                  opacity: hormoneIconFadeAnim,
                  transform: [{ scale: hormoneIconScaleAnim }],
                }
              ]}
            >
              {getHormoneIcon(action.hormones[0])}
            </Animated.Text>
          ) : (
            <Animated.Image 
              source={getHormoneIcon(action.hormones[0])} 
              style={[
                styles.hormoneIconImage,
                {
                  opacity: hormoneIconFadeAnim,
                  transform: [{ scale: hormoneIconScaleAnim }],
                }
              ]}
              resizeMode="contain"
            />
          )}
        </View>
      )}

      {/* Text appears when hormone icon (character) appears */}
      {showHormoneIcon && (
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
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

      {/* Button appears when hormone icon (character) appears */}
      {showHormoneIcon && (
        <>
          {/* Gradient background - lower z-index */}
          <View style={styles.buttonContainer}>
            <FixedBottomContainer containerStyle={styles.buttonGradientContainer}>
              <View />
            </FixedBottomContainer>
          </View>
          {/* Button content - highest z-index */}
          <View style={styles.buttonContent}>
            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initialContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Changed from purple to white
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  lottieAnimation: {
    width: responsiveWidth(50),
    height: responsiveWidth(50),
  },
  tapToUnlockText: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'Inter400',
    color: '#000000',
    textAlign: 'center',
    opacity: 1,
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
    flex: 1,
  },
  movingGlowAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    opacity: 0.3,
    zIndex: 1,
  },
  giftUnboxingAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  hormoneIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    pointerEvents: 'none',
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
    paddingTop: responsiveHeight(15),
    zIndex: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0, // Lower than movingGlowAnimation (5) so gradient background is behind it
  },
  buttonGradientContainer: {
    zIndex: 0, // Lower than movingGlowAnimation (5) so gradient background is behind it
  },
  buttonContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Highest z-index so button is always clickable and on top
    paddingBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(6),
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: responsiveHeight(50),
  },
  hormoneIconEmoji: {
    fontSize: responsiveFontSize(5),
    textAlign: 'center',
    lineHeight: responsiveFontSize(5),
    includeFontPadding: false,
  },
  hormoneIconImage: {
    width: responsiveWidth(45),
    height: responsiveHeight(40),
  },
  title: {
    fontSize: responsiveFontSize(3.12),
    fontFamily: 'NotoSerif600',
    color: '#000000',
    textAlign: 'center',
    lineHeight: responsiveHeight(3.9),
    marginBottom: responsiveHeight(2.5),
  },
  subtitle: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#404040',
    textAlign: 'center',
    lineHeight: responsiveHeight(2.1),
  },
});

export default ActionCompletedScreen;