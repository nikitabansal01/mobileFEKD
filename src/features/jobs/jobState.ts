import type { JobDto, JobState } from '@/src/core/api/contracts';

const TERMINAL_JOB_STATES = new Set<JobState>([
  'ready',
  'failed',
  'cancelled',
  'dead_letter',
]);

export const isTerminalJobState = (state: JobState): boolean =>
  TERMINAL_JOB_STATES.has(state);

export const shouldPollJob = (job: Pick<JobDto, 'state'> | null | undefined): boolean =>
  Boolean(job && !isTerminalJobState(job.state));

export const jobPollingInterval = (
  job: Pick<JobDto, 'state'> | null | undefined,
): number | false => (shouldPollJob(job) ? 2_000 : false);

export interface WaitForJobOptions {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** Deterministic polling primitive shared by hooks and imperative adapters. */
export async function waitForTerminalJob(
  fetchJob: () => Promise<JobDto>,
  options: WaitForJobOptions = {},
): Promise<JobDto> {
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const startedAt = now();
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 2_000;

  while (true) {
    if (options.signal?.aborted) {
      const error = new Error('Job polling aborted.');
      error.name = 'AbortError';
      throw error;
    }

    const job = await fetchJob();
    if (isTerminalJobState(job.state)) return job;
    if (now() - startedAt >= timeoutMs) {
      throw new Error(`Job polling timed out after ${timeoutMs}ms.`);
    }
    await sleep(intervalMs);
  }
}
