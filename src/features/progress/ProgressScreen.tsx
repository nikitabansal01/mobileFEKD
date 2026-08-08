import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProgressReport, useRewards, type ProgressPeriod } from './api';
import { styles } from './progressStyles';

const PERIODS: ProgressPeriod[] = ['week', 'month', 'all'];
const PERIOD_LABELS: Record<ProgressPeriod, string> = {
  week: 'Weekly',
  month: 'Monthly',
  all: 'All time',
};

/** Adherence is null, never zero, when nothing was eligible. */
function formatAdherence(adherence: number | null | undefined): string {
  return adherence === null || adherence === undefined
    ? '—'
    : `${Math.round(adherence * 100)}%`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const [period, setPeriod] = useState<ProgressPeriod>('week');
  const report = useProgressReport(period);
  const rewards = useRewards();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your progress</Text>

        <View style={styles.tabs} accessibilityRole="tablist">
          {PERIODS.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === value }}
              onPress={() => setPeriod(value)}
              style={[styles.tab, period === value && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  period === value && styles.tabLabelActive,
                ]}
              >
                {PERIOD_LABELS[value]}
              </Text>
            </Pressable>
          ))}
        </View>

        {report.isPending ? (
          <ActivityIndicator style={styles.loading} accessibilityLabel="Loading progress" />
        ) : report.isError ? (
          <Text style={styles.body} accessibilityRole="alert">
            We could not load your progress just now. Pull down to try again.
          </Text>
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat
                label="Adherence"
                value={formatAdherence(report.data.totals.adherence)}
              />
              <Stat
                label="Current streak"
                value={`${report.data.totals.current_streak_days}d`}
              />
              <Stat
                label="Best streak"
                value={`${report.data.totals.longest_streak_days}d`}
              />
            </View>

            <Text style={styles.sectionTitle}>By period</Text>
            {report.data.buckets.length === 0 ? (
              <Text style={styles.body}>
                Complete a Daily Review and your progress will appear here.
              </Text>
            ) : (
              report.data.buckets.map((bucket) => (
                <View key={bucket.bucket_start} style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {bucket.bucket_start}
                    {bucket.is_provisional ? ' (so far)' : ''}
                  </Text>
                  <Text style={styles.rowValue}>
                    {formatAdherence(bucket.adherence)}
                    <Text style={styles.rowMuted}>
                      {'  '}
                      {bucket.completed}/{bucket.eligible}
                    </Text>
                  </Text>
                </View>
              ))
            )}

            {rewards.data ? (
              <>
                <Text style={styles.sectionTitle}>Rewards</Text>
                {rewards.data.rewards.map((reward) => (
                  <View key={reward.reward_id} style={styles.row}>
                    <Text style={styles.rowLabel}>
                      {reward.icon} {reward.title}
                    </Text>
                    <Text
                      style={[
                        styles.rowValue,
                        reward.state === 'locked' && styles.rowMuted,
                      ]}
                    >
                      {reward.state === 'claimed'
                        ? 'Claimed'
                        : reward.state === 'eligible'
                          ? 'Ready'
                          : `${reward.required_streak_days}d`}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
