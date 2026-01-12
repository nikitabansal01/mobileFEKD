import { Ionicons } from "@expo/vector-icons";
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES, useAppFonts } from '../../constants/fonts';
import { rewardService, RewardsStatusResponse } from '../../services/rewardService';
import { preferencesService, AllPreferencesResponse, PreferenceType } from '../../services/preferencesService';
import { personalizationService, ProfileSummaryResponse, DiscoveryPrompt } from '../../services/personalizationService';
import PreferenceModal from '../../components/PreferenceModal';
import BodyMetricsModal from '../../components/BodyMetricsModal';
import CravingsModal from '../../components/CravingsModal';
import ProfileSummaryCard from '../../components/ProfileSummaryCard';
import DiscoveryPromptCard from '../../components/DiscoveryPromptCard';
// StreakAtRiskBanner removed - streak alerts handled via popup in HomeScreen
import StreakMilestoneModal from '../../components/StreakMilestoneModal';
import { shouldCelebrateMilestone, markMilestoneCelebrated } from '../../utils/streakMilestones';
import LabsSection from '../components/Personalization/LabsSection';
import StreakSection from '../components/Personalization/StreakSection';
import RewardsList from '../components/Personalization/RewardsList';

// Constants from Figma design
const BACKGROUND_VECTOR_IMAGE = "http://localhost:3845/assets/cf926b4d5ec2719e28f1af07e084ed30c131abe4.svg";
// const MILESTONE_BG_IMAGE = require("../../assets/images/milestone-bg.png");
const BLOOD_REPORT_IMAGE = require("../../assets/images/paywallSlide1Icon.png");

// Responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// Responsive scaling using react-native-size-matters
// No need for manual scaling factors


// Gradient Text Component
function GradientText({ children, style }: { children: string; style?: any }) {
  return (
    <MaskedView
      style={{
        flexDirection: 'row',
        height: Math.round(verticalScale(style?.lineHeight || 20)),
        ...(isAndroid && {
          renderToHardwareTextureAndroid: true,
          needsOffscreenAlphaCompositing: true
        } as any)
      }}
      maskElement={
        <Text style={[
          style,
          {
            backgroundColor: 'transparent',
            includeFontPadding: isAndroid ? false : undefined,
            textAlignVertical: isAndroid ? 'center' : undefined,
          }
        ]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
        locations={[0, 0.3654, 0.571, 0.8336, 1.142]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
          ...(isAndroid && {
            renderToHardwareTextureAndroid: true
          } as any)
        }}
      >
        <Text style={[
          style,
          {
            opacity: 0,
            includeFontPadding: isAndroid ? false : undefined,
            textAlignVertical: isAndroid ? 'center' : undefined,
          }
        ]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

// Progress Gradient Component
function ProgressGradient({ progress }: { progress: number }) {
  // Full gradient colors and their positions
  const fullColors = ['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1'] as const;
  const fullLocations = [0, 0.3, 0.6, 0.8, 1] as const;

  // Calculate which colors to show based on progress
  const progressDecimal = progress / 100;
  const visibleColors: string[] = [];
  const visibleLocations: number[] = [];

  for (let i = 0; i < fullColors.length; i++) {
    if (fullLocations[i] <= progressDecimal) {
      visibleColors.push(fullColors[i]);
      // Normalize locations to 0-1 range for the visible portion
      visibleLocations.push(fullLocations[i] / progressDecimal);
    }
  }

  // Ensure we have at least 2 colors for a gradient
  if (visibleColors.length < 2) {
    visibleColors.push(fullColors[1]);
    visibleLocations.push(1);
  }

  // Ensure locations array is valid (all values between 0 and 1)
  const validLocations = visibleLocations.map(loc => Math.min(Math.max(loc, 0), 1));

  return (
    <LinearGradient
      colors={visibleColors as any}
      locations={validLocations as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.progressFill,
        {
          width: `${progress}%`,
          ...(isAndroid && { renderToHardwareTextureAndroid: true })
        }
      ]}
    />
  );
}

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  greyMedium: "#6F6F6F",
  greyLight: "#949494",
  warmPurple: "#C17EC9",
  lightBlue: "#E0F6FF",
  lightViolet: "#F3F0FF",
  lightYellow: "#FFFCDE",
  background: "#FFFFFF",
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.25)",
  shadowPurple: "rgba(193, 126, 201, 0.5)",
  gradPurple: "#A29AEA",
  gradPink: "#FDC6D1",
};


// Types
type RewardState = 'in_progress' | 'available' | 'claimed';

type RewardItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  streak?: string;
  requiredStreakDays: number;
  state: RewardState;
  hasButton?: boolean;
  buttonText?: string;
};

