import { Platform } from 'react-native';
import { getAuthToken } from './authTokenService';

/**
 * Weekly Check-in Service
 * Handles API calls for the weekly check-in feature
 */

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  } else {
    return 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Tap option structure
 */
export interface TapOption {
  id: string;
  text: string;
}

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  created_at?: string;
  ui_blocks?: any[];
}

/**
 * Question response from API
 */
export interface QuestionResponse {
  is_complete: boolean;
  question_key: string | null;
  question_type: string | null; // "slider", "tap_choice", "multi_select", "free_text", "confirmation"
  message: string;  // Combined message for backward compatibility
  messages?: string[];  // Array of short messages for multi-bubble display
  tap_options: TapOption[];
  is_required: boolean;
  current_index: number;
  total_questions: number;
  summary?: string;
  slider_labels?: { [key: string]: string };  // For slider: {"1": "None", "5": "Moderate", "9": "Extreme"}
  history?: Message[]; // Chat history for context restoration
}

/**
 * Check-in status response
 */
export interface CheckInStatusResponse {
  is_available: boolean;
  is_due: boolean;
  due_date: string | null;
  incomplete_id: string | null;
  last_completed: string | null;
  checkin_streak: number;
  unlock_days_remaining: number;
}

/**
 * Start check-in response
 */
export interface StartCheckInResponse {
  // Legacy fields
  checkin_id: string;
  week_number: number;
  year: number;
  question: QuestionResponse;
  is_already_completed?: boolean;  // True if viewing completed check-in in read-only mode
  next_due_date?: string;  // When the next check-in is available
  // Standardized chatbot payload fields (optional for backwards compatibility)
  thread_id?: string;
  local_date?: string;
  history?: Message[];
  tap_options?: TapOption[];
  ui_blocks?: any[];
  actionable_insights?: Record<string, any>;
  trace?: Record<string, any>;
}

/**
 * Submit response result
 */
export interface SubmitResponseResult {
  // Legacy fields
  checkin_id: string;
  question: QuestionResponse;
  // Standardized chatbot payload fields (optional for backwards compatibility)
  thread_id?: string;
  local_date?: string;
  history?: Message[];
  tap_options?: TapOption[];
  ui_blocks?: any[];
  actionable_insights?: Record<string, any>;
  trace?: Record<string, any>;
}

export interface TranscribeResponse {
  text: string;
}

class WeeklyCheckinService {
  /**
   * Get current check-in status
   */
  async getStatus(): Promise<CheckInStatusResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to get check-in status:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching check-in status:', error);
      return null;
    }
  }

  /**
   * Start a new check-in or resume an incomplete one
   */
  async startCheckin(options?: { signal?: AbortSignal }): Promise<StartCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/start`, {
        method: 'POST',
        signal: options?.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to start check-in:', errorData);
        return null;
      }

      return await response.json();
    } catch (error: any) {
      if (error?.name === 'AbortError') return null;
      console.error('❌ Error starting check-in:', error);
      return null;
    }
  }

  /**
   * Submit a response to a check-in question
   */
  async submitResponse(
    checkinId: string,
    questionKey: string,
    response: any,
    messageText?: string,
    options?: { signal?: AbortSignal }
  ): Promise<SubmitResponseResult | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const fetchResponse = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/respond`, {
        method: 'POST',
        signal: options?.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkin_id: checkinId,
          question_key: questionKey,
          response: response,
          message_text: messageText,
        }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        console.error('❌ Failed to submit response:', errorData);
        return null;
      }

      return await fetchResponse.json();
    } catch (error: any) {
      if (error?.name === 'AbortError') return null;
      console.error('❌ Error submitting response:', error);
      return null;
    }
  }

  /**
   * Get check-in history for insights
   */
  async getHistory(limit: number = 12): Promise<any[]> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/history?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to get check-in history:', response.status);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching check-in history:', error);
      return [];
    }
  }

  /**
   * Get severity trends for visualization
   */
  async getTrends(weeks: number = 8): Promise<any[]> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/trends?weeks=${weeks}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to get trends:', response.status);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching trends:', error);
      return [];
    }
  }

  /**
   * Get factor correlations for insights
   */
  async getCorrelations(weeks: number = 12): Promise<any | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/correlations?weeks=${weeks}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to get correlations:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching correlations:', error);
      return null;
    }
  }

  /**
   * Transcribe a locally recorded audio file (Yap) into text.
   *
   * The backend returns { text }, and the UI places it into the text input so the
   * user can edit before sending.
   */
  async transcribeAudio(uri: string): Promise<TranscribeResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const getAudioUploadMeta = (u: string): { name: string; type: string } => {
        const rawExt = (u.split('.').pop() || '').split('?')[0].toLowerCase();
        const ext = rawExt || 'm4a';
        // Whisper/OpenAI reliably supports: mp3, mp4/m4a, wav, webm.
        // Expo iOS previously produced .caf with the HIGH_QUALITY preset; we now record .m4a.
        switch (ext) {
          case 'm4a':
            return { name: 'yap.m4a', type: 'audio/mp4' };
          case 'mp4':
            return { name: 'yap.mp4', type: 'audio/mp4' };
          case 'wav':
            return { name: 'yap.wav', type: 'audio/wav' };
          case 'webm':
            return { name: 'yap.webm', type: 'audio/webm' };
          case 'mp3':
            return { name: 'yap.mp3', type: 'audio/mpeg' };
          default:
            return { name: `yap.${ext}`, type: 'audio/mp4' };
        }
      };

      const formData = new FormData();
      // NOTE: RN FormData file typing is loosely defined; cast to any.
      const meta = getAudioUploadMeta(uri);
      formData.append('file', {
        uri,
        name: meta.name,
        type: meta.type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/v1/weekly-checkin/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do NOT set Content-Type; let fetch set multipart boundaries.
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to transcribe audio:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      return null;
    }
  }
}

export const weeklyCheckinService = new WeeklyCheckinService();
export default weeklyCheckinService;
