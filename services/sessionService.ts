import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
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
    // For Android emulator
    return 'http://10.0.2.2:8000';
  } else {
    // For iOS simulator
    return 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

// API URL debugging logs
console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);

/**
 * User response data structure for survey answers
 */
export interface UserResponseData {
  age?: number;
  period_description?: string;
  birth_control?: string[];
  last_period_date?: string;
  cycle_length?: string;
  period_concerns?: string[];
  body_concerns?: string[];
  skin_hair_concerns?: string[];
  mental_health_concerns?: string[];
  other_concerns?: string[];
  top_concern?: string;
  diagnosed_conditions?: string[];
  family_history?: string[];
  workout_intensity?: string;
  sleep_duration?: string;
  stress_level?: string;
}

/**
 * Session data structure
 */
export interface SessionData {
  session_id: string;
  device_id: string;
  created_at: string;
  status: string;
}

/**
 * Session Service
 * 
 * Manages user sessions for survey data collection and recommendation generation.
 * Handles session creation, validation, data storage, and user linking.
 */
class SessionService {
  /** Current session ID */
  private sessionId: string | null = null;

  /**
   * Generates a unique device identifier
   * 
   * @returns Device identifier string
   */
  private getDeviceId(): string {
    return Device.deviceName || Device.modelName || 'unknown-device';
  }

  /**
   * Retrieves session ID from local storage
   * 
   * @returns Promise resolving to session ID or null
   */
  async getSessionId(): Promise<string | null> {
    try {
      const sessionId = await AsyncStorage.getItem('session_id');
      return sessionId;
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }

  /**
   * Saves session ID to local storage
   * 
   * @param sessionId - Session ID to save
   */
  async saveSessionId(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem('session_id', sessionId);
      this.sessionId = sessionId;
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }
  }

