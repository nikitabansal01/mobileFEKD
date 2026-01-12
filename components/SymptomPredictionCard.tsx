/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SYMPTOM PREDICTION CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Displays upcoming symptom predictions with proactive advice.
 * Features:
 * - 2-3 day ahead predictions
 * - Symptom likelihood and severity indicators
 * - Proactive prevention tips
 * - Phase transition alerts
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface SymptomPrediction {
  symptom: string;
  likelihood: number;
  expected_severity: number;
  expected_date: string;
  confidence: 'high' | 'medium' | 'low';
  proactive_advice: string[];
  user_specific: boolean;
}

interface PhaseTransition {
  from_phase: string;
  to_phase: string;
  expected_date: string;
  days_until: number;
}

interface PredictionData {
  predictions: SymptomPrediction[];
  phase_transition: PhaseTransition | null;
  overall_outlook: string;
  prediction_date: string;
}

interface SymptomPredictionCardProps {
  userId: string;
  onAdvicePress?: (advice: string) => void;
  onSymptomPress?: (symptom: string) => void;
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYMPTOM ICONS & COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const SYMPTOM_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  cramps: { icon: '🔥', color: '#E57373', label: 'Cramps' },
  bloating: { icon: '🎈', color: '#64B5F6', label: 'Bloating' },
  mood_changes: { icon: '🎭', color: '#BA68C8', label: 'Mood Changes' },
  fatigue: { icon: '😴', color: '#4DB6AC', label: 'Fatigue' },
  headache: { icon: '🤕', color: '#FF8A65', label: 'Headache' },
  breast_tenderness: { icon: '💗', color: '#F48FB1', label: 'Breast Tenderness' },
  food_cravings: { icon: '🍫', color: '#A1887F', label: 'Food Cravings' },
  irritability: { icon: '😤', color: '#FFB74D', label: 'Irritability' },
  acne: { icon: '✨', color: '#81C784', label: 'Skin Changes' },
  energy_boost: { icon: '⚡', color: '#FFD54F', label: 'Energy Boost' },
};

