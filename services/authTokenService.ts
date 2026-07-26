import { auth } from '@/config/firebase';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * Return a Firebase ID token without turning a transient connectivity problem
 * into a React Native error overlay. Firebase occasionally refreshes an
 * expired token while the simulator/device network is still reconnecting.
 */
export const getAuthToken = async (): Promise<string | null> => {
  await auth.authStateReady();

  const user = auth.currentUser;
  if (!user) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await user.getIdToken(attempt > 0);
    } catch (error: any) {
      const isNetworkFailure = error?.code === 'auth/network-request-failed';
      if (!isNetworkFailure || attempt === 2) {
        return null;
      }
      await delay(400 * (attempt + 1));
    }
  }

  return null;
};
