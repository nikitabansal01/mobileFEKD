import {
  getGuestOnboardingAssessment,
  saveGuestOnboardingAssessment,
  GUEST_ONBOARDING_ASSESSMENT_STORAGE_KEY,
} from '../guestOnboardingAssessmentStore';
import type { SecureKeyValueStore } from '../userScopedStorage';

class MemorySecureStore implements SecureKeyValueStore {
  readonly data = new Map<string, string>();
  async getItemAsync(key: string) { return this.data.get(key) ?? null; }
  async setItemAsync(key: string, value: string) { this.data.set(key, value); }
  async deleteItemAsync(key: string) { this.data.delete(key); }
}

const draft = {
  session_id: 'session-id', expires_at: '2099-01-01T00:00:00.000Z',
  timezone: 'Asia/Kolkata', revision: 1,
  answers: { age: 27, period_description: 'Regular', lifestyle_focus: ['eat'] },
};

describe('guest onboarding assessment store', () => {
  it('restores a device-only health draft after restart only for its own session', async () => {
    const store = new MemorySecureStore();
    await saveGuestOnboardingAssessment(draft, store);
    expect(await getGuestOnboardingAssessment('session-id', store)).toEqual(draft);
  });

  it('erases mismatched and expired drafts instead of leaking health data to another flow', async () => {
    const store = new MemorySecureStore();
    await saveGuestOnboardingAssessment(draft, store);
    await expect(getGuestOnboardingAssessment('other-session', store)).resolves.toBeNull();
    expect(store.data.has(GUEST_ONBOARDING_ASSESSMENT_STORAGE_KEY)).toBe(false);
    store.data.set(GUEST_ONBOARDING_ASSESSMENT_STORAGE_KEY, JSON.stringify({
      version: 1, value: { ...draft, expires_at: '2000-01-01T00:00:00.000Z' },
    }));
    await expect(getGuestOnboardingAssessment('session-id', store)).resolves.toBeNull();
  });
});
