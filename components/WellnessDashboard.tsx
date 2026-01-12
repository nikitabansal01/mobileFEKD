/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WELLNESS DASHBOARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Displays holistic wellness score with dimension breakdown.
 * Features:
 * - Overall wellness score (0-100) with animated ring
 * - 6 dimension scores (Sleep, Mood, Symptoms, Habits, Cycle, Social)
 * - AI-generated insights and recommendations
 * - Trending indicators (improving/stable/declining)
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Circle } from 'react-native-svg';
import { BACKGROUND, BRAND, TEXT } from '../constants/Colors';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface DimensionScore {
  name: string;
  score: number;
  icon: string;
  color: string;
}

interface WellnessData {
  overall_score: number;
  dimension_scores: {
    sleep: number;
    mood: number;
    symptoms: number;
    habits: number;
    cycle_alignment: number;
    social: number;
  };
  insights: string[];
  recommendations: string[];
  emoji: string;
  message: string;
  trend?: 'improving' | 'stable' | 'declining';
}

interface WellnessDashboardProps {
  userId: string;
  onRefresh?: () => void;
  onInsightPress?: (insight: string) => void;
  onDimensionPress?: (dimension: string) => void;
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED SCORE RING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  emoji?: string;
}

const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 12,
  emoji = '😊'
}) => {
  const animatedValue = new Animated.Value(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const getScoreColor = () => {
    if (score >= 85) return '#4CAF50'; // Green
    if (score >= 70) return '#8BC34A'; // Light green
    if (score >= 50) return '#FFC107'; // Yellow
    if (score >= 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.scoreCenter, { width: size, height: size }]}>
        <Text style={styles.emojiLarge}>{emoji}</Text>
        <Text style={styles.scoreNumber}>{Math.round(score)}</Text>
        <Text style={styles.scoreLabel}>Wellness</Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIMENSION BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DimensionBarProps {
  dimension: DimensionScore;
  onPress?: () => void;
}

const DimensionBar: React.FC<DimensionBarProps> = ({ dimension, onPress }) => {
  const getBarColor = (score: number): readonly [string, string] => {
    if (score >= 80) return ['#4CAF50', '#81C784'] as const;
    if (score >= 60) return ['#8BC34A', '#AED581'] as const;
    if (score >= 40) return ['#FFC107', '#FFD54F'] as const;
    if (score >= 20) return ['#FF9800', '#FFB74D'] as const;
    return ['#F44336', '#EF5350'] as const;
  };

  return (
    <TouchableOpacity
      style={styles.dimensionContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dimensionHeader}>
        <Text style={styles.dimensionIcon}>{dimension.icon}</Text>
        <Text style={styles.dimensionName}>{dimension.name}</Text>
        <Text style={styles.dimensionScore}>{dimension.score}%</Text>
      </View>
      <View style={styles.barBackground}>
        <LinearGradient
          colors={getBarColor(dimension.score)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${dimension.score}%` }]}
        />
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WELLNESS DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const WellnessDashboard: React.FC<WellnessDashboardProps> = ({
  userId,
  onRefresh,
  onInsightPress,
  onDimensionPress,
  compact = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wellnessData, setWellnessData] = useState<WellnessData | null>(null);

  useEffect(() => {
    fetchWellnessData();
  }, [userId]);

  const fetchWellnessData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/wellness-score/${userId}`);
      // const data = await response.json();

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWellnessData({
        overall_score: 73,
        dimension_scores: {
          sleep: 68,
          mood: 78,
          symptoms: 85,
          habits: 62,
          cycle_alignment: 70,
          social: 75,
        },
        insights: [
          "Your mood has been improving over the past 3 days! 🌟",
          "Sleep consistency could use some attention 💤",
          "Great job managing symptoms this week! 💪"
        ],
        recommendations: [
          "Try to get to bed 30 minutes earlier tonight",
          "Consider a short walk to boost your energy",
          "Stay hydrated - aim for 8 glasses today"
        ],
        emoji: '😊',
        message: "You're doing well! Small improvements add up.",
        trend: 'improving',
      });

    } catch (err) {
      setError('Failed to load wellness data');
      console.error('Wellness fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDimensions = (): DimensionScore[] => {
    if (!wellnessData) return [];

    return [
      { name: 'Sleep', score: wellnessData.dimension_scores.sleep, icon: '😴', color: '#7C4DFF' },
      { name: 'Mood', score: wellnessData.dimension_scores.mood, icon: '😊', color: '#E91E63' },
      { name: 'Symptoms', score: wellnessData.dimension_scores.symptoms, icon: '💫', color: '#00BCD4' },
      { name: 'Habits', score: wellnessData.dimension_scores.habits, icon: '✨', color: '#FF9800' },
      { name: 'Cycle', score: wellnessData.dimension_scores.cycle_alignment, icon: '🌙', color: '#9C27B0' },
      { name: 'Social', score: wellnessData.dimension_scores.social, icon: '💜', color: '#4CAF50' },
    ];
  };

  const getTrendIcon = () => {
    switch (wellnessData?.trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A29AEA" />
        <Text style={styles.loadingText}>Calculating your wellness...</Text>
      </View>
    );
  }

  if (error || !wellnessData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorText}>{error || 'Unable to load data'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWellnessData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Compact version for dashboard widget
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(162, 154, 234, 0.2)', 'rgba(233, 139, 172, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            <ScoreRing score={wellnessData.overall_score} size={80} strokeWidth={8} emoji={wellnessData.emoji} />
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Today's Wellness</Text>
              <Text style={styles.compactMessage}>{wellnessData.message}</Text>
              <View style={styles.trendBadge}>
                <Text style={styles.trendText}>{getTrendIcon()} {wellnessData.trend}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Full version
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Wellness Today</Text>
        <TouchableOpacity onPress={onRefresh || fetchWellnessData}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Main Score */}
      <View style={styles.mainScoreContainer}>
        <ScoreRing
          score={wellnessData.overall_score}
          emoji={wellnessData.emoji}
        />
        <Text style={styles.mainMessage}>{wellnessData.message}</Text>
        <View style={styles.trendContainer}>
          <Text style={styles.trendIndicator}>
            {getTrendIcon()} Trending {wellnessData.trend}
          </Text>
        </View>
      </View>

      {/* Dimension Breakdown */}
      <View style={styles.dimensionsSection}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        {getDimensions().map((dim, index) => (
          <DimensionBar
            key={index}
            dimension={dim}
            onPress={() => onDimensionPress?.(dim.name)}
          />
        ))}
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>✨ Insights</Text>
        {wellnessData.insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={styles.insightCard}
            onPress={() => onInsightPress?.(insight)}
          >
            <Text style={styles.insightText}>{insight}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>💡 Today's Focus</Text>
        {wellnessData.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
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
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  title: {
    fontSize: moderateScale(20, 0.5),
    fontFamily: 'NotoSerif600',
    color: '#2D2D2D',
  },
  refreshButton: {
    fontSize: moderateScale(20),
    padding: scale(5),
  },
  mainScoreContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLarge: {
    fontSize: moderateScale(28),
    marginBottom: verticalScale(4),
  },
  scoreNumber: {
    fontSize: moderateScale(32, 0.5),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  scoreLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  mainMessage: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter500',
    color: '#4A4A4A',
    textAlign: 'center',
    marginTop: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  trendContainer: {
    marginTop: verticalScale(8),
  },
  trendIndicator: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  dimensionsSection: {
    marginTop: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'NotoSerif500',
    color: '#2D2D2D',
    marginBottom: verticalScale(12),
  },
  dimensionContainer: {
    marginBottom: verticalScale(12),
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  dimensionIcon: {
    fontSize: moderateScale(14),
    marginRight: scale(6),
  },
  dimensionName: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: 'Inter500',
    color: '#4A4A4A',
  },
  dimensionScore: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  barBackground: {
    height: verticalScale(8),
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightsSection: {
    marginTop: verticalScale(20),
  },
  insightCard: {
    backgroundColor: '#F8F4FF',
    borderRadius: 12,
    padding: scale(12),
    marginBottom: verticalScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#A29AEA',
  },
  insightText: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#4A4A4A',
    lineHeight: verticalScale(20),
  },
  recommendationsSection: {
    marginTop: verticalScale(15),
  },
  recommendationCard: {
    flexDirection: 'row',
    marginBottom: verticalScale(8),
    paddingLeft: scale(4),
  },
  recommendationBullet: {
    fontSize: moderateScale(14),
    color: '#E98BAC',
    marginRight: scale(8),
    fontFamily: 'Inter600',
  },
  recommendationText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: 'Inter400',
    color: '#4A4A4A',
    lineHeight: verticalScale(20),
  },
  // Loading & Error States
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
    backgroundColor: '#A29AEA',
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
    padding: scale(16),
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: scale(16),
  },
  compactTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'NotoSerif600',
    color: '#2D2D2D',
  },
  compactMessage: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(4),
  },
  trendBadge: {
    marginTop: verticalScale(6),
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: moderateScale(11),
    fontFamily: 'Inter500',
    color: '#4CAF50',
  },
});

export default WellnessDashboard;
