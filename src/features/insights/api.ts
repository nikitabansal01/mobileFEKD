import { useQuery } from '@tanstack/react-query';

import { v2Client } from '@/src/core/api/runtimeClient';
import type { components } from '@/src/core/api/v2.generated';

export type InsightsSummary = components['schemas']['InsightsSummaryResponse'];
export type SymptomPatterns = components['schemas']['SymptomPatternsResponse'];
export type CycleState = components['schemas']['CycleStateResponse'];

export const insightKeys = {
  all: ['insights'] as const,
  summary: () => [...insightKeys.all, 'summary'] as const,
  symptoms: () => [...insightKeys.all, 'symptom-patterns'] as const,
  cycle: () => [...insightKeys.all, 'cycle'] as const,
};

export const getInsightsSummary = (signal?: AbortSignal): Promise<InsightsSummary> =>
  v2Client.request('get', '/api/v2/me/insights/summary', { signal });

export const getSymptomPatterns = (signal?: AbortSignal): Promise<SymptomPatterns> =>
  v2Client.request('get', '/api/v2/me/insights/symptom-patterns', { signal });

export const getCycleState = (signal?: AbortSignal): Promise<CycleState> =>
  v2Client.request('get', '/api/v2/me/cycle', { signal });

export const useInsightsSummary = () =>
  useQuery({
    queryKey: insightKeys.summary(),
    queryFn: ({ signal }) => getInsightsSummary(signal),
  });

export const useSymptomPatterns = () =>
  useQuery({
    queryKey: insightKeys.symptoms(),
    queryFn: ({ signal }) => getSymptomPatterns(signal),
  });

export const useCycleState = () =>
  useQuery({
    queryKey: insightKeys.cycle(),
    queryFn: ({ signal }) => getCycleState(signal),
  });
