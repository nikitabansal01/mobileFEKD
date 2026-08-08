import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '@/config/firebase';

import { userStorageKey } from './userScopedStorage';

const keyForCurrentUser = (key: string): string | null => {
  const uid = auth.currentUser?.uid;
  return uid ? userStorageKey(uid, key) : null;
};

/** Non-sensitive per-user UI state. Missing auth never falls back to a shared key. */
export const userScopedAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const scopedKey = keyForCurrentUser(key);
    return scopedKey ? AsyncStorage.getItem(scopedKey) : null;
  },

  async setItem(key: string, value: string): Promise<boolean> {
    const scopedKey = keyForCurrentUser(key);
    if (!scopedKey) return false;
    await AsyncStorage.setItem(scopedKey, value);
    return true;
  },

  async removeItem(key: string): Promise<boolean> {
    const scopedKey = keyForCurrentUser(key);
    if (!scopedKey) return false;
    await AsyncStorage.removeItem(scopedKey);
    return true;
  },

  async multiRemove(keys: readonly string[]): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    await AsyncStorage.multiRemove(keys.map((key) => userStorageKey(uid, key)));
    return true;
  },

  /** Writes related account-setup state in one native storage operation. */
  async multiSet(entries: readonly (readonly [string, string])[]): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    await AsyncStorage.multiSet(entries.map(([key, value]) => [userStorageKey(uid, key), value]));
    return true;
  },
};
