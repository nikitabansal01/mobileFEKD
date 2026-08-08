import { useQuery } from '@tanstack/react-query';

import { v2Client } from '@/src/core/api/runtimeClient';
import type { JobDto, UUID } from '@/src/core/api/contracts';

import { jobPollingInterval } from './jobState';

export const jobKeys = {
  all: ['jobs'] as const,
  detail: (jobId: UUID) => [...jobKeys.all, jobId] as const,
};

export const getJob = (
  jobId: UUID,
  signal?: AbortSignal,
): Promise<JobDto> =>
  v2Client.request('get', '/api/v2/jobs/{job_id}', {
    path: { job_id: jobId },
    signal,
  });

export const useJob = (jobId: UUID | null) =>
  useQuery({
    queryKey: jobId ? jobKeys.detail(jobId) : [...jobKeys.all, 'none'],
    queryFn: ({ signal }) => getJob(jobId!, signal),
    enabled: Boolean(jobId),
    refetchInterval: (query) => jobPollingInterval(query.state.data),
  });
