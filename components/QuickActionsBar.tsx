/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUICK ACTIONS BAR COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides quick access to common wellness tasks.
 * Features:
 * - Log mood, symptoms, sleep
 * - Quick voice input
 * - Chat shortcuts
 * - Customizable action slots
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  colors: readonly [string, string];
  onPress: () => void;
}

interface QuickActionsBarProps {
  onLogMood?: () => void;
  onLogSymptom?: () => void;
  onLogSleep?: () => void;
  onStartVoice?: () => void;
  onAskQuestion?: () => void;
  onViewInsights?: () => void;
  customActions?: QuickAction[];
  compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionButtonProps {
  action: QuickAction;
  compact?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, compact }) => {
  return (
    <TouchableOpacity
      style={[styles.actionButton, compact && styles.actionButtonCompact]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={action.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.actionGradient, compact && styles.actionGradientCompact]}
      >
        <Text style={[styles.actionIcon, compact && styles.actionIconCompact]}>
          {action.icon}
        </Text>
      </LinearGradient>
      <Text 
        style={[styles.actionLabel, compact && styles.actionLabelCompact]}
        numberOfLines={1}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onLogMood,
  onLogSymptom,
  onLogSleep,
  onStartVoice,
  onAskQuestion,
  onViewInsights,
  customActions = [],
  compact = false,
}) => {
  const defaultActions: QuickAction[] = [
    {
      id: 'mood',
      icon: '😊',
      label: 'Log Mood',
      colors: ['#E91E63', '#F48FB1'] as const,
      onPress: onLogMood || (() => console.log('Log mood')),
    },
    {
      id: 'symptom',
      icon: '💫',
      label: 'Symptom',
      colors: ['#00BCD4', '#80DEEA'] as const,
      onPress: onLogSymptom || (() => console.log('Log symptom')),
    },
    {
      id: 'sleep',
      icon: '😴',
      label: 'Sleep',
      colors: ['#7C4DFF', '#B388FF'] as const,
      onPress: onLogSleep || (() => console.log('Log sleep')),
    },
    {
      id: 'voice',
      icon: '🎙️',
      label: 'Voice',
      colors: ['#FF9800', '#FFCC80'] as const,
      onPress: onStartVoice || (() => console.log('Start voice')),
    },
    {
      id: 'ask',
      icon: '💬',
      label: 'Ask Auvra',
      colors: ['#A29AEA', '#C17EC9'] as const,
      onPress: onAskQuestion || (() => console.log('Ask question')),
    },
    {
      id: 'insights',
      icon: '📊',
      label: 'Insights',
      colors: ['#4CAF50', '#81C784'] as const,
      onPress: onViewInsights || (() => console.log('View insights')),
    },
  ];

  const actions = customActions.length > 0 ? customActions : defaultActions;

  return (
    <View style={styles.container}>
      {!compact && (
        <Text style={styles.title}>Quick Actions</Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <ActionButton 
            key={action.id} 
            action={action} 
            compact={compact}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    marginVertical: verticalScale(8),
  },
  title: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
    marginBottom: verticalScale(12),
    paddingHorizontal: responsiveWidth(4),
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(4),
    gap: scale(12),
  },
  actionButton: {
    alignItems: 'center',
    width: scale(64),
  },
  actionButtonCompact: {
    width: scale(52),
  },
  actionGradient: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGradientCompact: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
  },
  actionIcon: {
    fontSize: moderateScale(24),
  },
  actionIconCompact: {
    fontSize: moderateScale(20),
  },
  actionLabel: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins500',
    color: '#4A4A4A',
    marginTop: verticalScale(6),
    textAlign: 'center',
  },
  actionLabelCompact: {
    fontSize: moderateScale(9),
    marginTop: verticalScale(4),
  },
});

export default QuickActionsBar;
