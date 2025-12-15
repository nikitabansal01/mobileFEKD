/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUVRA CHATBOT - Frontend Chat Service
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service layer connecting the frontend chatbot UI to backend API endpoints.
 * 
 * API Endpoints:
 * - POST /api/v1/chat/message - Send text message
 * - POST /api/v1/chat/voice - Send voice message (base64)
 * - POST /api/v1/chat/voice/upload - Upload voice file
 * - GET /api/v1/chat/sessions - Get session history
 * - POST /api/v1/chat/sessions/{session_id}/end - End session
 * - GET /api/v1/chat/greeting - Get proactive greeting
 * - POST /api/v1/chat/slider - Handle slider response
 * - POST /api/v1/chat/choice - Handle choice selection
 */

import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gets the API base URL based on platform and environment
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
const CHAT_API_URL = `${API_BASE_URL}/api/v1/chat`;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input modes matching backend InputMode enum
 */
export type InputMode = 'tap' | 'yap' | 'type';

/**
 * Conversation contexts matching backend ConversationContext enum
 */
export type ConversationContext = 
  | 'care_plan_modal' 
  | 'symptom_checkin' 
  | 'personalise' 
  | 'know_body';

/**
 * Response types from the AI
 */
export type ResponseType = 
  | 'text'
  | 'choice_buttons'
  | 'slider'
  | 'confirmation';

/**
 * Action button returned by the AI
 */
export interface ChatAction {
  type: string;
  target?: string;
  params?: Record<string, any>;
}

/**
 * Slider config returned by the AI
 */
export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels: string[];
  default_value?: number;
}

/**
 * Choice option returned by the AI
 */
// Backend returns choices as string[]; UI can map to ids if needed.

/**
 * Chat message request to backend
 */
export interface ChatMessageRequest {
  user_id: string;
  message: string;
  conversation_context: ConversationContext;
  input_mode: InputMode;
  session_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Voice message request to backend
 */
export interface VoiceMessageRequest {
  user_id: string;
  audio_base64: string;
  audio_format: string;
  language: string;
  conversation_context: ConversationContext;
}

/**
 * Slider response request
 */
export interface SliderRequest {
  user_id: string;
  session_id?: string;
  value: number;
  context: Record<string, any>;
}

/**
 * Choice selection request
 */
export interface ChoiceRequest {
  user_id: string;
  session_id: string;
  choice: string;
  conversation_context: ConversationContext;
}

/**
 * Chat message response from backend
 */
export interface ChatMessageResponse {
  session_id: string;
  message_id?: string;
  response_type: ResponseType;

  // Main response text
  content: string;

  // Optional UI elements
  choices?: string[];
  slider_config?: SliderConfig;
  transcription?: string;
  metadata?: Record<string, any>;
  actions?: ChatAction[];
  confidence?: number;
  timestamp?: string;
}

/**
 * Session info from backend
 */
export interface SessionInfo {
  session_id: string;
  conversation_context: string;
  status: string;
  created_at: string;
  message_count: number;
  summary?: string;
}

/**
 * Greeting response from backend
 */
export interface GreetingResponse {
  greeting: string;
  triggers?: Array<{
    type: string;
    title: string;
    description?: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retrieves Firebase authentication token for API requests
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
 * Gets the current user's ID from Firebase
 */
const getCurrentUserId = (): string | null => {
  try {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  } catch (error) {
    console.error('❌ Failed to get user ID:', error);
    return null;
  }
};

/**
 * Creates headers for API requests
 */
const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Firebase token included');
  } else {
    console.log('⚠️ No Firebase token available');
  }

  return headers;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class ChatService {
  private currentSessionId: string | null = null;

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set the current session ID (e.g., from a response)
   */
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
    console.log('📝 Session ID set:', sessionId);
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.currentSessionId = null;
    console.log('🗑️ Session cleared');
  }

  /**
   * Send a text message to the chatbot
   */
  async sendMessage(
    message: string,
    conversationContext: ConversationContext = 'care_plan_modal',
    inputMode: InputMode = 'type',
    metadata?: Record<string, any>
  ): Promise<ChatMessageResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('🔄 Sending message:', { message, conversationContext, inputMode });

      const headers = await getHeaders();
      const request: ChatMessageRequest = {
        user_id: userId,
        message,
        conversation_context: conversationContext,
        input_mode: inputMode,
        session_id: this.currentSessionId || undefined,
        metadata,
      };

