import { useQuery } from '@tanstack/react-query';

import { v2Client } from '@/src/core/api/runtimeClient';
import type { components } from '@/src/core/api/v2.generated';

export type ProgressPeriod = 'week' | 'month' | 'all';
export type ProgressReport = components['schemas']['ProgressReportResponse'];
export type AdherenceBucket = components['schemas']['AdherenceBucket'];
export type RewardsOverview = components['schemas']['RewardsOverviewResponse'];

export const progressKeys = {
  all: ['progress'] as const,
  report: (period: ProgressPeriod) => [...progressKeys.all, period] as const,
  rewards: () => [...progressKeys.all, 'rewards'] as const,
};

export const getProgressReport = (
  period: ProgressPeriod,
  signal?: AbortSignal,
): Promise<ProgressReport> =>
  v2Client.request('get', '/api/v2/me/progress', { query: { period }, signal });

export const getRewards = (signal?: AbortSignal): Promise<RewardsOverview> =>
  v2Client.request('get', '/api/v2/me/rewards', { signal });

export const useProgressReport = (period: ProgressPeriod) =>
  useQuery({
    queryKey: progressKeys.report(period),
    queryFn: ({ signal }) => getProgressReport(period, signal),
  });

export const useRewards = () =>
  useQuery({
    queryKey: progressKeys.rewards(),
    queryFn: ({ signal }) => getRewards(signal),
  });
