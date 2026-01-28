import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import homeService, { ActionPlanItem, ActionPlanResponse } from '@/services/homeService';
import { rewardService, RewardsStatusResponse } from '@/services/rewardService';
import { BRAND, COLORS } from '@/constants/Colors';

export type ReplaceCategory =
  | 'dont_like'
  | 'no_time'
  | 'not_feeling_it'
  | 'allergic'
  | 'no_ingredients'
  | 'already_done'
  | 'too_hard'
  | 'want_different'
  | 'other';

type Props = {
  visible: boolean;
  onClose: () => void;
  actionPlan: ActionPlanResponse | null;
  rewardsStatus: RewardsStatusResponse | null;
  onRequestRefreshPlan: () => Promise<void>;
  onActionPlanChange: (next: ActionPlanResponse) => void;
  onRewardsStatusChange: (next: RewardsStatusResponse) => void;
};

// Enhanced replace reasons with icons and better UX
const REPLACE_REASONS: Array<{ label: string; category: ReplaceCategory; icon: string; description: string }> = [
  { label: "Don't like it", category: 'dont_like', icon: '👎', description: "Not my taste or preference" },
  { label: "No time", category: 'no_time', icon: '⏰', description: "Too busy today" },
  { label: "Not feeling it", category: 'not_feeling_it', icon: '😔', description: "Low energy or motivation" },
  { label: "Allergy/sensitivity", category: 'allergic', icon: '⚠️', description: "Can't consume this safely" },
  { label: "Missing ingredients", category: 'no_ingredients', icon: '🛒', description: "Don't have what I need" },
  { label: "Already did similar", category: 'already_done', icon: '✓', description: "Did something like this recently" },
  { label: "Too difficult", category: 'too_hard', icon: '😅', description: "Too complex or challenging" },
  { label: "Want something specific", category: 'want_different', icon: '💭', description: "I have something else in mind" },
];

