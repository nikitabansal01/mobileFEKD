import { v2Client } from '@/src/core/api/runtimeClient';

import {
  getCurrentObservations,
  getObservationCatalog,
  recordObservation,
} from '../api';

jest.mock('@/src/core/api/runtimeClient', () => ({
  v2Client: { request: jest.fn() },
}));

const request = v2Client.request as jest.Mock;

describe('personalize v2 adapter', () => {
  beforeEach(() => request.mockResolvedValue({}));

  it('reads the observation catalog unauthenticated', async () => {
    await getObservationCatalog();

    expect(request).toHaveBeenCalledWith('get', '/api/v2/observation-catalog', {
      authenticated: false,
      signal: undefined,
    });
  });

  it('reads current observations scoped to one observation type', async () => {
    await getCurrentObservations('preference');

    expect(request).toHaveBeenCalledWith(
      'get',
      '/api/v2/me/observations/current',
      { query: { observation_type: 'preference' }, signal: undefined },
    );
  });

  it('writes an observation with an idempotency key and no direct value', async () => {
    await recordObservation(
      {
        client_observation_id: 'client-1',
        observation_type: 'preference',
        code: 'diet_preference',
        observed_at: '2026-08-08T00:00:00Z',
        value: { codes: ['vegan'] },
      },
      'write-1',
    );

    expect(request).toHaveBeenCalledWith('post', '/api/v2/me/observations', {
      body: {
        client_observation_id: 'client-1',
        observation_type: 'preference',
        code: 'diet_preference',
        observed_at: '2026-08-08T00:00:00Z',
        value: { codes: ['vegan'] },
      },
      idempotencyKey: 'write-1',
    });
  });
});
