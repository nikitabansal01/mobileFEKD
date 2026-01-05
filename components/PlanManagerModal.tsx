import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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

const REPLACE_REASONS: Array<{ label: string; category: ReplaceCategory }> = [
  { label: "I don't like it", category: 'dont_like' },
  { label: "No time today", category: 'no_time' },
  { label: "Not feeling it", category: 'not_feeling_it' },
  { label: "Allergy / sensitivity", category: 'allergic' },
  { label: "Missing ingredients", category: 'no_ingredients' },
  { label: "Already did something similar", category: 'already_done' },
  { label: 'Other', category: 'other' },
];

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
    async (item: ActionPlanItem) => {
      if (busy) return;
      if (!refreshStatus?.can_refresh) {
        Alert.alert(
          'No refresh tokens',
          `You\'ve reached your daily refresh limit (${refreshStatus?.limit ?? 0}/day). Try again tomorrow.`
        );
        return;
      }

      Alert.alert(
        'Replace this item?',
        `This uses 1 refresh token. You have ${refreshStatus.remaining} left today.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Choose reason',
            onPress: () => {
              Alert.alert(
                'Why replace?',
                'Pick the closest reason.',
                REPLACE_REASONS.map((r) => ({
                  text: r.label,
                  onPress: async () => {
                    try {
                      setBusy(true);
                      const result = await homeService.replaceAction(item.id, undefined, r.category);
                      if (!result?.success || !result.replacement_action) {
                        Alert.alert('Could not replace', 'Please try again.');
                        return;
                      }

                      updateOneItem(item.id, result.replacement_action);

                      // Refresh token counts / streak status from server (source of truth)
                      const nextStatus = await rewardService.getRewardsStatus();
                      onRewardsStatusChange(nextStatus);

                      Alert.alert('Replaced', 'Done! I swapped it with something better for today.');
                    } catch (e: any) {
                      Alert.alert('Error', e?.message || 'Failed to replace action.');
                    } finally {
                      setBusy(false);
                    }
                  },
                }))
              );
            },
          },
        ]
      );
    },
    [busy, refreshStatus, onRewardsStatusChange, updateOneItem]
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
