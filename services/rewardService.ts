/**
 * Reward Service
 * 
 * Handles communication with the rewards API for streak-based rewards system.
 */
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RewardItem {
    id: string;
    title: string;
    required_streak: number;
    category: "seed" | "rise";
    icon: string;
    state: "locked" | "available" | "claimed";
    days_remaining: number;
}

export interface RefreshStatus {
    limit: number;
    used: number;
    remaining: number;
    can_refresh: boolean;
}

export interface RewardsStatusResponse {
    current_streak: number;
    longest_streak: number;
    freeze_count: number;
    refresh_status: RefreshStatus;
    last_activity_date: string | null;
    // Streak risk status (for freeze prompts)
    streak_at_risk: boolean;
    missed_days_count: number;
    missed_dates: string[];
    can_freeze: boolean;
    freezes_needed: number;
    today_completed: boolean;
    today_frozen: boolean;
    // Rewards list
    rewards: RewardItem[];
}

export interface ClaimResponse {
    success: boolean;
    reward_id?: string;
    title?: string;
    icon?: string;
    error?: string;
    effect?: string;
    effect_result?: string;
}

export interface FreezeResponse {
    success: boolean;
    message?: string;
    error?: string;
    freeze_count: number;
    days_frozen?: number;
    frozen_dates?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class RewardService {
    /**
     * Get all rewards with current streak status.
     */
    async getRewardsStatus(): Promise<RewardsStatusResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/rewards`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch rewards: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Claim a reward if eligible.
     */
    async claimReward(rewardId: string): Promise<ClaimResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/rewards/claim`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reward_id: rewardId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to claim reward");
        }

        return response.json();
    }

    /**
     * Get rewards configuration (public, no auth needed).
     */
    async getRewardsConfig(): Promise<{ rewards: any[] }> {
        const response = await fetch(`${API_BASE_URL}/api/v1/rewards/config`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch rewards config");
        }

        return response.json();
    }

    /**
     * Get claimed rewards (for badge display).
     */
    async getClaimedRewards(): Promise<Array<{ id: string; title: string; icon: string; claimed_at: string | null }>> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/rewards/claimed`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch claimed rewards");
        }

        return response.json();
    }

    /**
     * Use freeze proactively for TODAY.
     * Call when user knows they won't complete actions today.
     */
    async useFreezeProactive(): Promise<FreezeResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/rewards/use-freeze`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to use freeze");
        }

        return response.json();
    }

    /**
     * Use freeze(s) reactively to protect streak from missed days.
     * Supports multi-day: will use X freezes for X missed days.
     */
    async useFreezeReactive(): Promise<FreezeResponse> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/rewards/use-freeze-reactive`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to use freeze");
        }

        return response.json();
    }
}

export const rewardService = new RewardService();
