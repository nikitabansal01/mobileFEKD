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
  time_slot?: string;
  hero_image_url?: string;
  hormone_persona_intro?: string;
  research_studies?: Array<{
    title: string;
    authors?: string;
    year: number;
    journal: string;
    finding: string;
    participants?: string | number;
    doi?: string;
    pmid?: string;
    verification_link?: string;
    source?: string;
  }>;
  variants?: Array<{
    variant_type: string;
    title: string;
    description: string;
    image_url: string;
  }>;
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
  plan_id?: number;
  primary_hormone?: string;
  cycle_phase?: string;
  show_feedback_prompt_after_seconds?: number;
}

/**
 * Action Plan item structure (from new action plan system)
 */
export interface ActionPlanItem {
  id: number;
  slot: number;
  time_slot: string;
  category: string;
  title: string;
  specific_action: string;
  purpose: string;
  target_hormone: string;
  hormone_persona_intro: string;
  hero_image_url: string;
  research_studies: Array<{
    title: string;
    authors?: string;
    year: number;
    journal: string;
    finding: string;
    participants?: string | number;
    doi?: string;
    pmid?: string;
    verification_link?: string;
    source?: string;
  }>;
  is_completed: boolean;
  is_replaced: boolean;
  variants: Array<{
    variant_type: string;
    title: string;
    description: string;
    image_url: string;
  }>;
}

/**
 * Action Plan response structure
 */
export interface ActionPlanResponse {
  plan_id: number;
  user_id: string;
  date: string;
  phase: string;
  phase_day: number;
  actions: ActionPlanItem[];
  total_actions: number;
  completed_actions: number;
  show_feedback_prompt_after_seconds: number;
}

/**
 * Plan satisfaction request
 */
export interface PlanSatisfactionRequest {
  plan_id: number;
  satisfaction: 'works_for_me' | 'want_to_change';
  items_to_replace?: number[];
  reasons?: { [key: number]: string };
}

/**
 * Plan satisfaction response
 */
export interface PlanSatisfactionResponse {
  success: boolean;
  message: string;
  feedback_count?: number;
  new_actions?: ActionPlanItem[];
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

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/assignments/today?t=${new Date().getTime()}`, {
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

  /**
   * Submits plan satisfaction feedback
   * 
   * @param planId - ID of the action plan
   * @param satisfaction - 'works_for_me' or 'want_to_change'
   * @param itemsToReplace - Optional array of item IDs to replace (for want_to_change)
   * @param reasons - Optional reasons for each item replacement
   * @returns Promise resolving to satisfaction response or null on error
   */
  async submitPlanSatisfaction(
    planId: number,
    satisfaction: 'works_for_me' | 'want_to_change',
    itemsToReplace?: number[],
    reasons?: { [key: number]: string }
  ): Promise<PlanSatisfactionResponse | null> {
    try {
      console.log('🔄 Submitting plan satisfaction:', `${API_BASE_URL}/api/v1/new-scheduling/plan-satisfaction`);

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

      const requestBody: PlanSatisfactionRequest = {
        plan_id: planId,
        satisfaction,
      };

      if (itemsToReplace && itemsToReplace.length > 0) {
        requestBody.items_to_replace = itemsToReplace;
      }

      if (reasons && Object.keys(reasons).length > 0) {
        requestBody.reasons = reasons;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/plan-satisfaction`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to submit plan satisfaction:', errorText);
        throw new Error(`Failed to submit plan satisfaction: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully submitted plan satisfaction:', result);
      return result;
    } catch (error) {
      console.error('❌ Error submitting plan satisfaction:', error);
      return null;
    }
  }

  /**
   * Submits detailed feedback for an action from ActionDetailScreen
   * 
   * @param itemId - ID of the action item
   * @param feedbackType - 'loved' | 'completed' | 'skipped' | 'not_for_me' | 'like' | 'dislike'
   * @param feedbackText - Optional text feedback from user
   * @param feedbackSource - 'home' or 'detail'
   * @returns Promise resolving to feedback response or null on error
   */
  async submitActionFeedback(
    itemId: number,
    feedbackType: 'loved' | 'completed' | 'skipped' | 'not_for_me' | 'like' | 'dislike',
    feedbackText?: string,
    feedbackSource: 'home' | 'detail' = 'detail'
  ): Promise<{ success: boolean; feedback_id?: number; can_replace: boolean } | null> {
    try {
      console.log('🔄 Submitting action feedback:', `${API_BASE_URL}/api/v1/new-scheduling/feedback`);

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

      const requestBody: {
        item_id: number;
        feedback_type: string;
        feedback_text?: string;
        feedback_source: string;
      } = {
        item_id: itemId,
        feedback_type: feedbackType,
        feedback_source: feedbackSource,
      };

      if (feedbackText && feedbackText.trim()) {
        requestBody.feedback_text = feedbackText;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to submit action feedback:', errorText);
        throw new Error(`Failed to submit action feedback: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully submitted action feedback:', result);
      return result;
    } catch (error) {
      console.error('❌ Error submitting action feedback:', error);
      return null;
    }
  }

  /**
   * Replaces an action with a new one
   * 
   * @param itemId - ID of the action item to replace
   * @param reason - Optional reason text
   * @param replacementCategory - Categorized reason: 'allergic', 'no_time', 'dont_like', etc.
   * @returns Promise resolving to replacement result or null on error
   */
  async replaceAction(
    itemId: number,
    reason?: string,
    replacementCategory?: 'dont_like' | 'allergic' | 'no_ingredients' | 'no_time' | 'already_done' | 'not_feeling_it' | 'other'
  ): Promise<{ success: boolean; replacement_action?: ActionPlanItem } | null> {
    try {
      console.log('🔄 Replacing action:', `${API_BASE_URL}/api/v1/new-scheduling/replace`);

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

      const requestBody: {
        item_id: number;
        reason?: string;
        replacement_category?: string;
      } = {
        item_id: itemId,
      };

      if (reason && reason.trim()) {
        requestBody.reason = reason;
      }

      if (replacementCategory) {
        requestBody.replacement_category = replacementCategory;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/replace`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to replace action:', errorText);
        throw new Error(`Failed to replace action: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully replaced action:', result);
      return result;
    } catch (error) {
      console.error('❌ Error replacing action:', error);
      return null;
    }
  }

  /**
   * Refresh all incomplete actions for today.
   * Uses daily refresh limit (1 default, 2 with plan_refresh_2x reward).
   */
  async refreshAllIncomplete(): Promise<{
    success: boolean;
    message: string;
    replaced_count: number;
    refresh_status: { limit: number; used: number; remaining: number; can_refresh: boolean };
  } | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available for refresh all');
        return null;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/refresh-all-incomplete`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to refresh all:', errorText);
        throw new Error(`Failed to refresh all: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully refreshed all:', result);
      return result;
    } catch (error) {
      console.error('❌ Error refreshing all:', error);
      return null;
    }
  }
}

export default new HomeService();