const getSymptomConfig = (symptom: string) => {
  return SYMPTOM_CONFIG[symptom] || { icon: '•', color: '#9E9E9E', label: symptom };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIKELIHOOD BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface LikelihoodBadgeProps {
  likelihood: number;
  confidence: 'high' | 'medium' | 'low';
}

const LikelihoodBadge: React.FC<LikelihoodBadgeProps> = ({ likelihood, confidence }) => {
  const getColors = (): readonly [string, string] => {
    if (likelihood >= 0.8) return ['#FFCDD2', '#E57373'] as const;
    if (likelihood >= 0.6) return ['#FFE0B2', '#FFB74D'] as const;
    return ['#C8E6C9', '#81C784'] as const;
  };

  const getLabel = () => {
    if (likelihood >= 0.8) return 'Very Likely';
    if (likelihood >= 0.6) return 'Likely';
    return 'Possible';
  };

  return (
    <View style={styles.likelihoodContainer}>
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.likelihoodBadge}
      >
        <Text style={styles.likelihoodText}>{Math.round(likelihood * 100)}%</Text>
        <Text style={styles.likelihoodLabel}>{getLabel()}</Text>
      </LinearGradient>
      {confidence === 'high' && (
        <Text style={styles.confidenceIcon}>🎯</Text>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEVERITY INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SeverityIndicatorProps {
  severity: number; // 1-9 scale
}

const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ severity }) => {
  const dots = Array.from({ length: 9 }, (_, i) => i + 1);

  const getDotColor = (dotIndex: number) => {
    if (dotIndex > severity) return '#E0E0E0';
    if (severity <= 3) return '#81C784';
    if (severity <= 6) return '#FFB74D';
    return '#E57373';
  };

  return (
    <View style={styles.severityContainer}>
      <Text style={styles.severityLabel}>Expected Intensity</Text>
      <View style={styles.dotsContainer}>
        {dots.map((dot) => (
          <View
            key={dot}
            style={[
              styles.severityDot,
              { backgroundColor: getDotColor(dot) }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface PredictionItemProps {
  prediction: SymptomPrediction;
  onAdvicePress?: (advice: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

const PredictionItem: React.FC<PredictionItemProps> = ({
  prediction,
  onAdvicePress,
  expanded = false,
  onToggle,
}) => {
  const config = getSymptomConfig(prediction.symptom);

  const formatDate = (dateStr: string) => {
    let date: Date;

    // Check if it's a simple YYYY-MM-DD string
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      // Create date in local timezone
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      date = new Date(dateStr);
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnlyString = date.toDateString();
    if (dateOnlyString === today.toDateString()) return 'Today';
    if (dateOnlyString === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.predictionItem, { borderLeftColor: config.color }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.predictionHeader}>
        <View style={styles.symptomInfo}>
          <Text style={styles.symptomIcon}>{config.icon}</Text>
          <View>
            <Text style={styles.symptomName}>{config.label}</Text>
            <Text style={styles.expectedDate}>{formatDate(prediction.expected_date)}</Text>
          </View>
        </View>
        <LikelihoodBadge
          likelihood={prediction.likelihood}
          confidence={prediction.confidence}
        />
      </View>

      {/* Severity */}
      <SeverityIndicator severity={prediction.expected_severity} />

      {/* Expanded advice section */}
      {expanded && prediction.proactive_advice.length > 0 && (
        <View style={styles.adviceSection}>
          <Text style={styles.adviceTitle}>💡 Prevention Tips</Text>
          {prediction.proactive_advice.map((advice, index) => (
            <TouchableOpacity
              key={index}
              style={styles.adviceItem}
              onPress={() => onAdvicePress?.(advice)}
            >
              <Text style={styles.adviceBullet}>•</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* User-specific badge */}
      {prediction.user_specific && (
        <View style={styles.personalizedBadge}>
          <Text style={styles.personalizedText}>✨ Based on your patterns</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE TRANSITION ALERT
// ═══════════════════════════════════════════════════════════════════════════════

interface PhaseTransitionAlertProps {
  transition: PhaseTransition;
}

const PhaseTransitionAlert: React.FC<PhaseTransitionAlertProps> = ({ transition }) => {
  const getPhaseEmoji = (phase: string) => {
    const emojis: Record<string, string> = {
      menstrual: '🔴',
      follicular: '🌱',
      ovulatory: '🌟',
      luteal: '🌙',
    };
    return emojis[phase] || '•';
  };

  return (
    <LinearGradient
      colors={['rgba(162, 154, 234, 0.2)', 'rgba(233, 139, 172, 0.2)'] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.phaseAlertContainer}
    >
      <View style={styles.phaseAlertContent}>
        <Text style={styles.phaseAlertIcon}>🔄</Text>
        <View style={styles.phaseAlertInfo}>
          <Text style={styles.phaseAlertTitle}>Phase Transition Coming</Text>
          <View style={styles.phaseFlow}>
            <Text style={styles.phaseName}>
              {getPhaseEmoji(transition.from_phase)} {transition.from_phase}
            </Text>
            <Text style={styles.phaseArrow}>→</Text>
            <Text style={styles.phaseName}>
              {getPhaseEmoji(transition.to_phase)} {transition.to_phase}
            </Text>
          </View>
          <Text style={styles.daysUntil}>
            In {transition.days_until} day{transition.days_until !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SymptomPredictionCard: React.FC<SymptomPredictionCardProps> = ({
  userId,
  onAdvicePress,
  onSymptomPress,
  compact = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PredictionData | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchPredictions();
  }, [userId]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/predict-symptoms/${userId}`);
      // const data = await response.json();

      // Mock data
      await new Promise(resolve => setTimeout(resolve, 800));

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);

      setData({
        predictions: [
          {
            symptom: 'cramps',
            likelihood: 0.85,
            expected_severity: 6,
            expected_date: tomorrow.toISOString().split('T')[0], // Use YYYY-MM-DD for testing robust parsing
            confidence: 'high',
            proactive_advice: [
              'Start taking magnesium supplements now',
              'Use a heating pad in the evening',
              'Gentle yoga or stretching daily',
              'Avoid inflammatory foods'
            ],
            user_specific: true,
          },
          {
            symptom: 'bloating',
            likelihood: 0.72,
            expected_severity: 5,
            expected_date: tomorrow.toISOString().split('T')[0],
            confidence: 'medium',
            proactive_advice: [
              'Reduce sodium intake today',
              'Drink extra water (aim for 10 glasses)',
              'Avoid carbonated drinks',
              'Eat smaller, more frequent meals'
            ],
            user_specific: true,
          },
          {
            symptom: 'fatigue',
            likelihood: 0.65,
            expected_severity: 4,
            expected_date: dayAfter.toISOString().split('T')[0],
            confidence: 'medium',
            proactive_advice: [
              'Get to bed 30 minutes earlier tonight',
              'Have iron-rich foods with your meals',
              'Take short breaks during the day'
            ],
            user_specific: false,
          },
        ],
        phase_transition: {
          from_phase: 'luteal',
          to_phase: 'menstrual',
          expected_date: tomorrow.toISOString().split('T')[0],
          days_until: 1,
        },
        overall_outlook: "Expect some symptoms in the next couple days as you transition. Being proactive now can really help! 💪",
        prediction_date: today.toISOString(),
      });

    } catch (err) {
      setError('Failed to load predictions');
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E98BAC" />
        <Text style={styles.loadingText}>Analyzing your patterns...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🔮</Text>
        <Text style={styles.errorText}>{error || 'Unable to load predictions'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPredictions}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Compact version
  if (compact && data.predictions.length > 0) {
    const topPrediction = data.predictions[0];
    const config = getSymptomConfig(topPrediction.symptom);

    return (
      <TouchableOpacity style={styles.compactContainer} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(233, 139, 172, 0.15)', 'rgba(162, 154, 234, 0.15)'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          <View style={styles.compactHeader}>
            <Text style={styles.compactIcon}>🔮</Text>
            <Text style={styles.compactTitle}>Upcoming</Text>
          </View>
          <View style={styles.compactPrediction}>
            <Text style={styles.compactSymptomIcon}>{config.icon}</Text>
            <Text style={styles.compactSymptomName}>{config.label}</Text>
            <Text style={styles.compactLikelihood}>
              {Math.round(topPrediction.likelihood * 100)}%
            </Text>
          </View>
          {data.predictions.length > 1 && (
            <Text style={styles.compactMore}>
              +{data.predictions.length - 1} more prediction{data.predictions.length > 2 ? 's' : ''}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Full version
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔮 Symptom Predictions</Text>
          <Text style={styles.subtitle}>Next 2-3 days</Text>
        </View>
        <TouchableOpacity onPress={fetchPredictions}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Phase transition alert */}
      {data.phase_transition && (
        <PhaseTransitionAlert transition={data.phase_transition} />
      )}

      {/* Overall outlook */}
      <View style={styles.outlookCard}>
        <Text style={styles.outlookText}>{data.overall_outlook}</Text>
      </View>

      {/* Predictions list */}
      <ScrollView
        style={styles.predictionsScroll}
        showsVerticalScrollIndicator={false}
      >
        {data.predictions.map((prediction, index) => (
          <PredictionItem
            key={`${prediction.symptom}-${index}`}
            prediction={prediction}
            onAdvicePress={onAdvicePress}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </ScrollView>

      {/* Empty state */}
      {data.predictions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyText}>
            Looking good! No significant symptoms predicted for the next few days.
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: scale(20),
    marginHorizontal: responsiveWidth(4),
    marginVertical: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(15),
  },
  title: {
    fontSize: moderateScale(18, 0.5),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  subtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(2),
  },
  refreshButton: {
    fontSize: moderateScale(20),
    padding: scale(5),
  },
  // Phase transition
  phaseAlertContainer: {
    borderRadius: 12,
    marginBottom: verticalScale(15),
    overflow: 'hidden',
  },
  phaseAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
  },
  phaseAlertIcon: {
    fontSize: moderateScale(24),
    marginRight: scale(12),
  },
  phaseAlertInfo: {
    flex: 1,
  },
  phaseAlertTitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  phaseFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  phaseName: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#4A4A4A',
    textTransform: 'capitalize',
  },
  phaseArrow: {
    fontSize: moderateScale(14),
    color: '#6F6F6F',
    marginHorizontal: scale(8),
  },
  daysUntil: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(4),
  },
  // Outlook
  outlookCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: scale(12),
    marginBottom: verticalScale(15),
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
  },
  outlookText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#5D4037',
    lineHeight: verticalScale(20),
  },
  // Predictions
  predictionsScroll: {
    maxHeight: verticalScale(400),
  },
  predictionItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: scale(14),
    marginBottom: verticalScale(12),
    borderLeftWidth: 4,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  symptomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symptomIcon: {
    fontSize: moderateScale(24),
    marginRight: scale(10),
  },
  symptomName: {
    fontSize: moderateScale(15),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  expectedDate: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  // Likelihood
  likelihoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likelihoodBadge: {
    borderRadius: 12,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    alignItems: 'center',
  },
  likelihoodText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  likelihoodLabel: {
    fontSize: moderateScale(9),
    fontFamily: 'Inter400',
    color: '#4A4A4A',
  },
  confidenceIcon: {
    fontSize: moderateScale(12),
    marginLeft: scale(4),
  },
  // Severity
  severityContainer: {
    marginBottom: verticalScale(10),
  },
  severityLabel: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginBottom: verticalScale(6),
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: scale(4),
  },
  severityDot: {
    width: scale(16),
    height: verticalScale(6),
    borderRadius: 3,
  },
  // Advice
  adviceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: scale(12),
    marginTop: verticalScale(8),
  },
  adviceTitle: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
    marginBottom: verticalScale(8),
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
  },
  adviceBullet: {
    fontSize: moderateScale(12),
    color: '#E98BAC',
    marginRight: scale(8),
    fontFamily: 'Inter600',
  },
  adviceText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#4A4A4A',
    lineHeight: verticalScale(18),
  },
  // Personalized badge
  personalizedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(162, 154, 234, 0.2)',
    borderRadius: 10,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    marginTop: verticalScale(8),
  },
  personalizedText: {
    fontSize: moderateScale(10),
    fontFamily: 'Inter500',
    color: '#7C4DFF',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: scale(30),
  },
  emptyEmoji: {
    fontSize: moderateScale(40),
    marginBottom: verticalScale(10),
  },
  emptyText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    textAlign: 'center',
    lineHeight: verticalScale(22),
  },
  // Loading & Error
  loadingContainer: {
    padding: scale(40),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  errorContainer: {
    padding: scale(30),
    alignItems: 'center',
  },
  errorEmoji: {
    fontSize: moderateScale(40),
    marginBottom: verticalScale(10),
  },
  errorText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: verticalScale(15),
    backgroundColor: '#E98BAC',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    borderRadius: 20,
  },
  retryText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  // Compact version
  compactContainer: {
    marginHorizontal: responsiveWidth(4),
    marginVertical: verticalScale(8),
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactGradient: {
    padding: scale(14),
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  compactIcon: {
    fontSize: moderateScale(16),
    marginRight: scale(6),
  },
  compactTitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  compactPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactSymptomIcon: {
    fontSize: moderateScale(18),
    marginRight: scale(8),
  },
  compactSymptomName: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: 'Inter500',
    color: '#4A4A4A',
  },
  compactLikelihood: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter600',
    color: '#E57373',
  },
  compactMore: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(6),
  },
});

export default SymptomPredictionCard;