  /**
   * Creates a new session for the device
   * 
   * @returns Promise resolving to session data or null on error
   */
  async createSession(): Promise<SessionData | null> {
    try {
      const deviceId = this.getDeviceId();
      
      console.log('Attempting to create session:', `${API_BASE_URL}/api/v1/questions/sessions`);
      console.log('Request data:', { device_id: deviceId });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId
        }),
      });

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const sessionData: SessionData = await response.json();
      await this.saveSessionId(sessionData.session_id);
      return sessionData;
    } catch (error) {
      console.error('Session creation error:', error);
      return null;
    }
  }

  /**
   * Saves survey answers to the session (new structure)
   * 
   * @param answers - User's survey answers
   * @param questions - Survey questions structure
   * @returns Promise resolving to success status
   */
  async saveAnswers(answers: Record<string, any>, questions: any[]): Promise<boolean> {
    try {
      // Validate session and recreate if necessary
      const sessionValid = await this.validateAndRefreshSession();
      if (!sessionValid) {
        console.error('Session creation failed');
        return false;
      }

      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('No session ID available.');
        return false;
      }

      console.log('Starting answer save:', {
        sessionId,
        answersCount: Object.keys(answers).length,
        questionsCount: questions.length
      });

      // Save name to local storage (separate personal info)
      const { name, ...sessionData } = answers;
      if (name) {
        await AsyncStorage.setItem('userName', name);
        console.log('Name saved to local storage:', name);
      }

      // Convert answers to new structure (excluding personal info)
      const responseData: any = {};
      
      // Key mapping definition (excluding name)
      const keyMapping: Record<string, string> = {
        'age': 'age',
        'periodDescription': 'period_description',
        'birthControl': 'birth_control',
        'lastPeriodDate': 'last_period_date',
        'cycleLength': 'cycle_length',
        'periodConcerns': 'period_concerns',
        'bodyConcerns': 'body_concerns',
        'skinAndHairConcerns': 'skin_hair_concerns',
        'mentalHealthConcerns': 'mental_health_concerns',
        'otherConcerns': 'other_concerns',
        'topConcern': 'top_concern',
        'diagnosedCondition': 'diagnosed_conditions',
        'familyHistory': 'family_history',
        'workoutIntensity': 'workout_intensity',
        'sleepDuration': 'sleep_duration',
        'stressLevel': 'stress_level'
      };
      
      // Map each question's answer
      questions.forEach(q => {
        const answer = answers[q.key];
        console.log(`Question ${q.key}:`, answer);
        
        // Exclude name from processing
        if (q.key === 'name') {
          console.log('Name not saved to session');
          return;
        }
        
        const mappedKey = keyMapping[q.key];
        if (mappedKey) {
          // Convert age to number
          if (q.key === 'age') {
            responseData[mappedKey] = parseInt(answer) || 0;
            console.log(`Mapped (age number conversion): ${q.key} -> ${mappedKey} =`, responseData[mappedKey]);
          }
          // Process Others text input
          else if (q.key === 'otherConcerns' && Array.isArray(answer)) {
            const processedAnswer = answer.map(item => {
              if (item === 'Others (please specify)' && answers.otherConcernsText) {
                return `Others: ${answers.otherConcernsText}`;
              }
              return item;
            });
            responseData[mappedKey] = processedAnswer;
            console.log(`Mapped (Others processing): ${q.key} -> ${mappedKey} =`, processedAnswer);
          } else if (q.key === 'diagnosedCondition' && Array.isArray(answer)) {
            const processedAnswer = answer.map(item => {
              if (item === 'Others (please specify)' && answers.diagnosedConditionText) {
                return `Others: ${answers.diagnosedConditionText}`;
              }
              return item;
            });
            responseData[mappedKey] = processedAnswer;
            console.log(`Mapped (Others processing): ${q.key} -> ${mappedKey} =`, processedAnswer);
          } else {
            responseData[mappedKey] = answer;
            console.log(`Mapped: ${q.key} -> ${mappedKey} =`, answer);
          }
        } else {
          console.log(`Not mapped: ${q.key} =`, answer);
        }
      });

      // Auto-detect user timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const requestBody = {
        session_id: sessionId,
        data: {
          ...responseData,
          survey_timezone: userTimezone  // Required!
        }
      };

      console.log('Request URL:', `${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/data`);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Answer save response error:', errorText);
        throw new Error(`Answer save failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Answer save successful:', result);
      return true;
    } catch (error) {
      console.error('Answer save error:', error);
      return false;
    }
  }

  /**
   * Links session to user after login (new structure)
   * 
   * @param firebaseUser - Firebase user object
   * @returns Promise resolving to success status
   */
  async linkSessionToUser(firebaseUser: any): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('No session ID available.');
        return false;
      }

      // Get name from local storage
      const userName = await AsyncStorage.getItem('userName');
      
      // Auto-detect user timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const userProfile = {
        name: userName || '',
        email: firebaseUser.email || ''
      };

      console.log('Attempting session link:', {
        sessionId,
        userProfile,
        timezone: userTimezone
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
        },
        body: JSON.stringify({
          user_profile: userProfile,
          current_timezone: userTimezone  // Required!
        }),
      });

      if (!response.ok) {
        throw new Error(`Session link failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Session link successful:', result);
      
      // Clean up local storage after successful link
      await AsyncStorage.removeItem('userName');
      console.log('Name removed from local storage');
      
      return true;
    } catch (error) {
      console.error('Session link error:', error);
      return false;
    }
  }

  /**
   * Clears the current session
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('session_id');
      this.sessionId = null;
    } catch (error) {
      console.error('Session clear failed:', error);
    }
  }

  /**
   * Checks if a session exists
   * 
   * @returns Promise resolving to session existence status
   */
  async hasSession(): Promise<boolean> {
    const sessionId = await this.getSessionId();
    return sessionId !== null;
  }

  /**
   * Validates session and recreates if necessary
   * 
   * @returns Promise resolving to validation success status
   */
  async validateAndRefreshSession(): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.log('No session ID - creating new session');
        const newSession = await this.createSession();
        return newSession !== null;
      }

      // Check if existing session is valid (new endpoint)
      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        console.log('Existing session invalid - creating new session');
        await this.clearSession();
        const newSession = await this.createSession();
        return newSession !== null;
      }

      console.log('Existing session is valid');
      return true;
    } catch (error) {
      console.error('Error during session validation:', error);
      // Create new session on error
      await this.clearSession();
      const newSession = await this.createSession();
      return newSession !== null;
    }
  }

  /**
   * Logs out user and clears all stored information
   */
  async logout(): Promise<void> {
    try {
      // Clear session information
      await this.clearSession();
      
      // Clear remember me information
      await AsyncStorage.removeItem('rememberMe');
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
      
      console.log('Logout complete - all stored information cleared');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Starts recommendation generation process
   * 
   * @returns Promise resolving to success status
   */
  async startRecommendationGeneration(): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('❌ No session ID available.');
        return false;
      }

      console.log('🚀 Starting recommendation generation API call:', `${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/generate-recommendations`);

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/generate-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Recommendation generation start failed:', errorText);
        throw new Error(`Recommendation generation start failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Recommendation generation start successful:', result);
      return true;
    } catch (error) {
      console.error('❌ Recommendation generation start error:', error);
      return false;
    }
  }

  /**
   * Checks recommendation generation status
   * 
   * @returns Promise resolving to status information or null on error
   */
  async getRecommendationStatus(): Promise<{ status: string; data?: any } | null> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('❌ No session ID available.');
        return null;
      }

      console.log('🔍 Checking recommendation generation status API call:', `${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/recommendations/status`);

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/recommendations/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Recommendation status check failed:', errorText);
        throw new Error(`Recommendation status check failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 Recommendation status response:', result);
      
      // Normalize response structure
      let normalizedResult = {
        status: result.status || result.currentRecommendationStatus || 'pending',
        data: result.data || result,
        recommendations_count: result.recommendations_count || 0,
        session_id: result.session_id
      };
      
      console.log('✅ Normalized response:', normalizedResult);
      return normalizedResult;
    } catch (error) {
      console.error('❌ Recommendation status check error:', error);
      return null;
    }
  }
}

export default new SessionService(); 