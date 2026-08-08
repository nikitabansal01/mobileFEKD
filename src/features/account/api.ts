import { v2Client } from '@/src/core/api/runtimeClient';

import type {
  AccountDeletionRequest,
  AccountExportRequest,
  AccountProfile,
  AccountProfilePatch,
} from './types';

const profileRevisionHeaders = (version: number): Record<string, string> => {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('A current profile revision is required before saving.');
  }
  return { 'If-Match': `"${version}"` };
};

export const getMyProfile = (signal?: AbortSignal): Promise<AccountProfile> =>
  v2Client.request('get', '/api/v2/me/profile', { signal });

export const patchMyProfile = (
  patch: AccountProfilePatch,
  version: number,
  idempotencyKey: string,
): Promise<AccountProfile> =>
  v2Client.request('patch', '/api/v2/me/profile', {
    body: patch,
    headers: profileRevisionHeaders(version),
    idempotencyKey,
  });

export const requestMyExport = (
  idempotencyKey: string,
): Promise<AccountExportRequest> =>
  v2Client.request('post', '/api/v2/me/exports', {
    idempotencyKey,
  });

export const requestMyDeletion = (
  idempotencyKey: string,
): Promise<AccountDeletionRequest> =>
  v2Client.request('delete', '/api/v2/me', {
    idempotencyKey,
  });
