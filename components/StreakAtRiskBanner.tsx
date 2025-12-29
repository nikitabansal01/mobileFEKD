import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { rewardService } from '../services/rewardService';

interface StreakAtRiskBannerProps {
  streakAtRisk: boolean;
  canFreeze: boolean;
  missedDaysCount: number;
  freezesNeeded: number;
  freezeCount: number;
  onFreezeSuccess?: () => void;
  style?: 'full' | 'compact' | 'minimal';
}

/**
 * StreakAtRiskBanner - Universal component to show streak freeze warnings
 * 
 * Use this across multiple screens to ensure users never miss the opportunity to save their streak.
 * Supports 3 display styles:
 * - 'full': Large prominent banner with details (HomeScreen)
 * - 'compact': Medium banner for in-screen alerts (PersonalizeScreen, InsightsScreen)
 * - 'minimal': Small inline alert (ActionDetailScreen, ProfileScreen)
 */
const StreakAtRiskBanner: React.FC<StreakAtRiskBannerProps> = ({
  streakAtRisk,
  canFreeze,
  missedDaysCount,
  freezesNeeded,
  freezeCount,
  onFreezeSuccess,
  style = 'full',
}) => {
  // Don't show banner if not at risk OR can't freeze (no tokens)
  if (!streakAtRisk || !canFreeze || missedDaysCount === 0) {
    return null;
  }

  const handleFreeze = async () => {
    const dayText = missedDaysCount === 1 ? 'day' : 'days';
    const tokenText = freezesNeeded === 1 ? 'token' : 'tokens';
    
    Alert.alert(
      '⚠️ Your Streak is at Risk!',
      `You missed ${missedDaysCount} ${dayText}. Use ${freezesNeeded} freeze ${tokenText} to protect your streak?\n\n` +
      `You have ${freezeCount} ${freezeCount === 1 ? 'token' : 'tokens'} available.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: `Use ${freezesNeeded} Freeze ${freezesNeeded === 1 ? 'Token' : 'Tokens'} 🧊`,
          style: 'default',
          onPress: async () => {
            try {
              const result = await rewardService.useFreezeReactive();
              if (result.success) {
                Alert.alert(
                  '✅ Streak Saved!',
                  result.message || `${result.days_frozen} day(s) frozen. Your streak is safe!`,
                  [{ text: 'Great!', style: 'default' }]
                );
                if (onFreezeSuccess) {
                  onFreezeSuccess();
                }
              } else {
                Alert.alert('Error', result.error || 'Could not freeze streak');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to freeze streak. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (style === 'minimal') {
    return (
      <TouchableOpacity style={styles.minimalContainer} onPress={handleFreeze}>
        <Text style={styles.minimalText}>
          🔴 Streak at Risk • {freezeCount} 🧊
        </Text>
      </TouchableOpacity>
    );
  }

  if (style === 'compact') {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handleFreeze}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>⚠️</Text>
          <Text style={styles.compactTitle}>Streak at Risk!</Text>
        </View>
        <Text style={styles.compactMessage}>
          {missedDaysCount} missed {missedDaysCount === 1 ? 'day' : 'days'} • Tap to freeze
        </Text>
      </TouchableOpacity>
    );
  }

  // Full style (default)
  return (
    <View style={styles.fullContainer}>
      <View style={styles.fullHeader}>
        <Text style={styles.fullIcon}>⚠️</Text>
        <View style={styles.fullHeaderText}>
          <Text style={styles.fullTitle}>Your Streak is at Risk!</Text>
          <Text style={styles.fullSubtitle}>
            You missed {missedDaysCount} {missedDaysCount === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.fullMessage}>
        Use {freezesNeeded} freeze {freezesNeeded === 1 ? 'token' : 'tokens'} to save your streak?
        {'\n'}You have {freezeCount} {freezeCount === 1 ? 'token' : 'tokens'} available.
      </Text>

      <View style={styles.fullButtons}>
        <TouchableOpacity style={styles.freezeButton} onPress={handleFreeze}>
          <Text style={styles.freezeButtonText}>
            🧊 Use {freezesNeeded} Freeze {freezesNeeded === 1 ? 'Token' : 'Tokens'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Full Banner Style
  fullContainer: {
    backgroundColor: '#FEF3E7',
    borderRadius: 16,
    padding: responsiveWidth(4),
    marginHorizontal: responsiveWidth(4),
    marginVertical: responsiveHeight(1.5),
    borderWidth: 2,
    borderColor: '#F39C12',
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  fullIcon: {
    fontSize: responsiveFontSize(4),
    marginRight: responsiveWidth(3),
  },
  fullHeaderText: {
    flex: 1,
  },
  fullTitle: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: '700',
    color: '#D35400',
    marginBottom: 4,
  },
  fullSubtitle: {
    fontSize: responsiveFontSize(1.6),
    color: '#E67E22',
    fontWeight: '600',
  },
  fullMessage: {
    fontSize: responsiveFontSize(1.8),
    color: '#5D4037',
    lineHeight: 24,
    marginBottom: responsiveHeight(1.5),
  },
  fullButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  freezeButton: {
    flex: 1,
    backgroundColor: '#E67E22',
    paddingVertical: responsiveHeight(1.5),
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D35400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  freezeButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.9),
    fontWeight: '700',
  },

  // Compact Banner Style
  compactContainer: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(4),
    marginHorizontal: responsiveWidth(4),
    marginVertical: responsiveHeight(1),
    borderRadius: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactIcon: {
    fontSize: responsiveFontSize(2.2),
    marginRight: 8,
  },
  compactTitle: {
    fontSize: responsiveFontSize(1.8),
    fontWeight: '700',
    color: '#D35400',
  },
  compactMessage: {
    fontSize: responsiveFontSize(1.5),
    color: '#856404',
    marginLeft: responsiveWidth(8),
  },

  // Minimal Style
  minimalContainer: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  minimalText: {
    fontSize: responsiveFontSize(1.4),
    color: '#C62828',
    fontWeight: '600',
  },
});

export default StreakAtRiskBanner;
