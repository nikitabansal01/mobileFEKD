import { v2Client } from '@/src/core/api/runtimeClient';

import { getProgressReport, getRewards } from '../api';

jest.mock('@/src/core/api/runtimeClient', () => ({
  v2Client: { request: jest.fn() },
}));

const request = v2Client.request as jest.Mock;

describe('progress v2 adapter', () => {
  beforeEach(() => request.mockResolvedValue({}));

  it('requests the progress report with the selected period', async () => {
    await getProgressReport('month');

    expect(request).toHaveBeenCalledWith('get', '/api/v2/me/progress', {
      query: { period: 'month' },
      signal: undefined,
    });
  });

  it('reads the authenticated rewards overview', async () => {
    await getRewards();

    expect(request).toHaveBeenCalledWith('get', '/api/v2/me/rewards', {
      signal: undefined,
    });
  });
});
