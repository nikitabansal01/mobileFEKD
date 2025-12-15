/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SESSION SUMMARY MODAL COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Displays an intelligent summary after chat sessions end.
 * Features:
 * - Conversation summary with key topics
 * - Emotional journey visualization
 * - Action items extracted from conversation
 * - Share/export functionality
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
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

interface EmotionalJourney {
  start: string;
  end: string;
  trend: 'improving' | 'stable' | 'declining';
}

interface SessionMetrics {
  duration_minutes: number;
  message_count: number;
}

interface SessionSummaryData {
  summary: string;
  key_topics: string[];
  emotional_journey: EmotionalJourney;
  action_items: string[];
  insights: string[];
  next_steps: string[];
  metrics: SessionMetrics;
}

interface SessionSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  data: SessionSummaryData | null;
  onActionItemPress?: (item: string) => void;
  /** Show loading state while fetching summary */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Retry callback for error state */
  onRetry?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMOTION ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const EMOTION_ICONS: Record<string, string> = {
  happy: '😊',
  hopeful: '🌟',
  neutral: '😌',
  anxious: '😰',
  sad: '😢',
  frustrated: '😤',
  calm: '😇',
  energetic: '⚡',
  tired: '😴',
  stressed: '😓',
};

const getEmotionIcon = (emotion: string) => {
  return EMOTION_ICONS[emotion.toLowerCase()] || '😊';
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOPIC CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TopicChipProps {
  topic: string;
}

const TopicChip: React.FC<TopicChipProps> = ({ topic }) => {
  const getTopicColor = (topic: string): readonly [string, string] => {
    const colors: Record<string, readonly [string, string]> = {
      sleep: ['#7C4DFF', '#B388FF'] as const,
      mood: ['#E91E63', '#F48FB1'] as const,
      symptoms: ['#00BCD4', '#80DEEA'] as const,
      cycle: ['#9C27B0', '#CE93D8'] as const,
      habits: ['#FF9800', '#FFCC80'] as const,
      nutrition: ['#4CAF50', '#A5D6A7'] as const,
      energy: ['#FFC107', '#FFE082'] as const,
    };
    return colors[topic.toLowerCase()] || (['#9E9E9E', '#BDBDBD'] as const);
  };

  const getTopicIcon = (topic: string) => {
    const icons: Record<string, string> = {
      sleep: '😴',
      mood: '🎭',
      symptoms: '💫',
      cycle: '🌙',
      habits: '✨',
      nutrition: '🥗',
      energy: '⚡',
    };
    return icons[topic.toLowerCase()] || '•';
  };

  return (
    <LinearGradient
      colors={getTopicColor(topic)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.topicChip}
    >
      <Text style={styles.topicIcon}>{getTopicIcon(topic)}</Text>
      <Text style={styles.topicText}>{topic}</Text>
    </LinearGradient>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMOTIONAL JOURNEY VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

interface EmotionalJourneyViewProps {
  journey: EmotionalJourney;
}

const EmotionalJourneyView: React.FC<EmotionalJourneyViewProps> = ({ journey }) => {
  const getTrendColor = () => {
    switch (journey.trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#F44336';
      default: return '#FFC107';
    }
  };

  const getTrendIcon = () => {
    switch (journey.trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  return (
    <View style={styles.journeyContainer}>
      <Text style={styles.sectionTitle}>💜 Emotional Journey</Text>
      <View style={styles.journeyFlow}>
        {/* Start emotion */}
        <View style={styles.emotionPoint}>
          <Text style={styles.emotionEmoji}>{getEmotionIcon(journey.start)}</Text>
          <Text style={styles.emotionLabel}>{journey.start}</Text>
        </View>

        {/* Trend line */}
        <View style={[styles.trendLine, { backgroundColor: getTrendColor() }]} />
        <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
        <View style={[styles.trendLine, { backgroundColor: getTrendColor() }]} />

        {/* End emotion */}
        <View style={styles.emotionPoint}>
          <Text style={styles.emotionEmoji}>{getEmotionIcon(journey.end)}</Text>
          <Text style={styles.emotionLabel}>{journey.end}</Text>
        </View>
      </View>

      {/* Trend badge */}
      <View style={[styles.trendBadge, { backgroundColor: `${getTrendColor()}20` }]}>
        <Text style={[styles.trendText, { color: getTrendColor() }]}>
          {getTrendIcon()} {journey.trend === 'improving' ? 'Mood improved' : 
            journey.trend === 'declining' ? 'You might need more support' : 
            'Stayed stable'}
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  visible,
  onClose,
  data,
  onActionItemPress,
  loading = false,
  error = null,
  onRetry,
}) => {
  const handleShare = async () => {
    if (!data) return;

    const shareText = `
🌸 My AUVRA Session Summary

${data.summary}

📋 Key Topics: ${data.key_topics.join(', ')}

💜 Emotional Journey: ${data.emotional_journey.start} → ${data.emotional_journey.end}

✅ My Action Items:
${data.action_items.map(item => `• ${item}`).join('\n')}

📊 Session: ${data.metrics.duration_minutes} mins, ${data.metrics.message_count} messages
    `.trim();

    try {
      await Share.share({
        message: shareText,
        title: 'My AUVRA Session Summary',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Don't render if not visible
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#A29AEA', '#E98BAC'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>✨ Session Complete</Text>
              {data && (
                <Text style={styles.headerSubtitle}>
                  {data.metrics.duration_minutes} mins • {data.metrics.message_count} messages
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A29AEA" />
              <Text style={styles.loadingText}>Summarizing your session...</Text>
              <Text style={styles.loadingSubtext}>Analyzing insights and action items</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorEmoji}>😔</Text>
              <Text style={styles.errorText}>{error}</Text>
              {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBottomButton} onPress={onClose}>
                <Text style={styles.closeBottomText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content - show when data is available and not loading/error */}
          {data && !loading && !error && (
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Summary */}
              <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{data.summary}</Text>
            </View>

            {/* Topics */}
            {data.key_topics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📌 Topics Discussed</Text>
                <View style={styles.topicsContainer}>
                  {data.key_topics.map((topic, index) => (
                    <TopicChip key={index} topic={topic} />
                  ))}
                </View>
              </View>
            )}

            {/* Emotional Journey */}
            <EmotionalJourneyView journey={data.emotional_journey} />

            {/* Action Items */}
            {data.action_items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Your Action Items</Text>
                {data.action_items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionItem}
                    onPress={() => onActionItemPress?.(item)}
                  >
                    <View style={styles.checkbox} />
                    <Text style={styles.actionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Insights */}
            {data.insights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Insights</Text>
                {data.insights.map((insight, index) => (
                  <View key={index} style={styles.insightCard}>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Next Steps */}
            {data.next_steps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚀 Next Steps</Text>
                {data.next_steps.map((step, index) => (
                  <View key={index} style={styles.nextStepItem}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bottom padding */}
            <View style={{ height: verticalScale(20) }} />
          </ScrollView>
          )}

          {/* Footer Actions - show only when data is available */}
          {data && !loading && !error && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareIcon}>📤</Text>
                <Text style={styles.shareText}>Share Summary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: responsiveHeight(90),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(20),
    paddingTop: verticalScale(24),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(20, 0.5),
    fontFamily: 'Poppins600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: verticalScale(4),
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    fontFamily: 'Poppins600',
  },
  content: {
    padding: scale(20),
  },
  // Summary
  summaryCard: {
    backgroundColor: '#F8F4FF',
    borderRadius: 16,
    padding: scale(16),
    marginBottom: verticalScale(20),
  },
  summaryText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins400',
    color: '#2D2D2D',
    lineHeight: verticalScale(24),
  },
  // Sections
  section: {
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
    marginBottom: verticalScale(12),
  },
  // Topics
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: 16,
  },
  topicIcon: {
    fontSize: moderateScale(12),
    marginRight: scale(4),
  },
  topicText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  // Emotional Journey
  journeyContainer: {
    marginBottom: verticalScale(20),
  },
  journeyFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(15),
  },
  emotionPoint: {
    alignItems: 'center',
    width: scale(70),
  },
  emotionEmoji: {
    fontSize: moderateScale(32),
    marginBottom: verticalScale(4),
  },
  emotionLabel: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins500',
    color: '#6F6F6F',
    textTransform: 'capitalize',
  },
  trendLine: {
    height: 3,
    width: scale(30),
    borderRadius: 2,
  },
  trendIcon: {
    fontSize: moderateScale(20),
    marginHorizontal: scale(8),
  },
  trendBadge: {
    alignSelf: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: 20,
  },
  trendText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins500',
  },
  // Action Items
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: scale(14),
    marginBottom: verticalScale(8),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A29AEA',
    marginRight: scale(12),
  },
  actionText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#2D2D2D',
    lineHeight: verticalScale(20),
  },
  // Insights
  insightCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: scale(14),
    marginBottom: verticalScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
  },
  insightText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#5D4037',
    lineHeight: verticalScale(20),
  },
  // Next Steps
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  stepNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#A29AEA',
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontFamily: 'Poppins600',
    textAlign: 'center',
    lineHeight: scale(24),
    marginRight: scale(12),
  },
  stepText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#4A4A4A',
    lineHeight: verticalScale(20),
    paddingTop: verticalScale(2),
  },
  // Footer
  footer: {
    flexDirection: 'row',
    padding: scale(20),
    paddingBottom: verticalScale(30),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: scale(12),
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4FF',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  shareIcon: {
    fontSize: moderateScale(16),
  },
  shareText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins500',
    color: '#A29AEA',
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A29AEA',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
  },
  doneText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins600',
    color: '#FFFFFF',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
  },
  loadingSubtext: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(20),
  },
  errorEmoji: {
    fontSize: moderateScale(48),
    marginBottom: verticalScale(16),
  },
  errorText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  retryButton: {
    backgroundColor: '#A29AEA',
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(12),
    borderRadius: 12,
    marginBottom: verticalScale(12),
  },
  retryText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins600',
    color: '#FFFFFF',
  },
  closeBottomButton: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(8),
  },
  closeBottomText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins500',
    color: '#6F6F6F',
  },
});

export default SessionSummaryModal;
