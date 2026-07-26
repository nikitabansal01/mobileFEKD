/**
 * Preferences Service
 * 
 * Handles user preferences that are gated by streak rewards.
 * Each preference type requires a specific reward to be claimed first.
 */
import { Platform } from 'react-native';
import { getAuthToken } from './authTokenService';

/**
 * Gets the API base URL based on platform and environment
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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PreferenceOption {
    id: string;
    label: string;
    icon: string;
}

export interface BodyMetrics {
    height_cm?: number;
    weight_kg?: number;
    waist_cm?: number;
    bmi?: number;
    bmi_category?: string;
    waist_height_ratio?: number;
}

export interface AllPreferencesResponse {
    unlocked_preferences: string[];
    preferences: {
        diet_preference?: string;
        food_allergies?: string[];
        cuisine_preference?: string[];
        dine_out_frequency?: string;
        cultural_background?: string;
        body_metrics?: BodyMetrics;
        cravings?: string[];
    };
    preference_options: {
        diet_preference: PreferenceOption[];
        food_allergies: PreferenceOption[];
        cuisine_preference: PreferenceOption[];
        dine_out_frequency: PreferenceOption[];
        cultural_background: PreferenceOption[];
    };
}

export interface PreferenceResponse {
    success: boolean;
    preference_type: string;
    value: any;
    message?: string;
}

export type PreferenceType =
    | 'diet_preference'
    | 'food_allergies'
    | 'cuisine_preference'
    | 'dine_out_frequency'
    | 'cultural_background'
    | 'body_metrics'
    | 'cravings';

// Reward ID required for each preference type
export const PREFERENCE_REWARD_MAP: Record<PreferenceType, string> = {
    diet_preference: 'diet_prefs',
    food_allergies: 'food_allergies',
    cuisine_preference: 'cuisine_prefs',
    dine_out_frequency: 'dine_out',
    cultural_background: 'ethnicity',
    body_metrics: 'bmi_ratio',
    cravings: 'cravings_healthy',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class PreferencesService {
    /**
     * Get all preferences and which are unlocked
     */
    async getAllPreferences(): Promise<AllPreferencesResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch preferences');
        }

        return response.json();
    }

    /**
     * Set a preference value
     */
    async setPreference(preferenceType: PreferenceType, value: any): Promise<PreferenceResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                preference_type: preferenceType,
                value: value,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to set preference');
        }

        return response.json();
    }

    /**
     * Set body metrics
     */
    async setBodyMetrics(metrics: BodyMetrics): Promise<PreferenceResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/preferences/body-metrics`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                height_cm: metrics.height_cm,
                weight_kg: metrics.weight_kg,
                waist_cm: metrics.waist_cm,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to set body metrics');
        }

        return response.json();
    }

    /**
     * Get options for a preference type
     */
    async getPreferenceOptions(preferenceType: string): Promise<{ options: PreferenceOption[] }> {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/preferences/options/${preferenceType}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch options');
        }

        return response.json();
    }

    /**
     * Check if a preference type is unlocked for the user
     */
    isPreferenceUnlocked(
        preferenceType: PreferenceType,
        unlockedPreferences: string[]
    ): boolean {
        return unlockedPreferences.includes(preferenceType);
    }

    /**
     * Get the required reward ID for a preference type
     */
    getRequiredRewardId(preferenceType: PreferenceType): string {
        return PREFERENCE_REWARD_MAP[preferenceType];
    }
}

export const preferencesService = new PreferencesService();
