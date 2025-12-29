import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Streak Milestone Utilities
 * 
 * Based on Duolingo's research:
 * - Users who reach 10-day streak have much lower drop-off
 * - Milestone celebrations create emotional investment
 * 
 * Key milestones: 7, 14, 30, 50, 100, 200, 365, 500, 1000
 */

// Milestones to celebrate
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365, 500, 1000];

const CELEBRATED_MILESTONES_KEY = '@auvra_celebrated_milestones';

/**
 * Get the current applicable milestone for a streak count
 */
export const getCurrentMilestone = (streakCount: number): number | null => {
  // Find the highest milestone that was just reached
  const applicableMilestones = STREAK_MILESTONES.filter(m => streakCount >= m);
  
  if (applicableMilestones.length === 0) {
    return null;
  }
  
  // Return the highest applicable milestone
  return applicableMilestones[applicableMilestones.length - 1];
};

/**
 * Check if a milestone should be celebrated (not yet celebrated)
 */
export const shouldCelebrateMilestone = async (streakCount: number): Promise<number | null> => {
  try {
    // Get the current milestone
    const currentMilestone = getCurrentMilestone(streakCount);
    
    if (!currentMilestone) {
      return null;
    }

    // Check if we've already celebrated this milestone
    const celebratedJson = await AsyncStorage.getItem(CELEBRATED_MILESTONES_KEY);
    const celebratedMilestones: number[] = celebratedJson ? JSON.parse(celebratedJson) : [];

    // Only celebrate if this exact milestone hasn't been celebrated
    if (celebratedMilestones.includes(currentMilestone)) {
      return null;
    }

    // Also check if streak count exactly matches a milestone (celebrate on the day of achievement)
    // OR if it's the first session after achieving the milestone
    if (STREAK_MILESTONES.includes(streakCount) || 
        (streakCount > currentMilestone && !celebratedMilestones.includes(currentMilestone))) {
      return currentMilestone;
    }

    return null;
  } catch (error) {
    console.error('Error checking milestone celebration:', error);
    return null;
  }
};

/**
 * Mark a milestone as celebrated
 */
export const markMilestoneCelebrated = async (milestone: number): Promise<void> => {
  try {
    const celebratedJson = await AsyncStorage.getItem(CELEBRATED_MILESTONES_KEY);
    const celebratedMilestones: number[] = celebratedJson ? JSON.parse(celebratedJson) : [];

    if (!celebratedMilestones.includes(milestone)) {
      celebratedMilestones.push(milestone);
      await AsyncStorage.setItem(CELEBRATED_MILESTONES_KEY, JSON.stringify(celebratedMilestones));
    }
  } catch (error) {
    console.error('Error marking milestone as celebrated:', error);
  }
};

/**
 * Reset all celebrated milestones (for testing or streak reset)
 */
export const resetCelebratedMilestones = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CELEBRATED_MILESTONES_KEY);
  } catch (error) {
    console.error('Error resetting celebrated milestones:', error);
  }
};

/**
 * Get all celebrated milestones
 */
export const getCelebratedMilestones = async (): Promise<number[]> => {
  try {
    const celebratedJson = await AsyncStorage.getItem(CELEBRATED_MILESTONES_KEY);
    return celebratedJson ? JSON.parse(celebratedJson) : [];
  } catch (error) {
    console.error('Error getting celebrated milestones:', error);
    return [];
  }
};

/**
 * Get the next milestone to achieve
 */
export const getNextMilestone = (currentStreak: number): number | null => {
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak);
  return nextMilestone || null;
};

/**
 * Get progress to next milestone (0-100)
 */
export const getProgressToNextMilestone = (currentStreak: number): number => {
  const nextMilestone = getNextMilestone(currentStreak);
  
  if (!nextMilestone) {
    return 100; // Already at max milestone
  }

  // Find previous milestone (or 0)
  const previousMilestones = STREAK_MILESTONES.filter(m => m <= currentStreak);
  const previousMilestone = previousMilestones.length > 0 
    ? previousMilestones[previousMilestones.length - 1] 
    : 0;

  const totalDistance = nextMilestone - previousMilestone;
  const currentProgress = currentStreak - previousMilestone;

  return Math.round((currentProgress / totalDistance) * 100);
};

/**
 * Get a motivational message for the current streak
 */
export const getStreakMessage = (currentStreak: number): string => {
  if (currentStreak >= 1000) {
    return "You're a legend! 👑";
  }
  if (currentStreak >= 365) {
    return "A full year of commitment! 🏅";
  }
  if (currentStreak >= 100) {
    return "Triple digits! Incredible! 💎";
  }
  if (currentStreak >= 50) {
    return "Halfway to 100! Keep going! 🏆";
  }
  if (currentStreak >= 30) {
    return "A month of dedication! ⭐";
  }
  if (currentStreak >= 14) {
    return "Two weeks strong! 🌟";
  }
  if (currentStreak >= 7) {
    return "One week down! 🔥";
  }
  if (currentStreak >= 3) {
    return "Building momentum! ✨";
  }
  if (currentStreak > 0) {
    return "Great start! Keep it up! 🌱";
  }
  return "Start your journey today! 💪";
};
