import authService from '@/services/authService';

/**
 * Deletion is accepted before it finishes. Clear every mobile account cache
 * immediately after the server acknowledges the durable request, not when a
 * UI timer guesses completion. AuthService clears React Query, SecureStore,
 * UID-scoped AsyncStorage, and legacy state even when Firebase sign-out fails.
 */
export const clearAcceptedDeletionSession = async (): Promise<void> => {
  await authService.logout();
};
