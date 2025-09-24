import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import apiPromiseManager from '@/services/apiPromiseManager';
import homeService, { AssignmentsResponse, CyclePhaseResponse } from '@/services/homeService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

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
  HomeScreen: { 
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
  const [currentPhase, setCurrentPhase] = useState<'initial' | 'white' | 'gift' | 'final'>('initial');
  const [showContent, setShowContent] = useState(false);
  const [todayAssignments, setTodayAssignments] = useState<AssignmentsResponse | null>(null);
  const [cyclePhaseData, setCyclePhaseData] = useState<CyclePhaseResponse | null>(null);
  const [unboxingFinished, setUnboxingFinished] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

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

  /**
   * Get hormone name from hormones array (uses first hormone)
   * @param hormones - Array of hormone names
   * @returns Capitalized hormone name or default 'Progesterone'
   */
  const getHormoneName = (hormones: string[]) => {
    if (hormones.length > 0) {
      const hormone = hormones[0];
      return hormone.charAt(0).toUpperCase() + hormone.slice(1);
    }
    return 'Progesterone';
  };

  /**
   * Call background APIs to complete assignment and refresh data
   * @returns Promise with API call results
   */
  const callBackgroundAPIs = async () => {
    try {
      if (!action?.id) {
        return { success: false, assignmentCompleted: false, todayAssignments: null, cyclePhaseData: null };
      }

      // Complete assignment
      const completeSuccess = await homeService.completeAssignment(action.id);
      
      if (completeSuccess) {
        // Refresh assignments and cycle phase data in parallel
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
    // Phase transitions and API call setup
    const timer1 = setTimeout(() => {
      setCurrentPhase('white');
      
      // Register API promise for background processing
      if (action?.id) {
        const apiPromise = callBackgroundAPIs();
        apiPromiseManager.setActivePromise(action.id, apiPromise);
      }
    }, 1000);

    const timer2 = setTimeout(() => {
      setCurrentPhase('gift');
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [action?.id]);

  /**
   * Handle continue button press - navigate to HomeScreen with appropriate data
   */
  const handleContinue = () => {
    if (todayAssignments && cyclePhaseData) {
      // Both APIs completed - pass full data
      navigation.navigate('HomeScreen', { 
        refreshedData: todayAssignments,
        cyclePhaseData: cyclePhaseData,
        skipLoading: true 
      });
    } else if (todayAssignments) {
      // Only Today API completed - pass partial data
      navigation.navigate('HomeScreen', { 
        refreshedData: todayAssignments,
        skipTodayLoading: true 
      });
    } else {
      // APIs still in progress or failed - let HomeScreen handle promise
      navigation.navigate('HomeScreen', {});
    }
  };

  // Initial purple background phase
  if (currentPhase === 'initial') {
    return (
      <View style={styles.initialContainer}>
      </View>
    );
  }

  // White background phase (animation waiting)
  if (currentPhase === 'white') {
    return (
      <View style={styles.whiteContainer}>
      </View>
    );
  }

  // Gift phase (waiting for touch)
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
        
        <Text style={styles.tapToUnlockText}>Tap to unlock your gift!</Text>
        
        {/* Touch area for phase transition */}
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

  // Final phase with animations and content
  return (
    <View style={styles.container}>
      {/* Background animations */}
      <View style={styles.backgroundContainer}>
        {/* Moving Glow animation - only shown after unboxing finishes */}
        {unboxingFinished && (
          <LottieView
            source={MovingGlowAnimation}
            autoPlay
            loop={false}
            style={styles.movingGlowAnimation}
          />
        )}
        {/* Gift Unboxing animation - always shown (maintains last frame) */}
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

      {/* Main content - only shown after unboxing finishes */}
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
          {/* Text section */}
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

      {/* Bottom button - only shown after unboxing finishes */}
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
  // Initial purple background
  initialContainer: {
    flex: 1,
    backgroundColor: '#DDC2E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // White background
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gift phase container
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
    width: responsiveWidth(50),
    height: responsiveWidth(50),
  },

  tapToUnlockText: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'Inter400',
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

  // Final phase container
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(10),
    paddingTop: responsiveHeight(15),
  },

  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: responsiveHeight(50),
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
