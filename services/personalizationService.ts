/**
 * Personalization Service - 2026 Vision
 * 
 * Handles API calls for the intelligent personalization experience:
 * - Profile summary with trait chips
 * - Discovery prompts for gap exploration
 * - Unlock status for gated features
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


export interface TraitChip {
    id: string;
    label: string;
    icon: string;
    source: 'inferred' | 'explicit';
    confidence?: string;
}

export interface DiscoveryPrompt {
    id: string;
    title: string;
    question: string;
    icon: string;
    priority: 'high' | 'medium' | 'low';
}

export interface UnlockStatus {
    feature: string;
    accessible: boolean;
    type: 'streak_preference' | 'pro_feature';
    current_streak?: number;
    required_days?: number;
    days_remaining?: number;
}

export interface ProfileSummaryResponse {
    known_traits: TraitChip[];
    profile_density: number;  // 0-100
    discovery_prompts: DiscoveryPrompt[];
    unlock_statuses: UnlockStatus[];
    current_streak: number;
    is_pro: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class PersonalizationService {
    private baseUrl = `${API_BASE_URL}/api/v1/personalization`;

    private async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('User not authenticated');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }


    /**
     * Get comprehensive profile summary for the PersonalizeScreen.
     * Returns trait chips, profile density, discovery prompts, and unlock statuses.
     */
    async getProfileSummary(): Promise<ProfileSummaryResponse> {
        console.log('🎯 [Personalization] Fetching profile summary...');

        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/profile-summary`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch profile summary');
            }

            const data = await response.json();
            console.log('✅ [Personalization] Profile summary:', {
                traits: data.known_traits?.length || 0,
                density: data.profile_density,
                prompts: data.discovery_prompts?.length || 0,
            });

            return data;
        } catch (error) {
            console.error('❌ [Personalization] Error:', error);
            throw error;
        }
    }

    /**
     * Get discovery prompts for profile gaps.
     * Each prompt can be used to start a focused chat conversation.
     */
    async getDiscoveryPrompts(): Promise<DiscoveryPrompt[]> {
        console.log('🔍 [Personalization] Fetching discovery prompts...');

        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${this.baseUrl}/discovery-prompts`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch discovery prompts');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ [Personalization] Discovery prompts error:', error);
            throw error;
        }
    }

    /**
     * Check if a preference or feature is unlocked for the user.
     */
    isFeatureUnlocked(unlockStatuses: UnlockStatus[], feature: string): boolean {
        const status = unlockStatuses.find(s => s.feature === feature);
        return status?.accessible ?? false;
    }

    /**
     * Get unlock info for a specific feature.
     */
    getUnlockInfo(unlockStatuses: UnlockStatus[], feature: string): UnlockStatus | undefined {
        return unlockStatuses.find(s => s.feature === feature);
    }
}

export const personalizationService = new PersonalizationService();
