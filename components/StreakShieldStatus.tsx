import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

interface StreakShieldStatusProps {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  streakAtRisk: boolean;
  missedDaysCount: number;
  onPress?: () => void;
}

/**
 * StreakShieldStatus - Prominent display of streak and shield tokens
 * 
 * Based on Duolingo's research and Octalysis Framework:
 * - Core Drive 6 (Scarcity): Make tokens feel valuable by showing count
 * - Core Drive 8 (Loss Avoidance): Highlight when streak is at risk
 * - Core Drive 2 (Accomplishment): Show streak achievements
 * 
 * Place this on HomeScreen to make streak status highly visible.
 */
const StreakShieldStatus: React.FC<StreakShieldStatusProps> = ({
  currentStreak,
  longestStreak,
  freezeCount,
  streakAtRisk,
  missedDaysCount,
  onPress,
}) => {
  // Determine status color based on streak health
  const getStreakColor = () => {
    if (streakAtRisk) return '#E74C3C'; // Red - at risk
    if (currentStreak >= longestStreak && currentStreak > 0) return '#9B59B6'; // Purple - new record!
    if (currentStreak >= 30) return '#F1C40F'; // Gold - amazing
    if (currentStreak >= 7) return '#E67E22'; // Orange - good
    return '#3498DB'; // Blue - normal
  };

  const getStreakEmoji = () => {
    if (streakAtRisk) return '⚠️';
    if (currentStreak >= 100) return '💎';
    if (currentStreak >= 30) return '🏆';
    if (currentStreak >= 7) return '🔥';
    if (currentStreak > 0) return '✨';
    return '🌱';
  };

  const getStreakMessage = () => {
    if (streakAtRisk) {
      return `${missedDaysCount} missed! Save it!`;
    }
    if (currentStreak >= longestStreak && currentStreak > 0 && currentStreak >= 7) {
      return 'New record! 🎉';
    }
    if (currentStreak >= 30) {
      return 'Legendary streak!';
    }
    if (currentStreak >= 7) {
      return 'Keep it up!';
    }
    if (currentStreak > 0) {
      return 'Building momentum';
    }
    return 'Start your streak!';
  };

  const getShieldColor = () => {
    if (freezeCount === 0) return '#BDC3C7'; // Gray - no shields
    if (freezeCount <= 2) return '#3498DB'; // Blue - have some
    return '#27AE60'; // Green - well stocked
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: getStreakColor() }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Streak Section */}
      <View style={styles.streakSection}>
        <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
        <View style={styles.streakTextContainer}>
          <Text style={[styles.streakNumber, { color: getStreakColor() }]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Shield Section */}
      <View style={styles.shieldSection}>
        <Text style={styles.shieldEmoji}>🛡️</Text>
        <View style={styles.shieldTextContainer}>
          <Text style={[styles.shieldNumber, { color: getShieldColor() }]}>
            {freezeCount}
          </Text>
          <Text style={styles.shieldLabel}>
            {freezeCount === 1 ? 'shield' : 'shields'}
          </Text>
        </View>
        {freezeCount === 0 ? (
          <Text style={styles.earnMoreText}>Earn more! →</Text>
        ) : (
          <Text style={styles.protectedText}>
            {streakAtRisk ? 'Use now!' : 'Protected'}
          </Text>
        )}
      </View>

      {/* At Risk Indicator */}
      {streakAtRisk && (
        <View style={styles.atRiskBadge}>
          <Text style={styles.atRiskText}>⚡ SAVE NOW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: responsiveWidth(3),
    marginHorizontal: responsiveWidth(4),
    marginVertical: responsiveHeight(1),
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  streakSection: {
    flex: 1,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: responsiveFontSize(2.8),
    marginBottom: 4,
  },
  streakTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontSize: responsiveFontSize(3.5),
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: responsiveFontSize(1.4),
    color: '#7F8C8D',
    marginLeft: 4,
  },
  streakMessage: {
    fontSize: responsiveFontSize(1.2),
    color: '#95A5A6',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#ECF0F1',
    marginHorizontal: responsiveWidth(2),
  },
  shieldSection: {
    flex: 1,
    alignItems: 'center',
  },
  shieldEmoji: {
    fontSize: responsiveFontSize(2.8),
    marginBottom: 4,
  },
  shieldTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  shieldNumber: {
    fontSize: responsiveFontSize(3.5),
    fontWeight: 'bold',
  },
  shieldLabel: {
    fontSize: responsiveFontSize(1.4),
    color: '#7F8C8D',
    marginLeft: 4,
  },
  earnMoreText: {
    fontSize: responsiveFontSize(1.2),
    color: '#E67E22',
    marginTop: 2,
    fontWeight: '600',
  },
  protectedText: {
    fontSize: responsiveFontSize(1.2),
    color: '#27AE60',
    marginTop: 2,
  },
  atRiskBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  atRiskText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.1),
    fontWeight: 'bold',
  },
});

export default StreakShieldStatus;
