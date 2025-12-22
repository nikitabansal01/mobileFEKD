import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuvraCharacter from '../../components/AuvraCharacter';

/**
 * Loading screen shown after signup.
 * 
 * Waits for session link to complete before navigating to HomeScreen.
 * This ensures HomeScreen fetches data AFTER the user's recommendations are ready.
 * 
 * Flow:
 * 1. LoginBottomSheet calls session link API and sets 'session_link_complete' flag
 * 2. This screen polls for the flag (no API calls, just local storage check)
 * 3. Once flag is set, navigate to HomeScreen
 * 4. HomeScreen makes 1 API call to fetch data (now ready)
 */
const SignupLoadingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [statusMessage, setStatusMessage] = useState('Setting up your account...');
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the character
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // Wait for session link to complete, then navigate
  useEffect(() => {
    let isMounted = true;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;

    const navigateToHome = async () => {
      if (hasNavigated.current || !isMounted) return;
      hasNavigated.current = true;

      // Clear all timers
      if (checkInterval) clearInterval(checkInterval);
      if (progressTimer) clearInterval(progressTimer);
      if (maxWaitTimeout) clearTimeout(maxWaitTimeout);

      // Show success message
      setProgress(100);
      setStatusMessage('Your plan is ready! 🎉');

      // Clear flags
      await AsyncStorage.multiRemove(['fresh_signup_pending_refresh', 'session_link_complete']);

      // Small delay to show success message
      setTimeout(() => {
        if (isMounted) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainScreenTabs' }],
            })
          );
        }
      }, 500);
    };

    // Check if session link is complete (no API calls, just local storage)
    const checkSessionLinkComplete = async () => {
      if (hasNavigated.current) return;
      
      const isComplete = await AsyncStorage.getItem('session_link_complete');
      if (isComplete === 'true') {
        console.log('✅ Session link complete, navigating to HomeScreen');
        navigateToHome();
      }
    };

    // Progress animation
    let progressValue = 0;
    const messages = [
      { threshold: 20, message: 'Linking your survey data...' },
      { threshold: 50, message: 'Creating your personalized plan...' },
      { threshold: 80, message: 'Almost ready...' },
    ];

    progressTimer = setInterval(() => {
      if (hasNavigated.current || !isMounted) return;
      
      progressValue = Math.min(progressValue + 5, 95);
      setProgress(progressValue);
      
      const currentMessage = messages.find(m => progressValue <= m.threshold);
      if (currentMessage) {
        setStatusMessage(currentMessage.message);
      }
    }, 200);

    // Check every 300ms if session link is complete
    checkInterval = setInterval(checkSessionLinkComplete, 300);

    // Max wait of 30 seconds, then navigate anyway
    // Session link can take 15+ seconds for recommendation generation
    maxWaitTimeout = setTimeout(() => {
      console.log('⚠️ Max wait time reached, navigating anyway');
      navigateToHome();
    }, 30000);

    // Initial check
    checkSessionLinkComplete();

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (progressTimer) clearInterval(progressTimer);
      if (maxWaitTimeout) clearTimeout(maxWaitTimeout);
    };
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#F8F6FF', '#FFF5F8', '#F0F4FF']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Auvra Character */}
        <Animated.View style={[styles.characterContainer, { transform: [{ scale: pulseAnim }] }]}>
          <AuvraCharacter size={responsiveWidth(40)} />
        </Animated.View>

        {/* Status Message */}
        <Text style={styles.statusText}>{statusMessage}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <LinearGradient
              colors={['#A29AEA', '#C17EC9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Loading Indicator */}
        <ActivityIndicator size="large" color="#C17EC9" style={styles.loader} />

        {/* Sub-message */}
        <Text style={styles.subText}>
          We're crafting a personalized hormone balance plan just for you
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(8),
  },
  characterContainer: {
    marginBottom: responsiveHeight(4),
  },
  statusText: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'NotoSerif600',
    color: '#333',
    textAlign: 'center',
    marginBottom: responsiveHeight(3),
  },
  progressContainer: {
    width: responsiveWidth(70),
    alignItems: 'center',
    marginBottom: responsiveHeight(3),
  },
  progressBackground: {
    width: '100%',
    height: responsiveHeight(1),
    backgroundColor: 'rgba(162, 154, 234, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter500',
    color: '#666',
    marginTop: responsiveHeight(1),
  },
  loader: {
    marginBottom: responsiveHeight(3),
  },
  subText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#666',
    textAlign: 'center',
    lineHeight: responsiveFontSize(2.5),
    paddingHorizontal: responsiveWidth(5),
  },
});

export default SignupLoadingScreen;