type MilestoneState = 'completed' | 'active' | 'locked';

type Milestone = {
  id: string;
  name: string;
  day: string;
  dayNumber: number;  // For progress calculation
  state: MilestoneState;
};

// Navigation type
type RootStackParamList = {
  HomeScreen: undefined;
  PersonalizeScreen: undefined;
  MainScreenTabs: undefined;
  PaywallScreen: undefined;
  InsightsScreen: undefined;
};

export default function PersonalizeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const fontsLoaded = useAppFonts();
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [rewardsData, setRewardsData] = useState<RewardsStatusResponse | null>(null);
  const [preferencesData, setPreferencesData] = useState<AllPreferencesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationEmoji, setCelebrationEmoji] = useState('🎉');

  // Streak milestone celebration state
  const [milestoneToShow, setMilestoneToShow] = useState<number | null>(null);

  // Animation values for celebration
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Trigger celebration animation - DISABLED per user request
  const triggerCelebration = (emoji: string = '🎉') => {
    // Animation disabled - just do nothing
    return;
  };

  // Modal visibility state
  const [activeModal, setActiveModal] = useState<PreferenceType | null>(null);

  // 2026 Vision - Profile Summary State
  const [profileSummary, setProfileSummary] = useState<ProfileSummaryResponse | null>(null);

  // Load rewards, preferences, and profile summary data when screen is focused
  const loadRewardsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rewards, preferences, profile] = await Promise.all([
        rewardService.getRewardsStatus(),
        preferencesService.getAllPreferences().catch(() => null),
        personalizationService.getProfileSummary().catch((err) => {
          console.log('Profile summary not available:', err);
          return null;
        }),
      ]);
      setRewardsData(rewards);
      setCurrentStreakDays(rewards.current_streak);
      if (preferences) setPreferencesData(preferences);
      if (profile) setProfileSummary(profile);

      // Check for streak milestone celebration
      if (rewards.current_streak > 0) {
        const milestone = await shouldCelebrateMilestone(rewards.current_streak);
        if (milestone) {
          setMilestoneToShow(milestone);
        }
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Disable back gesture and load data on focus
  useFocusEffect(
    useCallback(() => {
      loadRewardsData();
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        navigation.setOptions({
          gestureEnabled: false,
        });
      };
    }, [navigation, loadRewardsData])
  );

  const navigateToIndex = () => {
    navigation.navigate('MainScreenTabs');
  };

  // 2026 Vision - Navigate to chat with focus on a specific discovery prompt
  const handleDiscoveryExplore = (prompt: DiscoveryPrompt) => {
    console.log('🔍 [Personalize] Exploring:', prompt.id);
    // Navigate to chatbot with personalise context and focus on this gap
    (navigation as any).navigate('ChatbotScreen', {
      context: 'personalise',
      initialMessage: prompt.question,
      focus: prompt.id,
    });
  };

  // 2026 Vision - Navigate to general personalization chat
  const handleStartPersonalizeChat = () => {
    console.log('💜 [Personalize] Starting general chat');
    (navigation as any).navigate('ChatbotScreen', {
      context: 'personalise',
      initialMessage: 'Help me understand you better',
    });
  };

  // 2026 Vision - Render the new profile summary section
  const renderProfileSection = () => {
    if (!profileSummary) return null;

    return (
      <View style={{ marginTop: verticalScale(8) }}>
        {/* Profile Summary Card */}
        <ProfileSummaryCard
          traits={profileSummary.known_traits}
          profileDensity={profileSummary.profile_density}
          onStartChat={handleStartPersonalizeChat}
          onTraitPress={(trait) => {
            console.log('Trait pressed:', trait.id);
            // Could open edit modal or chat focused on this trait
          }}
        />

        {/* Discovery Prompts Card */}
        {profileSummary.discovery_prompts.length > 0 && (
          <DiscoveryPromptCard
            prompts={profileSummary.discovery_prompts}
            onExplore={handleDiscoveryExplore}
          />
        )}
      </View>
    );
  };




  // Handle both claimed and available reward actions
  const handleRewardAction = async (rewardId: string) => {
    // Check if reward is already claimed using rewards state
    const reward = rewardsData?.rewards?.find(r => r.id === rewardId);
    const isClaimed = reward?.state === 'claimed';

    if (isClaimed) {
      // Reward already claimed - navigate directly to feature
      switch (rewardId) {
        case 'symptom_patterns':
          navigation.navigate('InsightsScreen');
          break;
        case 'diet_prefs':
          setActiveModal('diet_preference');
          break;
        case 'food_allergies':
          setActiveModal('food_allergies');
          break;
        case 'cuisine_prefs':
          setActiveModal('cuisine_preference');
          break;
        case 'dine_out':
          setActiveModal('dine_out_frequency');
          break;
        case 'ethnicity':
          setActiveModal('cultural_background');
          break;
        case 'bmi_ratio':
          setActiveModal('body_metrics');
          break;
        case 'cravings_healthy':
          setActiveModal('cravings');
          break;
        default:
          console.log('No action for claimed reward:', rewardId);
      }
    } else {
      // Reward not claimed - claim it first
      await claimReward(rewardId);
    }
  };

  const claimReward = async (rewardId: string) => {
    if (claimingRewardId) return; // Prevent double tap

    setClaimingRewardId(rewardId);
    try {
      const result = await rewardService.claimReward(rewardId);
      if (result.success) {
        // Refresh rewards data
        await loadRewardsData();
        console.log('Reward claimed:', result.title);

        // Trigger celebration animation with reward-specific emoji
        const emojiMap: Record<string, string> = {
          'streak_freeze': '🧊',
          'diet_prefs': '🥗',
          'food_allergies': '🥜',
          'cuisine_prefs': '🍜',
          'dine_out': '🍔',
          'ethnicity': '🌍',
          'bmi_ratio': '📊',
          'cravings_healthy': '🍫',
          'symptom_patterns': '✨',
          'plan_refresh_2x': '🔄',
          'first_improvement': '🏆',
        };
        triggerCelebration(emojiMap[rewardId] || '🎉');

        // Handle different reward types
        switch (rewardId) {
          // ═══════════════════════════════════════════════════════════════
          // PERSONALIZATION REWARDS - Open modal to set preference
          // ═══════════════════════════════════════════════════════════════
          case 'diet_prefs':
            setTimeout(() => setActiveModal('diet_preference'), 500);
            break;
          case 'food_allergies':
            setTimeout(() => setActiveModal('food_allergies'), 500);
            break;
          case 'cuisine_prefs':
            setTimeout(() => setActiveModal('cuisine_preference'), 500);
            break;
          case 'dine_out':
            setTimeout(() => setActiveModal('dine_out_frequency'), 500);
            break;
          case 'ethnicity':
            setTimeout(() => setActiveModal('cultural_background'), 500);
            break;
          case 'bmi_ratio':
            setTimeout(() => setActiveModal('body_metrics'), 500);
            break;
          case 'cravings_healthy':
            setTimeout(() => setActiveModal('cravings'), 500);
            break;

          // ═══════════════════════════════════════════════════════════════
          // SPECIAL REWARDS - Non-modal actions
          // ═══════════════════════════════════════════════════════════════
          case 'streak_freeze':
            // Freeze token is automatically added by backend
            // Show confirmation toast
            console.log('✅ Streak freeze token claimed! You can now protect your streak.');
            break;

          case 'symptom_patterns':
            // Navigate to InsightsScreen to view analytics
            setTimeout(() => {
              navigation.navigate('InsightsScreen');
            }, 500);
            break;

          case 'plan_refresh_2x':
            // Refresh limit is automatically doubled by backend
            console.log('✅ 2x plan refresh unlocked! You can now refresh actions twice per day.');
            break;

          case 'first_improvement':
            // Badge is automatically marked - show celebration
            console.log('🏆 Congratulations! You\'ve unlocked the First Improvement badge!');
            setTimeout(() => {
              Alert.alert(
                '🏆 First Improvement!',
                'Congratulations! You\'ve noticed your first symptom improvement. This badge is now displayed in your profile!',
                [{ text: 'Amazing!', style: 'default' }]
              );
            }, 500);
            break;

          default:
            console.log('Unknown reward:', rewardId);
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaimingRewardId(null);
    }
  };

  const getRewardState = (item: RewardItem): RewardState => {
    // Use API data if available
    if (rewardsData) {
      // Frontend IDs now match backend IDs directly - no mapping needed
      const apiReward = rewardsData.rewards.find(r => r.id === item.id);
      if (apiReward) {
        if (apiReward.state === 'claimed') return 'claimed';
        if (apiReward.state === 'available') return 'available';
        return 'in_progress';
      }
    }
    // Fallback to local calculation
    if (currentStreakDays >= item.requiredStreakDays) return 'available';
    return 'in_progress';
  };

  // Dynamic reward organization based on current state
  // ═══════════════════════════════════════════════════════════════════════════════
  // REWARDS CONFIG - Must match backend REWARDS_CONFIG exactly
  // Source of truth: /app/services/streak_service.py
  // ═══════════════════════════════════════════════════════════════════════════════
  const getAllRewards = (): RewardItem[] => {
    return [
      // SEED REWARDS (days 1-15)
      {
        id: "streak_freeze",  // Backend ID
        title: "Streak freeze",
        description: "Protect your streak when you miss a day",
        icon: "🧊",
        backgroundColor: COLORS.lightBlue,
        streak: "3 day streak",
        requiredStreakDays: 3,
        state: 'in_progress',
      },
      {
        id: "diet_prefs",
        title: "Diet preferences",
        description: "Personalize recommendations to your diet",
        icon: "🥗",
        backgroundColor: COLORS.lightViolet,
        streak: "7 day streak",
        requiredStreakDays: 7,
        state: 'in_progress',
      },
      {
        id: "food_allergies",
        title: "Food Allergies",
        description: "Skip foods that don't work for your body",
        icon: "🥜",
        backgroundColor: COLORS.lightViolet,
        streak: "8 day streak",
        requiredStreakDays: 8,
        state: 'in_progress',
      },
      {
        id: "cuisine_prefs",
        title: "Cuisine preferences",
        description: "The plan adapts to your favorite cuisines",
        icon: "🥘",
        backgroundColor: COLORS.lightViolet,
        streak: "12 day streak",
        requiredStreakDays: 12,
        state: 'in_progress',
      },
      {
        id: "symptom_patterns",
        title: "Symptom patterns unlocked",
        description: "Understand your bodily trends",
        icon: "✨",
        backgroundColor: COLORS.lightYellow,
        streak: "14 day streak",
        requiredStreakDays: 14,
        state: 'in_progress',
      },
      {
        id: "dine_out",
        title: "Dine out habits",
        description: "Healthier alternatives to your fav orders",
        icon: "🍔",
        backgroundColor: COLORS.lightViolet,
        streak: "14 day streak",
        requiredStreakDays: 14,
        state: 'in_progress',
      },
      // RISE REWARDS (days 16+)
      {
        id: "plan_refresh_2x",
        title: "2x plan refresh",
        description: "Double your daily action refreshes",
        icon: "🔄",
        backgroundColor: COLORS.lightBlue,
        streak: "16 day streak",
        requiredStreakDays: 16,
        state: 'in_progress',
      },
      {
        id: "ethnicity",
        title: "Cultural preferences",
        description: "Tailor the plan to your traditions & lifestyle",
        icon: "🌏",
        backgroundColor: COLORS.lightViolet,
        streak: "18 day streak",
        requiredStreakDays: 18,
        state: 'in_progress',
      },
      {
        id: "bmi_ratio",
        title: "Body metrics",
        description: "Adjust actions to your body's unique profile",
        icon: "⚖️",
        backgroundColor: COLORS.lightViolet,
        streak: "18 day streak",
        requiredStreakDays: 18,
        state: 'in_progress',
      },
      {
        id: "cravings_healthy",
        title: "Cravings made healthy",
        description: "Get healthy alternatives for your cravings",
        icon: "🥮",
        backgroundColor: COLORS.lightViolet,
        streak: "18 day streak",
        requiredStreakDays: 18,
        state: 'in_progress',
      },
      {
        id: "first_improvement",
        title: "First signs of improvement",
        description: "You'll start to feel relief for top concerns",
        icon: "🏆",
        backgroundColor: COLORS.lightYellow,
        streak: "21 day streak",
        requiredStreakDays: 21,
        state: 'in_progress',
      },
    ];
  };

  // Dynamically filter rewards based on their current state
  const seedRewards = getAllRewards().filter(item => {
    const state = getRewardState(item);
    return state === 'claimed' || state === 'available';
  }).map(item => {
    const state = getRewardState(item);

    // Define button config for both available AND claimed states
    const getButtonConfig = (rewardId: string, rewardState: string) => {
      switch (rewardId) {
        case 'streak_freeze':
          return rewardState === 'claimed'
            ? { buttonText: "", buttonStyle: 'collected' as const, hasButton: false }
            : { buttonText: "Claim", buttonStyle: 'action' as const, hasButton: true };
        case 'plan_refresh_2x':
          return rewardState === 'claimed'
            ? { buttonText: "", buttonStyle: 'collected' as const, hasButton: false }
            : { buttonText: "Claim", buttonStyle: 'action' as const, hasButton: true };
        case 'symptom_patterns':
          // When unlocked, just show checkmark - no View Insights button (effect is in Insights screen)
          return rewardState === 'claimed'
            ? { buttonText: "", buttonStyle: 'collected' as const, hasButton: false }
            : { buttonText: "Claim", buttonStyle: 'action' as const, hasButton: true };
        case 'first_improvement':
          return rewardState === 'claimed'
            ? { buttonText: "", buttonStyle: 'collected' as const, hasButton: false }
            : { buttonText: "Claim", buttonStyle: 'action' as const, hasButton: true };
        default:
          // All preference rewards - show "Edit" when claimed, "Personalize now" when available
          if (rewardState === 'claimed') {
            return { buttonText: "Edit ✏️", buttonStyle: 'action' as const, hasButton: true };
          }
          return { buttonText: "Personalize now", buttonStyle: 'action' as const, hasButton: true };
      }
    };

    const config = getButtonConfig(item.id, state);
    return {
      ...item,
      hasButton: config.hasButton,
      buttonText: config.buttonText,
      buttonStyle: config.buttonStyle
    };
  });

  const growRewards = getAllRewards().filter(item => {
    const state = getRewardState(item);
    return state === 'in_progress' && item.requiredStreakDays < 16;
  });

  const riseRewards = getAllRewards().filter(item => {
    // Rise rewards are those with higher streak requirements (16+ days) and in progress
    const state = getRewardState(item);
    return state === 'in_progress' && item.requiredStreakDays >= 16;
  });

  if (!fontsLoaded) {
    return null; // or a loading component
  }

  // Dynamic milestones based on current streak - 3 states: completed, active, locked
  const getMilestoneState = (dayThreshold: number, nextThreshold?: number): MilestoneState => {
    if (nextThreshold) {
      // Has a next threshold - check if we've passed this range
      if (currentStreakDays >= nextThreshold) {
        return 'completed';  // Past this milestone entirely
      } else if (currentStreakDays >= dayThreshold) {
        return 'active';     // Currently in this milestone range
      }
      return 'locked';       // Haven't reached this milestone yet
    } else {
      // No next threshold - this is the last milestone
      if (currentStreakDays >= dayThreshold) {
        return 'active';     // Reached the final milestone
      }
      return 'locked';
    }
  };

  const milestones: Milestone[] = [
    { id: "1", name: "Seed", day: "Day 7", dayNumber: 7, state: getMilestoneState(7, 30) },
    { id: "2", name: "Grow", day: "Day 30", dayNumber: 30, state: getMilestoneState(30, 60) },
    { id: "3", name: "Rise", day: "Day 60", dayNumber: 60, state: getMilestoneState(60, 180) },
    { id: "4", name: "Peak", day: "Day 180", dayNumber: 180, state: getMilestoneState(180, 270) },
    { id: "5", name: "Glow", day: "Day 270", dayNumber: 270, state: getMilestoneState(270) },
  ];



  return (
    <SafeAreaView style={styles.container} edges={isAndroid ? [] : []}>
      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            }
          ]}
          pointerEvents="none"
        >
          <Text style={styles.celebrationEmoji}>{celebrationEmoji}</Text>
        </Animated.View>
      )}
      <StatusBar style="dark" backgroundColor={isAndroid ? COLORS.background : COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={isIOS}
        overScrollMode={isAndroid ? "never" : "auto"}
      >
        <LabsSection onBackPress={navigateToIndex} />

        <StreakSection
          currentStreakDays={currentStreakDays}
          milestones={milestones}
        />

        {/* Your Preferences & Tokens Section */}
        {/* ... (Existing preference item code remains here for now, could be moved to another component later) ... */}
        {(rewardsData || preferencesData) && (
          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesSectionTitle}>Your Status</Text>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>🧊 Streak Freeze</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={styles.preferenceValue}>{rewardsData?.freeze_count ?? 0}</Text>
                {/* ... existing freeze token logic ... */}
              </View>
            </View>

            {/* Refresh Status */}
            {rewardsData?.refresh_status && (
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>🔄 Daily Refreshes</Text>
                <Text style={styles.preferenceValue}>
                  {rewardsData.refresh_status.remaining}/{rewardsData.refresh_status.limit}
                </Text>
              </View>
            )}

            {/* Dynamic Preferences List */}
            {preferencesData && (
              <>
                {preferencesData.preferences.diet_preference && (
                  <TouchableOpacity style={styles.preferenceItem} onPress={() => setActiveModal('diet_preference')}>
                    <Text style={styles.preferenceLabel}>🥗 Diet</Text>
                    <Text style={styles.preferenceValue}>{preferencesData.preferences.diet_preference}</Text>
                  </TouchableOpacity>
                )}
                {/* ... Add other preferences here ... */}
              </>
            )}
          </View>
        )}

        <RewardsList
          seedRewards={seedRewards}
          growRewards={growRewards}
          riseRewards={riseRewards}
          onRewardAction={handleRewardAction}
          currentStreakDays={currentStreakDays}
        />

      </ScrollView>

      {/* Preference Modals */}
      <PreferenceModal
        visible={activeModal === 'diet_preference'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        preferenceType="diet_preference"
        title="🥗 Diet Preference"
        subtitle="We'll personalize your food recommendations"
        options={preferencesData?.preference_options?.diet_preference || []}
        currentValue={preferencesData?.preferences?.diet_preference}
        isMultiSelect={false}
      />

      <PreferenceModal
        visible={activeModal === 'food_allergies'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        preferenceType="food_allergies"
        title="🥜 Food Allergies"
        subtitle="We'll never recommend these foods"
        options={preferencesData?.preference_options?.food_allergies || []}
        currentValue={preferencesData?.preferences?.food_allergies}
        isMultiSelect={true}
      />

      <PreferenceModal
        visible={activeModal === 'cuisine_preference'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        preferenceType="cuisine_preference"
        title="🥘 Cuisine Preferences"
        subtitle="Select your favorite cuisines"
        options={preferencesData?.preference_options?.cuisine_preference || []}
        currentValue={preferencesData?.preferences?.cuisine_preference}
        isMultiSelect={true}
      />

      <PreferenceModal
        visible={activeModal === 'dine_out_frequency'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        preferenceType="dine_out_frequency"
        title="🍔 Dining Out Frequency"
        subtitle="How often do you eat out?"
        options={preferencesData?.preference_options?.dine_out_frequency || []}
        currentValue={preferencesData?.preferences?.dine_out_frequency}
        isMultiSelect={false}
      />

      <PreferenceModal
        visible={activeModal === 'cultural_background'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        preferenceType="cultural_background"
        title="🌏 Cultural Background"
        subtitle="For culturally appropriate recommendations"
        options={preferencesData?.preference_options?.cultural_background || []}
        currentValue={preferencesData?.preferences?.cultural_background}
        isMultiSelect={false}
      />

      <BodyMetricsModal
        visible={activeModal === 'body_metrics'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        currentMetrics={preferencesData?.preferences?.body_metrics}
      />

      <CravingsModal
        visible={activeModal === 'cravings'}
        onClose={() => setActiveModal(null)}
        onSaved={loadRewardsData}
        currentCravings={preferencesData?.preferences?.cravings}
      />

      {/* ... Other Modals ... */}

      {/* Streak Milestone Celebration Modal */}
      <StreakMilestoneModal
        visible={milestoneToShow !== null}
        milestone={milestoneToShow || 7}
        onClose={async () => {
          if (milestoneToShow) {
            await markMilestoneCelebrated(milestoneToShow);
          }
          setMilestoneToShow(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: isAndroid ? verticalScale(20) : 0,
  },
  preferencesSection: {
    marginHorizontal: scale(20),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(8),
    backgroundColor: '#F8F4FF',
    borderRadius: moderateScale(16),
    padding: scale(14),
  },
  preferencesSectionTitle: {
    fontSize: moderateScale(16, 1.5),
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: '#4A3D5C',
    marginBottom: verticalScale(8),
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1F0',
  },
  preferenceLabel: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: '#6B5B7A',
  },
  preferenceValue: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: '#8B5CF6',
    maxWidth: '50%',
    textAlign: 'right',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  celebrationEmoji: {
    fontSize: moderateScale(100),
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
});
