/**
 * DailyReviewModal - Complete Rewrite
 * 
 * A production-grade review modal that:
 * - Shows all 4 action items as cards simultaneously
 * - Uses the app's design system (Colors, Fonts)
 * - Has smooth animations throughout
 * - Handles all review statuses properly
 * - Matches the app's visual style perfectly
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface DailyReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewData: PendingReviewResponse | null;
  onReviewComplete: (result: DailyReviewResponse) => void;
  /** If true, user cannot dismiss the modal until review is complete */
  isMandatory?: boolean;
}

type ReviewStatus = 'forgot_to_mark' | 'replaced' | 'skipped' | 'was_completed';

interface ItemReviewState {
  item_id: number;
  status: ReviewStatus | null;
  replacement_text: string;
  replacement_category: string;
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
// COMPONENT
// ============================================================================

const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  visible,
  onClose,
  reviewData,
  onReviewComplete,
  isMandatory = true,
}) => {
  // Step management: 1=Intro, 2=All Cards Review, 3=Replacement Details, 4=Streak Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [itemReviewStates, setItemReviewStates] = useState<Map<number, ItemReviewState>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<DailyReviewResponse | null>(null);
  const [useFreeze, setUseFreeze] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // Initialize card animations
  useEffect(() => {
    if (reviewData?.items) {
      reviewData.items.forEach((_, index) => {
        if (!cardAnimations[index]) {
          cardAnimations[index] = new Animated.Value(0);
        }
      });
    }
  }, [reviewData?.items]);

  // ============================================================================
  // DRAFT PERSISTENCE
  // ============================================================================

  const getDraftKey = useCallback((): string | null => {
    if (!reviewData?.plan_id) return null;
    return `${DRAFT_STORAGE_KEY_PREFIX}${reviewData.plan_id}`;
  }, [reviewData?.plan_id]);

  const isDraftExpired = (savedAt: string): boolean => {
    const savedTime = new Date(savedAt).getTime();
    const now = Date.now();
    const hoursSince = (now - savedTime) / (1000 * 60 * 60);
    return hoursSince > DRAFT_EXPIRY_HOURS;
  };

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
      if (isDraftExpired(draft.savedAt)) {
        await AsyncStorage.removeItem(draftKey);
        return null;
      }

      if (draft.planId !== reviewData?.plan_id) {
        await AsyncStorage.removeItem(draftKey);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [getDraftKey, reviewData?.plan_id]);

  const clearDraft = useCallback(async () => {
    const draftKey = getDraftKey();
    if (!draftKey) return;
    try {
      await AsyncStorage.removeItem(draftKey);
      lastSavedStateRef.current = '';
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [getDraftKey]);

  const restoreDraft = useCallback((draft: ReviewDraft) => {
    setCurrentStep(draft.currentStep);
    setItemReviewStates(new Map(draft.itemStates));
    setUseFreeze(draft.useFreeze);
    setIsDraftLoaded(true);
  }, []);

  const promptResumeDraft = useCallback(async (draft: ReviewDraft) => {
    const savedDate = new Date(draft.savedAt);
    const timeAgo = Math.round((Date.now() - savedDate.getTime()) / (1000 * 60));

    let timeText = '';
    if (timeAgo < 1) {
      timeText = 'just now';
    } else if (timeAgo < 60) {
      timeText = `${timeAgo} minute${timeAgo > 1 ? 's' : ''} ago`;
    } else {
      const hoursAgo = Math.round(timeAgo / 60);
      timeText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Resume Previous Review? 💜',
        `We found your review from ${timeText}. Want to pick up where you left off?`,
        [
          {
            text: 'Start Fresh',
            style: 'destructive',
            onPress: async () => {
              await clearDraft();
              resolve(false);
            },
          },
          {
            text: 'Resume',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }, [clearDraft]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize item states when reviewData changes
  useEffect(() => {
    if (reviewData?.items && !isDraftLoaded) {
      const initializeReview = async () => {
        const draft = await loadDraft();

        if (draft) {
          const shouldResume = await promptResumeDraft(draft);
          if (shouldResume) {
            restoreDraft(draft);
            return;
          }
        }

        // Initialize fresh state
        const initialStates = new Map<number, ItemReviewState>();
        reviewData.items.forEach((item) => {
          initialStates.set(item.id, {
            item_id: item.id,
            status: item.is_completed ? 'was_completed' : null,
            replacement_text: '',
            replacement_category: '',
          });
        });
        setItemReviewStates(initialStates);
        setCurrentStep(1);
        setReviewResult(null);
        setUseFreeze(false);
        setIsDraftLoaded(false);
      };

      initializeReview();
    }
  }, [reviewData, isDraftLoaded, loadDraft, promptResumeDraft, restoreDraft]);

  // Auto-save draft on state changes
  useEffect(() => {
    if (!reviewData || currentStep === 1 || itemReviewStates.size === 0) return;

    setHasPendingChanges(true);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
      setHasPendingChanges(false);
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [reviewData, currentStep, itemReviewStates, useFreeze, saveDraft]);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      // Ensure visible
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [visible]);

  // Card stagger animation when entering step 2
  useEffect(() => {
    if (currentStep === 2 && reviewData?.items) {
      reviewData.items.forEach((_, index) => {
        if (cardAnimations[index]) {
          cardAnimations[index].setValue(0);
          Animated.spring(cardAnimations[index], {
            toValue: 1,
            delay: index * 100,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [currentStep, reviewData?.items]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allItems = reviewData?.items || [];

  const getCompletionCount = () => {
    let completed = 0;
    itemReviewStates.forEach((state) => {
      if (state.status === 'was_completed' || state.status === 'forgot_to_mark' || state.status === 'replaced') {
        completed++;
      }
    });
    return completed;
  };

  const willMaintainStreak = () => {
    const totalItems = reviewData?.total_items ?? allItems.length ?? 0;
    const completedAfterReview = getCompletionCount();
    if (totalItems === 0) return true;
    return completedAfterReview === totalItems;
  };

  const allItemsReviewed = () => {
    return allItems.every((item) => {
      const state = itemReviewStates.get(item.id);
      return state?.status !== null;
    });
  };

  const replacedItems = () => {
    return Array.from(itemReviewStates.values()).filter(
      (state) => state.status === 'replaced'
    );
  };

  const allReplacementsComplete = () => {
    return replacedItems().every(
      (state) => state.replacement_text.trim().length >= MIN_REPLACEMENT_TEXT_LENGTH
    );
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStatusSelect = (itemId: number, status: ReviewStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || {
        item_id: itemId,
        status: null,
        replacement_text: '',
        replacement_category: '',
      };
      newMap.set(itemId, { ...existing, status });
      return newMap;
    });
  };

  const handleReplacementTextChange = (itemId: number, text: string) => {
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, replacement_text: text });
      }
      return newMap;
    });
  };

  const handleReplacementCategorySelect = (itemId: number, category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, replacement_category: category });
      }
      return newMap;
    });
  };

  const handleContinueFromCards = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const hasReplacements = replacedItems().length > 0;
    if (hasReplacements) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  };

  const handleContinueFromReplacements = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep(4);
  };

  const handleSubmitReview = async () => {
    if (!reviewData?.plan_id) return;

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 3000];

    try {
      const items: DailyReviewItemStatus[] = Array.from(itemReviewStates.values())
        .filter((state) => state.status !== null)
        .map((state) => ({
          item_id: state.item_id,
          status: state.status!,
          replacement_text: state.status === 'replaced' ? state.replacement_text : undefined,
          replacement_category: state.status === 'replaced' ? state.replacement_category : undefined,
        }));

      let result: DailyReviewResponse | null = null;
      let lastError: any = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          result = await homeService.submitDailyReview(reviewData.plan_id, items, useFreeze);

          if (result?.success) {
            await clearDraft();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setReviewResult(result);
            onReviewComplete(result);
            setIsSubmitting(false);
            return;
          }

          lastError = new Error(result?.error || 'Unknown error');
          break;
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error);

          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
          }
        }
      }

      await saveDraft();

      Alert.alert(
        'Saved Locally 💜',
        "We couldn't submit your review right now, but don't worry - your answers are safe! We'll try again when you're back online.",
        [{ text: 'Got it' }]
      );
    } catch (error) {
      console.error('Unexpected error in submit handler:', error);
      Alert.alert(
        'Oops!',
        'Something went wrong. Your answers are saved - please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (isMandatory && !reviewResult) {
      Alert.alert(
        'Review Required',
        "Please complete your daily review before continuing. This helps us personalize your next action plan! 💜",
        [{ text: 'Continue Review', style: 'cancel' }]
      );
      return;
    }

    if (hasPendingChanges) {
      saveDraft();
    }
    onClose();
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Step 1: Welcome/Intro
  const renderIntroStep = () => {
    // Format the date nicely - show "Yesterday" prominently with full date
    const getFormattedDateInfo = () => {
      if (!reviewData?.review_date) {
        return { label: 'Yesterday', fullDate: '' };
      }
      
      const reviewDate = new Date(reviewData.review_date + 'T12:00:00');
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const daysDiff = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let label = '';
      if (daysDiff === 1) {
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
    
    const dateInfo = getFormattedDateInfo();

    return (
      <View style={styles.stepContainer}>
        {/* Header Illustration */}
        <View style={styles.introHeader}>
          <LinearGradient
            colors={[BRAND.gradPurple, BRAND.warmPurple, BRAND.gradPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introGradientCircle}
          >
            <Text style={styles.introEmoji}>📋</Text>
          </LinearGradient>
        </View>

        {/* Yesterday Badge - Clear indicator of which day we're reviewing */}
        <View style={styles.yesterdayBadge}>
          <Text style={styles.yesterdayLabel}>{dateInfo.label}</Text>
          {dateInfo.fullDate && (
            <Text style={styles.yesterdayDate}>{dateInfo.fullDate}</Text>
          )}
        </View>

        <Text style={styles.introTitle}>Let's reflect on your actions</Text>
        <Text style={styles.introSubtitle}>
          You completed{' '}
          <Text style={styles.highlightText}>
            {reviewData?.completed_count || 0} of {reviewData?.total_items || 0}
          </Text>
          {' '}actions
        </Text>

        {reviewData?.was_frozen && (
          <View style={styles.frozenBadge}>
            <Text style={styles.frozenText}>🧊 This day was frozen - no streak penalty</Text>
          </View>
        )}

        <Text style={styles.introDescription}>
          Quick check: What really happened with each action? This helps us make your next plan even better! 💫
        </Text>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Let's Review →"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (allItems.length > 0) {
                setCurrentStep(2);
              } else {
                setCurrentStep(4);
              }
            }}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    );
  };

  // Step 2: All 4 Cards View
  const renderAllCardsStep = () => {
    return (
      <View style={styles.stepContainer}>
        {/* Header */}
        <View style={styles.cardsHeader}>
          <Text style={styles.sectionTitle}>What happened?</Text>
          <Text style={styles.sectionSubtitle}>
            Tell us about each action from {reviewData?.review_date ? 'yesterday' : 'your last session'}
          </Text>
        </View>

        {/* All Cards */}
        <View style={styles.cardsScrollView}>
          {allItems.map((item, index) => {
            const state = itemReviewStates.get(item.id);
            const selectedStatus = state?.status;
            const cardAnim = cardAnimations[index] || new Animated.Value(1);

            return (
              <View
                key={item.id}
                style={[
                  styles.actionCard,
                  selectedStatus && styles.actionCardSelected,
                ]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  {item.hero_image_url ? (
                    <Image
                      source={{ uri: item.hero_image_url }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <View style={styles.cardIconContainer}>
                      <Text style={styles.cardIcon}>{getCategoryIcon(item.category)}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
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
                        onPress={() => handleStatusSelect(item.id, option.id)}
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
          })}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={allItemsReviewed() ? "Continue →" : `Review ${allItems.length - Array.from(itemReviewStates.values()).filter(s => s.status !== null).length} more`}
            onPress={handleContinueFromCards}
            disabled={!allItemsReviewed()}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    );
  };

  // Step 3: Replacement Details
  const renderReplacementDetailsStep = () => {
    const itemsToDetail = replacedItems();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>What did you do instead?</Text>
        <Text style={styles.sectionSubtitle}>
          This helps us understand your preferences better! 💜
        </Text>

        <View style={styles.replacementScrollView}>
          {itemsToDetail.map((state) => {
            const item = allItems.find((i) => i.id === state.item_id);
            if (!item) return null;

            const charCount = state.replacement_text.length;
            const isValid = charCount >= MIN_REPLACEMENT_TEXT_LENGTH;

            return (
              <View key={state.item_id} style={styles.replacementCard}>
                <Text style={styles.replacementItemTitle}>
                  🔄 Instead of: {item.title}
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
                  onChangeText={(text) => handleReplacementTextChange(state.item_id, text)}
                  multiline
                  maxLength={MAX_REPLACEMENT_TEXT_LENGTH}
                />

                <View style={styles.inputFooter}>
                  <Text style={[
                    styles.charCount,
                    isValid && styles.charCountValid,
                  ]}>
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
                      onPress={() => handleReplacementCategorySelect(state.item_id, cat.id)}
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
              </View>
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue →"
            onPress={handleContinueFromReplacements}
            disabled={!allReplacementsComplete()}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    );
  };

  // Step 4: Streak Resolution
  const renderStreakResolutionStep = () => {
    const completedAfterReview = getCompletionCount();
    const totalItems = reviewData?.total_items ?? allItems.length ?? 0;
    const streakMaintained = willMaintainStreak();
    const canUseFreeze = !streakMaintained && (reviewData?.freezes_available || 0) > 0;

    // If already submitted, show result
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
                      🧊 Used {reviewResult.freezes_used} freeze
                    </Text>
                  </View>
                )}
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeText}>
                    {reviewResult.new_streak_count} Day Streak
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

          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Let's Go! 🚀"
              onPress={onClose}
              style={styles.primaryBtn}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Review Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actions Completed</Text>
            <Text style={[
              styles.summaryValue,
              completedAfterReview === totalItems ? styles.completedValue : styles.pendingValue,
            ]}>
              {completedAfterReview}/{totalItems}
            </Text>
          </View>
        </View>

        {reviewData?.was_frozen ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🧊</Text>
            <Text style={styles.streakTitle}>Day Was Frozen</Text>
            <Text style={styles.streakSubtitle}>
              Your streak is safe! Thanks for letting us know what you did.
            </Text>
          </View>
        ) : streakMaintained ? (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakTitle}>Streak Maintained!</Text>
            <Text style={styles.streakSubtitle}>
              Amazing! All actions complete — your streak continues!
            </Text>
          </View>
        ) : (
          <View style={[styles.streakCard, styles.streakAtRiskCard]}>
            <Text style={styles.streakEmoji}>⚠️</Text>
            <Text style={styles.streakTitle}>Streak at Risk!</Text>
            <Text style={styles.streakSubtitle}>
              You completed {completedAfterReview}/{totalItems} actions.
            </Text>

            {canUseFreeze ? (
              <>
                {/* Clear warning if not using freeze */}
                {!useFreeze && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚡ Your streak will reset to 0 if you don't use a freeze
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
                    <Text style={styles.freezeOptionText}>
                      Use 1 freeze token 🧊
                    </Text>
                    <Text style={styles.freezeAvailableText}>
                      {reviewData?.freezes_available} available
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noFreezeWarning}>
                <Text style={styles.noFreezeText}>
                  😔 No freeze tokens available
                </Text>
                <Text style={styles.noFreezeSubtext}>
                  Your streak will reset to 0, but don't worry — today is a fresh start!
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={isSubmitting ? "Submitting..." : "Complete Review ✨"}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
            style={styles.primaryBtn}
          />
          {isSubmitting && (
            <ActivityIndicator
              color={BRAND.warmPurple}
              style={{ marginTop: responsiveHeight(2) }}
            />
          )}
        </View>
      </View>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderIntroStep();
      case 2: return renderAllCardsStep();
      case 3: return renderReplacementDetailsStep();
      case 4: return renderStreakResolutionStep();
      default: return renderIntroStep();
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Don't render if not visible
  if (!visible) return null;

  // Show loading state if reviewData is not yet loaded
  const isLoading = !reviewData || !reviewData.items;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <LinearGradient
            colors={[BACKGROUND.purpleTint, BACKGROUND.white]}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Daily Review</Text>
            {(!isMandatory || reviewResult) ? (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleModalClose}
                disabled={isSubmitting}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryBadgeText}>Required</Text>
              </View>
            )}
          </LinearGradient>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND.warmPurple} />
              <Text style={styles.loadingText}>Loading your review...</Text>
            </View>
          ) : (
            <>
              {/* Progress Indicator */}
              {currentStep < 4 && (
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

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderCurrentStep()}
          </ScrollView>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================================================
// STYLES - Using Design System
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: UI.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.94,
    minHeight: SCREEN_HEIGHT * 0.6, // Ensure minimum height
    maxHeight: SCREEN_HEIGHT * 0.88,
    backgroundColor: BACKGROUND.white,
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveHeight(10),
    minHeight: responsiveHeight(30),
  },
  loadingText: {
    marginTop: responsiveHeight(2),
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.medium,
    color: TEXT.muted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    paddingTop: responsiveHeight(2.5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: FONT_SERIF.medium,
    color: TEXT.secondary,
  },
  closeButton: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: moderateScale(22),
    color: TEXT.grey,
    fontFamily: FONT_INTER.semiBold,
    marginTop: -2,
  },
  mandatoryBadge: {
    backgroundColor: BRAND.warmPurple,
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: moderateScale(12),
  },
  mandatoryBadgeText: {
    fontSize: moderateScale(10),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.white,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsiveWidth(2),
    paddingBottom: responsiveHeight(1.5),
  },
  progressDot: {
    width: responsiveWidth(2.5),
    height: responsiveWidth(2.5),
    borderRadius: responsiveWidth(1.25),
    backgroundColor: BORDER.grey,
  },
  progressDotActive: {
    backgroundColor: BRAND.gradPurple,
  },
  progressDotCurrent: {
    width: responsiveWidth(6),
    borderRadius: responsiveWidth(1.25),
    backgroundColor: BRAND.warmPurple,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: responsiveWidth(5),
    paddingBottom: responsiveHeight(4),
    flexGrow: 1,
  },
  stepContainer: {
    width: '100%',
    minHeight: responsiveHeight(45),
  },

  // ============ INTRO STEP ============
  introHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  introGradientCircle: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  introEmoji: {
    fontSize: moderateScale(36),
  },
  // Yesterday Badge - Prominent indicator of which day
  yesterdayBadge: {
    alignItems: 'center',
    marginBottom: responsiveHeight(1.5),
    backgroundColor: BACKGROUND.purpleTint,
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    borderRadius: moderateScale(20),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: BRAND.gradPurple + '40',
  },
  yesterdayLabel: {
    fontSize: moderateScale(16),
    fontFamily: FONT_INTER.semiBold,
    color: BRAND.warmPurple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  yesterdayDate: {
    fontSize: moderateScale(11),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    marginTop: responsiveHeight(0.3),
  },
  introTitle: {
    fontSize: moderateScale(22),
    fontFamily: FONT_SERIF.medium,
    color: TEXT.secondary,
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  introSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    textAlign: 'center',
    marginBottom: responsiveHeight(2.5),
    lineHeight: moderateScale(20),
  },
  highlightText: {
    fontFamily: FONT_INTER.semiBold,
    color: BRAND.warmPurple,
  },
  introDescription: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
    lineHeight: moderateScale(19),
  },

  // ============ SUMMARY CARD ============
  summaryCard: {
    backgroundColor: BACKGROUND.purpleTint,
    borderRadius: moderateScale(16),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  summaryLabel: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
  },
  summaryValue: {
    fontSize: moderateScale(15),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.secondary,
  },
  completedValue: {
    color: UI.successGreen,
  },
  pendingValue: {
    color: UI.warningYellow,
  },
  frozenBadge: {
    backgroundColor: BACKGROUND.lightBlue,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1),
    borderRadius: moderateScale(20),
    marginBottom: responsiveHeight(2),
    alignSelf: 'center',
  },
  frozenText: {
    fontSize: moderateScale(12),
    fontFamily: FONT_INTER.medium,
    color: '#0369A1',
  },

  // ============ ALL CARDS STEP ============
  cardsHeader: {
    marginBottom: responsiveHeight(2),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: FONT_SERIF.medium,
    color: TEXT.secondary,
    marginBottom: responsiveHeight(0.5),
  },
  sectionSubtitle: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
  },
  cardsScrollView: {
    width: '100%',
    marginBottom: responsiveHeight(2),
  },
  cardsScrollContent: {
    paddingBottom: responsiveHeight(2),
  },
  actionCard: {
    backgroundColor: BACKGROUND.white,
    borderRadius: moderateScale(16),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    borderWidth: 2,
    borderColor: BORDER.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardSelected: {
    borderColor: BRAND.gradPurple,
    backgroundColor: BACKGROUND.purpleTint,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: responsiveHeight(1.5),
  },
  cardImage: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: moderateScale(12),
    marginRight: responsiveWidth(3),
  },
  cardIconContainer: {
    width: responsiveWidth(14),
    height: responsiveWidth(14),
    borderRadius: moderateScale(12),
    backgroundColor: BACKGROUND.lightViolet,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth(3),
  },
  cardIcon: {
    fontSize: moderateScale(24),
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.secondary,
    marginBottom: responsiveHeight(0.5),
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(2),
  },
  cardMetaText: {
    fontSize: moderateScale(11),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.3),
    borderRadius: moderateScale(8),
  },
  completedBadgeText: {
    fontSize: moderateScale(10),
    fontFamily: FONT_INTER.medium,
    color: '#166534',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
  },
  statusOption: {
    flex: 1,
    minWidth: responsiveWidth(26),
    backgroundColor: BACKGROUND.white,
    borderRadius: moderateScale(12),
    padding: responsiveWidth(2.5),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BORDER.grey,
  },
  statusOptionSelected: {
    backgroundColor: BACKGROUND.purpleTint,
  },
  statusEmoji: {
    fontSize: moderateScale(20),
    marginBottom: responsiveHeight(0.3),
  },
  statusLabel: {
    fontSize: moderateScale(11),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.secondary,
    textAlign: 'center',
  },
  statusSublabel: {
    fontSize: moderateScale(8),
    fontFamily: FONT_INTER.regular,
    color: TEXT.greyLight,
    textAlign: 'center',
    marginTop: 1,
  },

  // ============ REPLACEMENT DETAILS ============
  replacementScrollView: {
    width: '100%',
    marginBottom: responsiveHeight(2),
  },
  replacementCard: {
    backgroundColor: BACKGROUND.purpleTint,
    borderRadius: moderateScale(16),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  replacementItemTitle: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.secondary,
    marginBottom: responsiveHeight(1.5),
  },
  replacementInput: {
    backgroundColor: BACKGROUND.white,
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.regular,
    color: TEXT.secondary,
    minHeight: responsiveHeight(10),
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: BORDER.light,
  },
  replacementInputError: {
    borderColor: UI.dangerRed,
    backgroundColor: BACKGROUND.danger,
  },
  replacementInputValid: {
    borderColor: UI.successGreen,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: responsiveHeight(0.5),
  },
  charCount: {
    fontSize: moderateScale(10),
    fontFamily: FONT_INTER.regular,
    color: TEXT.greyLight,
  },
  charCountValid: {
    color: UI.successGreen,
    fontFamily: FONT_INTER.medium,
  },
  categoryLabel: {
    fontSize: moderateScale(12),
    fontFamily: FONT_INTER.medium,
    color: TEXT.muted,
    marginBottom: responsiveHeight(1),
    marginTop: responsiveHeight(1.5),
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND.white,
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: BORDER.light,
  },
  categoryChipSelected: {
    backgroundColor: BRAND.gradPink + '30',
    borderColor: BRAND.warmPurple,
  },
  categoryChipText: {
    fontSize: moderateScale(11),
    fontFamily: FONT_INTER.regular,
    color: TEXT.grey,
  },
  categoryChipTextSelected: {
    color: BRAND.warmPurple,
    fontFamily: FONT_INTER.medium,
  },

  // ============ STREAK RESOLUTION ============
  streakCard: {
    backgroundColor: BACKGROUND.purpleTint,
    borderRadius: moderateScale(16),
    padding: responsiveWidth(5),
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  streakAtRiskCard: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: UI.warningYellow,
  },
  streakEmoji: {
    fontSize: moderateScale(44),
    marginBottom: responsiveHeight(1),
  },
  streakTitle: {
    fontSize: moderateScale(18),
    fontFamily: FONT_SERIF.medium,
    color: TEXT.secondary,
    marginBottom: responsiveHeight(0.5),
  },
  streakSubtitle: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  freezeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND.white,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    borderRadius: moderateScale(12),
    marginTop: responsiveHeight(2),
    borderWidth: 2,
    borderColor: BORDER.grey,
  },
  freezeOptionSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: BACKGROUND.lightBlue,
  },
  freezeCheckbox: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: '#0EA5E9',
    marginRight: responsiveWidth(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  freezeCheckboxSelected: {
    backgroundColor: '#0EA5E9',
  },
  freezeCheckmark: {
    fontSize: moderateScale(10),
    color: TEXT.white,
    fontFamily: FONT_INTER.semiBold,
  },
  freezeOptionContent: {
    flex: 1,
  },
  freezeOptionText: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.medium,
    color: TEXT.secondary,
  },
  freezeAvailableText: {
    fontSize: moderateScale(11),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    marginTop: responsiveHeight(0.2),
  },
  // Warning styles for streak at risk
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: UI.dangerRed,
    borderRadius: moderateScale(10),
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1),
    marginTop: responsiveHeight(1.5),
    marginBottom: responsiveHeight(0.5),
  },
  warningText: {
    fontSize: moderateScale(12),
    fontFamily: FONT_INTER.medium,
    color: UI.dangerRed,
    textAlign: 'center',
  },
  noFreezeWarning: {
    marginTop: responsiveHeight(2),
    alignItems: 'center',
  },
  noFreezeText: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.medium,
    color: TEXT.muted,
    marginBottom: responsiveHeight(0.5),
  },
  noFreezeSubtext: {
    fontSize: moderateScale(12),
    fontFamily: FONT_INTER.regular,
    color: TEXT.greyLight,
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },

  // ============ RESULT ============
  resultContent: {
    alignItems: 'center',
    marginBottom: responsiveHeight(3),
    paddingTop: responsiveHeight(2),
  },
  resultEmoji: {
    fontSize: moderateScale(60),
    marginBottom: responsiveHeight(1.5),
  },
  resultTitle: {
    fontSize: moderateScale(26),
    fontFamily: FONT_SERIF.medium,
    color: TEXT.secondary,
    marginBottom: responsiveHeight(0.5),
  },
  resultSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    textAlign: 'center',
    marginBottom: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
  },
  freezeUsedBadge: {
    backgroundColor: BACKGROUND.lightBlue,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: moderateScale(20),
    marginBottom: responsiveHeight(1.5),
  },
  freezeUsedText: {
    fontSize: moderateScale(12),
    fontFamily: FONT_INTER.medium,
    color: '#0369A1',
  },
  streakBadge: {
    backgroundColor: BRAND.warmPurple,
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    borderRadius: moderateScale(25),
  },
  streakBadgeText: {
    fontSize: moderateScale(14),
    fontFamily: FONT_INTER.semiBold,
    color: TEXT.white,
  },
  encouragementText: {
    fontSize: moderateScale(13),
    fontFamily: FONT_INTER.regular,
    color: TEXT.muted,
    textAlign: 'center',
    marginTop: responsiveHeight(1),
  },

  // ============ BUTTONS ============
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: responsiveHeight(1),
  },
  primaryBtn: {
    width: '100%',
  },
});

export default DailyReviewModal;
