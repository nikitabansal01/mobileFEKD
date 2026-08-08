import {
  deletionRequested,
  exportDeliveryUnavailableMessage,
  exportRequested,
  failedRequest,
  pendingRequest,
} from '../accountRequestState';

describe('durable account request presentation', () => {
  it('keeps durable job and request identifiers without claiming export delivery', () => {
    expect(
      exportRequested(
        {
          export_id: 'export-id',
          job_id: 'job-id',
          state: 'queued',
          expires_at: '2026-08-09T00:00:00Z',
        },
        'export-retry-key',
      ),
    ).toEqual({
      kind: 'requested',
      requestId: 'export-id',
      jobId: 'job-id',
      idempotencyKey: 'export-retry-key',
    });
    expect(exportDeliveryUnavailableMessage).toMatch(/not available/i);
    expect(exportDeliveryUnavailableMessage).not.toMatch(/download is ready/i);
  });

  it('retains retry keys and deletion acknowledgement state after transient errors', () => {
    expect(pendingRequest('retry-key')).toEqual({
      kind: 'submitting',
      idempotencyKey: 'retry-key',
    });
    expect(failedRequest('retry-key', 'Network unavailable')).toEqual({
      kind: 'error',
      idempotencyKey: 'retry-key',
      message: 'Network unavailable',
    });
    expect(
      deletionRequested(
        { deletion_request_id: 'deletion-id', job_id: 'job-id', state: 'queued' },
        'delete-retry-key',
      ),
    ).toEqual({
      kind: 'requested',
      requestId: 'deletion-id',
      jobId: 'job-id',
      idempotencyKey: 'delete-retry-key',
    });
  });
});
