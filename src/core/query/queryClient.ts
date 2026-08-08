import { QueryClient } from '@tanstack/react-query';

import { ApiProblemError } from '../api/problem';
import { isRetryableApiProblem } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) =>
        error instanceof ApiProblemError &&
        isRetryableApiProblem(error.problem) &&
        failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const clearServerState = (): void => queryClient.clear();
