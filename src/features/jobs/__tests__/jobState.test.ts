import type { JobDto, JobState } from '@/src/core/api/contracts';

import {
  isTerminalJobState,
  jobPollingInterval,
  waitForTerminalJob,
} from '../jobState';

const job = (state: JobState): JobDto => ({
  job_id: 'job-1',
  job_type: 'plan_generation',
  state,
  progress: 0,
  phase: null,
  local_date: '2026-08-01',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
});

describe('job state', () => {
  it.each(['ready', 'failed', 'cancelled', 'dead_letter'] as const)(
    'treats %s as terminal',
    (state) => expect(isTerminalJobState(state)).toBe(true),
  );

  it('polls queued/running jobs and stops at a terminal state', () => {
    expect(jobPollingInterval(job('queued'))).toBe(2_000);
    expect(jobPollingInterval(job('running'))).toBe(2_000);
    expect(jobPollingInterval(job('ready'))).toBe(false);
  });

  it('waits through durable states until the job is ready', async () => {
    const states: JobState[] = ['queued', 'running', 'retry_wait', 'ready'];
    const fetchJob = jest.fn(async () => job(states.shift()!));
    const sleep = jest.fn(async () => undefined);

    await expect(waitForTerminalJob(fetchJob, { sleep })).resolves.toMatchObject({
      state: 'ready',
    });
    expect(fetchJob).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledTimes(3);
  });

  it('times out instead of polling forever', async () => {
    let now = 0;
    await expect(
      waitForTerminalJob(async () => job('running'), {
        timeoutMs: 5,
        now: () => (now += 5),
        sleep: async () => undefined,
      }),
    ).rejects.toThrow('timed out');
  });
});
