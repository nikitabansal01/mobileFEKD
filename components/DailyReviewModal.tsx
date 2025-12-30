import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import homeService, {
  DailyReviewItemStatus,
  DailyReviewResponse,
  PendingReviewItemInfo,
  PendingReviewResponse,
} from '@/services/homeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface DailyReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewData: PendingReviewResponse | null;
  onReviewComplete: (result: DailyReviewResponse) => void;
}

type ReviewStatus = 'forgot_to_mark' | 'replaced' | 'skipped' | 'was_completed';

interface ItemReviewState {
  item_id: number;
  status: ReviewStatus | null;
  replacement_text: string;
  replacement_category: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REPLACEMENT_CATEGORIES = [
  { id: 'healthier_option', emoji: '🥗', text: 'Healthier option' },
  { id: 'no_time', emoji: '⏰', text: 'No time' },
  { id: 'no_ingredients', emoji: '🛒', text: "Didn't have ingredients" },
  { id: 'different_activity', emoji: '🔄', text: 'Different activity' },
  { id: 'other', emoji: '💬', text: 'Other' },
];

const getCategoryIcon = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'food':
      return '🍽️';
    case 'movement':
    case 'exercise':
      return '🏃';
    case 'mindfulness':
    case 'pause':
      return '🧘';
    default:
      return '✨';
  }
};

