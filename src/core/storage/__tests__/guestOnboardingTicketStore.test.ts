import {
  getGuestOnboardingTicket,
  saveGuestOnboardingTicket,
  GUEST_ONBOARDING_TICKET_STORAGE_KEY,
} from '../guestOnboardingTicketStore';
import type { SecureKeyValueStore } from '../userScopedStorage';

class MemorySecureStore implements SecureKeyValueStore {
  readonly data = new Map<string, string>();
  async getItemAsync(key: string) { return this.data.get(key) ?? null; }
  async setItemAsync(key: string, value: string) { this.data.set(key, value); }
  async deleteItemAsync(key: string) { this.data.delete(key); }
}

const ticket = {
  session_id: 'session-id',
  proof_token: 'proof-token',
  expires_at: '2099-01-01T00:00:00.000Z',
  required_consents: [
    { consent_type: 'privacy', document_version: '2026-01' },
    { consent_type: 'health_data_processing', document_version: '2026-01' },
  ],
};

describe('guest onboarding ticket store', () => {
  it('survives a process restart without a Firebase UID and excludes health content', async () => {
    const store = new MemorySecureStore();
    await saveGuestOnboardingTicket(ticket, store);
    expect(await getGuestOnboardingTicket(store)).toEqual(ticket);
    const serialized = store.data.get(GUEST_ONBOARDING_TICKET_STORAGE_KEY) ?? '';
    expect(serialized).not.toMatch(/"(?:answers|password|uid|name)"/i);
  });

  it('removes expired tickets instead of allowing a stale proof to be claimed', async () => {
    const store = new MemorySecureStore();
    store.data.set(GUEST_ONBOARDING_TICKET_STORAGE_KEY, JSON.stringify({
      version: 1,
      value: { ...ticket, expires_at: '2000-01-01T00:00:00.000Z' },
    }));
    await expect(getGuestOnboardingTicket(store)).resolves.toBeNull();
    expect(store.data.has(GUEST_ONBOARDING_TICKET_STORAGE_KEY)).toBe(false);
  });
});
