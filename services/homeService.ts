import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

/**
 * Gets the API base URL based on platform and environment
 * 
 * @returns The appropriate API base URL for the current platform
 */
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  // Platform-specific default values
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  } else {
    return 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Retrieves Firebase authentication token for API requests
 * 
 * @returns Promise resolving to the Firebase token or null if not available
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get Firebase token:', error);
    return null;
  }
};

/**
 * Type definitions for API responses and data structures
 */

/**
 * User cycle information
 */
export interface CycleInfo {
  user_name: string;
  cycle_day: number;
  phase: string;
}

/**
 * Response structure for cycle phase API
 */
export interface CyclePhaseResponse {
  cycle_info: CycleInfo;
}

/**
 * Assignment data structure
 */
export interface Assignment {
  id: number;
  recommendation_id: number;
  title: string;
  purpose: string;
  specific_action?: string;
  category: string;
  conditions: string[];
  symptoms: string[];
  hormones: string[];
  is_completed: boolean;
  completed_at: string;
  advices: Array<{
    type: string;
    title: string;
    image?: string;
  }>;
  food_amounts: string[];
  food_items: string[];
  exercise_durations: string[];
  exercise_types: string[];
  exercise_intensities: string[];
  mindfulness_durations: string[];
  mindfulness_techniques: string[];
}

/**
 * Response structure for assignments API
 */
export interface AssignmentsResponse {
  date: string;
  assignments: {
    [key: string]: Assignment[];
  };
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  hormone_stats: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

/**
 * Hormone statistics structure
 */
export interface HormoneStats {
  androgens?: { completed: number; total: number };
  progesterone?: { completed: number; total: number };
  estrogen?: { completed: number; total: number };
  thyroid?: { completed: number; total: number };
  insulin?: { completed: number; total: number };
  cortisol?: { completed: number; total: number };
  FSH?: { completed: number; total: number };
  LH?: { completed: number; total: number };
  prolactin?: { completed: number; total: number };
  ghrelin?: { completed: number; total: number };
  testosterone?: { completed: number; total: number };
}

/**
 * Response structure for progress statistics API
 */
export interface ProgressStatsResponse {
  hormone_stats: HormoneStats;
}

/**
 * Home Service
 * 
 * Provides API methods for managing home screen data including:
 * - Cycle phase information
 * - Today's assignments
 * - Progress statistics
 * - Assignment completion
 */
class HomeService {
  /**
   * Retrieves user's cycle phase information
   * 
   * @returns Promise resolving to cycle phase data or null on error
   */
  async getCyclePhase(): Promise<CyclePhaseResponse | null> {
    try {
      console.log('🔄 Fetching cycle phase info:', `${API_BASE_URL}/api/v1/cycle/phase`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase token included');
      } else {
        console.log('⚠️ No Firebase token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/cycle/phase`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch cycle phase info:', errorText);
        throw new Error(`Failed to fetch cycle phase info: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully fetched cycle phase info:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching cycle phase info:', error);
      return null;
    }
  }

  /**
   * Retrieves today's assignments for the user
   * 
   * @returns Promise resolving to assignments data or null on error
   */
  async getTodayAssignments(): Promise<AssignmentsResponse | null> {
    try {
      console.log('🔄 Fetching today\'s assignments:', `${API_BASE_URL}/api/v1/new-scheduling/assignments/today`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase token included');
      } else {
        console.log('⚠️ No Firebase token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/assignments/today`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch today\'s assignments:', errorText);
        throw new Error(`Failed to fetch today's assignments: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully fetched today\'s assignments:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching today\'s assignments:', error);
      return null;
    }
  }

  /**
   * Retrieves progress statistics for the user
   * 
   * @returns Promise resolving to progress stats or null on error
   */
  async getProgressStats(): Promise<ProgressStatsResponse | null> {
    try {
      console.log('🔄 Fetching progress stats:', `${API_BASE_URL}/api/v1/progress/stats`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase token included');
      } else {
        console.log('⚠️ No Firebase token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/progress/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch progress stats:', errorText);
        throw new Error(`Failed to fetch progress stats: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully fetched progress stats:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching progress stats:', error);
      return null;
    }
  }

  /**
   * Marks an assignment as completed
   * 
   * @param assignmentId - ID of the assignment to complete
   * @param notes - Optional notes for the completion
   * @returns Promise resolving to success status
   */
  async completeAssignment(assignmentId: number, notes?: string): Promise<boolean> {
    try {
      console.log('🔄 Completing assignment:', `${API_BASE_URL}/api/v1/new-scheduling/assignments/${assignmentId}/complete`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase token included');
      } else {
        console.log('⚠️ No Firebase token available');
      }

      const requestBody: { notes?: string } = {};
      if (notes) {
        requestBody.notes = notes;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to complete assignment:', errorText);
        throw new Error(`Failed to complete assignment: ${response.status} - ${errorText}`);
      }

      console.log('✅ Successfully completed assignment');
      return true;
    } catch (error) {
      console.error('❌ Error completing assignment:', error);
      return false;
    }
  }
}

export default new HomeService();
