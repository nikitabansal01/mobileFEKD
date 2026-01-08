/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MOOD TRACKER WIDGET COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Quick daily mood logging with visual history.
 * Features:
 * - One-tap mood selection
 * - Energy level slider
 * - 7-day mood history visualization
 * - Streak tracking
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
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

interface MoodEntry {
  date: string;
  moodLevel: number;
  energyLevel: number;
  timestamp: string;
}

interface MoodTrackerProps {
  onMoodLogged?: (mood: number, energy: number) => void;
  onViewHistory?: () => void;
  initialMood?: number;
  initialEnergy?: number;
  recentMoods?: MoodEntry[];
  streak?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const MOOD_OPTIONS = [
  { level: 1, emoji: '😢', label: 'Awful', color: '#E57373' },
  { level: 2, emoji: '😔', label: 'Bad', color: '#FF8A65' },
  { level: 3, emoji: '😐', label: 'Meh', color: '#FFD54F' },
  { level: 4, emoji: '🙂', label: 'Okay', color: '#AED581' },
  { level: 5, emoji: '😊', label: 'Good', color: '#81C784' },
  { level: 6, emoji: '😄', label: 'Great', color: '#4DB6AC' },
  { level: 7, emoji: '🤩', label: 'Amazing', color: '#64B5F6' },
];

const ENERGY_OPTIONS = [
  { level: 1, emoji: '😴', label: 'Exhausted' },
  { level: 2, emoji: '🥱', label: 'Tired' },
  { level: 3, emoji: '😌', label: 'Calm' },
  { level: 4, emoji: '😊', label: 'Good' },
  { level: 5, emoji: '⚡', label: 'Energetic' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MoodButtonProps {
  option: typeof MOOD_OPTIONS[0];
  selected: boolean;
  onPress: () => void;
}

const MoodButton: React.FC<MoodButtonProps> = ({ option, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.moodButton,
        selected && { backgroundColor: `${option.color}30`, borderColor: option.color }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.moodEmoji, selected && styles.moodEmojiSelected]}>
        {option.emoji}
      </Text>
      {selected && (
        <Text style={[styles.moodLabel, { color: option.color }]}>
          {option.label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY SLIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface EnergySliderProps {
  value: number;
  onChange: (value: number) => void;
}

const EnergySlider: React.FC<EnergySliderProps> = ({ value, onChange }) => {
  return (
    <View style={styles.energyContainer}>
      <Text style={styles.energyTitle}>Energy Level</Text>
      <View style={styles.energyOptions}>
        {ENERGY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.level}
            style={[
              styles.energyOption,
              value === option.level && styles.energyOptionSelected
            ]}
            onPress={() => onChange(option.level)}
          >
            <Text style={styles.energyEmoji}>{option.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.energyLabel}>
        {ENERGY_OPTIONS.find(o => o.level === value)?.label || 'Select'}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD HISTORY MINI CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface MoodHistoryProps {
  moods: MoodEntry[];
  onPress?: () => void;
}

const MoodHistoryMini: React.FC<MoodHistoryProps> = ({ moods, onPress }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const getMoodForDate = (date: string) => {
    return moods.find(m => m.date === date);
  };

  const getDayLabel = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  return (
    <TouchableOpacity 
      style={styles.historyContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.historyTitle}>Last 7 Days</Text>
      <View style={styles.historyChart}>
        {last7Days.map((date, index) => {
          const mood = getMoodForDate(date);
          const moodOption = mood ? MOOD_OPTIONS.find(o => o.level === mood.moodLevel) : null;
          
          return (
            <View key={date} style={styles.historyDay}>
              <View 
                style={[
                  styles.historyBar,
                  { 
                    height: mood ? verticalScale(8 + mood.moodLevel * 5) : verticalScale(8),
                    backgroundColor: moodOption?.color || '#E0E0E0'
                  }
                ]}
              />
              <Text style={styles.historyLabel}>{getDayLabel(date)}</Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MoodTracker: React.FC<MoodTrackerProps> = ({
  onMoodLogged,
  onViewHistory,
  initialMood,
  initialEnergy = 3,
  recentMoods = [],
  streak = 0,
}) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(initialMood || null);
  const [energy, setEnergy] = useState(initialEnergy);
  const [logged, setLogged] = useState(false);

  // Check if already logged today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMood = recentMoods.find(m => m.date === today);
    if (todayMood) {
      setSelectedMood(todayMood.moodLevel);
      setEnergy(todayMood.energyLevel);
      setLogged(true);
    }
  }, [recentMoods]);

  const handleLog = () => {
    if (selectedMood !== null) {
      onMoodLogged?.(selectedMood, energy);
      setLogged(true);
    }
  };

  const getMoodOption = () => MOOD_OPTIONS.find(o => o.level === selectedMood);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Tap to log your mood</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
      </View>

      {/* Logged state */}
      {logged && selectedMood !== null && (
        <LinearGradient
          colors={[`${getMoodOption()?.color}20`, `${getMoodOption()?.color}10`] as const}
          style={styles.loggedCard}
        >
          <Text style={styles.loggedEmoji}>{getMoodOption()?.emoji}</Text>
          <View>
            <Text style={styles.loggedTitle}>Today: {getMoodOption()?.label}</Text>
            <Text style={styles.loggedSubtitle}>
              Energy: {ENERGY_OPTIONS.find(o => o.level === energy)?.label}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setLogged(false)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Mood selection (when not logged) */}
      {!logged && (
        <>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((option) => (
              <MoodButton
                key={option.level}
                option={option}
                selected={selectedMood === option.level}
                onPress={() => setSelectedMood(option.level)}
              />
            ))}
          </View>

          {selectedMood !== null && (
            <>
              <EnergySlider value={energy} onChange={setEnergy} />
              
              <TouchableOpacity
                style={[
                  styles.logButton,
                  { backgroundColor: getMoodOption()?.color }
                ]}
                onPress={handleLog}
              >
                <Text style={styles.logButtonText}>Log Mood</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* History mini chart */}
      {recentMoods.length > 0 && (
        <MoodHistoryMini moods={recentMoods} onPress={onViewHistory} />
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 12,
  },
  streakEmoji: {
    fontSize: moderateScale(14),
    marginRight: scale(4),
  },
  streakText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter600',
    color: '#FF9800',
  },
  // Logged state
  loggedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: scale(16),
    marginBottom: verticalScale(15),
  },
  loggedEmoji: {
    fontSize: moderateScale(40),
    marginRight: scale(16),
  },
  loggedTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter600',
    color: '#2D2D2D',
  },
  loggedSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(2),
  },
  editButton: {
    marginLeft: 'auto',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  editText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
  },
  // Mood selection
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(8),
    marginBottom: verticalScale(15),
  },
  moodButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: moderateScale(22),
  },
  moodEmojiSelected: {
    fontSize: moderateScale(24),
  },
  moodLabel: {
    position: 'absolute',
    bottom: -verticalScale(18),
    fontSize: moderateScale(10),
    fontFamily: 'Inter500',
  },
  // Energy slider
  energyContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  energyTitle: {
    fontSize: moderateScale(13),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
    marginBottom: verticalScale(8),
  },
  energyOptions: {
    flexDirection: 'row',
    gap: scale(8),
  },
  energyOption: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  energyOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#81C784',
  },
  energyEmoji: {
    fontSize: moderateScale(18),
  },
  energyLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    marginTop: verticalScale(6),
  },
  // Log button
  logButton: {
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  logButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter600',
    color: '#FFFFFF',
  },
  // History
  historyContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: scale(14),
  },
  historyTitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
    marginBottom: verticalScale(10),
  },
  historyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: verticalScale(50),
  },
  historyDay: {
    alignItems: 'center',
    flex: 1,
  },
  historyBar: {
    width: scale(20),
    borderRadius: 4,
    marginBottom: verticalScale(4),
  },
  historyLabel: {
    fontSize: moderateScale(10),
    fontFamily: 'Inter400',
    color: '#9E9E9E',
  },
});

export default MoodTracker;
