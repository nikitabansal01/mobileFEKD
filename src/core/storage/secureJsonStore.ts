import * as SecureStore from 'expo-secure-store';

import { auth } from '@/config/firebase';

import {
  registerSecureUserKey,
  type SecureKeyValueStore,
  type UserStorageDependencies,
  unregisterSecureUserKey,
  userStorageKey,
} from './userScopedStorage';

interface SecureEnvelope<T> {
  version: 1;
  expires_at: string;
  value: T;
}

const secureStoreFor = (overrides: UserStorageDependencies): SecureKeyValueStore =>
  overrides.secureStore ?? (SecureStore as SecureKeyValueStore);

const activeUid = (): string | null => auth.currentUser?.uid ?? null;

const secureKeyForActiveUser = (key: string): { uid: string; key: string } | null => {
  const uid = activeUid();
  return uid ? { uid, key: userStorageKey(uid, key) } : null;
};

/**
 * Stores sensitive drafts only when Firebase has identified the owner. A
 * missing UID is an explicit failure rather than a fallback to a shared key.
 */
export async function setSecureJson<T>(
  key: string,
  value: T,
  ttlMs: number,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('Secure JSON TTL must be a positive number.');
  }
  const scoped = secureKeyForActiveUser(key);
  if (!scoped) throw new Error('Cannot persist sensitive data without a Firebase user UID.');

  const envelope: SecureEnvelope<T> = {
    version: 1,
    expires_at: new Date(Date.now() + ttlMs).toISOString(),
    value,
  };
  await registerSecureUserKey(scoped.uid, scoped.key, overrides);
  try {
    await secureStoreFor(overrides).setItemAsync(scoped.key, JSON.stringify(envelope), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    await unregisterSecureUserKey(scoped.uid, scoped.key, overrides);
    throw error;
  }
}

export async function getSecureJson<T>(
  key: string,
  overrides: UserStorageDependencies = {},
): Promise<T | null> {
  const scoped = secureKeyForActiveUser(key);
  if (!scoped) return null;
  const serialized = await secureStoreFor(overrides).getItemAsync(scoped.key);
  if (!serialized) return null;

  try {
    const envelope = JSON.parse(serialized) as Partial<SecureEnvelope<T>>;
    const expiresAt = Date.parse(envelope.expires_at ?? '');
    if (envelope.version !== 1 || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await deleteSecureJson(key, overrides);
      return null;
    }
    return envelope.value ?? null;
  } catch {
    await deleteSecureJson(key, overrides);
    return null;
  }
}

export async function deleteSecureJson(
  key: string,
  overrides: UserStorageDependencies = {},
): Promise<void> {
  const scoped = secureKeyForActiveUser(key);
  if (!scoped) return;
  await secureStoreFor(overrides).deleteItemAsync(scoped.key);
  await unregisterSecureUserKey(scoped.uid, scoped.key, overrides);
}
