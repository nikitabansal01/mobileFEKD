import { signOut } from 'firebase/auth';

import { auth } from '@/config/firebase';
import { clearServerState } from '@/src/core/query/queryClient';
import {
  clearUserScopedStorage,
  getRememberedEmail,
  setRememberedEmail,
} from '@/src/core/storage/userScopedStorage';

/**
 * Compatibility facade for existing screens while v2 feature modules replace
 * them. Firebase owns the session; this service never stores passwords or a
 * second "logged in" flag.
 */
class AuthService {
  async saveLoginPreference(email: string, rememberEmail: boolean): Promise<void> {
    await setRememberedEmail(rememberEmail ? email : null);
  }

  async getSavedEmail(): Promise<string | null> {
    return getRememberedEmail();
  }

  async logout(): Promise<void> {
    const uid = auth.currentUser?.uid ?? null;
    clearServerState();

    let signOutError: unknown;
    try {
      await signOut(auth);
    } catch (error) {
      signOutError = error;
    }

    // Local cleanup must run even if Firebase cannot reach the network.
    await clearUserScopedStorage(uid);

    if (signOutError) {
      throw signOutError;
    }
  }

  async fullLogout(): Promise<void> {
    await this.logout();
  }
}

const authService = new AuthService();
export default authService;
