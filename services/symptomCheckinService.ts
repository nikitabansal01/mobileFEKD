import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import type { UIBlock, UIEventRequest } from '@/utils/uiBlocks';

/**
 * Symptom Check-in Service
 * Daily threaded chat for symptom progress.
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
    if (user) return await user.getIdToken();
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

export interface StartSymptomCheckInResponse {
  thread_id: string;
  local_date: string;
  history: Message[];
  tap_options: TapOption[];
  ui_blocks?: UIBlock[];
}

export interface RespondSymptomCheckInResponse {
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

class SymptomCheckinService {
  async startToday(): Promise<StartSymptomCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to start symptom check-in:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error starting symptom check-in:', error);
      return null;
    }
  }

  async sendMessage(threadId: string, messageText: string): Promise<RespondSymptomCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/respond`, {
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
        console.error('❌ Failed to send symptom message:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending symptom message:', error);
      return null;
    }
  }

  async sendEvent(event: UIEventRequest): Promise<RespondSymptomCheckInResponse | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/event`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to send symptom UI event:', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error sending symptom UI event:', error);
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

      const getAudioUploadMeta = (u: string): { name: string; type: string } => {
        const rawExt = (u.split('.').pop() || '').split('?')[0].toLowerCase();
        const ext = rawExt || 'm4a';
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
      const meta = getAudioUploadMeta(uri);
      formData.append('file', {
        uri,
        name: meta.name,
        type: meta.type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed to transcribe audio (symptom):', response.status, text);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error transcribing audio (symptom):', error);
      return null;
    }
  }
}

export const symptomCheckinService = new SymptomCheckinService();
export default symptomCheckinService;
