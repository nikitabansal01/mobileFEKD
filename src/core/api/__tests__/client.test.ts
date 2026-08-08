import { ApiClient } from '../client';
import { ApiProblemError } from '../problem';

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe('ApiClient', () => {
  it('adds auth, request and idempotency headers to mutations', async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(jsonResponse({ id: 'job-1' }));
    const client = new ApiClient({
      baseUrl: 'https://api.auvra.test/api/v2',
      tokenProvider: async () => 'firebase-token',
      fetchImplementation,
      idempotencyKeyFactory: () => 'idem-generated',
      requestIdFactory: () => 'request-1',
    });

    await client.request('/plan-generations', {
      method: 'POST',
      body: { timezone: 'Asia/Kolkata' },
    });

    const [url, init] = fetchImplementation.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe('https://api.auvra.test/api/v2/plan-generations');
    expect(headers.get('Authorization')).toBe('Bearer firebase-token');
    expect(headers.get('Idempotency-Key')).toBe('idem-generated');
    expect(headers.get('X-Request-ID')).toBe('request-1');
    expect(init.body).toBe('{"timezone":"Asia/Kolkata"}');
  });

  it('preserves an explicit idempotency key across caller retries', async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new ApiClient({
      baseUrl: 'https://api.auvra.test/api/v2',
      tokenProvider: async () => 'token',
      fetchImplementation,
      idempotencyKeyFactory: () => 'must-not-be-used',
    });

    await client.request('/me/plans/p1/review', {
      method: 'PUT',
      body: {},
      idempotencyKey: 'review-operation-7',
    });

    const headers = fetchImplementation.mock.calls[0][1].headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('review-operation-7');
  });

  it('maps RFC 9457 responses to a typed ApiProblemError', async () => {
    const fetchImplementation = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          type: 'https://auvra.com/problems/revision-conflict',
          title: 'Plan revision conflict',
          status: 409,
          code: 'revision_conflict',
        },
        409,
        { 'x-request-id': 'request-7' },
      ),
    );
    const client = new ApiClient({
      baseUrl: 'https://api.auvra.test/api/v2',
      tokenProvider: async () => 'token',
      fetchImplementation,
    });

    await expect(client.request('/me/plans/p1')).rejects.toMatchObject({
      name: 'ApiProblemError',
      status: 409,
      code: 'revision_conflict',
      correlationId: 'request-7',
    } satisfies Partial<ApiProblemError>);
  });

  it('does not make an authenticated request without a Firebase token', async () => {
    const fetchImplementation = jest.fn();
    const client = new ApiClient({
      baseUrl: 'https://api.auvra.test/api/v2',
      tokenProvider: async () => null,
      fetchImplementation,
    });

    await expect(client.request('/me/profile')).rejects.toMatchObject({
      status: 401,
      code: 'authentication_required',
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('rejects absolute request URLs to prevent token exfiltration', async () => {
    const client = new ApiClient({
      baseUrl: 'https://api.auvra.test/api/v2',
      tokenProvider: async () => 'token',
      fetchImplementation: jest.fn(),
    });

    await expect(client.request('https://attacker.invalid/collect')).rejects.toThrow(
      'root-relative',
    );
  });
});
