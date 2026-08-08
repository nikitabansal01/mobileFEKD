import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface AsyncKeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

export interface SecureKeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(
    key: string,
    value: string,
    options?: SecureStore.SecureStoreOptions,
  ): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface UserStorageDependencies {
  asyncStore?: AsyncKeyValueStore;
  secureStore?: SecureKeyValueStore;
}

export const SECURE_STORAGE_KEYS = {
  rememberedEmail: 'auvra.auth.remembered_email.v1',
} as const;

const USER_STORAGE_PREFIX = 'auvra.user.';
const REGISTRY_SUFFIX = 'secure_key_registry.v1';
const LEGACY_PASSWORD_KEYS = ['auth_saved_password', 'savedPassword'];
const LEGACY_AUTH_STATE_KEYS = [
  'auth_remember_me',
  'auth_saved_email',
  'auth_saved_password',
  'auth_is_logged_in',
  'auth_user_uid',
  'rememberMe',
  'savedEmail',
  'savedPassword',
  'session_id',
  'session_link_complete',
  'session_link_completed_ms',
  'session_link_duration_ms',
  'fresh_signup_pending_refresh',
  'post_auth_flow',
  'post_auth_started_ms',
  'plan_generating_in_background',
  'recommendation_generation_started',
  'homescreen_last_load',
  'userName',
  'lifestyle_focus',
  'last_plan_id',
  'cached_assignments',
  'cached_cycle_info',
  'QuestionScreen_answers',
];
const LEGACY_USER_PREFIXES = [
  'daily_review_draft_',
  'session_validated_',
  'auvra.draft.',
];

const dependencies = (overrides: UserStorageDependencies = {}) => ({
  asyncStore: overrides.asyncStore ?? (AsyncStorage as AsyncKeyValueStore),
  secureStore: overrides.secureStore ?? (SecureStore as SecureKeyValueStore),
});

const normalizedUid = (uid: string): string => {
  if (!uid.trim()) throw new Error('A Firebase user UID is required for local storage.');
  return encodeURIComponent(uid);
};

/** A single namespace for every local value that belongs to an authenticated user. */
export const userStorageKey = (uid: string, key: string): string => {
  if (!key.trim()) throw new Error('A local storage key is required.');
  return `${USER_STORAGE_PREFIX}${normalizedUid(uid)}.${key}`;
};

export const secureRegistryKey = (uid: string): string =>
  userStorageKey(uid, REGISTRY_SUFFIX);

export const userStoragePrefix = (uid: string): string =>
  `${USER_STORAGE_PREFIX}${normalizedUid(uid)}.`;

const parseRegistry = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((key): key is string => typeof key === 'string'))]
      : [];
  } catch {
    return [];
  }
};

export async function registerSecureUserKey(
  uid: string,
  key: string,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const { asyncStore } = dependencies(overrides);
  const registryKey = secureRegistryKey(uid);
  const keys = parseRegistry(await asyncStore.getItem(registryKey));
  if (!keys.includes(key)) {
    keys.push(key);
    await asyncStore.setItem(registryKey, JSON.stringify(keys));
  }
}

export async function unregisterSecureUserKey(
  uid: string,
  key: string,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const { asyncStore } = dependencies(overrides);
  const registryKey = secureRegistryKey(uid);
  const keys = parseRegistry(await asyncStore.getItem(registryKey));
  const remaining = keys.filter((registeredKey) => registeredKey !== key);
  if (remaining.length === 0) {
    await asyncStore.removeItem(registryKey);
  } else if (remaining.length !== keys.length) {
    await asyncStore.setItem(registryKey, JSON.stringify(remaining));
  }
}

/** Remove password values written by every known legacy implementation. */
export async function purgeLegacyPlaintextCredentials(
  overrides: UserStorageDependencies = {},
): Promise<void> {
  await dependencies(overrides).asyncStore.multiRemove(LEGACY_PASSWORD_KEYS);
}

/** One-time upgrade from the old password/manual-session persistence model. */
export async function migrateLegacyAuthStorage(
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const { asyncStore, secureStore } = dependencies(overrides);
  const [rememberMe, oldEmail, keys] = await Promise.all([
    asyncStore.getItem('auth_remember_me'),
    asyncStore.getItem('auth_saved_email'),
    asyncStore.getAllKeys(),
  ]);

  let migrationError: unknown;
  try {
    const existing = await secureStore.getItemAsync(SECURE_STORAGE_KEYS.rememberedEmail);
    if (rememberMe === 'true' && oldEmail?.trim() && !existing) {
      await secureStore.setItemAsync(
        SECURE_STORAGE_KEYS.rememberedEmail,
        oldEmail.trim().toLowerCase(),
        { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY },
      );
    }
  } catch (error) {
    migrationError = error;
  } finally {
    const staleSensitiveKeys = keys.filter((key) =>
      LEGACY_USER_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      key === 'QuestionScreen_answers',
    );
    await asyncStore.multiRemove([...LEGACY_AUTH_STATE_KEYS, ...staleSensitiveKeys]);
  }
  if (migrationError) throw migrationError;
}

export async function setRememberedEmail(
  email: string | null,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const { secureStore } = dependencies(overrides);
  const normalizedEmail = email?.trim().toLowerCase();
  await purgeLegacyPlaintextCredentials(overrides);
  if (!normalizedEmail) {
    await secureStore.deleteItemAsync(SECURE_STORAGE_KEYS.rememberedEmail);
    return;
  }
  await secureStore.setItemAsync(SECURE_STORAGE_KEYS.rememberedEmail, normalizedEmail, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function getRememberedEmail(
  overrides: UserStorageDependencies = {},
): Promise<string | null> {
  return dependencies(overrides).secureStore.getItemAsync(SECURE_STORAGE_KEYS.rememberedEmail);
}

const isLegacyUserData = (key: string): boolean =>
  LEGACY_AUTH_STATE_KEYS.includes(key) ||
  LEGACY_USER_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
  key === 'auvra_secure_key_registry_v1';

/**
 * Clears exactly one user's namespaced state plus historical unscoped values.
 * It intentionally never enumerates or deletes another user's namespaced data.
 */
export async function clearUserScopedStorage(
  uid: string | null,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const { asyncStore, secureStore } = dependencies(overrides);
  const [allAsyncKeys, registry] = uid
    ? await Promise.all([
        asyncStore.getAllKeys(),
        asyncStore.getItem(secureRegistryKey(uid)),
      ])
    : [await asyncStore.getAllKeys(), null];
  const prefix = uid ? userStoragePrefix(uid) : '';
  const asyncKeysToDelete = allAsyncKeys.filter(
    (key) => isLegacyUserData(key) || (prefix.length > 0 && key.startsWith(prefix)),
  );
  const secureKeysToDelete = [
    SECURE_STORAGE_KEYS.rememberedEmail,
    ...parseRegistry(registry),
  ];
  const secureResults = await Promise.allSettled(
    [...new Set(secureKeysToDelete)].map((key) => secureStore.deleteItemAsync(key)),
  );
  const failure = secureResults.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (failure) {
    throw new Error('Secure user data could not be completely removed.', {
      cause: failure.reason,
    });
  }
  // Keep the registry and namespace intact on any SecureStore failure so a
  // later logout/account-switch can discover and retry the orphaned value.
  if (asyncKeysToDelete.length > 0) await asyncStore.multiRemove(asyncKeysToDelete);
}
