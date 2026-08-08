import authService from '@/services/authService';

import { clearAcceptedDeletionSession } from '../accountSession';

jest.mock('@/services/authService', () => ({
  __esModule: true,
  default: { logout: jest.fn() },
}));

describe('accepted deletion session cleanup', () => {
  it('delegates to the central logout boundary that clears query, secure, and UID-scoped state', async () => {
    await clearAcceptedDeletionSession();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
