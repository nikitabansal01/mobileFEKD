import type {
  AccountDeletionRequest,
  AccountExportRequest,
  DurableRequestState,
} from './types';

export const pendingRequest = (idempotencyKey: string): DurableRequestState => ({
  kind: 'submitting',
  idempotencyKey,
});

export const exportRequested = (
  request: AccountExportRequest,
  idempotencyKey: string,
): DurableRequestState => ({
  kind: 'requested',
  idempotencyKey,
  jobId: request.job_id,
  requestId: request.export_id,
});

export const deletionRequested = (
  request: AccountDeletionRequest,
  idempotencyKey: string,
): DurableRequestState => ({
  kind: 'requested',
  idempotencyKey,
  jobId: request.job_id,
  requestId: request.deletion_request_id,
});

export const failedRequest = (
  idempotencyKey: string,
  message: string,
): DurableRequestState => ({
  kind: 'error',
  idempotencyKey,
  message,
});

/** The API has no export delivery/status resource, so mobile must not invent one. */
export const exportDeliveryUnavailableMessage =
  'Your export request is recorded and is being prepared. Download and export-status tracking are not available in this version of the app yet.';
