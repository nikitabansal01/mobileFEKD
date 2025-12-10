/**
 * AUVRA Chat Service
 * 
 * Handles all chat-related API communications with the backend.
 * Supports multi-turn conversations, tool execution, and real-time updates.
 */

import { getAuth } from 'firebase/auth';
import { getDynamicApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getDynamicApiUrl();

// ============================================================================
// Types
// ============================================================================

/**
 * Intent types that can be classified from user messages
 */
export type IntentType =
  | 'query_schedule'
  | 'query_progress'
  | 'query_cycle'
  | 'query_recommendations'
  | 'query_hormones'
  | 'action_complete_task'
  | 'action_reschedule'
  | 'action_generate_recs'
  | 'rag_health_question'
  | 'rag_food_question'
  | 'rag_exercise_question'
  | 'rag_mindfulness_question'
  | 'general_chat'
  | 'feedback'
  | 'unknown';

/**
 * Status of a tool call
 */
export type ToolCallStatus = 
  | 'pending' 
  | 'success' 
  | 'failed' 
  | 'requires_confirmation' 
  | 'cancelled';

/**
 * Citation from RAG research
 */
export interface Citation {
  title: string;
  authors?: string;
  pmid?: string;
  doi?: string;
  year?: number;
  relevanceScore?: number;
}

/**
 * Tool call made by the chatbot
 */
export interface ToolCall {
  toolName: string;
  toolInput: Record<string, any>;
  toolOutput?: Record<string, any>;
  status: ToolCallStatus;
  errorMessage?: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

/**
 * Request to send a chat message
 */
export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
  context?: {
    screen?: string;
    currentAssignmentId?: number;
    [key: string]: any;
  };
}

/**
 * Response from sending a chat message
 */
export interface ChatMessageResponse {
  messageId: string;
  sessionId: string;
  response: string;
  intent: IntentType;
  citations: Citation[];
  toolCalls: ToolCall[];
  suggestions: string[];
  confidence?: number;
  tokensUsed?: number;
  modelUsed?: string;
  createdAt: string;
}

/**
 * Single message in chat history
 */
export interface ChatHistoryItem {
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  intent?: IntentType;
  citations: Citation[];
  toolCalls: ToolCall[];
  createdAt: string;
}

/**
 * Chat history response
 */
export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatHistoryItem[];
  totalMessages: number;
  hasMore: boolean;
}

/**
 * Feedback request
 */
export interface ChatFeedbackRequest {
  messageId: string;
  rating: -1 | 0 | 1;
  feedbackText?: string;
  feedbackCategory?: 'accuracy' | 'helpfulness' | 'safety' | 'other';
}

/**
 * Chat session info
 */
export interface ChatSession {
  sessionId: string;
  title?: string;
  createdAt: string;
  lastMessageAt?: string;
  totalMessages: number;
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets Firebase auth token
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get Firebase token:', error);
    return null;
  }
};

/**
 * Converts snake_case to camelCase for response objects
 */
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively transforms snake_case keys to camelCase
 */
const transformKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformKeys(obj[key]);
      return acc;
    }, {} as Record<string, any>);
  }
  return obj;
};


// ============================================================================
// Chat Service
// ============================================================================

