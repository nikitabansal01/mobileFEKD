import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import { userScopedAsyncStorage } from '@/src/core/storage/userScopedAsyncStorage';
import AuvraCharacter from '../../components/AuvraCharacter';
import PrimaryButton from '../../components/PrimaryButton';
import sessionService from '../../services/sessionService';

/**
 * SignupLoadingScreen - REDESIGNED
 * 
 * This screen ONLY waits for session link to complete (5-10 seconds max).
 * It does NOT wait for the action plan to be generated.
 * 
 * The action plan continues generating in the background while the user
 * is taken to HomeScreen. HomeScreen handles the "plan not ready" state
 * with appropriate UI feedback.
 * 
 * Flow:
 * 1. LoginBottomSheet starts session link API call
 * 2. This screen polls for 'session_link_complete' flag (local storage only)
 * 3. Once session is linked, navigate to HomeScreen immediately
 * 4. HomeScreen shows "plan generating" state if plan isn't ready yet
 * 5. HomeScreen polls and auto-refreshes when plan becomes available
 * 
 * This eliminates the 60-120 second wait that was blocking users.
 */
const SignupLoadingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [statusMessage, setStatusMessage] = useState('Setting up your account...');
  const [progress, setProgress] = useState(0);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);
  const startedAtMsRef = useRef<number>(Date.now());

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
  }, [fadeAnim, pulseAnim]);

  // Claim is awaited here. It is never a detached background operation: a
  // retry uses the preserved device-only proof after a network/server failure.
  useEffect(() => {
    let isMounted = true;

    const navigateToHome = async () => {
      if (hasNavigated.current || !isMounted) return;
      hasNavigated.current = true;

      // Log timing for post-auth flow (signup/login)
      try {
        const postAuthFlow = await userScopedAsyncStorage.getItem('post_auth_flow');
        const postAuthStartedMsStr = await userScopedAsyncStorage.getItem('post_auth_started_ms');
        const linkCompletedMsStr = await userScopedAsyncStorage.getItem('session_link_completed_ms');
        const linkDurationMsStr = await userScopedAsyncStorage.getItem('session_link_duration_ms');

        const now = Date.now();
        const screenMs = now - startedAtMsRef.current;
        const postAuthMs = postAuthStartedMsStr ? now - parseInt(postAuthStartedMsStr, 10) : null;

        console.log(
          `⏱️ [SignupLoadingScreen] flow=${postAuthFlow ?? 'unknown'} screen_wait=${screenMs}ms ` +
          `post_auth_to_now=${postAuthMs ?? 'n/a'}ms session_link_completed_ms=${linkCompletedMsStr ?? 'n/a'} ` +
          `session_link_duration_ms=${linkDurationMsStr ?? 'n/a'}`
        );
      } catch {
        // ignore
      }

      // Show success message
      setProgress(100);
      setStatusMessage('Welcome to Auvra! 🎉');

      // Retain the user-scoped completion record. It prevents a second account
      // from observing this account's completed setup after an account switch.
      await userScopedAsyncStorage.removeItem('fresh_signup_pending_refresh');
      
      // Set flag to indicate this is a fresh signup - HomeScreen will show generating UI
      await userScopedAsyncStorage.setItem('plan_generating_in_background', 'true');

      // Small delay to show success message
      setTimeout(() => {
        if (isMounted) {
          // Determine if this flow was a *signup* (new user) vs login
          // HomeScreen will use this for more specific perf logs.
          userScopedAsyncStorage.getItem('post_auth_flow').then((flow) => {
            const freshSignup = flow === 'signup';
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainScreenTabs', params: { freshSignup, planGenerating: true } }],
              })
            );
          });

        }
      }, 500);
    };

    // Cosmetic progress is bounded below completion and does not imply success.
    let progressValue = 0;
    const messages = [
      { threshold: 30, message: 'Linking your account...' },
      { threshold: 60, message: 'Setting up your profile...' },
      { threshold: 90, message: 'Almost there...' },
    ];

    const progressTimer = setInterval(() => {
      if (hasNavigated.current || !isMounted) return;

      // Faster progress since session link takes ~5-10s, not 60-120s
      progressValue = Math.min(progressValue + 8, 95);
      setProgress(progressValue);

      const currentMessage = messages.find(m => progressValue <= m.threshold);
      if (currentMessage) {
        setStatusMessage(currentMessage.message);
      }
    }, 150);

    const claim = async () => {
      setLinkError(null);
      try {
        const completed = await sessionService.completeSignup();
        if (!completed) throw new Error('Please return to signup and explicitly accept the required consent documents.');
        if (isMounted) await navigateToHome();
      } catch (error: any) {
        if (isMounted) {
          setLinkError(error?.message || 'We could not link your questionnaire. Your answers are safe; please try again.');
          setStatusMessage('Account setup needs your attention');
        }
      }
    };
    void claim();

    return () => {
      isMounted = false;
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [attempt, navigation]);

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
        {linkError ? (
          <View style={styles.retryContainer}>
            <Text accessibilityRole="alert" style={styles.errorText}>{linkError}</Text>
            <PrimaryButton title="Try again" onPress={() => setAttempt((value) => value + 1)} />
          </View>
        ) : <ActivityIndicator size="large" color="#C17EC9" style={styles.loader} />}

        {/* Sub-message */}
        <Text style={styles.subText}>
          We&apos;re crafting a personalized hormone balance plan just for you
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
  retryContainer: {
    width: responsiveWidth(75),
    marginBottom: responsiveHeight(3),
    gap: responsiveHeight(1.5),
  },
  errorText: {
    fontFamily: 'Inter400',
    color: '#9B2C2C',
    textAlign: 'center',
    fontSize: responsiveFontSize(1.6),
    lineHeight: responsiveFontSize(2.2),
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
