import { v2Client } from '@/src/core/api/runtimeClient';

import {
  getMyProfile,
  patchMyProfile,
  requestMyDeletion,
  requestMyExport,
} from '../api';

jest.mock('@/src/core/api/runtimeClient', () => ({
  v2Client: { request: jest.fn() },
}));

const request = v2Client.request as jest.Mock;

describe('account v2 adapter', () => {
  beforeEach(() => request.mockResolvedValue({}));

  it('reads the authenticated profile without a client-supplied user identifier', async () => {
    await getMyProfile();

    expect(request).toHaveBeenCalledWith('get', '/api/v2/me/profile', {});
  });

  it('uses the canonical profile endpoint, revision precondition, and replay key', async () => {
    await patchMyProfile(
      { display_name: 'Auvra User', timezone: 'Asia/Kolkata', locale: 'en-IN' },
      4,
      'profile-retry-key',
    );

    expect(request).toHaveBeenCalledWith('patch', '/api/v2/me/profile', {
      body: {
        display_name: 'Auvra User',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
      },
      headers: { 'If-Match': '"4"' },
      idempotencyKey: 'profile-retry-key',
    });
  });

  it('keeps one caller-supplied replay key for export and deletion retries', async () => {
    await requestMyExport('export-retry-key');
    await requestMyExport('export-retry-key');
    await requestMyDeletion('deletion-retry-key');
    await requestMyDeletion('deletion-retry-key');

    expect(request).toHaveBeenNthCalledWith(1, 'post', '/api/v2/me/exports', {
      idempotencyKey: 'export-retry-key',
    });
    expect(request).toHaveBeenNthCalledWith(2, 'post', '/api/v2/me/exports', {
      idempotencyKey: 'export-retry-key',
    });
    expect(request).toHaveBeenNthCalledWith(3, 'delete', '/api/v2/me', {
      idempotencyKey: 'deletion-retry-key',
    });
    expect(request).toHaveBeenNthCalledWith(4, 'delete', '/api/v2/me', {
      idempotencyKey: 'deletion-retry-key',
    });
  });

  it('rejects an absent or stale revision before requesting a profile change', async () => {
    expect(() => patchMyProfile({ locale: 'en-IN' }, 0, 'profile-key')).toThrow(
      'current profile revision',
    );
    expect(request).not.toHaveBeenCalled();
  });
});
