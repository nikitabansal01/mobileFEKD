import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCycleState, useInsightsSummary, useSymptomPatterns } from './api';
import { styles } from './insightsStyles';

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

export default function InsightsScreen() {
  const cycle = useCycleState();
  const summary = useInsightsSummary();
  const patterns = useSymptomPatterns();

  const loading = cycle.isPending || summary.isPending || patterns.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>

        {loading ? (
          <ActivityIndicator style={styles.loading} accessibilityLabel="Loading insights" />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cycle</Text>
              {cycle.data?.phase ? (
                <>
                  <Text style={styles.cardValue}>
                    {PHASE_LABELS[cycle.data.phase] ?? cycle.data.phase}
                  </Text>
                  <Text style={styles.cardBody}>
                    Day {cycle.data.cycle_day}
                    {cycle.data.phase_confidence === 'low'
                      ? ' · estimated from your reported cycle length'
                      : ''}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardBody}>
                  Log a period start to see your cycle phase here.
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>What you complete most</Text>
            {summary.data?.adherence_by_category.length ? (
              summary.data.adherence_by_category.map((category) => (
                <View key={category.category} style={styles.row}>
                  <Text style={styles.rowLabel}>{category.category}</Text>
                  <Text style={styles.rowValue}>
                    {category.rate === null
                      ? '—'
                      : `${Math.round(category.rate * 100)}%`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.body}>
                Complete a few Daily Reviews to see patterns here.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Symptom patterns</Text>
            {patterns.data?.patterns.length ? (
              patterns.data.patterns.map((pattern) => (
                <View key={pattern.code} style={styles.row}>
                  <Text style={styles.rowLabel}>{pattern.code}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.rowValue}>
                      {pattern.occurrences}x
                      {pattern.mean_severity !== null
                        ? ` · avg ${pattern.mean_severity.toFixed(1)}`
                        : ''}
                    </Text>
                    {!pattern.sufficient ? (
                      <Text style={styles.insufficientBadge}>early data</Text>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.body}>
                Log symptoms in the chat to see patterns here.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
