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

// Timeout constants
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds for regular requests
const STREAMING_TIMEOUT_MS = 60000; // 60 seconds for streaming
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Retry wrapper with exponential backoff
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) or abort
      if (error instanceof Error) {
        if (error.name === 'AbortError') throw error;
        if (error.message.includes('400') || 
            error.message.includes('401') || 
            error.message.includes('403') || 
            error.message.includes('404')) {
          throw error;
        }
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};

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

      // Use retry wrapper with timeout for resilience
      const result = await withRetry(async () => {
        const response = await fetchWithTimeout(
          `${CHAT_API_URL}/message`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
          },
          DEFAULT_TIMEOUT_MS
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to send message:', response.status, errorText);
          throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
        }

        return await response.json() as ChatMessageResponse;
      });

      console.log('✅ Received response:', result);

      // Update session ID from response
      if (result.session_id) {
        this.setSessionId(result.session_id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Provide user-friendly error message
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out');
      }
      return null;
    }
  }

  /**
   * Send a message with STREAMING response.
   * 
   * This makes the chatbot feel ALIVE by showing tokens as they arrive!
   * 
   * @param message - User's message
   * @param conversationContext - Conversation context
   * @param inputMode - Input method
   * @param metadata - Optional metadata
   * @param onToken - Callback for each token (accumulates content)
   * @param onComplete - Callback when streaming finishes (full response)
   * @param onError - Callback for errors
   */
  async sendMessageStreaming(
    message: string,
    conversationContext: ConversationContext = 'care_plan_modal',
    inputMode: InputMode = 'type',
    metadata: Record<string, any> | undefined,
    onToken: (content: string) => void,
    onComplete: (response: ChatMessageResponse) => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STREAMING_TIMEOUT_MS);
    
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        onError('User not authenticated');
        return;
      }

      console.log('🔄 Starting STREAMING message:', { message, conversationContext, inputMode });

      const headers = await getHeaders();
      const request: ChatMessageRequest = {
        user_id: userId,
        message,
        conversation_context: conversationContext,
        input_mode: inputMode,
        session_id: this.currentSessionId || undefined,
        metadata,
      };

      const response = await fetch(`${CHAT_API_URL}/message/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to start streaming:', response.status, errorText);
        
        // Provide user-friendly error messages
        if (response.status === 429) {
          onError('Too many requests. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          onError('Server is temporarily unavailable. Please try again.');
        } else {
          onError(`Failed to start streaming: ${response.status}`);
        }
        return;
      }

      if (!response.body) {
        console.error('❌ No response body');
        onError('No response body');
        return;
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim() || !message.startsWith('data: ')) continue;

          // Parse SSE data
          const jsonStr = message.substring(6); // Remove "data: " prefix
          try {
            const chunk = JSON.parse(jsonStr);

            if (chunk.type === 'token') {
              // Accumulate and display token
              accumulatedContent += chunk.content;
              onToken(accumulatedContent);
              console.log('📝 Token:', chunk.content);
            } else if (chunk.type === 'final') {
              // Final metadata received
              console.log('✅ Streaming complete:', chunk);
              
              // Update session ID
              if (chunk.session_id) {
                this.setSessionId(chunk.session_id);
              }

              // Call complete callback with full response
              onComplete({
                session_id: chunk.session_id,
                message_id: chunk.message_id,
                response_type: chunk.response_type || 'text',
                content: chunk.content,
                choices: chunk.choices,
                slider_config: chunk.slider_config,
                metadata: chunk.metadata,
                actions: chunk.actions,
                timestamp: chunk.timestamp,
              });
              return;
            } else if (chunk.type === 'error') {
              console.error('❌ Streaming error:', chunk.error);
              onError(chunk.content || 'Streaming error');
              return;
            }
          } catch (parseError) {
            console.error('❌ Failed to parse chunk:', jsonStr, parseError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in streaming message:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          onError('Request timed out. Please try again.');
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          onError('Network error. Please check your connection.');
        } else {
          onError('Connection error. Please try again.');
        }
      } else {
        onError('Connection error');
      }
    } finally {
      clearTimeout(timeoutId);
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
   * @param context - Optional conversation context for context-aware greetings
   */
  async getGreeting(context?: ConversationContext): Promise<GreetingResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('👋 Fetching greeting...', { context });

      const headers = await getHeaders();
      let url = `${CHAT_API_URL}/greeting?user_id=${userId}`;
      if (context) {
        url += `&context=${context}`;
      }
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers,
      }, DEFAULT_TIMEOUT_MS);

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

  // ═══════════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE FEATURES API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get wellness score for the user
   */
  async getWellnessScore(): Promise<WellnessScoreResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('🌟 Fetching wellness score...');

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/wellness-score/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get wellness score:', response.status, errorText);
        throw new Error(`Failed to get wellness score: ${response.status} - ${errorText}`);
      }

      const result: WellnessScoreResponse = await response.json();
      console.log('✅ Received wellness score:', result.overall_score);
      return result;
    } catch (error) {
      console.error('❌ Error getting wellness score:', error);
      return null;
    }
  }

  /**
   * Get symptom predictions for the user
   */
  async getSymptomPredictions(): Promise<SymptomPredictionsResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('🔮 Fetching symptom predictions...');

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/predict-symptoms/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get predictions:', response.status, errorText);
        throw new Error(`Failed to get predictions: ${response.status} - ${errorText}`);
      }

      const result: SymptomPredictionsResponse = await response.json();
      console.log('✅ Received predictions:', result.predictions?.length || 0);
      return result;
    } catch (error) {
      console.error('❌ Error getting predictions:', error);
      return null;
    }
  }

  /**
   * Get session summary after a conversation
   */
  async getSessionSummary(sessionId?: string): Promise<SessionSummaryResponse | null> {
    try {
      const userId = getCurrentUserId();
      const targetSessionId = sessionId || this.currentSessionId;
      
      if (!userId || !targetSessionId) {
        console.error('❌ User not authenticated or no session');
        return null;
      }

      console.log('📝 Fetching session summary...');

      const headers = await getHeaders();
      const response = await fetch(
        `${CHAT_API_URL}/session-summary/${targetSessionId}?user_id=${userId}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get summary:', response.status, errorText);
        throw new Error(`Failed to get summary: ${response.status} - ${errorText}`);
      }

      const result: SessionSummaryResponse = await response.json();
      console.log('✅ Received session summary');
      return result;
    } catch (error) {
      console.error('❌ Error getting session summary:', error);
      return null;
    }
  }

  /**
   * Log user mood for tracking
   */
  async logMood(
    moodLevel: number,
    energy: number,
    notes?: string
  ): Promise<boolean> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return false;
      }

      console.log('😊 Logging mood...', { moodLevel, energy });

      const headers = await getHeaders();
      const response = await fetch(`${CHAT_API_URL}/mood-log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          mood_level: moodLevel,
          energy_level: energy,
          notes,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to log mood:', response.status, errorText);
        return false;
      }

      console.log('✅ Mood logged successfully');
      return true;
    } catch (error) {
      console.error('❌ Error logging mood:', error);
      return false;
    }
  }

  /**
   * Get mood history for the user
   */
  async getMoodHistory(days: number = 7): Promise<MoodHistoryResponse | null> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('📊 Fetching mood history...');

      const headers = await getHeaders();
      const response = await fetch(
        `${CHAT_API_URL}/mood-history/${userId}?days=${days}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to get mood history:', response.status, errorText);
        throw new Error(`Failed to get mood history: ${response.status} - ${errorText}`);
      }

      const result: MoodHistoryResponse = await response.json();
      console.log('✅ Received mood history:', result.entries?.length || 0, 'entries');
      return result;
    } catch (error) {
      console.error('❌ Error getting mood history:', error);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WellnessScoreResponse {
  success: boolean;
  user_id: string;
  date: string;
  overall_score: number;
  dimension_scores: {
    sleep: number;
    mood: number;
    symptoms: number;
    habits: number;
    cycle_alignment: number;
    social: number;
  };
  insights: string[];
  recommendations: string[];
  emoji: string;
  message: string;
}

export interface SymptomPrediction {
  symptom: string;
  likelihood: number;
  expected_severity: number;
  expected_date: string;
  confidence: 'high' | 'medium' | 'low';
  proactive_advice: string[];
  user_specific: boolean;
}

export interface PhaseTransition {
  from_phase: string;
  to_phase: string;
  expected_date: string;
  days_until: number;
}

export interface SymptomPredictionsResponse {
  success: boolean;
  user_id: string;
  predictions: SymptomPrediction[];
  phase_transition: PhaseTransition | null;
  overall_outlook: string;
  prediction_date: string;
}

export interface SessionSummaryResponse {
  success: boolean;
  session_id: string;
  summary: string;
  key_topics: string[];
  emotional_journey: {
    start: string;
    end: string;
    trend: 'improving' | 'stable' | 'declining';
  };
  action_items: string[];
  insights: string[];
  next_steps: string[];
  metrics: {
    duration_minutes: number;
    message_count: number;
  };
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  mood_level: number;
  energy_level: number;
  notes?: string;
  date?: string;
}

export interface MoodHistoryResponse {
  success: boolean;
  user_id: string;
  entries: MoodEntry[];
  statistics: {
    average_mood: number;
    average_energy: number;
    total_entries: number;
    trend: 'improving' | 'stable' | 'declining' | 'no_data';
  };
  streak: number;
}

// Export singleton instance
export default new ChatService();
