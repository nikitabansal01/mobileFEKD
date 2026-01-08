/**
 * Symptom Tracking Service
 *
 * Powers the Symptom Manager UI:
 * - Fetch recent symptom logs + aggregates for charts
 * - Log a symptom severity entry (1-9) with optional factors
 */
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
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

export type SymptomTrend = 'improving' | 'stable' | 'worsening' | 'unknown';

export interface SymptomLogItem {
  symptom_type: string;
  severity: number; // 1-9
  logged_at: string;
  notes?: string | null;
  factors: string[];
}

export interface SymptomTypeAggregate {
  symptom_type: string;
  count: number;
  avg_severity: number;
  last_severity?: number | null;
  trend: SymptomTrend;
}

export interface SymptomOverviewResponse {
  period_days: number;
  logs: SymptomLogItem[];
  aggregates: SymptomTypeAggregate[];
  top_symptoms: string[];
}

export interface LogSymptomRequest {
  symptom_type: string;
  severity: number;
  notes?: string;
  factors?: string[];
  logged_via?: string;
}

class SymptomTrackingService {
  async getOverview(periodDays: number = 14): Promise<SymptomOverviewResponse> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/overview?period_days=${periodDays}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch symptom overview');
    }

    return response.json();
  }

  async logSymptom(payload: LogSymptomRequest): Promise<{ success: boolean; log?: any }> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/v1/symptom-checkin/log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        logged_via: payload.logged_via || 'symptom_checkin_ui',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to log symptom');
    }

    return response.json();
  }
}

export const symptomTrackingService = new SymptomTrackingService();
export default symptomTrackingService;
