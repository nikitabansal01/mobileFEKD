import type { components } from '@/src/core/api/v2.generated';

export type UUID = string;
export type AccountProfile = components['schemas']['ProfileResponse'];
export type AccountProfilePatch = components['schemas']['ProfilePatchRequest'];
export type AccountExportRequest = components['schemas']['AccountExportResponse'];
export type AccountDeletionRequest = components['schemas']['DeletionResponse'];

export type DurableRequestState =
  | { kind: 'idle' }
  | { kind: 'checking_recent_auth' }
  | { kind: 'submitting'; idempotencyKey: string }
  | {
      kind: 'requested';
      idempotencyKey: string;
      jobId: UUID;
      requestId: UUID;
    }
  | { kind: 'reauth_required' }
  | { kind: 'error'; idempotencyKey: string; message: string }
  | { kind: 'cleanup_failed'; message: string };
