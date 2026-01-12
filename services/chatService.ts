import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import type { UIBlock } from '@/utils/uiBlocks';

/**
 * Generic Chat service (FastAPI /api/v1/chat).
 * Used for contexts like: personalise ("personalize" UI), know_body, general.
 */

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('❌ Failed to get Firebase token:', error);
    return null;
  }
};

const getUserId = async (): Promise<string | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user?.uid ?? null;
};

export interface ChatMessageResponse {
  session_id: string;
  content: string;
  response_type?: string;
  choices?: string[];
  slider_config?: any;
  ui_blocks?: UIBlock[];
  metadata?: Record<string, any>;
}

class ChatService {
  async sendMessage(params: {
    message: string;
    conversation_context: string;
    input_mode?: 'tap' | 'yap' | 'type';
    session_id?: string | null;
    metadata?: Record<string, any>;
  }): Promise<ChatMessageResponse | null> {
    try {
      const [token, userId] = await Promise.all([getAuthToken(), getUserId()]);
      if (!userId) {
        console.error('❌ No user available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: params.message,
          conversation_context: params.conversation_context,
          input_mode: params.input_mode || 'type',
          session_id: params.session_id || undefined,
          metadata: params.metadata,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to send chat message:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      return null;
    }
  }
  async getSessions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting sessions:', error);
      return [];
    }
  }

  async getSessionMessages(userId: string, sessionId: string): Promise<any[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${userId}/${sessionId}/messages`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting session messages:', error);
      return [];
    }
  }
}

export const chatService = new ChatService();
export default chatService;