const getTimeSlotIcon = (timeSlot: string): string => {
  switch (timeSlot?.toLowerCase()) {
    case 'morning':
      return '🌤️';
    case 'afternoon':
      return '☀️';
    case 'evening':
    case 'night':
      return '🌙';
    default:
      return '⏰';
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
}) => {
  // Step management: 1=Intro, 2=Review Items, 3=Replacement Details, 4=Streak Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemReviewStates, setItemReviewStates] = useState<Map<number, ItemReviewState>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<DailyReviewResponse | null>(null);
  const [useFreeze, setUseFreeze] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Initialize item states when reviewData changes
  useEffect(() => {
    if (reviewData?.items) {
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
      setCurrentItemIndex(0);
      setReviewResult(null);
      setUseFreeze(false);  // Reset freeze toggle
    }
  }, [reviewData]);

  // Fade in animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Get only incomplete items that need review
  const incompleteItems = reviewData?.items.filter((item) => !item.is_completed) || [];

  // Get items that were marked as 'replaced' and need details
  const itemsNeedingReplacementDetails = Array.from(itemReviewStates.values()).filter(
    (state) => state.status === 'replaced' && !state.replacement_text
  );

  // Calculate completion status after review
  const getCompletionCount = () => {
    let completed = reviewData?.completed_count || 0;
    itemReviewStates.forEach((state) => {
      if (state.status === 'forgot_to_mark' || state.status === 'replaced') {
        completed++;
      }
    });
    return completed;
  };

  // Check if streak will be maintained
  const willMaintainStreak = () => {
    const totalItems = reviewData?.total_items || 4;
    const completedAfterReview = getCompletionCount();
    return completedAfterReview >= 3 || completedAfterReview === totalItems;
  };

  // Handle item status selection
  const handleStatusSelect = (itemId: number, status: ReviewStatus) => {
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

  // Handle replacement text update
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

  // Handle replacement category select
  const handleReplacementCategorySelect = (itemId: number, category: string) => {
    setItemReviewStates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing) {
        newMap.set(itemId, { ...existing, replacement_category: category });
      }
      return newMap;
    });
  };

  // Move to next incomplete item or next step
  const handleNextItem = () => {
    if (currentItemIndex < incompleteItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      // Check if any items need replacement details
      const needsDetails = Array.from(itemReviewStates.values()).some(
        (state) => state.status === 'replaced' && !state.replacement_text
      );
      if (needsDetails) {
        setCurrentStep(3);
      } else {
        // Go to streak resolution
        setCurrentStep(4);
      }
    }
  };

  // Submit the review
  const handleSubmitReview = async () => {
    if (!reviewData?.plan_id) return;

    setIsSubmitting(true);

    try {
      const items: DailyReviewItemStatus[] = Array.from(itemReviewStates.values())
        .filter((state) => state.status !== null)
        .map((state) => ({
          item_id: state.item_id,
          status: state.status!,
          replacement_text: state.status === 'replaced' ? state.replacement_text : undefined,
          replacement_category: state.status === 'replaced' ? state.replacement_category : undefined,
        }));

      const result = await homeService.submitDailyReview(reviewData.plan_id, items, useFreeze);

      if (result?.success) {
        setReviewResult(result);
        onReviewComplete(result);
      } else {
        console.error('Failed to submit review:', result?.error);
        Alert.alert(
          'Oops!',
          result?.error || 'Failed to submit review. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to server. Please check your internet and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle going back to previous item
  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Step 1: Welcome/Intro Screen
  const renderIntroStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.introContent}>
        <Text style={styles.introEmoji}>📋</Text>
        <Text style={styles.introTitle}>Welcome back!</Text>
        <Text style={styles.introSubtitle}>
          Let's review your action plan from{' '}
          <Text style={styles.highlightText}>
            {reviewData?.review_date
              ? new Date(reviewData.review_date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })
              : 'yesterday'}
          </Text>
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Actions</Text>
            <Text style={styles.summaryValue}>{reviewData?.total_items || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={[styles.summaryValue, styles.completedValue]}>
              {reviewData?.completed_count || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Need Review</Text>
            <Text style={[styles.summaryValue, styles.pendingValue]}>
              {reviewData?.incomplete_count || 0}
            </Text>
          </View>
        </View>

        {reviewData?.was_frozen && (
          <View style={styles.frozenBadge}>
            <Text style={styles.frozenText}>🧊 This day was frozen - no streak penalty</Text>
          </View>
        )}

        <Text style={styles.introDescription}>
          Tell us what happened with each action so we can personalize your future plans better.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (incompleteItems.length > 0) {
            setCurrentStep(2);
          } else {
            setCurrentStep(4);
          }
        }}
      >
        <Text style={styles.primaryButtonText}>
          {incompleteItems.length > 0 ? "Let's Review" : 'Continue'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onClose}>
        <Text style={styles.skipButtonText}>Remind me later</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 2: Review Each Item
  const renderReviewItemStep = () => {
    const currentItem = incompleteItems[currentItemIndex];
    if (!currentItem) return null;

    const currentState = itemReviewStates.get(currentItem.id);
    const selectedStatus = currentState?.status;

    return (
      <View style={styles.stepContainer}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Action {currentItemIndex + 1} of {incompleteItems.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentItemIndex + 1) / incompleteItems.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Item Card */}
        <View style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View style={styles.itemIconContainer}>
              {currentItem.hero_image_url ? (
                <Image source={{ uri: currentItem.hero_image_url }} style={styles.itemImage} />
              ) : (
                <Text style={styles.itemCategoryIcon}>{getCategoryIcon(currentItem.category)}</Text>
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {currentItem.title}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemMetaText}>
                  {getTimeSlotIcon(currentItem.time_slot)} {currentItem.time_slot}
                </Text>
                <Text style={styles.itemMetaText}>
                  {getCategoryIcon(currentItem.category)} {currentItem.category}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>What happened with this action?</Text>

        {/* Status Options */}
        <View style={styles.statusOptions}>
          <TouchableOpacity
            style={[
              styles.statusOption,
              selectedStatus === 'forgot_to_mark' && styles.statusOptionSelected,
            ]}
            onPress={() => handleStatusSelect(currentItem.id, 'forgot_to_mark')}
          >
            <Text style={styles.statusEmoji}>✅</Text>
            <Text
              style={[
                styles.statusText,
                selectedStatus === 'forgot_to_mark' && styles.statusTextSelected,
              ]}
            >
              I did it!
            </Text>
            <Text style={styles.statusSubtext}>Forgot to mark</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusOption,
              selectedStatus === 'replaced' && styles.statusOptionSelected,
            ]}
            onPress={() => handleStatusSelect(currentItem.id, 'replaced')}
          >
            <Text style={styles.statusEmoji}>🔄</Text>
            <Text
              style={[styles.statusText, selectedStatus === 'replaced' && styles.statusTextSelected]}
            >
              Replaced it
            </Text>
            <Text style={styles.statusSubtext}>Did something else</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusOption,
              selectedStatus === 'skipped' && styles.statusOptionSelected,
            ]}
            onPress={() => handleStatusSelect(currentItem.id, 'skipped')}
          >
            <Text style={styles.statusEmoji}>⏭️</Text>
            <Text
              style={[styles.statusText, selectedStatus === 'skipped' && styles.statusTextSelected]}
            >
              Skipped it
            </Text>
            <Text style={styles.statusSubtext}>Carry to today</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentItemIndex > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePreviousItem}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton, 
              !selectedStatus && styles.primaryButtonDisabled,
              currentItemIndex > 0 && styles.primaryButtonFlex
            ]}
            onPress={handleNextItem}
            disabled={!selectedStatus}
          >
            <Text style={styles.primaryButtonText}>
              {currentItemIndex < incompleteItems.length - 1 ? 'Next Action' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Step 3: Replacement Details
  const renderReplacementDetailsStep = () => {
    const replacedItems = Array.from(itemReviewStates.entries())
      .filter(([_, state]) => state.status === 'replaced')
      .map(([id, state]) => ({
        item: reviewData?.items.find((i) => i.id === id),
        state,
      }))
      .filter((x) => x.item);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>What did you do instead?</Text>
        <Text style={styles.sectionSubtitle}>
          This helps us suggest better alternatives next time 💜
        </Text>

        <ScrollView style={styles.replacementList} showsVerticalScrollIndicator={false}>
          {replacedItems.map(({ item, state }) => (
            <View key={item!.id} style={styles.replacementCard}>
              <Text style={styles.replacementItemTitle}>
                {getCategoryIcon(item!.category)} {item!.title}
              </Text>

              <TextInput
                style={styles.replacementInput}
                placeholder="What did you do instead?"
                placeholderTextColor="#999"
                value={state.replacement_text}
                onChangeText={(text) => handleReplacementTextChange(item!.id, text)}
                multiline
              />

              <View style={styles.categoryChips}>
                {REPLACEMENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      state.replacement_category === cat.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => handleReplacementCategorySelect(item!.id, cat.id)}
                  >
                    <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        state.replacement_category === cat.id && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentStep(4)}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Step 4: Streak Resolution
  const renderStreakResolutionStep = () => {
    const completedAfterReview = getCompletionCount();
    const totalItems = reviewData?.total_items || 4;
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

          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Let's Go! 🚀</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Review Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actions Completed</Text>
            <Text style={styles.summaryValue}>
              {completedAfterReview}/{totalItems}
            </Text>
          </View>
        </View>

        {reviewData?.was_frozen ? (
          <View style={styles.streakStatusCard}>
            <Text style={styles.streakStatusEmoji}>🧊</Text>
            <Text style={styles.streakStatusTitle}>Day Was Frozen</Text>
            <Text style={styles.streakStatusSubtitle}>
              Your streak is safe! Thanks for letting us know what you did.
            </Text>
          </View>
        ) : streakMaintained ? (
          <View style={styles.streakStatusCard}>
            <Text style={styles.streakStatusEmoji}>🔥</Text>
            <Text style={styles.streakStatusTitle}>Streak Maintained!</Text>
            <Text style={styles.streakStatusSubtitle}>
              Great job completing {completedAfterReview} actions!
            </Text>
          </View>
        ) : (
          <View style={[styles.streakStatusCard, styles.streakAtRiskCard]}>
            <Text style={styles.streakStatusEmoji}>⚠️</Text>
            <Text style={styles.streakStatusTitle}>Streak at Risk</Text>
            <Text style={styles.streakStatusSubtitle}>
              You completed {completedAfterReview}/{totalItems} actions. Need 3+ to maintain streak.
            </Text>

            {canUseFreeze && (
              <TouchableOpacity
                style={[styles.freezeOption, useFreeze && styles.freezeOptionSelected]}
                onPress={() => setUseFreeze(!useFreeze)}
              >
                <View style={styles.freezeCheckbox}>
                  {useFreeze && <Text style={styles.freezeCheckmark}>✓</Text>}
                </View>
                <Text style={styles.freezeOptionText}>
                  Use 1 freeze token 🧊 ({reviewData?.freezes_available} available)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmitReview}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderIntroStep();
      case 2:
        return renderReviewItemStep();
      case 3:
        return renderReplacementDetailsStep();
      case 4:
        return renderStreakResolutionStep();
      default:
        return null;
    }
  };

  if (!visible || !reviewData) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Daily Review</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderCurrentStep()}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.92,
    maxHeight: responsiveHeight(85),
    backgroundColor: '#FFEDF7',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
  },
  closeButton: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: responsiveFontSize(3),
    color: '#666666',
    fontFamily: 'Inter600',
    marginTop: -2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: responsiveWidth(5),
  },
  stepContainer: {
    flex: 1,
  },

  // Intro Step
  introContent: {
    alignItems: 'center',
    marginBottom: responsiveHeight(3),
  },
  introEmoji: {
    fontSize: moderateScale(48),
    marginBottom: responsiveHeight(1.5),
  },
  introTitle: {
    fontSize: moderateScale(22),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(0.5),
  },
  introSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },
  highlightText: {
    fontFamily: 'Inter600',
    color: '#683AF4',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: responsiveWidth(4),
    width: '100%',
    marginBottom: responsiveHeight(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.8),
  },
  summaryLabel: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
  },
  completedValue: {
    color: '#22C55E',
  },
  pendingValue: {
    color: '#F59E0B',
  },
  frozenBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1),
    borderRadius: 20,
    marginBottom: responsiveHeight(2),
  },
  frozenText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#0369A1',
  },
  introDescription: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },

  // Progress
  progressContainer: {
    marginBottom: responsiveHeight(2),
  },
  progressText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#6B5B7A',
    marginBottom: responsiveHeight(0.5),
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#683AF4',
    borderRadius: 3,
  },

  // Item Card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconContainer: {
    width: responsiveWidth(16),
    height: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    backgroundColor: '#F5F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveWidth(3),
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemCategoryIcon: {
    fontSize: moderateScale(24),
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(0.5),
  },
  itemMeta: {
    flexDirection: 'row',
    gap: responsiveWidth(3),
  },
  itemMetaText: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
  },

  // Question
  questionText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },

  // Status Options
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveWidth(2),
    marginBottom: responsiveHeight(3),
  },
  statusOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: responsiveWidth(3),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statusOptionSelected: {
    borderColor: '#683AF4',
    backgroundColor: '#F5F0FF',
  },
  statusEmoji: {
    fontSize: moderateScale(24),
    marginBottom: responsiveHeight(0.5),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    textAlign: 'center',
  },
  statusTextSelected: {
    color: '#683AF4',
  },
  statusSubtext: {
    fontSize: moderateScale(9),
    fontFamily: 'Inter400',
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },

  // Buttons
  navigationButtons: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
    marginTop: responsiveHeight(1),
  },
  backButton: {
    flex: 0.4,
    backgroundColor: '#F5F5F5',
    paddingVertical: responsiveHeight(1.8),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter500',
    color: '#6B5B7A',
  },
  primaryButton: {
    backgroundColor: '#683AF4',
    paddingVertical: responsiveHeight(1.8),
    borderRadius: 12,
    alignItems: 'center',
    marginTop: responsiveHeight(1),
  },
  primaryButtonFlex: {
    flex: 0.6,
    marginTop: 0,
  },
  primaryButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  primaryButtonText: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: responsiveHeight(1.5),
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter500',
    color: '#6B5B7A',
  },

  // Replacement Details
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(0.5),
  },
  sectionSubtitle: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    marginBottom: responsiveHeight(2),
  },
  replacementList: {
    maxHeight: responsiveHeight(40),
    marginBottom: responsiveHeight(2),
  },
  replacementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(1.5),
  },
  replacementItemTitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(1),
  },
  replacementInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: responsiveWidth(3),
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#4A3D5C',
    minHeight: responsiveHeight(8),
    textAlignVertical: 'top',
    marginBottom: responsiveHeight(1.5),
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#F5F0FF',
    borderColor: '#683AF4',
  },
  categoryChipEmoji: {
    fontSize: moderateScale(12),
    marginRight: responsiveWidth(1),
  },
  categoryChipText: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter400',
    color: '#666',
  },
  categoryChipTextSelected: {
    color: '#683AF4',
    fontFamily: 'Inter500',
  },

  // Streak Resolution
  streakStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: responsiveWidth(5),
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  streakAtRiskCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  streakStatusEmoji: {
    fontSize: moderateScale(40),
    marginBottom: responsiveHeight(1),
  },
  streakStatusTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(0.5),
  },
  streakStatusSubtitle: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    textAlign: 'center',
  },
  freezeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    borderRadius: 10,
    marginTop: responsiveHeight(2),
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  freezeOptionSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  freezeCheckbox: {
    width: responsiveWidth(5),
    height: responsiveWidth(5),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    marginRight: responsiveWidth(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  freezeCheckmark: {
    fontSize: moderateScale(10),
    color: '#0EA5E9',
    fontFamily: 'Inter600',
  },
  freezeOptionText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter500',
    color: '#4A3D5C',
  },

  // Result
  resultContent: {
    alignItems: 'center',
    marginBottom: responsiveHeight(3),
  },
  resultEmoji: {
    fontSize: moderateScale(56),
    marginBottom: responsiveHeight(1.5),
  },
  resultTitle: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter600',
    color: '#4A3D5C',
    marginBottom: responsiveHeight(0.5),
  },
  resultSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    textAlign: 'center',
    marginBottom: responsiveHeight(1.5),
  },
  freezeUsedBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 20,
    marginBottom: responsiveHeight(1.5),
  },
  freezeUsedText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#0369A1',
  },
  streakBadge: {
    backgroundColor: '#683AF4',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    borderRadius: 25,
  },
  streakBadgeText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#FFFFFF',
  },
  encouragementText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#6B5B7A',
    textAlign: 'center',
    marginTop: responsiveHeight(1),
  },
});

export default DailyReviewModal;
