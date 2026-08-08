import {
  checkRecentAuthentication,
  RECENT_AUTH_MAX_AGE_MS,
} from '../recentAuthentication';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: null },
}));

const now = Date.parse('2026-08-08T12:00:00.000Z');

describe('recent account authentication policy', () => {
  it('accepts a sign-in within the policy window', async () => {
    await expect(
      checkRecentAuthentication(
        { getIdTokenResult: async () => ({ authTime: '2026-08-08T11:56:00.000Z' }) },
        now,
      ),
    ).resolves.toEqual({ recent: true });
  });

  it('requires reauthentication for stale, unavailable, or missing identity state', async () => {
    await expect(
      checkRecentAuthentication(
        {
          getIdTokenResult: async () => ({
            authTime: new Date(now - RECENT_AUTH_MAX_AGE_MS - 1).toISOString(),
          }),
        },
        now,
      ),
    ).resolves.toEqual({ recent: false, reason: 'expired' });
    await expect(
      checkRecentAuthentication({ getIdTokenResult: async () => ({}) }, now),
    ).resolves.toEqual({ recent: false, reason: 'unavailable' });
    await expect(checkRecentAuthentication(null, now)).resolves.toEqual({
      recent: false,
      reason: 'signed_out',
    });
  });
});
