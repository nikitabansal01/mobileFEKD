import Images from '@/assets/images';
import ActionPlanTimeline from '@/components/ActionPlanTimeline';
import AuvraChatModal from '@/components/AuvraChatModal';
import CalendarBottomSheet from '@/components/CalendarBottomSheet';
import DailyReviewModal from '@/components/DailyReviewModal';
import apiPromiseManager from '@/services/apiPromiseManager';
import homeService, { AssignmentsResponse, CycleInfo, HormoneStats, ProgressStatsResponse, ActionPlanResponse, ActionPlanItem, DailyReviewResponse, PendingReviewResponse, DailyReviewRequest } from '@/services/homeService';
import { rewardService, RefreshStatus, RewardsStatusResponse } from '@/services/rewardService';
// StreakAtRiskBanner removed - using one-time Alert popup instead
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  Modal,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Circle, Defs, Line, Polygon, Stop, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient } from 'react-native-svg';
import TypeActionPlan from '../../components/TypeActionPlan';
import { BRAND, BRAND_GRADIENT, TEXT, BACKGROUND, BORDER, UI, COLORS } from '@/constants/Colors';
import { FONT_INTER, FONT_SERIF, TYPOGRAPHY } from '@/constants/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * DesigningPlanOverlay
 * 
 * A full-screen overlay shown after daily review submission while the backend
 * generates the new action plan. Allows "fire-and-forget" UX.
 */
