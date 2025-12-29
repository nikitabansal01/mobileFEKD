import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

// Colors matching AUVRA app design
const COLORS = {
  white: "#FFFFFF",
  warmPurple: "#C17EC9",
  gradPurple: "#A29AEA",
  textPrimary: "#4A3D5C",
  textSecondary: "#6B5B7A",
  accent: "#8B5CF6",
  border: "#E8E1F0",
  danger: "#E74C3C",
  greyLight: "#949494",
};

interface StreakShieldStatusProps {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  streakAtRisk: boolean;
  missedDaysCount: number;
  onPress?: () => void;
}

/**
 * StreakShieldStatus - Shows current streak and Streak Freeze count
 * Matches AUVRA app design from PersonalizeScreen
 */
const StreakShieldStatus: React.FC<StreakShieldStatusProps> = ({
  currentStreak,
  longestStreak,
  freezeCount,
  streakAtRisk,
  missedDaysCount,
  onPress,
}) => {
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
      return `${missedDaysCount} day${missedDaysCount > 1 ? 's' : ''} missed`;
    }
    if (currentStreak >= longestStreak && currentStreak > 0 && currentStreak >= 7) {
      return 'New record! 🎉';
    }
    if (currentStreak >= 30) return 'Legendary!';
    if (currentStreak >= 7) return 'On fire!';
    if (currentStreak > 0) return 'Keep going!';
    return 'Start today!';
  };

  return (
    <TouchableOpacity 
      style={[styles.container, streakAtRisk && styles.containerAtRisk]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Streak Section */}
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <Text style={styles.emoji}>{getStreakEmoji()}</Text>
          <Text style={[styles.number, streakAtRisk && styles.numberAtRisk]}>
            {currentStreak}
          </Text>
        </View>
        <Text style={styles.label}>Day Streak</Text>
        <Text style={[styles.subLabel, streakAtRisk && styles.subLabelAtRisk]}>
          {getStreakMessage()}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Streak Freeze Section */}
      <View style={styles.section}>
        <View style={styles.iconRow}>
          <Text style={styles.emoji}>🧊</Text>
          <Text style={styles.number}>{freezeCount}</Text>
        </View>
        <Text style={styles.label}>Streak Freeze</Text>
        <Text style={styles.subLabel}>
          {freezeCount === 0 ? 'Earn at Day 3' : streakAtRisk ? 'Tap to use' : 'Available'}
        </Text>
      </View>

      {/* At Risk Badge */}
      {streakAtRisk && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Save Now</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    marginHorizontal: scale(16),
    marginVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  containerAtRisk: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
  },
  section: {
    flex: 1,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  emoji: {
    fontSize: moderateScale(18),
  },
  number: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: COLORS.accent,
  },
  numberAtRisk: {
    color: COLORS.danger,
  },
  label: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: verticalScale(2),
  },
  subLabel: {
    fontSize: moderateScale(10),
    color: COLORS.greyLight,
    marginTop: verticalScale(1),
  },
  subLabelAtRisk: {
    color: COLORS.danger,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.border,
    marginHorizontal: scale(12),
  },
  badge: {
    position: 'absolute',
    top: -verticalScale(8),
    right: scale(12),
    backgroundColor: COLORS.danger,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
  },
  badgeText: {
    color: COLORS.white,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
});

export default StreakShieldStatus;