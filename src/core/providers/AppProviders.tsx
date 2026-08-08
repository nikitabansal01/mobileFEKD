import { QueryClientProvider } from '@tanstack/react-query';
import React, { PropsWithChildren, useEffect, useRef } from 'react';

import { auth } from '@/config/firebase';

import { queryClient } from '../query/queryClient';
import {
  clearUserScopedStorage,
  migrateLegacyAuthStorage,
} from '../storage/userScopedStorage';

/** Cross-cutting providers and account-boundary cleanup for the current app. */
export function AppProviders({ children }: PropsWithChildren) {
  const previousUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    void migrateLegacyAuthStorage().catch(() => {
      // Never log credentials or storage payloads. A later logout retries cleanup.
    });

    return auth.onAuthStateChanged((user) => {
      const nextUid = user?.uid ?? null;
      const priorUid = previousUid.current;

      // Guest -> newly-created user intentionally preserves the onboarding claim.
      if (priorUid !== undefined && priorUid !== null && priorUid !== nextUid) {
        queryClient.clear();
        void clearUserScopedStorage(priorUid).catch(() => {
          // AuthService surfaces explicit logout failures; this listener is a
          // second defensive boundary for externally-triggered account changes.
        });
      }
      previousUid.current = nextUid;
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