      const response = await fetch(`${CHAT_API_URL}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send message:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      const result: ChatMessageResponse = await response.json();
      console.log('✅ Received response:', result);

      // Update session ID from response
      if (result.session_id) {
        this.setSessionId(result.session_id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return null;
    }
  }

  /**
   * Send a voice message to the chatbot
   */
  async sendVoiceMessage(
    audioBase64: string,
    audioFormat: string = 'm4a',
    conversationContext: ConversationContext = 'care_plan_modal',
    language: string = 'en'
  ): Promise<ChatMessageResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('🎤 Sending voice message:', { audioFormat, conversationContext, language });

      const headers = await getHeaders();
      const request: VoiceMessageRequest = {
        user_id: userId,
        audio_base64: audioBase64,
        audio_format: audioFormat,
        language,
        conversation_context: conversationContext,
      };

      const response = await fetch(`${CHAT_API_URL}/voice`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send voice message:', response.status, errorText);
        throw new Error(`Failed to send voice message: ${response.status} - ${errorText}`);
      }

      const result: ChatMessageResponse = await response.json();
      console.log('✅ Received voice response:', result);

      // Update session ID from response
      if (result.session_id) {
        this.setSessionId(result.session_id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      return null;
    }
  }

  /**
   * Handle slider value submission
   */
  async sendSliderValue(
    value: number,
    context: Record<string, any> = {}
  ): Promise<ChatMessageResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('📊 Sending slider value:', { value, context, sessionId: this.currentSessionId });

      const headers = await getHeaders();
      
      // Build request - only include session_id if we have one
      const request: SliderRequest = {
        user_id: userId,
        value,
        context,
      };
      
      // Add session_id only if it exists and is not "error"
      if (this.currentSessionId && this.currentSessionId !== 'error') {
        request.session_id = this.currentSessionId;
      }

      const response = await fetch(`${CHAT_API_URL}/slider`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send slider value:', response.status, errorText);
        throw new Error(`Failed to send slider value: ${response.status} - ${errorText}`);
      }

      const result: ChatMessageResponse = await response.json();
      console.log('✅ Received slider response:', result);

      // Update session ID from response (slider can be the first interaction)
      if (result.session_id) {
        this.setSessionId(result.session_id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending slider value:', error);
      return null;
    }
  }

  /**
   * Handle choice selection
   */
  async sendChoice(
    choice: string,
    conversationContext: ConversationContext = 'care_plan_modal'
  ): Promise<ChatMessageResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      if (!this.currentSessionId) {
        console.error('❌ No active session for choice');
        return null;
      }

      console.log('✅ Sending choice:', { choice, conversationContext });

      const headers = await getHeaders();
      const request: ChoiceRequest = {
        user_id: userId,
        session_id: this.currentSessionId,
        choice,
        conversation_context: conversationContext,
      };

      const response = await fetch(`${CHAT_API_URL}/choice`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send choice:', response.status, errorText);
        throw new Error(`Failed to send choice: ${response.status} - ${errorText}`);
      }

      const result: ChatMessageResponse = await response.json();
      console.log('✅ Received choice response:', result);

      // Keep session ID in sync (defensive)
      if (result.session_id) {
        this.setSessionId(result.session_id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending choice:', error);
      return null;
    }
  }

  /**
   * Get proactive greeting for the user
   */
  async getGreeting(): Promise<GreetingResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('👋 Fetching greeting...');

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/greeting?user_id=${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get greeting:', response.status, errorText);
        throw new Error(`Failed to get greeting: ${response.status} - ${errorText}`);
      }

      const result: GreetingResponse = await response.json();
      console.log('✅ Received greeting:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getting greeting:', error);
      return null;
    }
  }

  /**
   * Get session history for the user
   */
  async getSessions(): Promise<SessionInfo[] | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('📋 Fetching sessions...');

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/sessions?user_id=${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get sessions:', response.status, errorText);
        throw new Error(`Failed to get sessions: ${response.status} - ${errorText}`);
      }

      const result: SessionInfo[] = await response.json();
      console.log('✅ Received sessions:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error getting sessions:', error);
      return null;
    }
  }

  /**
   * End a chat session
   */
  async endSession(sessionId?: string): Promise<boolean> {
    try {
      const targetSessionId = sessionId || this.currentSessionId;
      if (!targetSessionId) {
        console.error('❌ No session to end');
        return false;
      }

      console.log('🛑 Ending session:', targetSessionId);

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/sessions/${targetSessionId}/end`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to end session:', response.status, errorText);
        throw new Error(`Failed to end session: ${response.status} - ${errorText}`);
      }

      // Clear current session if it was the one ended
      if (!sessionId || sessionId === this.currentSessionId) {
        this.clearSession();
      }

      console.log('✅ Session ended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error ending session:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new ChatService();
