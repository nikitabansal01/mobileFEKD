import { auth } from '@/config/firebase';

export const RECENT_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export interface RecentAuthenticationUser {
  getIdTokenResult(): Promise<{ authTime?: string }>;
}

export type RecentAuthenticationResult =
  | { recent: true }
  | { recent: false; reason: 'signed_out' | 'unavailable' | 'expired' };

const authenticatedAt = (authTime?: string): number | null => {
  if (!authTime) return null;
  const parsed = Date.parse(authTime);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function checkRecentAuthentication(
  user: RecentAuthenticationUser | null = auth.currentUser,
  nowMs: number = Date.now(),
): Promise<RecentAuthenticationResult> {
  if (!user) return { recent: false, reason: 'signed_out' };
  try {
    const token = await user.getIdTokenResult();
    const authTime = authenticatedAt(token.authTime);
    if (authTime === null) return { recent: false, reason: 'unavailable' };
    return nowMs - authTime <= RECENT_AUTH_MAX_AGE_MS && nowMs >= authTime
      ? { recent: true }
      : { recent: false, reason: 'expired' };
  } catch {
    return { recent: false, reason: 'unavailable' };
  }
}

export const recentAuthenticationMessage = (): string =>
  'For your security, sign out and sign in again before requesting an export or deleting your account.';
