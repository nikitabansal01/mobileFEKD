import { auth } from '@/config/firebase';

import type { AccessTokenProvider } from '../api/client';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** Firebase is the sole mobile authentication/session authority. */
export const firebaseTokenProvider: AccessTokenProvider = async () => {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await user.getIdToken(attempt > 0);
    } catch (error: any) {
      const networkFailure = error?.code === 'auth/network-request-failed';
      if (!networkFailure || attempt === 2) return null;
      await delay(400 * (attempt + 1));
    }
  }

  return null;
};
