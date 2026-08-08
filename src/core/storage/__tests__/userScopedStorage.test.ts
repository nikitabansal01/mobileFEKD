import { auth } from '@/config/firebase';

import {
  clearUserScopedStorage,
  migrateLegacyAuthStorage,
  purgeLegacyPlaintextCredentials,
  secureRegistryKey,
  SECURE_STORAGE_KEYS,
  userStorageKey,
  type AsyncKeyValueStore,
  type SecureKeyValueStore,
} from '../userScopedStorage';
import { getSecureJson, setSecureJson } from '../secureJsonStore';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: null },
}));

class MemoryAsyncStore implements AsyncKeyValueStore {
  readonly data = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    Object.entries(seed).forEach(([key, value]) => this.data.set(key, value));
  }

  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
  async multiRemove(keys: readonly string[]) {
    keys.forEach((key) => this.data.delete(key));
  }
}

class MemorySecureStore implements SecureKeyValueStore {
  readonly data = new Map<string, string>();
  readonly failingDeletes = new Set<string>();

  async getItemAsync(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItemAsync(key: string, value: string) {
    this.data.set(key, value);
  }
  async deleteItemAsync(key: string) {
    if (this.failingDeletes.has(key)) {
      throw new Error(`Cannot remove ${key}`);
    }
    this.data.delete(key);
  }
}

const setCurrentUser = (uid: string | null) => {
  (auth as { currentUser: { uid: string } | null }).currentUser = uid ? { uid } : null;
};

describe('user-scoped storage cleanup', () => {
  afterEach(() => setCurrentUser(null));

  it('removes legacy plaintext health data and credentials during upgrade', async () => {
    const asyncStore = new MemoryAsyncStore({
      auth_remember_me: 'true',
      auth_saved_email: 'Person@Example.com ',
      auth_saved_password: 'must-disappear',
      savedPassword: 'also-disappear',
      QuestionScreen_answers: '{"period":"private"}',
      daily_review_draft_1: '{"health":"private"}',
    });
    const secureStore = new MemorySecureStore();

    await migrateLegacyAuthStorage({ asyncStore, secureStore });

    expect(asyncStore.data.size).toBe(0);
    expect(secureStore.data.get(SECURE_STORAGE_KEYS.rememberedEmail)).toBe(
      'person@example.com',
    );
  });

  it('purges both historical plaintext password keys independently', async () => {
    const asyncStore = new MemoryAsyncStore({
      auth_saved_password: 'one',
      savedPassword: 'two',
      auth_saved_email: 'person@example.com',
    });

    await purgeLegacyPlaintextCredentials({
      asyncStore,
      secureStore: new MemorySecureStore(),
    });

    expect([...asyncStore.data.entries()]).toEqual([
      ['auth_saved_email', 'person@example.com'],
    ]);
  });

  it('isolates sensitive values by UID and clears only the signed-out account', async () => {
    const userA = 'user/a';
    const userB = 'user-b';
    const asyncStore = new MemoryAsyncStore({
      [userStorageKey(userA, 'ui.plan-status')]: 'generating',
      [userStorageKey(userB, 'ui.plan-status')]: 'ready',
      QuestionScreen_answers: '{"legacy":"health"}',
      theme_preference: 'dark',
    });
    const secureStore = new MemorySecureStore();
    const aDraftKey = userStorageKey(userA, 'draft.daily-review.1');
    const bDraftKey = userStorageKey(userB, 'draft.daily-review.1');
    asyncStore.data.set(secureRegistryKey(userA), JSON.stringify([aDraftKey]));
    asyncStore.data.set(secureRegistryKey(userB), JSON.stringify([bDraftKey]));
    secureStore.data.set(aDraftKey, 'user-a-health');
    secureStore.data.set(bDraftKey, 'user-b-health');

    await clearUserScopedStorage(userA, { asyncStore, secureStore });

    expect(asyncStore.data).toEqual(
      new Map([
        [userStorageKey(userB, 'ui.plan-status'), 'ready'],
        [secureRegistryKey(userB), JSON.stringify([bDraftKey])],
        ['theme_preference', 'dark'],
      ]),
    );
    expect(secureStore.data).toEqual(new Map([[bDraftKey, 'user-b-health']]));
  });

  it('fails closed instead of using a shared secure-draft key without Firebase auth', async () => {
    const asyncStore = new MemoryAsyncStore();
    const secureStore = new MemorySecureStore();

    await expect(
      setSecureJson('draft.onboarding.answers', { period: 'private' }, 1_000, {
        asyncStore,
        secureStore,
      }),
    ).rejects.toThrow('Firebase user UID');
    await expect(
      getSecureJson('draft.onboarding.answers', { asyncStore, secureStore }),
    ).resolves.toBeNull();
    expect(asyncStore.data.size).toBe(0);
    expect(secureStore.data.size).toBe(0);
  });

  it('preserves the registry after a SecureStore failure so cleanup can retry', async () => {
    const uid = 'retry-user';
    const draftKey = userStorageKey(uid, 'draft.daily-review.1');
    const registryKey = secureRegistryKey(uid);
    const asyncStore = new MemoryAsyncStore({
      [userStorageKey(uid, 'ui.plan-status')]: 'generating',
      [registryKey]: JSON.stringify([draftKey]),
    });
    const secureStore = new MemorySecureStore();
    secureStore.data.set(draftKey, 'sensitive-draft');
    secureStore.failingDeletes.add(draftKey);

    await expect(clearUserScopedStorage(uid, { asyncStore, secureStore })).rejects.toThrow(
      'Secure user data',
    );
    expect(asyncStore.data.get(registryKey)).toBe(JSON.stringify([draftKey]));
    expect(asyncStore.data.get(userStorageKey(uid, 'ui.plan-status'))).toBe('generating');
    expect(secureStore.data.get(draftKey)).toBe('sensitive-draft');

    secureStore.failingDeletes.delete(draftKey);
    await clearUserScopedStorage(uid, { asyncStore, secureStore });
    expect(asyncStore.data.size).toBe(0);
    expect(secureStore.data.size).toBe(0);
  });

  it('cannot read a first account’s secure draft after an account switch', async () => {
    const asyncStore = new MemoryAsyncStore();
    const secureStore = new MemorySecureStore();
    setCurrentUser('user-a');
    await setSecureJson('draft.onboarding.answers', { age: 30 }, 1_000, {
      asyncStore,
      secureStore,
    });

    setCurrentUser('user-b');
    await expect(
      getSecureJson<{ age: number }>('draft.onboarding.answers', {
        asyncStore,
        secureStore,
      }),
    ).resolves.toBeNull();
  });
});
