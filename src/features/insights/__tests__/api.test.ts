import { v2Client } from '@/src/core/api/runtimeClient';

import { getCycleState, getInsightsSummary, getSymptomPatterns } from '../api';

jest.mock('@/src/core/api/runtimeClient', () => ({
  v2Client: { request: jest.fn() },
}));

const request = v2Client.request as jest.Mock;

describe('insights v2 adapter', () => {
  beforeEach(() => request.mockResolvedValue({}));

  it('reads the insights summary', async () => {
    await getInsightsSummary();

    expect(request).toHaveBeenCalledWith('get', '/api/v2/me/insights/summary', {
      signal: undefined,
    });
  });

  it('reads symptom patterns', async () => {
    await getSymptomPatterns();

    expect(request).toHaveBeenCalledWith(
      'get',
      '/api/v2/me/insights/symptom-patterns',
      { signal: undefined },
    );
  });

  it('reads derived cycle state, never writing one', async () => {
    await getCycleState();

    expect(request).toHaveBeenCalledWith('get', '/api/v2/me/cycle', {
      signal: undefined,
    });
  });
});
