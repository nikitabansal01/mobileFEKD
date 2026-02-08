/**
 * DailyReviewModal - Optimized Version
 * 
 * A production-grade review modal that:
 * - Shows all 4 action items as cards simultaneously
 * - Uses the app's design system (Colors, Fonts)
 * - Has smooth animations throughout (using LayoutAnimation for performance)
 * - Handles all review statuses properly
 * - Matches the app's visual style perfectly
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Design System Imports
import { BRAND, BRAND_GRADIENT, TEXT, BACKGROUND, BORDER, UI } from '@/constants/Colors';
import { FONT_INTER, FONT_SERIF, TYPOGRAPHY } from '@/constants/fonts';
import PrimaryButton from './PrimaryButton';
import homeService, {
  DailyReviewItemStatus,
  DailyReviewResponse,
  PendingReviewItemInfo,
  PendingReviewResponse,
} from '@/services/homeService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface DailyReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewData: PendingReviewResponse | null;
  onReviewComplete: (result: DailyReviewResponse) => void;
  isMandatory?: boolean;
  onSubmit?: (data: DailyReviewRequest) => void; // New prop for external handling
}

type ReviewStatus = 'forgot_to_mark' | 'replaced' | 'skipped' | 'was_completed';

interface ItemReviewState {
  item_id: number;
  status: ReviewStatus | null;
  replacement_text: string;
  replacement_category: string;
  other_reason: string;
}

interface ReviewDraft {
  planId: number;
  reviewDate: string;
  currentStep: 1 | 2 | 3 | 4;
  itemStates: [number, ItemReviewState][];
  useFreeze: boolean;
  savedAt: string;
  version: 1;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAFT_STORAGE_KEY_PREFIX = 'daily_review_draft_';
const DRAFT_EXPIRY_HOURS = 48;
const AUTO_SAVE_DELAY_MS = 3000;

const STATUS_OPTIONS = [
  {
    id: 'was_completed' as ReviewStatus,
    emoji: '✅',
    label: 'Done',
    sublabel: 'Already marked',
    color: UI.successGreen,
  },
  {
    id: 'forgot_to_mark' as ReviewStatus,
    emoji: '💭',
    label: 'Did it',
    sublabel: 'Forgot to mark',
    color: BRAND.warmPurple,
  },
  {
    id: 'replaced' as ReviewStatus,
    emoji: '🔄',
    label: 'Swapped',
    sublabel: 'Did something else',
    color: BRAND.accent,
  },
  {
    id: 'skipped' as ReviewStatus,
    emoji: '⏭️',
    label: 'Skipped',
    sublabel: "Couldn't do it",
    color: UI.warningYellow,
  },
];

const REPLACEMENT_CATEGORIES = [
  { id: 'healthier_option', emoji: '🥗', text: 'Healthier' },
  { id: 'no_time', emoji: '⏰', text: 'Time constraint' },
  { id: 'no_ingredients', emoji: '🛒', text: 'No ingredients' },
  { id: 'different_activity', emoji: '🔄', text: 'Different activity' },
  { id: 'other', emoji: '💬', text: 'Other' },
];

const MIN_REPLACEMENT_TEXT_LENGTH = 3;
const MAX_REPLACEMENT_TEXT_LENGTH = 200;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCategoryIcon = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'food': return '🍽️';
    case 'movement':
    case 'exercise': return '🏃';
    case 'mindfulness':
    case 'pause': return '🧘';
    default: return '✨';
  }
};

const getTimeSlotIcon = (timeSlot: string): string => {
  switch (timeSlot?.toLowerCase()) {
    case 'morning': return '🌤️';
    case 'afternoon': return '☀️';
    case 'evening':
    case 'night': return '🌙';
    default: return '⏰';
  }
};

// ============================================================================
// SUB-COMPONENTS (Memoized for Performance)
// ============================================================================

const ReviewCard = React.memo(({
  item,
  state,
  onStatusSelect
}: {
  item: PendingReviewItemInfo,
  state: ItemReviewState | undefined,
  onStatusSelect: (itemId: number, status: ReviewStatus) => void
}) => {
  const selectedStatus = state?.status;

  return (
    <View style={[styles.actionCard, selectedStatus && styles.actionCardSelected]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        {item.hero_image_url ? (
          <Image source={{ uri: item.hero_image_url }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>{getCategoryIcon(item.category)}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title.replace('[Carried Forward] ', '')}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>
              {getTimeSlotIcon(item.time_slot)} {item.time_slot}
            </Text>
            {item.is_completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓ Done</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Status Options */}
      <View style={styles.statusGrid}>
        {STATUS_OPTIONS.map((option) => {
          // Skip "was_completed" if item wasn't already completed
          if (option.id === 'was_completed' && !item.is_completed) return null;
          // Skip other options if item was already completed (only show was_completed)
          if (option.id !== 'was_completed' && item.is_completed) return null;

          const isSelected = selectedStatus === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.statusOption,
                isSelected && [styles.statusOptionSelected, { borderColor: option.color }],
              ]}
              onPress={() => onStatusSelect(item.id, option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.statusEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.statusLabel,
                isSelected && { color: option.color },
              ]}>
                {option.label}
              </Text>
              <Text style={styles.statusSublabel}>{option.sublabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const ReplacementCard = React.memo(({
  item,
  state,
  onTextChange,
  onCategorySelect,
  onOtherReasonChange
}: {
  item: PendingReviewItemInfo,
  state: ItemReviewState,
  onTextChange: (itemId: number, text: string) => void,
  onCategorySelect: (itemId: number, category: string) => void,
  onOtherReasonChange: (itemId: number, text: string) => void
}) => {
  const charCount = state.replacement_text.length;
  const isValid = charCount >= MIN_REPLACEMENT_TEXT_LENGTH;

  return (
    <View style={styles.replacementCard}>
      <Text style={styles.replacementItemTitle}>
        🔄 Instead of: {item.title.replace('[Carried Forward] ', '')}
      </Text>

      <TextInput
        style={[
          styles.replacementInput,
          !isValid && charCount > 0 && styles.replacementInputError,
          isValid && styles.replacementInputValid,
        ]}
        placeholder="What did you do instead?"
        placeholderTextColor={TEXT.greyLight}
        value={state.replacement_text}
        onChangeText={(text) => onTextChange(item.id, text)}
        multiline
        maxLength={MAX_REPLACEMENT_TEXT_LENGTH}
      />

      <View style={styles.inputFooter}>
        <Text style={[styles.charCount, isValid && styles.charCountValid]}>
          {isValid ? '✓ ' : ''}{charCount}/{MIN_REPLACEMENT_TEXT_LENGTH}+ chars
        </Text>
      </View>

      <Text style={styles.categoryLabel}>Why did you swap? 👆</Text>
      <View style={styles.categoryChips}>
        {REPLACEMENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              state.replacement_category === cat.id && styles.categoryChipSelected,
            ]}
            onPress={() => onCategorySelect(item.id, cat.id)}
          >
            <Text style={[
              styles.categoryChipText,
              state.replacement_category === cat.id && styles.categoryChipTextSelected,
            ]}>
              {cat.emoji} {cat.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show text input when 'Other' is selected */}
      {state.replacement_category === 'other' && (
        <View style={styles.otherReasonContainer}>
          <TextInput
            style={styles.otherReasonInput}
            placeholder="Please specify your reason..."
            placeholderTextColor={TEXT.greyLight}
            value={state.other_reason}
            onChangeText={(text) => onOtherReasonChange(item.id, text)}
            maxLength={100}
          />
        </View>
      )}
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  visible,
  onClose,
  reviewData,
  onReviewComplete,
  isMandatory = true,
  onSubmit, // New prop
}) => {
  // Step management: 1=Intro, 2=All Cards Review, 3=Replacement Details, 4=Streak Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [itemReviewStates, setItemReviewStates] = useState<Map<number, ItemReviewState>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<DailyReviewResponse | null>(null);
  const [useFreeze, setUseFreeze] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const lastPlanIdRef = useRef<number | null>(null);

  // Reset state when plan changes or modal reopens with new data
  useEffect(() => {
    if (visible && reviewData?.plan_id && reviewData.plan_id !== lastPlanIdRef.current) {
      console.log('📋 New review data detected, resetting state');
      lastPlanIdRef.current = reviewData.plan_id;
      setIsDraftLoaded(false);
      setCurrentStep(1);
      setReviewResult(null);
      setItemReviewStates(new Map());
    }
  }, [visible, reviewData?.plan_id]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // ============================================================================
  // DRAFT PERSISTENCE
  // ============================================================================

  const getDraftKey = useCallback((): string | null => {
    if (!reviewData?.plan_id) return null;
    return `${DRAFT_STORAGE_KEY_PREFIX}${reviewData.plan_id}`;
  }, [reviewData?.plan_id]);

  const saveDraft = useCallback(async () => {
    const draftKey = getDraftKey();
    if (!draftKey || !reviewData) return;

    try {
      const draft: ReviewDraft = {
        planId: reviewData.plan_id!,
        reviewDate: reviewData.review_date!,
        currentStep,
        itemStates: Array.from(itemReviewStates.entries()),
        useFreeze,
        savedAt: new Date().toISOString(),
        version: 1,
      };

      const draftJson = JSON.stringify(draft);
      if (draftJson !== lastSavedStateRef.current) {
        await AsyncStorage.setItem(draftKey, draftJson);
        lastSavedStateRef.current = draftJson;
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [getDraftKey, reviewData, currentStep, itemReviewStates, useFreeze]);

  const loadDraft = useCallback(async (): Promise<ReviewDraft | null> => {
    const draftKey = getDraftKey();
    if (!draftKey) return null;

    try {
      const draftJson = await AsyncStorage.getItem(draftKey);
      if (!draftJson) return null;

      const draft: ReviewDraft = JSON.parse(draftJson);
      // Check expiry...
      return draft;
    } catch (error) {
      return null;
    }
  }, [getDraftKey]);

  const clearDraft = useCallback(async () => {
    const draftKey = getDraftKey();
    if (!draftKey) return;
    try {
      await AsyncStorage.removeItem(draftKey);
      lastSavedStateRef.current = '';
    } catch (error) { }
  }, [getDraftKey]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize
  useEffect(() => {
    if (reviewData?.items && !isDraftLoaded) {
      const initializeReview = async () => {
        const draft = await loadDraft();
        if (draft) {
          // Simplified resume logic for speed
          setCurrentStep(draft.currentStep);
          setItemReviewStates(new Map(draft.itemStates));
          setUseFreeze(draft.useFreeze);
          setIsDraftLoaded(true);
          return;
        }

        const initialStates = new Map<number, ItemReviewState>();
        reviewData.items.forEach((item) => {
          initialStates.set(item.id, {
            item_id: item.id,
            status: item.is_completed ? 'was_completed' : null,
            replacement_text: '',
            replacement_category: '',
            other_reason: '',
          });
        });
        setItemReviewStates(initialStates);
        setCurrentStep(1);
        setReviewResult(null);
        setUseFreeze(false);
        setIsDraftLoaded(true);
      };
      initializeReview();
    }
  }, [reviewData, isDraftLoaded, loadDraft]);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStatusSelect = useCallback((itemId: number, status: ReviewStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || {
        item_id: itemId,
        status: null,
        replacement_text: '',
        replacement_category: '',
        other_reason: '',
      };
      newMap.set(itemId, { ...existing, status });
      return newMap;
    });
  }, []);

  const handleReplacementTextChange = useCallback((itemId: number, text: string) => {
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, replacement_text: text });
      }
      return newMap;
    });
  }, []);

  const handleReplacementCategorySelect = useCallback((itemId: number, category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, replacement_category: category });
      }
      return newMap;
    });
  }, []);

  const handleOtherReasonChange = useCallback((itemId: number, text: string) => {
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, other_reason: text });
      }
      return newMap;
    });
  }, []);

  const changeStep = (step: 1 | 2 | 3 | 4) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(step);
  };

  const handleContinueFromCards = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const hasReplacements = Array.from(itemReviewStates.values()).some(s => s.status === 'replaced');
    changeStep(hasReplacements ? 3 : 4);
  };

  const handleSubmitReview = async () => {
    if (!reviewData?.plan_id) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const items: DailyReviewItemStatus[] = Array.from(itemReviewStates.values())
        .filter((state) => state.status !== null)
        .map((state) => ({
          item_id: state.item_id,
          status: state.status!,
          replacement_text: state.status === 'replaced' ? state.replacement_text : undefined,
          replacement_category: state.status === 'replaced' ? state.replacement_category : undefined,
        }));

      // If external handler provided, use it (Fire-and-forget flow)
      if (onSubmit) {
        const payload: DailyReviewRequest = {
          plan_id: reviewData.plan_id,
          items,
          use_freeze: useFreeze
        };

        await clearDraft(); // Clear draft immediately
        onSubmit(payload); // Hand off to parent
        return;
      }

      // Default internal behavior (Blocking)
      const result = await homeService.submitDailyReview(reviewData.plan_id, items, useFreeze);

      if (result?.success) {
        await clearDraft();
        setReviewResult(result);
        onReviewComplete(result);
      } else {
        Alert.alert('Error', result?.error || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDERERS
  // ============================================================================

  const getFormattedDateInfo = () => {
    if (!reviewData?.review_date) {
      return { label: 'Yesterday', fullDate: '' };
    }

    const reviewDate = new Date(reviewData.review_date + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

    let label = '';
    if (daysDiff <= 1) {
      label = 'Yesterday';
    } else if (daysDiff === 2) {
      label = '2 Days Ago';
    } else {
      label = reviewDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    const fullDate = reviewDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return { label, fullDate };
  };

  const renderIntroStep = () => {
    const dateInfo = getFormattedDateInfo();
    const completedCount = reviewData?.completed_count || 0;
    const totalItems = reviewData?.total_items || reviewData?.items?.length || 0;
    const incompleteCount = totalItems - completedCount;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.introHeader}>
          <LinearGradient
            colors={[BRAND.gradPurple, BRAND.warmPurple, BRAND.gradPink]}
            style={styles.introGradientCircle}
          >
            <Text style={styles.introEmoji}>📋</Text>
          </LinearGradient>
        </View>

        {/* Yesterday Badge - Clear Date Context */}
        <View style={styles.yesterdayBadge}>
          <Text style={styles.yesterdayLabel}>{dateInfo.label}</Text>
          {dateInfo.fullDate && (
            <Text style={styles.yesterdayDate}>{dateInfo.fullDate}</Text>
          )}
        </View>

        <Text style={styles.introTitle}>Let's reflect on your actions</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, incompleteCount > 0 && styles.statNumberWarning]}>{incompleteCount}</Text>
            <Text style={styles.statLabel}>Incomplete</Text>
          </View>
        </View>

        {reviewData?.was_frozen && (
          <View style={styles.frozenBadge}>
            <Text style={styles.frozenText}>🧊 This day was frozen</Text>
          </View>
        )}

        <Text style={styles.introSubtitle}>
          Quick check: What really happened with each action? This helps us make tomorrow even better! 💫
        </Text>

        <PrimaryButton
          title="Let's Review →"
          onPress={() => changeStep(2)}
          style={styles.primaryBtn}
        />
      </View>
    );
  };

  const renderAllCardsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>What happened?</Text>
      <View style={styles.cardsScrollView}>
        {reviewData?.items?.map((item) => (
          <ReviewCard
            key={item.id}
            item={item}
            state={itemReviewStates.get(item.id)}
            onStatusSelect={handleStatusSelect}
          />
        ))}
      </View>
      <PrimaryButton
        title="Continue →"
        onPress={handleContinueFromCards}
        disabled={!reviewData?.items?.every(i => itemReviewStates.get(i.id)?.status !== null)}
        style={styles.primaryBtn}
      />
    </View>
  );

  const renderReplacementDetailsStep = () => {
    const itemsToDetail = Array.from(itemReviewStates.values()).filter(s => s.status === 'replaced');
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>What did you do instead?</Text>
        <View style={styles.replacementScrollView}>
          {itemsToDetail.map((state) => {
            const item = reviewData?.items?.find(i => i.id === state.item_id);
            if (!item) return null;
            return (
              <ReplacementCard
                key={state.item_id}
                item={item}
                state={state}
                onTextChange={handleReplacementTextChange}
                onCategorySelect={handleReplacementCategorySelect}
                onOtherReasonChange={handleOtherReasonChange}
              />
            );
          })}
        </View>
        <PrimaryButton
          title="Continue →"
          onPress={() => changeStep(4)}
          style={styles.primaryBtn}
        />
      </View>
    );
  };

  const renderStreakResolutionStep = () => {
    // Calculate streak outcome BEFORE submit
    const getCompletedAfterReview = () => {
      let count = 0;
      itemReviewStates.forEach((state) => {
        if (state.status === 'was_completed' || state.status === 'forgot_to_mark' || state.status === 'replaced') {
          count++;
        }
      });
      return count;
    };

    const getSkippedCount = () => {
      let count = 0;
      itemReviewStates.forEach((state) => {
        if (state.status === 'skipped') count++;
      });
      return count;
    };

    const completedAfterReview = getCompletedAfterReview();
    const skippedCount = getSkippedCount();
    const totalItems = reviewData?.total_items ?? reviewData?.items?.length ?? 0;
    // Streak rule: maintain with at least 1 completion (or empty plan)
    const streakMaintained = totalItems === 0 || completedAfterReview > 0;
    const allActionsCompleted = totalItems > 0 && completedAfterReview === totalItems;
    const canUseFreeze = !streakMaintained && (reviewData?.freezes_available || 0) > 0;

    // AFTER submission - show result
    if (reviewResult) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.resultContent}>
            {reviewResult.streak_maintained ? (
              <>
                <Text style={styles.resultEmoji}>🔥</Text>
                <Text style={styles.resultTitle}>Streak Maintained!</Text>
                <Text style={styles.resultSubtitle}>{reviewResult.message}</Text>
                {reviewResult.freezes_used > 0 && (
                  <View style={styles.freezeUsedBadge}>
                    <Text style={styles.freezeUsedText}>
                      🧊 Used {reviewResult.freezes_used} freeze token
                    </Text>
                  </View>
                )}
                <View style={styles.streakBadgeFinal}>
                  <Text style={styles.streakBadgeFinalText}>
                    🔥 {reviewResult.new_streak_count} Day Streak
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.resultEmoji}>💪</Text>
                <Text style={styles.resultTitle}>Fresh Start!</Text>
                <Text style={styles.resultSubtitle}>{reviewResult.message}</Text>
                <Text style={styles.encouragementText}>
                  Every day is a new opportunity. Let's make today count!
                </Text>
              </>
            )}
          </View>
          <PrimaryButton title="Let's Go! 🚀" onPress={onClose} style={styles.primaryBtn} />
        </View>
      );
    }

    // BEFORE submission - show preview
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Review Summary</Text>

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>✅ Completed</Text>
            <Text style={styles.summaryValue}>{completedAfterReview}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>⏭️ Skipped</Text>
            <Text style={[styles.summaryValue, skippedCount > 0 && styles.summaryValueWarning]}>{skippedCount}</Text>
          </View>
        </View>

        {/* Streak Status Preview */}
        {reviewData?.was_frozen ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🧊</Text>
            <Text style={styles.streakTitle}>Day Was Frozen</Text>
            <Text style={styles.streakSubtitle}>Your streak is safe!</Text>
          </View>
        ) : streakMaintained ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakTitle}>Streak Maintained!</Text>
            <Text style={styles.streakSubtitle}>
              {allActionsCompleted
                ? 'All actions completed — awesome!'
                : 'At least 1 action completed — your streak is safe!'}
            </Text>
          </View>
        ) : (
          <View style={[styles.streakCard, styles.streakAtRiskCard]}>
            <Text style={styles.streakEmoji}>⚠️</Text>
            <Text style={styles.streakTitle}>Streak at Risk</Text>
            <Text style={styles.streakSubtitle}>{skippedCount} action(s) were skipped.</Text>

            {canUseFreeze ? (
              <>
                {!useFreeze && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚡ Your streak will reset to 0 without a freeze
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.freezeOption, useFreeze && styles.freezeOptionSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setUseFreeze(!useFreeze);
                  }}
                >
                  <View style={[styles.freezeCheckbox, useFreeze && styles.freezeCheckboxSelected]}>
                    {useFreeze && <Text style={styles.freezeCheckmark}>✓</Text>}
                  </View>
                  <View style={styles.freezeOptionContent}>
                    <Text style={styles.freezeOptionText}>Use 1 freeze token 🧊</Text>
                    <Text style={styles.freezeAvailableText}>{reviewData?.freezes_available} available</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noFreezeWarning}>
                <Text style={styles.noFreezeText}>😔 No freeze tokens available</Text>
                <Text style={styles.noFreezeSubtext}>
                  Your streak will reset, but don't worry — today is a fresh start!
                </Text>
              </View>
            )}
          </View>
        )}

        <PrimaryButton
          title={isSubmitting ? "Submitting..." : "Complete Review ✨"}
          onPress={handleSubmitReview}
          disabled={isSubmitting}
          style={styles.primaryBtn}
        />
        {isSubmitting && (
          <ActivityIndicator color={BRAND.warmPurple} style={{ marginTop: responsiveHeight(2) }} />
        )}
      </View>
    );
  };

  const handleModalClose = useCallback(() => {
    if (isMandatory && !reviewResult) {
      Alert.alert(
        'Review Required',
        "Please complete your daily review before continuing. This helps us personalize your next action plan! 💜",
        [{ text: 'Continue Review', style: 'cancel' }]
      );
      return;
    }
    onClose();
  }, [isMandatory, reviewResult, onClose]);

  if (!visible) return null;

  const isLoading = !reviewData || !reviewData.items || !isDraftLoaded;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <LinearGradient colors={[BACKGROUND.purpleTint, BACKGROUND.white]} style={styles.header}>
            <Text style={styles.headerTitle}>Daily Review</Text>
            {(!isMandatory || reviewResult) ? (
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose} disabled={isSubmitting}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryBadgeText}>Required</Text>
              </View>
            )}
          </LinearGradient>

          {/* Progress Indicator */}
          {!reviewResult && !isLoading && (
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.progressDot,
                    currentStep >= step && styles.progressDotActive,
                    currentStep === step && styles.progressDotCurrent,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Content Area */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND.warmPurple} />
              <Text style={styles.loadingText}>Loading your review...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {currentStep === 1 && renderIntroStep()}
              {currentStep === 2 && renderAllCardsStep()}
              {currentStep === 3 && renderReplacementDetailsStep()}
              {currentStep === 4 && renderStreakResolutionStep()}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: BACKGROUND.white
  },
  keyboardView: {
    flex: 1
  },
  overlay: { flex: 1, backgroundColor: UI.overlay, justifyContent: 'center', alignItems: 'center' },
  container: { width: SCREEN_WIDTH * 0.94, minHeight: responsiveHeight(50), maxHeight: SCREEN_HEIGHT * 0.88, backgroundColor: BACKGROUND.white, borderRadius: moderateScale(24), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveHeight(2), paddingTop: responsiveHeight(2.5) },
  headerTitle: { fontSize: moderateScale(18), fontFamily: FONT_SERIF.medium, color: TEXT.secondary },
  closeButton: { width: responsiveWidth(8), height: responsiveWidth(8), borderRadius: responsiveWidth(4), backgroundColor: 'rgba(0, 0, 0, 0.08)', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: moderateScale(22), color: TEXT.grey, fontFamily: FONT_INTER.semiBold, marginTop: -2 },
  mandatoryBadge: { backgroundColor: BRAND.warmPurple, paddingHorizontal: responsiveWidth(3), paddingVertical: responsiveHeight(0.5), borderRadius: moderateScale(12) },
  mandatoryBadgeText: { fontSize: moderateScale(10), fontFamily: FONT_INTER.semiBold, color: TEXT.white },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: responsiveWidth(2), paddingBottom: responsiveHeight(1.5) },
  progressDot: { width: responsiveWidth(2.5), height: responsiveWidth(2.5), borderRadius: responsiveWidth(1.25), backgroundColor: BORDER.grey },
  progressDotActive: { backgroundColor: BRAND.gradPurple },
  progressDotCurrent: { width: responsiveWidth(6), borderRadius: responsiveWidth(1.25), backgroundColor: BRAND.warmPurple },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: responsiveHeight(10), minHeight: responsiveHeight(30) },
  loadingText: { marginTop: responsiveHeight(2), fontSize: moderateScale(14), fontFamily: FONT_INTER.medium, color: TEXT.muted },
  content: { width: '100%' },
  contentContainer: { padding: responsiveWidth(5), paddingBottom: responsiveHeight(4) },
  stepContainer: { width: '100%', minHeight: responsiveHeight(40) },

  // Intro Step
  introHeader: { alignItems: 'center', marginBottom: responsiveHeight(1) },
  introGradientCircle: { width: responsiveWidth(20), height: responsiveWidth(20), borderRadius: responsiveWidth(10), justifyContent: 'center', alignItems: 'center' },
  introEmoji: { fontSize: moderateScale(36) },
  yesterdayBadge: { alignItems: 'center', marginBottom: responsiveHeight(1.5), backgroundColor: BACKGROUND.purpleTint, paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveHeight(1), borderRadius: moderateScale(20), alignSelf: 'center', borderWidth: 1, borderColor: BRAND.gradPurple + '40' },
  yesterdayLabel: { fontSize: moderateScale(16), fontFamily: FONT_INTER.semiBold, color: BRAND.warmPurple, textTransform: 'uppercase', letterSpacing: 1 },
  yesterdayDate: { fontSize: moderateScale(11), fontFamily: FONT_INTER.regular, color: TEXT.muted, marginTop: responsiveHeight(0.3) },
  introTitle: { fontSize: moderateScale(22), fontFamily: FONT_SERIF.medium, color: TEXT.secondary, textAlign: 'center', marginBottom: responsiveHeight(2) },
  introSubtitle: { fontSize: moderateScale(13), fontFamily: FONT_INTER.regular, color: TEXT.muted, textAlign: 'center', marginBottom: responsiveHeight(2), lineHeight: moderateScale(19) },
  highlightText: { fontFamily: FONT_INTER.semiBold, color: BRAND.warmPurple },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: responsiveHeight(2) },
  statBox: { alignItems: 'center', paddingHorizontal: responsiveWidth(6) },
  statNumber: { fontSize: moderateScale(28), fontFamily: FONT_INTER.bold, color: UI.successGreen },
  statNumberWarning: { color: UI.warningYellow },
  statLabel: { fontSize: moderateScale(12), fontFamily: FONT_INTER.regular, color: TEXT.muted },
  statDivider: { width: 1, height: responsiveHeight(4), backgroundColor: BORDER.light },
  frozenBadge: { backgroundColor: BACKGROUND.lightBlue, paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveHeight(1), borderRadius: moderateScale(20), marginBottom: responsiveHeight(2), alignSelf: 'center' },
  frozenText: { fontSize: moderateScale(12), fontFamily: FONT_INTER.medium, color: '#0369A1' },
  primaryBtn: { width: '100%', marginTop: responsiveHeight(2) },

  // Cards Step
  sectionTitle: { fontSize: moderateScale(20), fontFamily: FONT_SERIF.medium, color: TEXT.secondary, marginBottom: responsiveHeight(2) },
  cardsScrollView: { marginBottom: responsiveHeight(2) },
  actionCard: { backgroundColor: BACKGROUND.white, borderRadius: moderateScale(16), padding: responsiveWidth(4), marginBottom: responsiveHeight(2), borderWidth: 2, borderColor: BORDER.light, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionCardSelected: { borderColor: BRAND.gradPurple, backgroundColor: BACKGROUND.purpleTint },
  cardHeader: { flexDirection: 'row', marginBottom: responsiveHeight(1.5) },
  cardImage: { width: responsiveWidth(14), height: responsiveWidth(14), borderRadius: moderateScale(12), marginRight: responsiveWidth(3) },
  cardIconContainer: { width: responsiveWidth(14), height: responsiveWidth(14), borderRadius: moderateScale(12), backgroundColor: BACKGROUND.lightViolet, justifyContent: 'center', alignItems: 'center', marginRight: responsiveWidth(3) },
  cardIcon: { fontSize: moderateScale(24) },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: moderateScale(14), fontFamily: FONT_INTER.semiBold, color: TEXT.secondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: responsiveWidth(2) },
  cardMetaText: { fontSize: moderateScale(11), fontFamily: FONT_INTER.regular, color: TEXT.muted },
  completedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: responsiveWidth(2), paddingVertical: responsiveHeight(0.3), borderRadius: moderateScale(8) },
  completedBadgeText: { fontSize: moderateScale(10), fontFamily: FONT_INTER.medium, color: '#166534' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: responsiveWidth(2) },
  statusOption: { flex: 1, minWidth: responsiveWidth(26), backgroundColor: BACKGROUND.white, borderRadius: moderateScale(12), padding: responsiveWidth(2.5), alignItems: 'center', borderWidth: 2, borderColor: BORDER.grey },
  statusOptionSelected: { backgroundColor: BACKGROUND.purpleTint },
  statusEmoji: { fontSize: moderateScale(20), marginBottom: responsiveHeight(0.3) },
  statusLabel: { fontSize: moderateScale(11), fontFamily: FONT_INTER.semiBold, color: TEXT.secondary, textAlign: 'center' },
  statusSublabel: { fontSize: moderateScale(8), fontFamily: FONT_INTER.regular, color: TEXT.greyLight, textAlign: 'center', marginTop: 1 },

  // Replacement Step
  replacementScrollView: { marginBottom: responsiveHeight(2) },
  replacementCard: { backgroundColor: BACKGROUND.purpleTint, borderRadius: moderateScale(16), padding: responsiveWidth(4), marginBottom: responsiveHeight(2) },
  replacementItemTitle: { fontSize: moderateScale(14), fontFamily: FONT_INTER.semiBold, color: TEXT.secondary, marginBottom: responsiveHeight(1.5) },
  replacementInput: { backgroundColor: BACKGROUND.white, borderRadius: moderateScale(12), padding: responsiveWidth(4), fontSize: moderateScale(14), fontFamily: FONT_INTER.regular, color: TEXT.secondary, minHeight: responsiveHeight(10), textAlignVertical: 'top', borderWidth: 2, borderColor: BORDER.light },
  replacementInputError: { borderColor: UI.dangerRed, backgroundColor: BACKGROUND.danger },
  replacementInputValid: { borderColor: UI.successGreen },
  inputFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: responsiveHeight(0.5) },
  charCount: { fontSize: moderateScale(10), fontFamily: FONT_INTER.regular, color: TEXT.greyLight },
  charCountValid: { color: UI.successGreen, fontFamily: FONT_INTER.medium },
  categoryLabel: { fontSize: moderateScale(12), fontFamily: FONT_INTER.medium, color: TEXT.muted, marginBottom: responsiveHeight(1), marginTop: responsiveHeight(1.5) },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: responsiveWidth(2) },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: BACKGROUND.white, paddingHorizontal: responsiveWidth(3), paddingVertical: responsiveHeight(0.8), borderRadius: moderateScale(20), borderWidth: 1.5, borderColor: BORDER.light },
  categoryChipSelected: { backgroundColor: BRAND.gradPink + '30', borderColor: BRAND.warmPurple },
  categoryChipText: { fontSize: moderateScale(11), fontFamily: FONT_INTER.regular, color: TEXT.grey },
  categoryChipTextSelected: { color: BRAND.warmPurple, fontFamily: FONT_INTER.medium },
  otherReasonContainer: { marginTop: responsiveHeight(1.5) },
  otherReasonInput: { backgroundColor: BACKGROUND.white, borderRadius: moderateScale(12), padding: responsiveWidth(3.5), fontSize: moderateScale(13), fontFamily: FONT_INTER.regular, color: TEXT.secondary, borderWidth: 1.5, borderColor: BORDER.light },

  // Streak Resolution Step
  summaryCard: { backgroundColor: BACKGROUND.purpleTint, borderRadius: moderateScale(16), padding: responsiveWidth(4), marginBottom: responsiveHeight(2) },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: responsiveHeight(0.8) },
  summaryLabel: { fontSize: moderateScale(13), fontFamily: FONT_INTER.regular, color: TEXT.secondary },
  summaryValue: { fontSize: moderateScale(16), fontFamily: FONT_INTER.bold, color: UI.successGreen },
  summaryValueWarning: { color: UI.warningYellow },
  streakCard: { backgroundColor: BACKGROUND.purpleTint, borderRadius: moderateScale(16), padding: responsiveWidth(5), alignItems: 'center', marginBottom: responsiveHeight(2) },
  streakAtRiskCard: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: UI.warningYellow },
  streakEmoji: { fontSize: moderateScale(44), marginBottom: responsiveHeight(1) },
  streakTitle: { fontSize: moderateScale(18), fontFamily: FONT_SERIF.medium, color: TEXT.secondary, marginBottom: responsiveHeight(0.5) },
  streakSubtitle: { fontSize: moderateScale(13), fontFamily: FONT_INTER.regular, color: TEXT.muted, textAlign: 'center', lineHeight: moderateScale(18) },
  warningBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: UI.dangerRed, borderRadius: moderateScale(10), paddingHorizontal: responsiveWidth(3), paddingVertical: responsiveHeight(1), marginTop: responsiveHeight(1.5), marginBottom: responsiveHeight(0.5) },
  warningText: { fontSize: moderateScale(12), fontFamily: FONT_INTER.medium, color: UI.dangerRed, textAlign: 'center' },
  freezeOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: BACKGROUND.white, paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveHeight(1.5), borderRadius: moderateScale(12), marginTop: responsiveHeight(2), borderWidth: 2, borderColor: BORDER.grey },
  freezeOptionSelected: { borderColor: '#0EA5E9', backgroundColor: BACKGROUND.lightBlue },
  freezeCheckbox: { width: responsiveWidth(5), height: responsiveWidth(5), borderRadius: moderateScale(4), borderWidth: 2, borderColor: '#0EA5E9', marginRight: responsiveWidth(2), justifyContent: 'center', alignItems: 'center' },
  freezeCheckboxSelected: { backgroundColor: '#0EA5E9' },
  freezeCheckmark: { fontSize: moderateScale(10), color: TEXT.white, fontFamily: FONT_INTER.semiBold },
  freezeOptionContent: { flex: 1 },
  freezeOptionText: { fontSize: moderateScale(13), fontFamily: FONT_INTER.medium, color: TEXT.secondary },
  freezeAvailableText: { fontSize: moderateScale(11), fontFamily: FONT_INTER.regular, color: TEXT.muted, marginTop: responsiveHeight(0.2) },
  noFreezeWarning: { marginTop: responsiveHeight(2), alignItems: 'center' },
  noFreezeText: { fontSize: moderateScale(14), fontFamily: FONT_INTER.medium, color: TEXT.muted, marginBottom: responsiveHeight(0.5) },
  noFreezeSubtext: { fontSize: moderateScale(12), fontFamily: FONT_INTER.regular, color: TEXT.greyLight, textAlign: 'center', lineHeight: moderateScale(18) },

  // Result Step
  resultContent: { alignItems: 'center', marginBottom: responsiveHeight(3), paddingTop: responsiveHeight(2) },
  resultEmoji: { fontSize: moderateScale(60), marginBottom: responsiveHeight(1.5) },
  resultTitle: { fontSize: moderateScale(26), fontFamily: FONT_SERIF.medium, color: TEXT.secondary, marginBottom: responsiveHeight(0.5) },
  resultSubtitle: { fontSize: moderateScale(14), fontFamily: FONT_INTER.regular, color: TEXT.muted, textAlign: 'center', marginBottom: responsiveHeight(1.5), paddingHorizontal: responsiveWidth(4) },
  freezeUsedBadge: { backgroundColor: BACKGROUND.lightBlue, paddingHorizontal: responsiveWidth(4), paddingVertical: responsiveHeight(0.8), borderRadius: moderateScale(20), marginBottom: responsiveHeight(1.5) },
  freezeUsedText: { fontSize: moderateScale(12), fontFamily: FONT_INTER.medium, color: '#0369A1' },
  streakBadgeFinal: { backgroundColor: BRAND.warmPurple, paddingHorizontal: responsiveWidth(5), paddingVertical: responsiveHeight(1), borderRadius: moderateScale(25), marginBottom: responsiveHeight(1) },
  streakBadgeFinalText: { fontSize: moderateScale(14), fontFamily: FONT_INTER.semiBold, color: TEXT.white },
  encouragementText: { fontSize: moderateScale(13), fontFamily: FONT_INTER.regular, color: TEXT.muted, textAlign: 'center', marginTop: responsiveHeight(1) },
});

export default DailyReviewModal;