export const chatService = {
  /**
   * Send a message to the chatbot
   * 
   * @param request - The chat message request
   * @returns Promise resolving to the chat response
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('💬 [ChatService] Sending message:', request.message.substring(0, 50) + '...');

    const response = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: request.message,
        session_id: request.sessionId,
        context: request.context,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ [ChatService] Error:', error);
      throw new Error(error.detail || 'Failed to send message');
    }

    const data = await response.json();
    console.log('✅ [ChatService] Response received:', data.intent);
    
    return transformKeys(data) as ChatMessageResponse;
  },

  /**
   * Get chat history for a session
   * 
   * @param sessionId - The session ID
   * @param limit - Maximum messages to return
   * @param offset - Number of messages to skip
   * @returns Promise resolving to chat history
   */
  async getHistory(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/history/${sessionId}?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return transformKeys(data) as ChatHistoryResponse;
  },

  /**
   * Submit feedback on a chat response
   * 
   * @param feedback - The feedback request
   * @returns Promise resolving to success status
   */
  async submitFeedback(feedback: ChatFeedbackRequest): Promise<{ success: boolean; message: string }> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('📝 [ChatService] Submitting feedback for:', feedback.messageId);

    const response = await fetch(`${API_BASE_URL}/api/v1/chat/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message_id: feedback.messageId,
        rating: feedback.rating,
        feedback_text: feedback.feedbackText,
        feedback_category: feedback.feedbackCategory,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    return await response.json();
  },

  /**
   * Confirm or cancel a pending action
   * 
   * @param messageId - The message ID with pending action
   * @param toolName - The tool name to confirm
   * @param confirmed - Whether to execute or cancel
   * @returns Promise resolving to result
   */
  async confirmAction(
    messageId: string,
    toolName: string,
    confirmed: boolean
  ): Promise<{ success: boolean; executed: boolean; message: string }> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log(`🔄 [ChatService] ${confirmed ? 'Confirming' : 'Cancelling'} action:`, toolName);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/confirm-action?message_id=${messageId}&tool_name=${toolName}&confirmed=${confirmed}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to confirm action');
    }

    return await response.json();
  },

  /**
   * Create a new chat session
   * 
   * @returns Promise resolving to session info
   */
  async createSession(): Promise<{ sessionId: string; createdAt: string }> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    return transformKeys(data);
  },

  /**
   * List user's chat sessions
   * 
   * @param limit - Maximum sessions to return
   * @returns Promise resolving to sessions list
   */
  async listSessions(limit: number = 10): Promise<{ sessions: ChatSession[]; total: number }> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/sessions?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list sessions');
    }

    const data = await response.json();
    return transformKeys(data);
  },

  /**
   * Check chat service health
   * 
   * @returns Promise resolving to health status
   */
  async healthCheck(): Promise<{
    status: string;
    chatService: string;
    llmModel: string;
    ragAvailable: boolean;
    features: Record<string, boolean>;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/health`);
    
    if (!response.ok) {
      throw new Error('Chat service unhealthy');
    }

    const data = await response.json();
    return transformKeys(data);
  },
};


// ============================================================================
// React Hook for Chat (Optional, can be used in components)
// ============================================================================

export interface UseChatOptions {
  sessionId?: string;
  onMessage?: (response: ChatMessageResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Simple chat state manager for use in components
 */
export class ChatManager {
  private sessionId: string | null = null;
  private messages: ChatHistoryItem[] = [];
  private isLoading: boolean = false;

  async initialize(existingSessionId?: string): Promise<string> {
    if (existingSessionId) {
      this.sessionId = existingSessionId;
      // Load history
      const history = await chatService.getHistory(existingSessionId);
      this.messages = history.messages;
    } else {
      const session = await chatService.createSession();
      this.sessionId = session.sessionId;
    }
    return this.sessionId;
  }

  async sendMessage(content: string, context?: Record<string, any>): Promise<ChatMessageResponse> {
    if (!this.sessionId) {
      await this.initialize();
    }

    this.isLoading = true;

    // Add user message to local state
    const userMessage: ChatHistoryItem = {
      messageId: `temp_${Date.now()}`,
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date().toISOString(),
    };
    this.messages.push(userMessage);

    try {
      const response = await chatService.sendMessage({
        message: content,
        sessionId: this.sessionId!,
        context,
      });

      // Add assistant response to local state
      const assistantMessage: ChatHistoryItem = {
        messageId: response.messageId,
        role: 'assistant',
        content: response.response,
        intent: response.intent,
        citations: response.citations,
        toolCalls: response.toolCalls,
        createdAt: response.createdAt,
      };
      this.messages.push(assistantMessage);

      return response;
    } finally {
      this.isLoading = false;
    }
  }

  getMessages(): ChatHistoryItem[] {
    return [...this.messages];
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  clear(): void {
    this.sessionId = null;
    this.messages = [];
    this.isLoading = false;
  }
}

export default chatService;
