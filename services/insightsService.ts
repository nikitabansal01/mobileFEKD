/**
 * Insights Service
 * 
 * Fetches analytics data for Symptom Patterns feature (requires 14-day streak reward).
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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CategoryStats {
    category: string;
    total: number;
    completed: number;
    liked: number;
    disliked: number;
    completion_rate: number;
}

export interface WeeklyTrend {
    week_start: string;
    food_completed: number;
    movement_completed: number;
    mindfulness_completed: number;
    total_completed: number;
}

export interface SymptomPatternsResponse {
    period_days: number;
    category_breakdown: CategoryStats[];
    weekly_trends: WeeklyTrend[];
    top_liked_categories: string[];
    insights: string[];
}

export interface QuickSummary {
    total_completed: number;
    current_streak: number;
    longest_streak: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class InsightsService {
    /**
     * Get symptom patterns (requires 14-day streak reward)
     */
    async getSymptomPatterns(): Promise<SymptomPatternsResponse> {
        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/v1/insights/symptom-patterns`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 403) {
            throw new Error('REWARD_REQUIRED');
        }

        if (!response.ok) {
            throw new Error('Failed to fetch patterns');
        }

        return response.json();
    }

    /**
     * Get quick summary (no reward required)
     */
    async getQuickSummary(): Promise<QuickSummary> {
        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/v1/insights/summary`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch summary');
        }

        return response.json();
    }
}

export const insightsService = new InsightsService();