const DesigningPlanOverlay = ({ visible }: { visible: boolean }) => {
  const [loadingText, setLoadingText] = useState("Analyzing your feedback...");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Pulse animation for the logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();

      // Cycle loading text
      const texts = [
        "Analyzing your feedback...",
        "Checking cycle phase...",
        "Optimizing for your goals...",
        "Finalizing your plan...",
      ];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setLoadingText(texts[index]);
      }, 3000);

      return () => clearInterval(interval);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <StatusBar barStyle="light-content" />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View style={[styles.overlayContent, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LottieView
                source={require('../../assets/animation/auvra-character.json')}
                autoPlay
                loop
                style={styles.overlayAvatar}
              />
            </Animated.View>
          </View>

          <Text style={styles.overlayTitle}>Designing your today's action plan</Text>

          <Text style={styles.overlaySubtitle}>
            Based on your goals, cycle phase, and feedback factors...
          </Text>

          <View style={styles.loadingPill}>
            <ActivityIndicator color={BRAND.accent} size="small" style={{ marginRight: 8 }} />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};


type RootStackParamList = {
  ChatbotScreen: {
    conversationContext?: {
      initialMessage: string;
      userResponse: string;
      context: string;
    };
  };
  MainScreenTabs: {
    activeTab?: string;
    chatContext?: {
      chatId: string;
      conversationContext?: {
        initialMessage: string;
        userResponse: string;
        context: string;
      };
    };
  };
};

interface HomeScreenProps {
  route?: {
    params?: {
      refreshedData?: AssignmentsResponse;
      cyclePhaseData?: any;
      skipLoading?: boolean;
      skipTodayLoading?: boolean;
      freshSignup?: boolean;
      shouldRefresh?: boolean; // Added: trigger refetch after action replacement
    };
  };
}

const FRESH_SIGNUP_FLAG = 'fresh_signup_pending_refresh';

const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentsResponse | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [hasRetried, setHasRetried] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time');

  // Action plan state (new system)
  const [actionPlan, setActionPlan] = useState<ActionPlanResponse | null>(null);
  const [feedbackPromptSeconds, setFeedbackPromptSeconds] = useState<number>(30); // Default 30 seconds
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Refresh status for 2x plan refresh reward
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [rewardsData, setRewardsData] = useState<RewardsStatusResponse | null>(null);

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current; // For hourglass rotation
  const planSlideAnim = useRef(new Animated.Value(0)).current; // For plan reveal animation (0 = hidden, 1 = visible)
  const planScaleAnim = useRef(new Animated.Value(0.95)).current; // Slight scale for lock-break effect
  const [showPlanAnimation, setShowPlanAnimation] = useState(false); // Track if we should animate plan entrance

  // ScrollView ref for scrolling to top
  const scrollViewRef = useRef<ScrollView>(null);

  // Start/stop rotation animation when refreshing
  useEffect(() => {
    if (isRefreshingAll) {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }
  }, [isRefreshingAll]);

  // Handle shouldRefresh param from navigation (e.g., after weekly check-in completion)
  useEffect(() => {
    const instanceId = componentIdRef.current;
    if (route?.params?.shouldRefresh) {
      console.log(`🔄 [HomeScreen:${instanceId}] shouldRefresh param detected - forcing data reload`);
      // Reset the deduplication timer to allow immediate refetch
      lastFocusTimeRef.current = 0;
      dataLoadingRef.current = false;
      // Reload assignments
      const reloadData = async () => {
        try {
          console.log(`📋 [HomeScreen:${instanceId}] Reloading assignments after shouldRefresh...`);
          const assignmentsData = await homeService.getTodayAssignments();
          if (assignmentsData) {
            console.log(`✅ [HomeScreen:${instanceId}] Reloaded ${assignmentsData.total_assignments} assignments`);
            setAssignments(assignmentsData);
            if (assignmentsData?.hormone_stats) {
              setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
            }
            wireUpActionPlan(assignmentsData);
          }
        } catch (error) {
          console.error(`❌ [HomeScreen:${instanceId}] Failed to reload after refresh:`, error);
        }
      };
      reloadData();
    }
  }, [route?.params?.shouldRefresh]);

  // Auvra chat modal state
  const [showAuvraChat, setShowAuvraChat] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Daily Review modal state (next-day review system)
  const [showDailyReview, setShowDailyReview] = useState(false);
  const [pendingReviewData, setPendingReviewData] = useState<PendingReviewResponse | null>(null);
  const [isTodayDataReady, setIsTodayDataReady] = useState(false); // Track if today's data is loaded after review
  const dailyReviewCheckedRef = useRef<boolean>(false); // Prevent duplicate checks per session
  const reviewSubmissionInProgressRef = useRef<boolean>(false); // Prevent re-fetch during submission
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const freshSignupCheckRef = useRef<boolean>(false);
  const initialDataLoadedRef = useRef<boolean>(false); // Prevent duplicate initial fetches

  // Note: Fresh signup data loading is now handled by SignupLoadingScreen
  // which waits until data is ready before navigating to HomeScreen

  // STATE FOR FIRE-AND-FORGET SUBMISSION
  const [isDesigningPlan, setIsDesigningPlan] = useState(false);


  // Disable swipe back gesture to prevent interference with scrolling
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );

  // State to track if review is blocking data load
  const [isReviewBlocking, setIsReviewBlocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false); // For lock break animation
  const lockOpacity = useRef(new Animated.Value(1)).current;
  const lockScale = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current; // 0 = hidden/down, 1 = visible/up

  // Track if we've already loaded data for this focus event to prevent duplicates
  const dataLoadingRef = useRef<boolean>(false);
  const lastFocusTimeRef = useRef<number>(0);
  const loadCallIdRef = useRef<number>(0); // Unique ID for each load call to detect stale calls
  const componentIdRef = useRef<string>(Math.random().toString(36).substring(7)); // Unique ID for this component instance

  // Refs to track state for useFocusEffect (avoids stale closure and dependency issues)
  const showDailyReviewRef = useRef(showDailyReview);
  const isReviewBlockingRef = useRef(isReviewBlocking);

  // Keep refs in sync with state
  useEffect(() => {
    showDailyReviewRef.current = showDailyReview;
    isReviewBlockingRef.current = isReviewBlocking;

    // CRITICAL: If review becomes active, immediately hide AuvraChatModal and clear timer
    if (isReviewBlocking || showDailyReview) {
      setShowAuvraChat(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  }, [isReviewBlocking, showDailyReview]);

  // Auto-trigger unlock animation when today's data becomes ready (modal already closed)
  useEffect(() => {
    const instanceId = componentIdRef.current;
    if (isTodayDataReady && isReviewBlocking && !showDailyReview) {
      console.log(`🔓 [HomeScreen:${instanceId}] Today data ready and modal closed - triggering unlock animation`);

      // Trigger Lock Break Animation
      setIsUnlocking(true);
      setIsReviewBlocking(false);

      Animated.parallel([
        Animated.timing(lockScale, {
          toValue: 2.5,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(lockOpacity, {
          toValue: 0,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsUnlocking(false);
        lockScale.setValue(1);
        lockOpacity.setValue(1);

        Animated.spring(planSlideAnim, {
          toValue: 1,
          friction: 4,
          tension: 20,
          useNativeDriver: true,
        }).start(() => {
          setShowPlanAnimation(false);
          setIsTodayDataReady(false);
        });
      });
    }
  }, [isTodayDataReady, isReviewBlocking, showDailyReview]);

  // Always refetch data when screen gains focus (e.g., after action replacement, completion, etc.)
  // IMPORTANT: Check for pending review FIRST - if review is pending, don't load assignments yet
  // CRITICAL: Use synchronous flag check BEFORE any async operations to prevent duplicate calls
  useFocusEffect(
    React.useCallback(() => {
      // SYNCHRONOUS GUARD: Check and set flag immediately to prevent race conditions
      const now = Date.now();
      const instanceId = componentIdRef.current;

      // STRICT DEDUPLICATION: If last call was within 500ms, always skip
      // This handles React's potential double-invocation
      if (now - lastFocusTimeRef.current < 500) {
        console.log(`🔄 [HomeScreen:${instanceId}] Skipped - within 500ms dedup window`);
        return;
      }

      // Skip if already loading (check FIRST, before any async operations)
      if (dataLoadingRef.current) {
        console.log(`🔄 [HomeScreen:${instanceId}] Skipped - already loading`);
        return;
      }

      // Prevent duplicate calls within 2 seconds (after the initial load)
      if (initialDataLoadedRef.current && now - lastFocusTimeRef.current < 2000) {
        console.log(`🔄 [HomeScreen:${instanceId}] Skipped - within 2s dedup window`);
        return;
      }

      // Skip if daily review modal is already showing - prevents loops and duplicate checks
      if (showDailyReviewRef.current) {
        console.log(`🔄 [HomeScreen:${instanceId}] Skipped - review modal showing`);
        return;
      }

      // Skip if a review submission is in progress
      if (reviewSubmissionInProgressRef.current) {
        console.log(`🔄 [HomeScreen:${instanceId}] Skipped - review submission in progress`);
        return;
      }

      // SET FLAGS IMMEDIATELY (synchronously) before any async work
      dataLoadingRef.current = true;
      lastFocusTimeRef.current = now;
      const thisCallId = ++loadCallIdRef.current; // Increment to get unique ID for this call
      const focusLoadStartMs = now;
      console.log(`🔄 [HomeScreen:${instanceId}] Loading data (callId: ${thisCallId}, time: ${new Date(now).toISOString().substr(11, 12)})`);

      const loadDataAfterReviewCheck = async () => {
        const stepTimings: Record<string, number> = {};
        // CROSS-INSTANCE DEDUPLICATION: Check if another instance loaded very recently
        try {
          const lastGlobalLoad = await AsyncStorage.getItem('homescreen_last_load');
          if (lastGlobalLoad) {
            const lastLoadTime = parseInt(lastGlobalLoad, 10);
            if (now - lastLoadTime < 1000) {
              console.log(`⏭️ [HomeScreen:${instanceId}] Skipped - another instance loaded ${now - lastLoadTime}ms ago`);
              dataLoadingRef.current = false;
              return;
            }
          }
          // Mark this load globally
          await AsyncStorage.setItem('homescreen_last_load', now.toString());
        } catch (e) {
          // AsyncStorage error - continue anyway
        }

        // Check if this call has been superseded by a newer one
        if (loadCallIdRef.current !== thisCallId) {
          console.log(`⏭️ [HomeScreen:${instanceId}] Stale call (callId: ${thisCallId}), skipping`);
          return;
        }

        try {
          // STEP 1: Check for pending review FIRST
          console.log(`📋 [HomeScreen:${instanceId}] Checking pending review...`);
          const tReviewStart = Date.now();
          const reviewResponse = await homeService.getPendingReview();
          stepTimings.pendingReviewMs = Date.now() - tReviewStart;

          // Double-check we're still the active call after await
          if (loadCallIdRef.current !== thisCallId) {
            console.log(`⏭️ [HomeScreen:${instanceId}] Stale after getPendingReview (callId: ${thisCallId})`);
            return;
          }

          const hasReview = reviewResponse?.needs_review && reviewResponse?.plan_id;
          console.log(`✅ [HomeScreen:${instanceId}] Review check: ${hasReview ? 'PENDING' : 'none'}`);

          if (hasReview) {
            console.log(`📋 [HomeScreen:${instanceId}] Showing review modal for plan ${reviewResponse.plan_id}`);
            setPendingReviewData(reviewResponse);
            setIsReviewBlocking(true);
            setShowDailyReview(true);
          }

          // Always load data (cycle, assignments, rewards)
          console.log(`📋 [HomeScreen:${instanceId}] Loading cycle + assignments + rewards...`);
          const isReviewPending = !!hasReview;

          let cycleMs = 0;
          let assignmentsMs = 0;
          let rewardsMs = 0;

          const cycleStart = Date.now();
          const cyclePromise = homeService.getCyclePhase().finally(() => {
            cycleMs = Date.now() - cycleStart;
          });

          const assignmentsStart = Date.now();
          const assignmentsPromise = (isReviewPending
            ? Promise.resolve(null)
            : homeService.getTodayAssignments().catch(() => null)
          ).finally(() => {
            assignmentsMs = Date.now() - assignmentsStart;
          });

          const rewardsStart = Date.now();
          const rewardsPromise = rewardService.getRewardsStatus().catch(() => null).finally(() => {
            rewardsMs = Date.now() - rewardsStart;
          });

          const [cycleData, assignmentsData, rewardsData] = await Promise.all([
            cyclePromise,
            assignmentsPromise,
            rewardsPromise,
          ]);

          stepTimings.cycleMs = cycleMs;
          stepTimings.assignmentsMs = assignmentsMs;
          stepTimings.rewardsMs = rewardsMs;

          // Final check that we're still the active call
          if (loadCallIdRef.current !== thisCallId) {
            console.log(`⏭️ [HomeScreen:${instanceId}] Stale after data load (callId: ${thisCallId})`);
            return;
          }

          setCycleInfo(cycleData?.cycle_info || null);

          // If we got assignments, use them; otherwise use pending review items if available
          if (assignmentsData) {
            console.log(`✅ [HomeScreen:${instanceId}] Got ${assignmentsData.total_assignments} assignments`);

            // Post-auth (signup/login) end-to-end timing: from auth completion to plan fetch
            try {
              const postAuthFlow = await AsyncStorage.getItem('post_auth_flow');
              const postAuthStartedMsStr = await AsyncStorage.getItem('post_auth_started_ms');
              if (postAuthStartedMsStr) {
                const nowMs = Date.now();
                const postAuthToAssignmentsMs = nowMs - parseInt(postAuthStartedMsStr, 10);
                const planSource = (assignmentsData as any)?.plan_source ?? (assignmentsData as any)?.timings_ms?.plan_source;
                const serverTotalMs = (assignmentsData as any)?.timings_ms?.server_total_ms;
                const serverGeneratorMs = (assignmentsData as any)?.timings_ms?.server_generator_call_ms;
                const planGenMs = (assignmentsData as any)?.plan_generation_time_ms ?? (assignmentsData as any)?.timings_ms?.plan_generation_time_ms;

                console.log(
                  `⏱️ [HomeScreen:${instanceId}] post_auth_to_assignments=${postAuthToAssignmentsMs}ms flow=${postAuthFlow ?? 'unknown'} ` +
                  `plan_source=${planSource ?? 'n/a'} server_total=${serverTotalMs ?? 'n/a'}ms server_generator=${serverGeneratorMs ?? 'n/a'}ms plan_generation=${planGenMs ?? 'n/a'}ms`
                );

                // Clear after first successful plan fetch to avoid noisy logs on later opens
                await AsyncStorage.multiRemove(['post_auth_flow', 'post_auth_started_ms', 'session_link_completed_ms', 'session_link_duration_ms']);
              }
            } catch (e) {
              // ignore
            }

            // Log backend-provided timings when available (helps differentiate fetch vs generate)
            const serverTiming = (assignmentsData as any)?.timings_ms;
            if (serverTiming) {
              console.log(`⏱️ [HomeScreen:${instanceId}] Backend timings_ms:`, serverTiming);
            }

            setAssignments(assignmentsData);
            if (assignmentsData?.hormone_stats) {
              setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
            }
            if (assignmentsData) {
              wireUpActionPlan(assignmentsData);
            }
          } else if (reviewResponse?.items && reviewResponse.items.length > 0) {
            // Use pending review items as display data when assignments blocked
            console.log(`📋 [HomeScreen:${instanceId}] Using ${reviewResponse.items.length} review items for display`);
            const reviewItems = reviewResponse.items.map((item, index) => ({
              slot: index + 1,
              title: item.title,
              time_of_day: item.time_slot || 'Morning',
              completed: item.is_completed || false,
              replaced: false,
              skipped: false,
              category: item.category || 'exercise',
            }));
            setAssignments({
              plan_id: reviewResponse.plan_id,
              date: reviewResponse.review_date,
              items: reviewItems,
            } as any);
          }

          setRewardsData(rewardsData || null);
          if (rewardsData?.refresh_status) {
            setRefreshStatus(rewardsData.refresh_status);
          }

          setLoading(false);
          initialDataLoadedRef.current = true;

          const totalLoadMs = Date.now() - focusLoadStartMs;
          console.log(
            `⏱️ [HomeScreen:${instanceId}] Home load timings (callId: ${thisCallId}): total=${totalLoadMs}ms ` +
            `(pendingReview=${stepTimings.pendingReviewMs ?? 'n/a'}ms, cycle=${stepTimings.cycleMs ?? 'n/a'}ms, ` +
            `assignments=${stepTimings.assignmentsMs ?? 'n/a'}ms, rewards=${stepTimings.rewardsMs ?? 'n/a'}ms)`
          );

          // Best-effort approximation for "time to plan rendered" after state updates
          requestAnimationFrame(() => {
            const approxRenderMs = Date.now() - focusLoadStartMs;
            console.log(`🖼️ [HomeScreen:${instanceId}] Approx time-to-render=${approxRenderMs}ms (callId: ${thisCallId})`);
          });

          console.log(`✅ [HomeScreen:${instanceId}] All data loaded successfully (callId: ${thisCallId})`);
        } catch (error) {
          console.error(`❌ [HomeScreen:${instanceId}] Failed to load data:`, error);
          setLoading(false);
        } finally {
          // ALWAYS reset the loading flag when done (success or error)
          // But only if this is still the active call
          if (loadCallIdRef.current === thisCallId) {
            dataLoadingRef.current = false;
            console.log(`🔓 [HomeScreen:${instanceId}] Unlocked dataLoadingRef (callId: ${thisCallId})`);
          }
        }
      };

      loadDataAfterReviewCheck();
    }, []) // Empty dependency - focus is the trigger, not state changes
  );

  // Reset inactivity timer - Shows Auvra modal after configured seconds from backend
  // IMPORTANT: Don't show during review - user must complete review first
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Don't start timer if review is blocking or Auvra chat is already showing
    if (!showAuvraChat && !isReviewBlockingRef.current && !showDailyReviewRef.current) {
      // Use feedbackPromptSeconds from backend (default 30 seconds)
      const timeoutMs = feedbackPromptSeconds * 1000;
      inactivityTimerRef.current = setTimeout(() => {
        // Double-check using REFS (not stale state) that review isn't blocking when timer fires
        if (!isReviewBlockingRef.current && !showDailyReviewRef.current) {
          setShowAuvraChat(true);
        }
      }, timeoutMs);
    }
  };

  // Handle user interaction
  const handleUserInteraction = () => {
    // Only reset timer if Auvra chat is not showing
    // Don't hide the chat when user interacts with screen
    if (!showAuvraChat) {
      resetInactivityTimer();
    }
  };

  // Handle Auvra chat responses - Call plan satisfaction API
  const handleAuvraResponse = async (response: 'positive' | 'negative' | string) => {
    // Only handle positive responses here
    // Negative responses are now handled via handleReplaceItems (in-modal selection)
    if (response !== 'positive') return;

    setShowAuvraChat(false);

    const instanceId = componentIdRef.current;

    // If we have an action plan, call the satisfaction API
    if (actionPlan?.plan_id) {
      setIsSubmittingFeedback(true);

      try {
        // "Works for me" - mark all as liked
        const result = await homeService.submitPlanSatisfaction(
          actionPlan.plan_id,
          'works_for_me'
        );

        if (result?.success) {
          console.log(`✅ [HomeScreen:${instanceId}] Plan marked as satisfactory: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ [HomeScreen:${instanceId}] Error submitting plan satisfaction:`, error);
      } finally {
        setIsSubmittingFeedback(false);
      }
    }
  };

  // Handle in-modal replacement of selected items
  const handleReplaceItems = async (itemIds: number[]) => {
    const instanceId = componentIdRef.current;
    if (!actionPlan?.plan_id || itemIds.length === 0) return;

    setIsSubmittingFeedback(true);

    try {
      console.log(`🔄 [HomeScreen:${instanceId}] Replacing items: ${itemIds.join(', ')}`);

      // Call plan-satisfaction API with items to replace
      const result = await homeService.submitPlanSatisfaction(
        actionPlan.plan_id,
        'want_to_change',
        itemIds
      );

      if (result?.success) {
        console.log(`✅ [HomeScreen:${instanceId}] Items replaced successfully: ${result.message}`);

        // Refresh assignments to get updated data
        const updatedAssignments = await homeService.getTodayAssignments();
        if (updatedAssignments) {
          setAssignments(updatedAssignments);
          wireUpActionPlan(updatedAssignments);

          if (updatedAssignments.hormone_stats) {
            setProgressStats({ hormone_stats: convertHormoneStats(updatedAssignments.hormone_stats) });
          }
        }
      } else if (result?.error === 'rate_limit') {
        // Show friendly message for daily limit
        Alert.alert(
          'Daily refresh limit reached',
          result.message || 'Daily refresh limit reached. Try again tomorrow.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Oops!', result?.message || 'Could not replace actions. Try again.');
      }

      // Close the modal after replacement attempt
      setShowAuvraChat(false);
    } catch (error) {
      console.error(`❌ [HomeScreen:${instanceId}] Error replacing items:`, error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle calendar button click
  const handleCalendarPress = () => {
    setShowCalendar(true);
  };

  // Handle Auvra chat close
  const handleAuvraClose = () => {
    setShowAuvraChat(false);
    resetInactivityTimer(); // Reset timer when user closes manually
  };

  /**
 * Handle non-blocking daily review submission
 * 
 * This implements the "fire-and-forget" UX pattern:
 * 1. Close modal immediately
 * 2. Show "Designing Plan" overlay
 * 3. Submit to backend in background
 * 4. Refresh data when ready
 */
  const handleDailyReviewSubmitAsync = async (reviewData: DailyReviewRequest) => {
    const instanceId = componentIdRef.current;

    // 1. Close modal immediately (instant feedback)
    setShowDailyReview(false);
    setPendingReviewData(null);
    reviewSubmissionInProgressRef.current = true;

    // 2. Show designing overlay
    setIsDesigningPlan(true);

    console.log(`🚀 [HomeScreen:${instanceId}] Starting async review submission & plan generation...`);

    try {
      // 3. Submit to backend (this can take 2+ mins if new plan generated)
      const submitStart = Date.now();
      const result = await homeService.submitDailyReview(
        reviewData.plan_id,
        reviewData.items,
        reviewData.use_freeze
      );

      console.log(`✅ [HomeScreen:${instanceId}] Async submission complete in ${Date.now() - submitStart}ms`);

      if (result?.success) {
        // Scroll to top to prepare for new content
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }

        // 4. Load the newly generated data
        // Small delay to ensure DB consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        const [assignmentsData, rewardsData] = await Promise.all([
          homeService.getTodayAssignments(),
          rewardService.getRewardsStatus().catch(() => null),
        ]);

        if (assignmentsData) {
          setAssignments(assignmentsData);
          if (assignmentsData.hormone_stats) {
            setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
          }
          wireUpActionPlan(assignmentsData);
        }

        if (rewardsData && rewardsData.refresh_status) {
          setRefreshStatus(rewardsData.refresh_status);
        }

        // Success! Hide overlay and Trigger unlock animation
        // We set these flags to trigger the existing unlock logic
        setIsTodayDataReady(true);
        setIsReviewBlocking(false);
        setShowPlanAnimation(true);
        planSlideAnim.setValue(0);
        planScaleAnim.setValue(0.95);

        // Trigger the unlock animation manually since we bypassed the normal close flow
        requestAnimationFrame(() => {
          // Short artificial delay before hiding overlay to make transition smooth
          setTimeout(() => {
            setIsDesigningPlan(false);

            // Trigger Lock Break Animation
            setIsUnlocking(true);
            Animated.parallel([
              Animated.timing(lockScale, {
                toValue: 2.5,
                duration: 1200,
                useNativeDriver: true,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              }),
              Animated.timing(lockOpacity, {
                toValue: 0,
                duration: 1000,
                delay: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setIsUnlocking(false);
              lockScale.setValue(1);
              lockOpacity.setValue(1);

              Animated.spring(planSlideAnim, {
                toValue: 1,
                friction: 4,
                tension: 20,
                useNativeDriver: true,
              }).start(() => {
                setShowPlanAnimation(false);
                setIsTodayDataReady(false);
              });
            });
          }, 1500); // Keep overlay for at least 1.5s so user can read message
        });

      } else {
        // Handle failure
        setIsDesigningPlan(false);
        Alert.alert('Submission Failed', result?.error || 'Please try again.');
        // Re-open modal
        setShowDailyReview(true);
      }
    } catch (error) {
      console.error(`❌ [HomeScreen:${instanceId}] Async submission failed:`, error);
      setIsDesigningPlan(false);
      Alert.alert('Error', 'An unexpected error occurred. Your progress is saved locally.');
      // Re-open modal
      setShowDailyReview(true);
    } finally {
      // Don't reset this immediately, wait for animation to finish
      setTimeout(() => {
        reviewSubmissionInProgressRef.current = false;
      }, 5000);
    }
  };

  // Handle Daily Review modal close - animate plan entrance
  const handleDailyReviewClose = async () => {
    // Standard close without submit (e.g. dismissed)
    setPendingReviewData(null);
    setShowDailyReview(false);

    // ... existing logic ...

    // Reset the submission in progress ref so next focus can check for reviews
    reviewSubmissionInProgressRef.current = false;

    // Only trigger unlock animation if today's data is ready
    // Otherwise force a refresh to get the data
    if (showPlanAnimation && isTodayDataReady) {
      // Trigger Lock Break Animation
      setIsUnlocking(true);
      setIsReviewBlocking(false); // Hand off to unlocking state

      // 1. Animate Lock Breaking (Scale up and fade out) - SLOW & DRAMATIC
      Animated.parallel([
        Animated.timing(lockScale, {
          toValue: 2.5,
          duration: 1200, // Much slower - 1.2 seconds
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Ease out cubic
        }),
        Animated.timing(lockOpacity, {
          toValue: 0,
          duration: 1000, // Slower fade - 1 second
          delay: 300, // More delay before fade starts
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Animate Content Sliding Up (Candy Crush style) - SLOW & SMOOTH
        setIsUnlocking(false);
        lockScale.setValue(1);
        lockOpacity.setValue(1);

        // Slide up animation for the plan - slower and more dramatic
        Animated.spring(planSlideAnim, {
          toValue: 1,
          friction: 4, // Lower friction = more bouncy
          tension: 20, // Lower tension = slower movement
          useNativeDriver: true,
        }).start(() => {
          setShowPlanAnimation(false);
          setIsTodayDataReady(false); // Reset for next time
        });
      });
    } else if (!isTodayDataReady) {
      // Today's data not ready - unblock and force refresh
      const instanceId = componentIdRef.current;
      console.log(`📋 [HomeScreen:${instanceId}] Modal closed but today data not ready - forcing refresh`);
      setIsReviewBlocking(false);
      setShowPlanAnimation(false);

      // Force refresh home data
      try {
        setLoading(true);
        const assignmentsData = await homeService.getTodayAssignments();
        if (assignmentsData) {
          setAssignments(assignmentsData);
          if (assignmentsData.hormone_stats) {
            setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
          }
          wireUpActionPlan(assignmentsData);
        }
      } catch (err) {
        console.error(`❌ [HomeScreen:${instanceId}] Failed to load assignments after review close:`, err);
      } finally {
        setLoading(false);
      }
    } else {
      setIsReviewBlocking(false);
    }
  };

  // Handle Daily Review complete - load today's assignments in background while result shows
  const handleDailyReviewComplete = async (result: DailyReviewResponse) => {
    const instanceId = componentIdRef.current;
    console.log(`✅ [HomeScreen:${instanceId}] Daily review submitted:`, result);

    // Scroll to top immediately so user sees the animation at the top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }

    // Mark submission in progress to prevent useFocusEffect from re-checking
    reviewSubmissionInProgressRef.current = true;

    // Keep blocking state true until close animation starts
    // setIsReviewBlocking(false); // REMOVED: Handled in handleDailyReviewClose

    // Prepare animation - reset to starting position
    planSlideAnim.setValue(0);
    planScaleAnim.setValue(0.95);
    setShowPlanAnimation(true);

    // Load today's assignments in background while user views result
    // Modal stays open so user can see their streak result and click "Let's Go"
    // NOTE: Small delay ensures backend has time to generate today's plan
    try {
      console.log(`🔄 [HomeScreen:${instanceId}] Loading today action plan in background...`);

      // Wait briefly for backend to finish generating plan
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if review is still pending (backend consistency check)
      // This prevents 428 errors if backend hasn't updated yet
      let reviewStatus = await homeService.getPendingReview();
      let attempts = 0;
      while (reviewStatus?.needs_review && attempts < 3) {
        console.log(`⏳ [HomeScreen:${instanceId}] Backend still reports pending review, waiting... (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        reviewStatus = await homeService.getPendingReview();
        attempts++;
      }

      if (reviewStatus?.needs_review) {
        console.warn(`⚠️ [HomeScreen:${instanceId}] Backend still reports pending review after retries. Will force refresh on close.`);
        // Don't return - let handleDailyReviewClose handle the refresh
        return;
      }

      const [assignmentsData, rewardsData] = await Promise.all([
        homeService.getTodayAssignments(),
        rewardService.getRewardsStatus().catch(() => null),
      ]);

      if (assignmentsData) {
        setAssignments(assignmentsData);
        if (assignmentsData.hormone_stats) {
          setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
        }
        wireUpActionPlan(assignmentsData);

        // Mark that today's data is ready - this enables the unlock animation
        setIsTodayDataReady(true);
        console.log(`✅ [HomeScreen:${instanceId}] Today data ready - unlock animation will trigger on modal close`);
      } else {
        console.warn(`⚠️ [HomeScreen:${instanceId}] No assignments data returned, will force refresh on close`);
      }

      if (rewardsData) {
        setRewardsData(rewardsData);
        if (rewardsData.refresh_status) {
          setRefreshStatus(rewardsData.refresh_status);
        }
      }

      console.log(`✅ [HomeScreen:${instanceId}] Today action plan ready (modal still showing result)`);
    } catch (error) {
      console.error(`❌ [HomeScreen:${instanceId}] Failed to load plan after review:`, error);
    }

    // NOTE: Do NOT close modal here! User clicks "Let's Go" button which calls onClose
  };

  // Start timer when component mounts and data is loaded
  // IMPORTANT: Don't start timer if review is blocking
  useEffect(() => {
    if (!loading && assignments && !isReviewBlocking && !showDailyReview) {
      resetInactivityTimer();
    }

    // Clear timer if review becomes blocking
    if (isReviewBlocking || showDailyReview) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      // Also hide Auvra chat if it was showing
      if (showAuvraChat) {
        setShowAuvraChat(false);
      }
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [loading, assignments, showAuvraChat, feedbackPromptSeconds, isReviewBlocking, showDailyReview]);

  /**
   * Convert hormone_stats data to HormoneStats interface
   * @param hormoneStatsData - Raw hormone stats data from API
   * @returns Formatted hormone stats object
   */
  const convertHormoneStats = (hormoneStatsData: any) => {
    const hormoneStats: HormoneStats = {};
    const supportedHormones = ['androgens', 'progesterone', 'estrogen', 'thyroid', 'insulin', 'cortisol', 'FSH', 'LH', 'prolactin', 'ghrelin', 'testosterone'];

    // Create a case-insensitive lookup of the API data keys
    const dataKeysLower: Record<string, string> = {};
    if (hormoneStatsData) {
      Object.keys(hormoneStatsData).forEach(key => {
        dataKeysLower[key.toLowerCase()] = key;
      });
    }

    supportedHormones.forEach(hormone => {
      // Check both the original key and case-insensitive match
      const actualKey = hormoneStatsData?.[hormone] ? hormone : dataKeysLower[hormone.toLowerCase()];
      if (actualKey && hormoneStatsData[actualKey]) {
        hormoneStats[hormone as keyof HormoneStats] = {
          completed: hormoneStatsData[actualKey].completed || 0,
          total: hormoneStatsData[actualKey].total || 0
        };
      }
    });

    // Remove verbose debug log - only log if needed for debugging
    // console.log('🧬 convertHormoneStats result:', { input: hormoneStatsData, output: hormoneStats });
    return hormoneStats;
  };


  useEffect(() => {
    const instanceId = componentIdRef.current;
    // Check for refreshed data from ActionCompletedScreen
    const refreshedData = route?.params?.refreshedData;
    const cyclePhaseData = route?.params?.cyclePhaseData;
    const skipLoading = route?.params?.skipLoading;
    const skipTodayLoading = route?.params?.skipTodayLoading;

    if (refreshedData && skipLoading) {
      // All data completed - use refreshed data
      setAssignments(refreshedData);

      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }

      if (cyclePhaseData?.cycle_info) {
        setCycleInfo(cyclePhaseData.cycle_info);
      }

      setLoading(false);
      initialDataLoadedRef.current = true;
    } else if (refreshedData && skipTodayLoading) {
      // Only Today API completed - use partial data
      setAssignments(refreshedData);

      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }

      // Load cycle data separately without loading state
      homeService.getCyclePhase().then(cycleData => {
        setCycleInfo(cycleData?.cycle_info || null);
        setLoading(false);
        initialDataLoadedRef.current = true;
      });
    } else {
      // Prevent duplicate initial fetches - useFocusEffect handles normal loading
      // Only proceed here if:
      // 1. We have an activePromise from ActionCompletedScreen, OR
      // 2. hasRetried is true (retry after empty assignments)
      if (initialDataLoadedRef.current && !hasRetried) {
        console.log(`⏭️ [HomeScreen:${instanceId}] route params useEffect - data already loaded by useFocusEffect`);
        return;
      }

      // Skip if useFocusEffect is currently loading data
      if (dataLoadingRef.current) {
        console.log(`⏭️ [HomeScreen:${instanceId}] route params useEffect - useFocusEffect is loading, skipping`);
        return;
      }

      // Check for active API promise from ActionCompletedScreen
      const activePromise = apiPromiseManager.getActivePromise();

      if (activePromise) {
        setLoading(true);

        // Wait for API promise result
        activePromise
          .then(result => {
            if (result.success) {
              if (result.todayAssignments) {
                setAssignments(result.todayAssignments);

                if (result.todayAssignments.hormone_stats) {
                  setProgressStats({ hormone_stats: convertHormoneStats(result.todayAssignments.hormone_stats) });
                }
              }

              if (result.cyclePhaseData?.cycle_info) {
                setCycleInfo(result.cyclePhaseData.cycle_info);
              }

              // Fallback to normal load if both failed
              if (!result.todayAssignments && !result.cyclePhaseData) {
                loadHomeDataWithoutLoading();
              }
            } else {
              // API call failed - use normal data load
              loadHomeDataWithoutLoading();
            }
          })
          .catch(error => {
            // Promise error - use normal data load
            loadHomeDataWithoutLoading();
          })
          .finally(() => {
            setLoading(false);
            initialDataLoadedRef.current = true;
          });
      } else {
        // Normal data load - but only if useFocusEffect hasn't started loading
        // This should rarely happen since useFocusEffect runs first on mount
        if (!dataLoadingRef.current && !initialDataLoadedRef.current) {
          console.log(`📋 [HomeScreen:${instanceId}] route params useEffect - triggering loadHomeData`);
          loadHomeData();
        } else {
          console.log(`⏭️ [HomeScreen:${instanceId}] route params useEffect - skipping, data load already in progress or complete`);
        }
      }
    }
  }, [route?.params, hasRetried]);

  /**
   * Load home data with loading state
   */
  const loadHomeData = async () => {
    const instanceId = componentIdRef.current;
    // Prevent duplicate fetches - check both flags
    if (initialDataLoadedRef.current || dataLoadingRef.current) {
      console.log(`⏭️ [HomeScreen:${instanceId}] loadHomeData skipped - already loaded or loading`);
      return;
    }

    // Skip if review is blocking - let useFocusEffect handle that case
    if (isReviewBlockingRef.current || showDailyReviewRef.current) {
      console.log(`⏭️ [HomeScreen:${instanceId}] loadHomeData skipped - review is blocking`);
      return;
    }

    // Set both flags to prevent concurrent calls
    dataLoadingRef.current = true;
    initialDataLoadedRef.current = true;

    try {
      setLoading(true);

      // Check for pending review
      const reviewResponse = await homeService.getPendingReview();

      if (reviewResponse?.needs_review && reviewResponse?.plan_id) {
        console.log(`📋 [HomeScreen:${instanceId}] Found pending review in loadHomeData`);
        setPendingReviewData(reviewResponse);
        setIsReviewBlocking(true);
        setShowDailyReview(true);
      }

      const isReviewPending = !!(reviewResponse?.needs_review && reviewResponse?.plan_id);

      // Load cycle info always; only fetch today's assignments if not blocked by pending review
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        isReviewPending ? Promise.resolve(null) : homeService.getTodayAssignments().catch(() => null),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);

      if (assignmentsData) {
        setAssignments(assignmentsData);
        if (assignmentsData?.hormone_stats) {
          setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
        }
        wireUpActionPlan(assignmentsData);
      } else if (reviewResponse?.items && reviewResponse.items.length > 0) {
        // Use pending review items as display data when assignments are blocked
        console.log(`📋 [HomeScreen:${instanceId}] Using ${reviewResponse.items.length} pending review items for display (loadHomeData)`);
        const reviewItems = reviewResponse.items.map((item, index) => ({
          slot: index + 1,
          title: item.title,
          time_of_day: item.time_slot || 'Morning',
          completed: item.is_completed || false,
          replaced: false,
          skipped: false,
          category: item.category || 'exercise',
        }));
        setAssignments({
          plan_id: reviewResponse.plan_id,
          date: reviewResponse.review_date,
          items: reviewItems,
        } as any);
      }

      setLoading(false);
      console.log(`✅ [HomeScreen:${instanceId}] loadHomeData complete`);
    } catch (error) {
      console.error(`❌ [HomeScreen:${instanceId}] Failed to load home data:`, error);
      setLoading(false);
    } finally {
      // Reset loading flag (initialDataLoadedRef stays true)
      dataLoadingRef.current = false;
    }
  };

  /**
   * Helper function to wire up actionPlan from assignmentsData
   */
  const wireUpActionPlan = (assignmentsData: AssignmentsResponse) => {
    if (!assignmentsData?.plan_id) return;

    const allActions = [
      ...(assignmentsData.assignments?.morning || []),
      ...(assignmentsData.assignments?.afternoon || []),
      ...(assignmentsData.assignments?.evening || []),
    ];
    setActionPlan({
      plan_id: assignmentsData.plan_id,
      user_id: '',
      date: assignmentsData.date || '',
      phase: assignmentsData.cycle_phase || '',
      phase_day: 0,
      actions: allActions.map((action, index) => ({
        id: action.id || index,
        slot: index + 1,
        time_slot: action.time_slot || 'morning',
        category: action.category || '',
        title: action.title || '',
        specific_action: action.specific_action || '',
        purpose: action.purpose || '',
        target_hormone: action.hormones?.[0] || '',
        hormone_persona_intro: action.hormone_persona_intro || '',
        hero_image_url: action.hero_image_url,
        research_studies: action.research_studies || [],
        is_completed: action.is_completed || false,
        is_replaced: false,
        variants: action.variants || [],
      })),
      total_actions: assignmentsData.total_assignments || 0,
      completed_actions: assignmentsData.completed_assignments || 0,
      show_feedback_prompt_after_seconds: assignmentsData.show_feedback_prompt_after_seconds || 30,
    });
  };

  /**
   * Load home data without changing loading state
   */
  const loadHomeDataWithoutLoading = async () => {
    const instanceId = componentIdRef.current;
    // Skip if review is blocking
    if (isReviewBlockingRef.current || showDailyReviewRef.current) {
      console.log(`⏭️ [HomeScreen:${instanceId}] loadHomeDataWithoutLoading skipped - review is blocking`);
      return;
    }

    try {
      // Check pending review first
      const reviewResponse = await homeService.getPendingReview();
      if (reviewResponse?.needs_review && reviewResponse?.plan_id) {
        console.log(`📋 [HomeScreen:${instanceId}] Found pending review in loadHomeDataWithoutLoading`);
        setPendingReviewData(reviewResponse);
        setIsReviewBlocking(true);
        setShowDailyReview(true);
      }

      const isReviewPending = !!(reviewResponse?.needs_review && reviewResponse?.plan_id);

      // Load cycle info always; only fetch today's assignments if not blocked by pending review
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        isReviewPending ? Promise.resolve(null) : homeService.getTodayAssignments().catch(() => null),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);

      if (assignmentsData) {
        setAssignments(assignmentsData);
        if (assignmentsData?.hormone_stats) {
          setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
        }
        wireUpActionPlan(assignmentsData);
      } else if (reviewResponse?.items && reviewResponse.items.length > 0) {
        // Use pending review items as display data when assignments are blocked
        console.log(`📋 [HomeScreen:${instanceId}] Using ${reviewResponse.items.length} pending review items for display (no-loading)`);
        const reviewItems = reviewResponse.items.map((item, index) => ({
          slot: index + 1,
          title: item.title,
          time_of_day: item.time_slot || 'Morning',
          completed: item.is_completed || false,
          replaced: false,
          skipped: false,
          category: item.category || 'exercise',
        }));
        setAssignments({
          plan_id: reviewResponse.plan_id,
          date: reviewResponse.review_date,
          items: reviewItems,
        } as any);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  /**
   * Get greeting based on current time
   * @returns Greeting string (Morning/Afternoon/Evening)
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  /**
   * Format date string to readable format
   * @param dateString - Date string to format (YYYY-MM-DD)
   * @returns Formatted date string
   * 
   * NOTE: We parse the date components directly instead of using new Date(dateString)
   * because new Date("2026-01-09") creates a UTC midnight date, which when displayed
   * in timezones behind UTC (like Pacific) would show as the previous day.
   */
  const formatDate = (dateString: string) => {
    // Parse date components directly to avoid timezone issues
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const day = parseInt(parts[2], 10);
      // Create date with local timezone (not UTC)
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    // Fallback for other date formats
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Get time slot icon
   * @param timeSlot - Time slot string
   * @returns Emoji icon for time slot
   */
  const getTimeIcon = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return '🌤️';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';  // Backend now uses 'evening'
      case 'night': return '🌙';     // Keep for backwards compatibility
      case 'anytime': return 'Anytime';
      default: return 'Anytime';
    }
  };

  /**
   * Get hormone icon emoji or image
   * @param hormone - Hormone name
   * @returns Image source for hormone
   */
  const getHormoneIcon = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return Images.AndrogensBothHand;
      case 'progesterone': return Images.ProgesteroneBothHand;
      case 'estrogen': return Images.EstrogenBothHand;
      case 'thyroid': return Images.ThyroidBothHand;
      case 'insulin': return Images.InsulinBothHand;
      case 'cortisol': return Images.CortisolBothHand;
      case 'fsh': return Images.EstrogenBothHand;
      case 'lh': return Images.LHCharacterBothHand;
      case 'prolactin': return Images.ProgesteroneBothHand;
      case 'ghrelin': return Images.InsulinBothHand;
      case 'testosterone': return Images.TestosteroneBothHand;
      default: return Images.ProgesteroneBothHand;
    }
  };

  /**
   * Calculate progress percentage
   * @param completed - Number of completed items
   * @param total - Total number of items
   * @returns Percentage value
   */
  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  /**
   * Get progress color for hormone
   * @param hormone - Hormone name
   * @returns Color hex string
   */
  const getProgressColor = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return '#A29AEA'; // Purple - matches ActionPlanTimeline
      case 'progesterone': return '#CBF0FF'; // Light blue
      case 'estrogen': return '#FF8BA7'; // Pink
      case 'thyroid': return '#F6C34C'; // Yellow
      case 'insulin': return '#90EE90'; // Light green
      case 'cortisol': return '#FFA07A'; // Coral/Orange
      case 'fsh': return '#98FB98'; // Pale green
      case 'lh': return '#FFD700'; // Gold
      case 'prolactin': return '#F6C34C'; // Yellow (same as thyroid)
      case 'ghrelin': return '#FF6B6B'; // Red
      case 'testosterone': return '#A29AEA'; // Purple (same as androgens)
      default: return '#C17EC9'; // Default purple
    }
  };

  // Lighten a hex color by blending it toward white by the given factor (0..1)
  const lightenColor = (hex: string, factor: number = 0.85) => {
    const cleaned = hex.replace('#', '');
    const num = parseInt(cleaned, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);

    return `rgb(${lr}, ${lg}, ${lb})`;
  };

  /**
   * Hormone priority order for consistent sorting
   * This ensures colors always match the same hormones
   */
  const HORMONE_PRIORITY_ORDER = [
    'cortisol',
    'progesterone',
    'estrogen',
    'insulin',
    'thyroid',
    'androgens',
    'testosterone',
    'fsh',
    'lh',
    'prolactin',
    'ghrelin'
  ];

  /**
   * Get sorted hormone keys based on priority order
   * @param hormoneStats - The hormone stats object
   * @returns Sorted array of hormone names
   */
  const getSortedHormoneKeys = (hormoneStats: Record<string, any>): string[] => {
    const hormoneKeys = Object.keys(hormoneStats);
    return hormoneKeys.sort((a, b) => {
      const aIndex = HORMONE_PRIORITY_ORDER.indexOf(a.toLowerCase());
      const bIndex = HORMONE_PRIORITY_ORDER.indexOf(b.toLowerCase());
      // If not in priority list, put at end
      const aOrder = aIndex === -1 ? 999 : aIndex;
      const bOrder = bIndex === -1 ? 999 : bIndex;
      return aOrder - bOrder;
    });
  };

  /**
   * Get hormone quest colors for background gradients
   * @returns Object with first and second hormone colors
   */
  const getHormoneQuestColors = () => {
    // Get hormones from hormone_stats and sort by priority
    if (assignments?.hormone_stats) {
      const sortedHormones = getSortedHormoneKeys(assignments.hormone_stats);
      const firstHormoneColor = sortedHormones.length > 0 ? getProgressColor(sortedHormones[0]) : '#C17EC9';
      const secondHormoneColor = sortedHormones.length > 1 ? getProgressColor(sortedHormones[1]) : '#87CEEB';
      return { firstHormoneColor, secondHormoneColor };
    }

    return { firstHormoneColor: '#C17EC9', secondHormoneColor: '#87CEEB' };
  };

  /**
   * Render large background radial gradients
   * @returns SVG component with overlapping gradients
   */
  const renderBackgroundGradients = () => {
    const { firstHormoneColor, secondHormoneColor } = getHormoneQuestColors();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    return (
      <View style={styles.backgroundGradientsContainer}>
        <Svg
          width={screenWidth}
          height={screenHeight}
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          <Defs>
            {/* First large radial gradient - left side (first hormone) */}
            <SvgRadialGradient id="bgGrad1" cx="0.25" cy="0.35" r="0.5">
              <Stop offset="0%" stopColor={firstHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={firstHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={firstHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>

            {/* Second large radial gradient - right side (second hormone) */}
            <SvgRadialGradient id="bgGrad2" cx="0.75" cy="0.35" r="0.5">
              <Stop offset="0%" stopColor={secondHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={secondHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={secondHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>

          {/* First large circular gradient - left side */}
          <Circle
            cx={screenWidth * 0.25}
            cy={screenHeight * 0.35}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad1)"
          />

          {/* Second large circular gradient - right side */}
          <Circle
            cx={screenWidth * 0.75}
            cy={screenHeight * 0.35}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad2)"
          />
        </Svg>
      </View>
    );
  };

  /**
   * Render VectorSpotlight as a foreground overlay above gradients and white circle
   */
  const renderSpotlightOverlay = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    return (
      <View style={styles.spotlightOverlayContainer} pointerEvents="none">
        <Svg
          width={screenWidth}
          height={screenHeight}
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          <Defs>
            <SvgLinearGradient id="spotlightLinear" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {/* Foreground triangular spotlight starting from the top */}
          <Polygon
            points={`${screenWidth * 0.5},0 ${screenWidth * 0.12},${screenHeight * 0.32} ${screenWidth * 0.88},${screenHeight * 0.32}`}
            fill="url(#spotlightLinear)"
          />
        </Svg>
      </View>
    );
  };

  /**
   * Get progress background color for hormone
   * @param hormone - Hormone name
   * @returns Background color hex string
   */
  const getProgressBgColor = (hormone: string) => {
    // Use a lighter shade of the main progress color for the unfilled track
    const base = getProgressColor(hormone);
    return lightenColor(base, 0.75);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        onTouchStart={handleUserInteraction}
        onScroll={handleUserInteraction}
      >
        {/* Large radial gradient background */}
        {renderBackgroundGradients()}

        {/* White circle overlay effect - show in both views */}
        <View style={styles.whiteCircleOverlay} />

        {/* Foreground VectorSpotlight overlay (on top of gradients and white circle) */}
        {renderSpotlightOverlay()}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()} {cycleInfo?.user_name || 'User'}!
            </Text>
            {cycleInfo?.cycle_day && cycleInfo?.phase ? (
              <Text style={styles.cycleInfo}>
                Cycle Day {cycleInfo.cycle_day} | {cycleInfo.phase}
              </Text>
            ) : (
              <View style={styles.noCycleDataContainer}>
                <Text style={styles.noCycleDataText}>No cycle data yet</Text>
                <Text style={styles.separator}>|</Text>
                <TouchableOpacity>
                  <Text style={styles.logPeriodText}>Log period</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarPress}>
            <Image
              source={require('../../assets/icons/IconCalendar.png')}
              style={styles.calendarIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Streak at risk popup is shown once on data load - no permanent banner */}

        {/* Hormone Quests Section - only show if there are any non-zero hormone totals */}
        {progressStats?.hormone_stats &&
          Object.values(progressStats.hormone_stats).some(stats => stats && stats.total > 0) && (
            <View style={styles.questSection}>
              <Text style={styles.sectionTitle}>🏆 Your Hormone Quests 🏆</Text>
              <View style={styles.questContainer}>
                {getSortedHormoneKeys(progressStats.hormone_stats).map((hormone, index) => {
                  const hormoneKey = hormone as keyof HormoneStats;
                  const hormoneStats = progressStats.hormone_stats[hormoneKey];

                  if (!hormoneStats || hormoneStats.total === 0) return null;

                  // Determine rotation based on position (left = -15deg, right = +15deg)
                  const isLeft = index % 2 === 0;
                  const rotation = isLeft ? '-5deg' : '10deg';

                  return (
                    <TouchableOpacity
                      key={hormone}
                      style={styles.questItem}
                      onPress={() => {
                        navigation.navigate('ChatbotScreen', {
                          conversationContext: {
                            context: 'know_body',
                            initialMessage: `I want to learn about my ${hormone}`,
                            userResponse: `I want to learn about my ${hormone}`
                          }
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.questImageContainer}>
                        {typeof getHormoneIcon(hormone) === 'string' ? (
                          <Text style={styles.questIcon}>{getHormoneIcon(hormone)}</Text>
                        ) : (
                          <View style={styles.questIconImageContainer}>
                            <Image
                              source={getHormoneIcon(hormone)}
                              style={[styles.questIconImage, { transform: [{ rotate: rotation }] }]}
                              resizeMode="contain"
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.questName}>{hormone.charAt(0).toUpperCase() + hormone.slice(1)}</Text>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: getProgressBgColor(hormone) }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: getProgressColor(hormone),
                                width: `${getProgressPercentage(hormoneStats.completed, hormoneStats.total)}%`
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {hormoneStats.completed}/{hormoneStats.total}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Svg width={responsiveWidth(30)} height={1} style={styles.centerDivider}>
            <Line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="#CFCFCF"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </Svg>
        </View>

        {/* Today's Action Plan */}
        <View style={styles.actionPlanSection}>
          <View style={styles.actionPlanHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Today's Action Plan</Text>
            </View>
            <Text style={styles.dateText}>
              {assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
            </Text>
            {/* Refresh All button */}
            {refreshStatus && refreshStatus.can_refresh && (
              <TouchableOpacity
                style={[
                  styles.refreshAllButton,
                  isRefreshingAll && styles.refreshAllButtonLoading
                ]}
                onPress={async () => {
                  setIsRefreshingAll(true);
                  try {
                    const result = await homeService.refreshAllIncomplete();
                    if (result?.success) {
                      Alert.alert(
                        '✅ Refreshed!',
                        result.message,
                        [{ text: 'OK' }]
                      );
                      if (result.refresh_status) {
                        setRefreshStatus(result.refresh_status);
                      }
                      // Reload assignments
                      const newAssignments = await homeService.getTodayAssignments();
                      setAssignments(newAssignments);
                      if (newAssignments) wireUpActionPlan(newAssignments);
                    } else if (result?.error === 'rate_limit') {
                      // Show friendly no-refresh message
                      Alert.alert(
                        'Daily refresh limit reached',
                        result.message || 'Daily refresh limit reached. Try again tomorrow.',
                        [{ text: 'OK' }]
                      );
                    } else {
                      Alert.alert('Oops!', result?.message || 'Could not refresh actions. Try again.');
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error?.message || 'Could not refresh actions');
                  } finally {
                    setIsRefreshingAll(false);
                  }
                }}
                disabled={isRefreshingAll}
              >
                {isRefreshingAll ? (
                  <View style={styles.refreshAllLoadingContent}>
                    <Animated.Text
                      style={[
                        styles.refreshHourglass,
                        {
                          transform: [{
                            rotate: spinValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          }]
                        }
                      ]}
                    >
                      ⏳
                    </Animated.Text>
                    <Text style={styles.refreshAllButtonText}>Refreshing...</Text>
                  </View>
                ) : (
                  <Text style={styles.refreshAllButtonText}>🔄 Refresh All</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Timeline and sort buttons container */}
          <View>
            <Animated.View
              style={[
                styles.timelineContainer,
                showPlanAnimation && {
                  opacity: planSlideAnim,
                  transform: [
                    {
                      translateY: planSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0], // Slide up from 50px below
                      })
                    },
                    { scale: planScaleAnim },
                  ],
                },
              ]}
            >
              {/* Dynamic component rendering */}
              {assignments?.assignments && Object.keys(assignments.assignments).length > 0 ? (
                sortBy === 'time' ? (
                  <ActionPlanTimeline
                    dateLabel={assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
                    assignments={assignments.assignments}
                    weeklyCheckinStatus={assignments.weekly_checkin}
                  />
                ) : (
                  <TypeActionPlan
                    dateLabel={assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
                    assignments={assignments.assignments}
                    weeklyCheckinStatus={assignments.weekly_checkin}
                    topConcern={assignments.primary_hormone || 'your symptoms'}
                  />
                )
              ) : (
                <View style={styles.noAssignmentsContainer}>
                  <Text style={styles.noAssignmentsText}>
                    {loading ? "Generating your plan..." : "Unable to load plan"}
                  </Text>
                  {!loading && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        setLoading(true);
                        loadHomeData();
                      }}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Sort buttons - positioned absolutely */}
              {!isReviewBlocking && (
                <View style={styles.sortContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      styles.sortButtonLeft,
                      sortBy === 'type' && styles.sortButtonActive
                    ]}
                    onPress={() => setSortBy('type')}
                  >
                    <Text style={[
                      styles.sortButtonText,
                      sortBy === 'type' && styles.sortButtonTextActive
                    ]}>Type</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      styles.sortButtonRight,
                      sortBy === 'time' && styles.sortButtonActive
                    ]}
                    onPress={() => setSortBy('time')}
                  >
                    <Text style={[
                      styles.sortButtonText,
                      sortBy === 'time' && styles.sortButtonTextActive
                    ]}>Time</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        </View>

      </ScrollView>

      {/* Auvra Chat Modal - NEVER show when review is pending
            CRITICAL: Triple-check all blocking conditions to prevent z-index conflict with DailyReviewModal */}
      {showAuvraChat &&
        !isReviewBlocking &&
        !showDailyReview &&
        !pendingReviewData?.needs_review && (
          <AuvraChatModal
            onClose={handleAuvraClose}
            onResponse={handleAuvraResponse}
            actions={actionPlan?.actions || []}
            planId={actionPlan?.plan_id}
            onReplaceItems={handleReplaceItems}
            isLoading={isSubmittingFeedback}
            refreshStatus={refreshStatus}
          />
        )}

      {/* Calendar Bottom Sheet */}
      <CalendarBottomSheet
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      {/* Daily Review Modal - Next Day Review System (MANDATORY - blocks home until complete) */}
      <DailyReviewModal
        visible={showDailyReview}
        onClose={handleDailyReviewClose}
        reviewData={pendingReviewData}
        onReviewComplete={handleDailyReviewComplete}
        isMandatory={true}
        onSubmit={handleDailyReviewSubmitAsync}
      />

      {/* Designing Plan Overlay - Premium loading experience during async plan generation */}
      <DesigningPlanOverlay visible={isDesigningPlan} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8', // Light pink fallback - visible even if gradients fail
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: responsiveHeight(5),
    minHeight: responsiveHeight(120),
    zIndex: 1, // Ensure scroll content appears above background gradients
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  backgroundGradientsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  spotlightOverlayContainer: {
    position: 'absolute',
    top: verticalScale(-15),
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  whiteCircleOverlay: {
    position: 'absolute',
    top: responsiveHeight(27),
    left: (Dimensions.get('window').width / 2) - responsiveWidth(150),
    width: responsiveWidth(300),
    height: responsiveWidth(400),
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(150),
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8', // Ensure loading state has visible background
  },
  loadingText: {
    fontSize: responsiveFontSize(2),
    color: '#6F6F6F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6), // Increased top padding
    paddingBottom: verticalScale(30),
    zIndex: 10, // Ensure header appears above background elements
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#000000',
    opacity: 0.77,
    marginBottom: verticalScale(3),
  },
  cycleInfo: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  noCycleDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  noCycleDataText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  separator: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  logPeriodText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#C17EC9',
  },
  calendarButton: {
    padding: responsiveWidth(1.5),
  },
  calendarIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    tintColor: '#000000',
  },
  questSection: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
    zIndex: 5, // Ensure quest section appears above background
  },
  sectionTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  questContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  questItem: {
    alignItems: 'center',
    minWidth: responsiveWidth(30),
    marginBottom: responsiveHeight(1),
  },
  questImageContainer: {
    width: responsiveWidth(25),
    height: responsiveHeight(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  questImage: {
    width: responsiveWidth(18),
    height: responsiveHeight(10),
    borderRadius: responsiveWidth(9),
  },
  questIcon: {
    fontSize: responsiveFontSize(2.5),
  },
  questIconImageContainer: {
    width: scale(128),
    height: verticalScale(100),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  questIconImage: {
    width: '100%',
    height: '100%',
  },
  questName: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'NotoSerif400',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  progressBar: {
    width: responsiveWidth(15),
    height: responsiveHeight(1),
    borderRadius: responsiveWidth(6),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: responsiveWidth(6),
  },
  progressText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  divider: {
    height: 1,
    backgroundColor: '#CFCFCF',
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(2),
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(2),
  },
  centerDivider: {
    width: responsiveWidth(30),
    height: 1,
    backgroundColor: 'transparent',
    // Custom dashed line will be implemented using SVG
  },
  actionPlanSection: {
    paddingHorizontal: responsiveWidth(5),
    zIndex: 5, // Ensure action plan appears above background
  },
  actionPlanHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  dateText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  timelineContainer: {
    position: 'relative',
  },
  sortContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    borderRadius: responsiveWidth(2),
    overflow: 'hidden',
    zIndex: 10,
  },
  sortButton: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    backgroundColor: '#FFFFFF',
    borderWidth: 0.25,
    borderColor: '#CFCFCF',
  },
  sortButtonActive: {
    backgroundColor: '#C17EC9',
    borderColor: '#C17EC9',
  },
  sortButtonLeft: {
    borderTopLeftRadius: responsiveWidth(2),
    borderBottomLeftRadius: responsiveWidth(2),
    borderRightWidth: 0,
  },
  sortButtonRight: {
    borderTopRightRadius: responsiveWidth(2),
    borderBottomRightRadius: responsiveWidth(2),
    borderLeftWidth: 0,
  },
  sortButtonText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  sortButtonTextActive: {
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  actionItemsContainer: {
    position: 'relative',
  },

  timeSection: {
    marginBottom: responsiveHeight(6),
    position: 'relative',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
    paddingLeft: responsiveWidth(15),
  },
  actionItemRight: {
    flexDirection: 'row-reverse',
    paddingLeft: 0,
    paddingRight: responsiveWidth(15),
  },
  actionImageContainer: {
    width: responsiveWidth(17),
    height: responsiveWidth(17),
    borderRadius: responsiveWidth(8.5),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionImage: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
  },
  actionIcon: {
    fontSize: responsiveFontSize(2.5),
  },
  hormoneBadge: {
    position: 'absolute',
    top: -responsiveHeight(1),
    left: -responsiveWidth(1),
    backgroundColor: '#FFE9F1',
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(1),
    paddingVertical: responsiveHeight(0.2),
  },
  hormoneBadgeText: {
    fontSize: responsiveFontSize(1.1),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  actionDetails: {
    flex: 1,
    marginHorizontal: responsiveWidth(3),
  },
  actionTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#949494',
  },
  actionSeparator: {
    fontSize: responsiveFontSize(1.7),
    color: '#949494',
    marginHorizontal: responsiveWidth(1),
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#949494',
  },
  tomorrowSection: {
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },
  tomorrowHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  tomorrowLockContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(2),
  },
  tomorrowLockIcon: {
    fontSize: responsiveFontSize(2.5),
    color: '#949494',
  },
  tomorrowPreview: {
    position: 'relative',
  },
  tomorrowBlurredContent: {
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
    opacity: 0.7,
  },
  pixelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.4)',
    zIndex: 3,
    opacity: 0.6,
  },
  staticOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    zIndex: 4,
    opacity: 0.5,
  },
  tomorrowCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  tomorrowCategoryTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
    paddingHorizontal: responsiveWidth(2),
  },
  dividerLeft: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
    marginRight: responsiveWidth(2),
  },
  dividerRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: responsiveWidth(2),
  },
  tomorrowActionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    gap: responsiveWidth(3),
  },

  sortButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  sortButtonTextDisabled: {
    color: '#C0C0C0',
  },
  tomorrowImageContainer: {
    width: responsiveWidth(12.5),
    height: responsiveWidth(12.5),
    borderRadius: responsiveWidth(6.25),
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tomorrowActionImage: {
    fontSize: responsiveFontSize(3),
  },
  tomorrowActionDetails: {
    flex: 1,
    gap: responsiveHeight(0.5),
  },
  tomorrowActionTitleBar: {
    height: responsiveHeight(2),
    width: '60%',
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  tomorrowActionSubtitleBar: {
    height: responsiveHeight(1.5),
    width: '40%',
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    marginTop: responsiveHeight(0.5),
  },
  tomorrowActionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  hormoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  hormoneCount: {
    fontSize: responsiveFontSize(1.6),
    color: '#949494',
  },
  hormoneIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    borderRadius: responsiveWidth(2),
    backgroundColor: '#A36CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneIconText: {
    fontSize: responsiveFontSize(1.2),
    color: '#FFFFFF',
    fontFamily: 'Inter600',
  },
  timeEmoji: {
    fontSize: responsiveFontSize(2.2),
  },
  bottomSpacing: {
    height: responsiveHeight(5),
  },
  noAssignmentsContainer: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(4),
  },
  noAssignmentsText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginBottom: responsiveHeight(2),
  },
  retryButton: {
    backgroundColor: '#C17EC9',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(1.6),
  },
  // Refresh count badge for 2x plan refresh reward
  refreshBadge: {
    backgroundColor: '#E8DEF8',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(12),
    marginLeft: scale(8),
  },
  refreshBadgeText: {
    fontSize: responsiveFontSize(1.3),
    fontFamily: 'Inter500',
    color: '#6750A4',
  },
  refreshAllButton: {
    backgroundColor: '#E8DEF8',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    marginLeft: scale(8),
  },
  refreshAllButtonText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: 'Inter500',
    color: '#6750A4',
  },
  refreshAllButtonLoading: {
    opacity: 0.8,
    minWidth: scale(120),
  },
  refreshAllLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  refreshHourglass: {
    fontSize: responsiveFontSize(1.6),
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayContent: {
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 30,
  },
  overlayAvatar: {
    width: 120,
    height: 120,
  },
  overlayEmoji: {
    fontSize: 48,
  },
  overlayTitle: {
    fontFamily: FONT_SERIF.bold,
    fontSize: 24,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  overlaySubtitle: {
    fontFamily: FONT_INTER.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loadingText: {
    fontFamily: FONT_INTER.medium,
    fontSize: 13,
    color: '#FFF',
  },
});

export default HomeScreen;
