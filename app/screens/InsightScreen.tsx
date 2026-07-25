import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONT_INTER, FONT_SERIF } from '@/constants/fonts';
import {
  insightsService,
  type QuickSummary,
  type SymptomPatternsResponse,
} from '@/services/insightsService';

const EMPTY_SUMMARY: QuickSummary = {
  total_completed: 0,
  current_streak: 0,
  longest_streak: 0,
};

export default function InsightScreen() {
  const [summary, setSummary] = useState<QuickSummary>(EMPTY_SUMMARY);
  const [patterns, setPatterns] = useState<SymptomPatternsResponse | null>(null);
  const [patternsLocked, setPatternsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const quickSummary = await insightsService.getQuickSummary();
      setSummary(quickSummary);

      try {
        const symptomPatterns = await insightsService.getSymptomPatterns();
        setPatterns(symptomPatterns);
        setPatternsLocked(false);
      } catch (patternError) {
        if ((patternError as Error)?.message === 'REWARD_REQUIRED') {
          setPatterns(null);
          setPatternsLocked(true);
        } else {
          throw patternError;
        }
      }
    } catch (loadError) {
      console.warn('Unable to load insights:', loadError);
      setError('Your insights could not be loaded. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInsights();
    }, [loadInsights]),
  );

  const unlockDays = Math.max(0, 14 - summary.current_streak);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A65D89" />
          <Text style={styles.loadingText}>Loading your real progress…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadInsights(true)} />}
      >
        <Text style={styles.title}>Your insights</Text>
        <Text style={styles.subtitle}>Built only from actions and check-ins you have actually completed.</Text>

        <View style={styles.summaryRow}>
          <SummaryCard value={summary.total_completed} label="Actions completed" />
          <SummaryCard value={summary.current_streak} label="Current streak" suffix=" days" />
          <SummaryCard value={summary.longest_streak} label="Best streak" suffix=" days" />
        </View>

        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Insights unavailable</Text>
            <Text style={styles.noticeBody}>{error}</Text>
          </View>
        ) : null}

        {patternsLocked ? (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.noticeTitle}>Symptom patterns unlock at a 14-day streak</Text>
            <Text style={styles.noticeBody}>
              {unlockDays > 0
                ? `Complete your daily plan for ${unlockDays} more day${unlockDays === 1 ? '' : 's'} to reveal reliable patterns.`
                : 'Complete today’s plan to refresh your reward status.'}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (summary.current_streak / 14) * 100)}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{summary.current_streak} / 14 days</Text>
          </View>
        ) : null}

        {patterns ? (
          <>
            <SectionTitle>Action patterns</SectionTitle>
            <View style={styles.panel}>
              {patterns.category_breakdown.length > 0 ? patterns.category_breakdown.map((category) => (
                <View key={category.category} style={styles.categoryRow}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{formatLabel(category.category)}</Text>
                    <Text style={styles.categoryRate}>{Math.round(category.completion_rate)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, category.completion_rate)}%` }]} />
                  </View>
                  <Text style={styles.categoryMeta}>{category.completed} of {category.total} completed</Text>
                </View>
              )) : <Text style={styles.emptyText}>Complete more actions to build category patterns.</Text>}
            </View>

            <SectionTitle>What your data shows</SectionTitle>
            <View style={styles.panel}>
              {patterns.insights.length > 0 ? patterns.insights.map((insight, index) => (
                <View key={`${index}-${insight}`} style={styles.insightRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              )) : <Text style={styles.emptyText}>Your check-ins will create insights here over time.</Text>}
            </View>

            <Text style={styles.periodNote}>Based on your last {patterns.period_days} days of activity.</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const displaySuffix = suffix === ' days' && value === 1 ? ' day' : suffix;
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}{displaySuffix}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFAFC' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 42 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: FONT_INTER.medium, fontSize: 14, color: '#6F6670' },
  title: { fontFamily: FONT_SERIF.semiBold, fontSize: 28, color: '#211B22' },
  subtitle: { fontFamily: FONT_INTER.regular, fontSize: 14, lineHeight: 21, color: '#716A72', marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  summaryCard: { flex: 1, minHeight: 104, padding: 13, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7EF' },
  summaryValue: { fontFamily: FONT_SERIF.semiBold, fontSize: 20, color: '#A65D89' },
  summaryLabel: { fontFamily: FONT_INTER.regular, fontSize: 12, lineHeight: 17, color: '#6F6670', marginTop: 8 },
  noticeCard: { marginTop: 22, padding: 20, borderRadius: 20, backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#F3DADA' },
  lockedCard: { marginTop: 22, padding: 22, borderRadius: 22, backgroundColor: '#F7F0F7', borderWidth: 1, borderColor: '#E9DAE8' },
  lockedIcon: { fontSize: 24, marginBottom: 10 },
  noticeTitle: { fontFamily: FONT_SERIF.semiBold, fontSize: 18, lineHeight: 24, color: '#332B34' },
  noticeBody: { fontFamily: FONT_INTER.regular, fontSize: 14, lineHeight: 21, color: '#716A72', marginTop: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E7DEE7', overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#A65D89' },
  progressLabel: { fontFamily: FONT_INTER.medium, fontSize: 12, color: '#7A6174', marginTop: 7, textAlign: 'right' },
  sectionTitle: { fontFamily: FONT_SERIF.semiBold, fontSize: 20, color: '#2B242C', marginTop: 28, marginBottom: 12 },
  panel: { padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7EF', gap: 17 },
  categoryRow: { gap: 5 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontFamily: FONT_INTER.medium, fontSize: 14, color: '#39313A' },
  categoryRate: { fontFamily: FONT_INTER.semiBold, fontSize: 13, color: '#A65D89' },
  categoryMeta: { fontFamily: FONT_INTER.regular, fontSize: 11, color: '#8A828A' },
  insightRow: { flexDirection: 'row', gap: 9 },
  bullet: { fontFamily: FONT_INTER.bold, fontSize: 17, color: '#A65D89' },
  insightText: { flex: 1, fontFamily: FONT_INTER.regular, fontSize: 14, lineHeight: 21, color: '#514A52' },
  emptyText: { fontFamily: FONT_INTER.regular, fontSize: 14, lineHeight: 21, color: '#716A72' },
  periodNote: { fontFamily: FONT_INTER.regular, fontSize: 12, color: '#8A828A', marginTop: 12, textAlign: 'center' },
});