// Replace reason modal component
function ReplaceReasonModal({
  visible,
  item,
  onClose,
  onSubmit,
  busy,
}: {
  visible: boolean;
  item: ActionPlanItem | null;
  onClose: () => void;
  onSubmit: (category: ReplaceCategory, customReason: string, preferenceHint: string) => void;
  busy: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ReplaceCategory | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [preferenceHint, setPreferenceHint] = useState('');
  const [step, setStep] = useState<'reason' | 'preference'>('reason');

  const resetState = () => {
    setSelectedCategory(null);
    setCustomReason('');
    setPreferenceHint('');
    setStep('reason');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCategorySelect = (category: ReplaceCategory) => {
    setSelectedCategory(category);
    // For "want something specific", go to preference step
    if (category === 'want_different') {
      setStep('preference');
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onSubmit(selectedCategory, customReason, preferenceHint);
    resetState();
  };

  const handleBack = () => {
    if (step === 'preference') {
      setStep('reason');
      setSelectedCategory(null);
    }
  };

  if (!visible || !item) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={replaceStyles.overlay}
      >
        <View style={replaceStyles.container}>
          {/* Header */}
          <View style={replaceStyles.header}>
            {step === 'preference' && (
              <TouchableOpacity onPress={handleBack} style={replaceStyles.backBtn}>
                <Text style={replaceStyles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={replaceStyles.title}>
              {step === 'reason' ? 'Why replace this?' : 'What would you prefer?'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={replaceStyles.closeBtn}>
              <Text style={replaceStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Item being replaced */}
          <View style={replaceStyles.itemPreview}>
            <Text style={replaceStyles.itemTitle}>{item.title}</Text>
            <Text style={replaceStyles.itemMeta}>
              {item.category} • {item.target_hormone}
            </Text>
          </View>

          <ScrollView 
            style={replaceStyles.scrollArea}
            contentContainerStyle={replaceStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'reason' ? (
              <>
                {/* Reason Options */}
                <View style={replaceStyles.reasonGrid}>
                  {REPLACE_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.category}
                      style={[
                        replaceStyles.reasonCard,
                        selectedCategory === reason.category && replaceStyles.reasonCardSelected,
                      ]}
                      onPress={() => handleCategorySelect(reason.category)}
                      disabled={busy}
                    >
                      <Text style={replaceStyles.reasonIcon}>{reason.icon}</Text>
                      <Text style={[
                        replaceStyles.reasonLabel,
                        selectedCategory === reason.category && replaceStyles.reasonLabelSelected,
                      ]}>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom reason text input */}
                <View style={replaceStyles.customSection}>
                  <Text style={replaceStyles.customLabel}>
                    Tell us more (optional)
                  </Text>
                  <TextInput
                    style={replaceStyles.customInput}
                    placeholder="E.g., I'd prefer something with chicken instead..."
                    placeholderTextColor="#9CA3AF"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    maxLength={200}
                    editable={!busy}
                  />
                  <Text style={replaceStyles.charCount}>
                    {customReason.length}/200
                  </Text>
                </View>
              </>
            ) : (
              /* Preference step for "want something specific" */
              <View style={replaceStyles.preferenceSection}>
                <Text style={replaceStyles.preferenceLabel}>
                  What would you like instead?
                </Text>
                <Text style={replaceStyles.preferenceHint}>
                  Be as specific as you can - we'll find the best match!
                </Text>
                <TextInput
                  style={replaceStyles.preferenceInput}
                  placeholder={
                    item.category === 'food' 
                      ? "E.g., Something with avocado, or a smoothie..." 
                      : item.category === 'movement'
                      ? "E.g., Dance, swimming, or something low-impact..."
                      : "E.g., Breathing exercises, or something shorter..."
                  }
                  placeholderTextColor="#9CA3AF"
                  value={preferenceHint}
                  onChangeText={setPreferenceHint}
                  multiline
                  maxLength={150}
                  autoFocus
                  editable={!busy}
                />
                <Text style={replaceStyles.charCount}>
                  {preferenceHint.length}/150
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={replaceStyles.footer}>
            <TouchableOpacity
              style={[
                replaceStyles.submitBtn,
                (!selectedCategory || busy) && replaceStyles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedCategory || busy}
            >
              <Text style={replaceStyles.submitBtnText}>
                {busy ? 'Finding replacement...' : 'Replace with something better ✨'}
              </Text>
            </TouchableOpacity>
            <Text style={replaceStyles.footerNote}>
              This uses 1 refresh token
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const replaceStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    position: 'absolute',
    left: moderateScale(16),
  },
  backText: {
    color: BRAND.gradPurple,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    position: 'absolute',
    right: moderateScale(16),
    padding: moderateScale(4),
  },
  closeText: {
    fontSize: moderateScale(18),
    color: '#6B7280',
  },
  itemPreview: {
    backgroundColor: '#F9FAFB',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
  },
  itemMeta: {
    fontSize: moderateScale(11),
    color: '#9CA3AF',
    marginTop: moderateScale(2),
  },
  scrollArea: {
    maxHeight: moderateScale(320),
  },
  scrollContent: {
    padding: moderateScale(16),
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  reasonCard: {
    width: '48%',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  reasonCardSelected: {
    borderColor: BRAND.gradPurple,
    backgroundColor: '#F5F3FF',
  },
  reasonIcon: {
    fontSize: moderateScale(18),
  },
  reasonLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  reasonLabelSelected: {
    color: BRAND.gradPurple,
  },
  customSection: {
    marginTop: moderateScale(16),
  },
  customLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#374151',
    marginBottom: moderateScale(8),
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(13),
    color: '#111827',
    minHeight: moderateScale(60),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: moderateScale(10),
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: moderateScale(4),
  },
  preferenceSection: {
    paddingVertical: moderateScale(8),
  },
  preferenceLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#111827',
    marginBottom: moderateScale(4),
  },
  preferenceHint: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: moderateScale(12),
  },
  preferenceInput: {
    borderWidth: 1.5,
    borderColor: BRAND.gradPurple,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    color: '#111827',
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  footer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: BRAND.gradPurple,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  footerNote: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(11),
    color: '#9CA3AF',
  },
});

export default function PlanManagerModal({
  visible,
  onClose,
  actionPlan,
  rewardsStatus,
  onRequestRefreshPlan,
  onActionPlanChange,
  onRewardsStatusChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [itemToReplace, setItemToReplace] = useState<ActionPlanItem | null>(null);

  const refreshStatus = rewardsStatus?.refresh_status;
  const freezeCount = rewardsStatus?.freeze_count ?? 0;

  const streakAtRisk = rewardsStatus?.streak_at_risk ?? false;
  const freezesNeeded = rewardsStatus?.freezes_needed ?? 1;
  const missedDays = rewardsStatus?.missed_days_count ?? 0;

  const actions = useMemo(() => actionPlan?.actions ?? [], [actionPlan?.actions]);

  const markCompletedLocal = useCallback(
    (itemId: number) => {
      if (!actionPlan) return;
      const wasCompleted = actionPlan.actions.find((a) => a.id === itemId)?.is_completed;
      const nextCompleted = wasCompleted ? actionPlan.completed_actions : actionPlan.completed_actions + 1;
      const next: ActionPlanResponse = {
        ...actionPlan,
        actions: actionPlan.actions.map((a) => (a.id === itemId ? { ...a, is_completed: true } : a)),
        completed_actions: nextCompleted,
      };
      onActionPlanChange(next);
    },
    [actionPlan, onActionPlanChange]
  );

  const updateOneItem = useCallback(
    (itemId: number, replacement: ActionPlanItem) => {
      if (!actionPlan) return;
      const next: ActionPlanResponse = {
        ...actionPlan,
        actions: actionPlan.actions.map((a) => (a.id === itemId ? replacement : a)),
      };
      onActionPlanChange(next);
    },
    [actionPlan, onActionPlanChange]
  );

  const handleReplace = useCallback(
    (item: ActionPlanItem) => {
      if (busy) return;
      if (!refreshStatus?.can_refresh) {
        Alert.alert(
          'No refresh tokens',
          `You\'ve reached your daily refresh limit (${refreshStatus?.limit ?? 0}/day). Try again tomorrow.`
        );
        return;
      }
      // Open the custom replace modal
      setItemToReplace(item);
      setReplaceModalVisible(true);
    },
    [busy, refreshStatus]
  );

  // Handle replace submission from the modal
  const handleReplaceSubmit = useCallback(
    async (category: ReplaceCategory, customReason: string, preferenceHint: string) => {
      if (!itemToReplace) return;

      try {
        setBusy(true);
        setReplaceModalVisible(false);

        // Build feedback string for AI - includes custom reason & preference
        let feedbackText = category;
        if (customReason.trim()) {
          feedbackText += ` | ${customReason.trim()}`;
        }
        if (preferenceHint.trim()) {
          feedbackText += ` | PREFERENCE: ${preferenceHint.trim()}`;
        }

        const result = await homeService.replaceAction(
          itemToReplace.id,
          feedbackText,
          category as 'dont_like' | 'no_time' | 'not_feeling_it' | 'allergic' | 'no_ingredients' | 'already_done' | 'too_hard' | 'want_different' | 'other'
        );

        if (!result?.success || !result.replacement_action) {
          Alert.alert('Could not replace', 'Please try again.');
          return;
        }

        updateOneItem(itemToReplace.id, result.replacement_action);

        // Refresh token counts / streak status from server (source of truth)
        const nextStatus = await rewardService.getRewardsStatus();
        onRewardsStatusChange(nextStatus);

        Alert.alert('Replaced! ✨', 'Done! Here\'s something better for today.');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to replace action.');
      } finally {
        setBusy(false);
        setItemToReplace(null);
      }
    },
    [itemToReplace, onRewardsStatusChange, updateOneItem]
  );

  const handleRefreshAll = useCallback(async () => {
    if (busy) return;
    if (!refreshStatus?.can_refresh) {
      Alert.alert(
        'No refresh tokens',
        `You\'ve reached your daily refresh limit (${refreshStatus?.limit ?? 0}/day). Try again tomorrow.`
      );
      return;
    }

    Alert.alert(
      "Refresh today\'s plan?",
      `This will replace incomplete items and uses 1 refresh token. You have ${refreshStatus.remaining} left today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm refresh',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              const result = await homeService.refreshAllIncomplete();
              if (!result?.success) {
                if (result?.error === 'rate_limit') {
                  Alert.alert('No refresh tokens', 'You have reached your daily limit.');
                  return;
                }
                Alert.alert('Refresh failed', result?.message || 'Please try again.');
                return;
              }

              await onRequestRefreshPlan();

              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);

              Alert.alert('Refreshed', result.message || "Updated today\'s plan.");
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to refresh plan.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [busy, refreshStatus, onRequestRefreshPlan, onRewardsStatusChange]);

  const handleFreeze = useCallback(async () => {
    if (busy) return;

    if (freezeCount <= 0) {
      Alert.alert('No freeze tokens', "You don\'t have any freeze tokens available right now.");
      return;
    }

    const modeLabel = missedDays > 0 ? 'protect missed days' : 'freeze today';

    Alert.alert(
      'Use freeze token?',
      missedDays > 0
        ? `You missed ${missedDays} day(s). This will use ${Math.min(freezesNeeded, freezeCount)} freeze token(s) to protect your streak. Continue?`
        : 'This will use 1 freeze token to protect your streak for today. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Confirm (${modeLabel})`,
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              const result = missedDays > 0 ? await rewardService.useFreezeReactive() : await rewardService.useFreezeProactive();
              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);
              Alert.alert('Freeze applied', result.message || 'Your streak is protected.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to use freeze token.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [busy, freezeCount, freezesNeeded, missedDays, onRewardsStatusChange]);

  const handleComplete = useCallback(
    async (item: ActionPlanItem) => {
      if (busy) return;

      Alert.alert('Mark complete?', 'This will mark the action as completed for today.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: async () => {
            try {
              setBusy(true);
              const ok = await homeService.completeAssignment(item.id);
              if (!ok) {
                Alert.alert('Could not complete', 'Please try again.');
                return;
              }

              // Optional: also record completion as feedback for analytics.
              await homeService.submitActionFeedback(item.id, 'completed', undefined, 'home');

              markCompletedLocal(item.id);

              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);

              Alert.alert('Completed', 'Nice — marked as done.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to mark as completed.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
    },
    [busy, markCompletedLocal, onRewardsStatusChange]
  );

  const handleSkip = useCallback(
    async (item: ActionPlanItem) => {
      if (busy) return;

      const reasons: Array<{ label: string; text?: string }> = [
        { label: 'No time today', text: 'No time today' },
        { label: 'Not feeling it', text: 'Not feeling it' },
        { label: 'Not relevant', text: 'Not relevant' },
        { label: 'Other', text: undefined },
      ];

      Alert.alert(
        'Skip this action?',
        'We’ll record that you skipped it (so we can improve future plans).',
        [
          { text: 'Cancel', style: 'cancel' },
          ...reasons.map((r) => ({
            text: r.label,
            onPress: async () => {
              try {
                setBusy(true);
                await homeService.submitActionFeedback(item.id, 'skipped', r.text, 'home');

                const nextStatus = await rewardService.getRewardsStatus();
                onRewardsStatusChange(nextStatus);

                Alert.alert('Skipped', 'Got it — recorded.');
              } catch (e: any) {
                Alert.alert('Error', e?.message || 'Failed to skip action.');
              } finally {
                setBusy(false);
              }
            },
          })),
        ]
      );
    },
    [busy, onRewardsStatusChange]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Manage today’s plan</Text>
              <Text style={styles.subTitle}>
                Refreshes: {refreshStatus ? `${refreshStatus.remaining}/${refreshStatus.limit}` : '—'} • Freezes: {freezeCount}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {(streakAtRisk || missedDays > 0) && (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Streak at risk</Text>
              <Text style={styles.bannerText}>
                {missedDays > 0
                  ? `You missed ${missedDays} day(s). You can protect your streak with a freeze.`
                  : 'You can protect your streak with a freeze if you won’t complete today.'}
              </Text>
              <TouchableOpacity style={[styles.bannerBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={handleFreeze}>
                <Text style={styles.bannerBtnText}>{freezeCount > 0 ? 'Use freeze token 🧊' : 'No freeze tokens'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.primaryAction, busy && { opacity: 0.6 }]} disabled={busy} onPress={handleRefreshAll}>
              <Text style={styles.primaryActionText}>Refresh plan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {actions.length === 0 ? (
              <Text style={styles.emptyText}>No plan items found for today.</Text>
            ) : (
              actions.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>{item.time_slot} • {item.category} • {item.target_hormone}</Text>
                  </View>

                  <View style={styles.cardButtons}>
                    <TouchableOpacity style={[styles.secondaryBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => handleReplace(item)}>
                      <Text style={styles.secondaryBtnText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      onPress={() => handleComplete(item)}
                    >
                      <Text style={styles.secondaryBtnText}>Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      onPress={() => handleSkip(item)}
                    >
                      <Text style={styles.secondaryBtnText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Custom Replace Reason Modal */}
      <ReplaceReasonModal
        visible={replaceModalVisible}
        item={itemToReplace}
        onClose={() => {
          setReplaceModalVisible(false);
          setItemToReplace(null);
        }}
        onSubmit={handleReplaceSubmit}
        busy={busy}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    maxHeight: '90%',
    paddingBottom: moderateScale(18),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111',
  },
  subTitle: {
    marginTop: moderateScale(3),
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  closeBtn: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  closeText: {
    color: BRAND.gradPurple,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  banner: {
    margin: moderateScale(14),
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  bannerText: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(12),
    color: '#334155',
    lineHeight: moderateScale(16),
  },
  bannerBtn: {
    marginTop: moderateScale(10),
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(10),
    backgroundColor: BRAND.gradPurple,
  },
  bannerBtnText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  actionsRow: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(10),
  },
  primaryAction: {
    backgroundColor: COLORS.gradPurple,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  list: {
    padding: moderateScale(16),
    paddingTop: moderateScale(6),
    gap: moderateScale(10),
  },
  emptyText: {
    color: '#6B7280',
    fontSize: moderateScale(13),
    textAlign: 'center',
    paddingVertical: moderateScale(28),
  },
  card: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: '#fff',
  },
  cardTop: {
    gap: moderateScale(4),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#111',
  },
  cardMeta: {
    fontSize: moderateScale(11),
    color: '#6B7280',
  },
  cardButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(10),
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
});
