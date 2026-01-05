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
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Polyline } from 'react-native-svg';

import { BRAND, COLORS } from '@/constants/Colors';
import symptomTrackingService, {
  SymptomOverviewResponse,
  SymptomTypeAggregate,
} from '@/services/symptomTrackingService';

type Props = {
  visible: boolean;
  onClose: () => void;
  overview: SymptomOverviewResponse | null;
  onOverviewChange: (next: SymptomOverviewResponse) => void;
  onRequestRefreshOverview: () => Promise<void>;
};

const COMMON_SYMPTOMS: Array<{ key: string; label: string }> = [
  { key: 'cramps', label: 'Cramps' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'headache', label: 'Headache' },
  { key: 'acne', label: 'Acne' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
];



function Sparkline({ values }: { values: number[] }) {
  const points = useMemo(() => {
    if (!values.length) return '';
    const w = 120;
    const h = 28;
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = Math.max(1, maxV - minV);

    return values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * w;
        const y = h - ((v - minV) / range) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values]);

  return (
    <Svg width={120} height={28}>
      <Polyline
        points={points}
        fill="none"
        stroke={BRAND.gradPurple}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function SymptomManagerModal({
  visible,
  onClose,
  overview,
  onOverviewChange,
  onRequestRefreshOverview,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [severityPickerSymptom, setSeverityPickerSymptom] = useState<string | null>(null);

  const aggregates = overview?.aggregates ?? [];

  const last7ValuesFor = useCallback(
    (symptomType: string) => {
      const logs = (overview?.logs ?? [])
        .filter((l) => l.symptom_type === symptomType)
        .slice(0, 7)
        .reverse();
      return logs.map((l) => l.severity);
    },
    [overview?.logs]
  );

  const logSymptom = useCallback(
    async (symptomType: string, severity: number) => {
      if (busy) return;

      try {
        setBusy(true);
        await symptomTrackingService.logSymptom({
          symptom_type: symptomType,
          severity,
        });

        await onRequestRefreshOverview();

        Alert.alert('Saved', `${symptomType} logged at ${severity}/9.`);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to log symptom.');
      } finally {
        setBusy(false);
      }
    },
    [busy, onRequestRefreshOverview]
  );

  const openSeverityPicker = useCallback((symptomType: string) => {
    setSeverityPickerSymptom(symptomType);
  }, []);

  const refresh = useCallback(async () => {
    if (busy) return;
    try {
      setBusy(true);
      await onRequestRefreshOverview();
    } finally {
      setBusy(false);
    }
  }, [busy, onRequestRefreshOverview]);

  const topCards = useMemo(() => {
    const top = (overview?.top_symptoms ?? []).slice(0, 3);
    const map = new Map(aggregates.map((a) => [a.symptom_type, a] as const));
    return top.map((t) => map.get(t)).filter(Boolean) as SymptomTypeAggregate[];
  }, [aggregates, overview?.top_symptoms]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Symptom manager</Text>
              <Text style={styles.subTitle}>Quick log + trends • {overview ? `${overview.period_days} days` : '—'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.primaryAction, busy && { opacity: 0.6 }]} disabled={busy} onPress={refresh}>
              <Text style={styles.primaryActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick log</Text>
              <Text style={styles.sectionHint}>Tap a symptom, pick severity (1–9)</Text>
              <View style={styles.chipGrid}>
                {COMMON_SYMPTOMS.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.chip, busy && { opacity: 0.6 }]}
                    disabled={busy}
                    onPress={() => openSeverityPicker(s.key)}
                  >
                    <Text style={styles.chipText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trends</Text>
              {topCards.length === 0 ? (
                <Text style={styles.emptyText}>No symptom logs yet. Log one above to start seeing trends.</Text>
              ) : (
                <View style={{ gap: moderateScale(10) }}>
                  {topCards.map((a) => (
                    <View key={a.symptom_type} style={styles.trendCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trendTitle}>{a.symptom_type}</Text>
                        <Text style={styles.trendMeta}>
                          last {a.last_severity ?? '—'}/9 • avg {a.avg_severity.toFixed(1)}/9 • {a.trend}
                        </Text>
                      </View>
                      <Sparkline values={last7ValuesFor(a.symptom_type)} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Severity picker overlay (Alert on iOS only shows a few buttons) */}
          {severityPickerSymptom ? (
            <View style={styles.severityOverlay}>
              <View style={styles.severityCard}>
                <Text style={styles.severityTitle}>Log {severityPickerSymptom}</Text>
                <Text style={styles.severityHint}>Pick severity (1–9)</Text>

                <View style={styles.severityGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <TouchableOpacity
                      key={`sev_${n}`}
                      disabled={busy}
                      style={[styles.severityChip, busy && { opacity: 0.6 }]}
                      onPress={async () => {
                        const symptomType = severityPickerSymptom;
                        setSeverityPickerSymptom(null);
                        await logSymptom(symptomType, n);
                      }}
                    >
                      <Text style={styles.severityChipText}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setSeverityPickerSymptom(null)}
                  style={styles.severityCancel}
                  disabled={busy}
                >
                  <Text style={styles.severityCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
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
    maxHeight: '92%',
    paddingBottom: moderateScale(18),
  },

  severityOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
  },
  severityCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  severityTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  severityHint: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(12),
    color: COLORS.greyLight,
  },
  severityGrid: {
    marginTop: moderateScale(12),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  severityChip: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  severityChipText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  severityCancel: {
    marginTop: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  severityCancelText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.onSurface,
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
  row: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
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
  content: {
    padding: moderateScale(16),
    gap: moderateScale(16),
    paddingBottom: verticalScale(30),
  },
  section: {
    gap: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#111',
  },
  sectionHint: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    lineHeight: moderateScale(16),
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#111827',
  },
  trendCard: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  trendTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#111',
    textTransform: 'capitalize',
  },
  trendMeta: {
    marginTop: moderateScale(4),
    fontSize: moderateScale(11),
    color: '#6B7280',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
});
