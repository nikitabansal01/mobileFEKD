import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import type { UIBlock, UIEventRequest } from '@/utils/uiBlocks';

/**
 * Care Plan Check-in Service
 * Daily threaded chat (one thread per local date).
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

export interface TapOption {
  id: string;
  text: string;
}

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

export interface StartCarePlanCheckInResponse {
  thread_id: string;
  local_date: string;
  history: Message[];
  tap_options: TapOption[];
  ui_blocks?: UIBlock[];
}

export interface RespondCarePlanCheckInResponse {
  thread_id: string;
  local_date: string;
  history: Message[];
  tap_options: TapOption[];
  actionable_insights?: Record<string, any>;
  ui_blocks?: UIBlock[];
}

export interface TranscribeResponse {
  text: string;
}

class CarePlanCheckinService {
  async startToday(): Promise<StartCarePlanCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/care-plan-checkin/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to start care plan check-in:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error starting care plan check-in:', error);
      return null;
    }
  }

  async sendMessage(threadId: string, messageText: string): Promise<RespondCarePlanCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/care-plan-checkin/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          message_text: messageText,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to send care plan message:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending care plan message:', error);
      return null;
    }
  }

  async sendEvent(event: UIEventRequest): Promise<RespondCarePlanCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/care-plan-checkin/event`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to send care plan UI event:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending care plan UI event:', error);
      return null;
    }
  }

  async transcribeAudio(uri: string): Promise<TranscribeResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'yap.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/v1/care-plan-checkin/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to transcribe audio (care plan):', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error transcribing audio (care plan):', error);
      return null;
    }
  }
}

export const carePlanCheckinService = new CarePlanCheckinService();
export default carePlanCheckinService;
