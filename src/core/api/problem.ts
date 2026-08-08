import type { ApiProblem } from './contracts';

export class ApiProblemError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.detail || problem.title);
    this.name = 'ApiProblemError';
    this.problem = problem;
  }

  get status(): number {
    return this.problem.status;
  }

  get code(): string | undefined {
    return this.problem.code;
  }

  get correlationId(): string | undefined {
    return this.problem.request_id;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

export async function problemFromResponse(response: Response): Promise<ApiProblem> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const body = isRecord(payload) ? payload : {};
  const responseRequestId = response.headers.get('x-request-id') || undefined;

  return {
    type: optionalString(body.type) ?? 'about:blank',
    title: optionalString(body.title) ?? `Request failed (${response.status})`,
    status: typeof body.status === 'number' ? body.status : response.status,
    detail: optionalString(body.detail),
    instance: optionalString(body.instance),
    code: optionalString(body.code),
    request_id: optionalString(body.request_id) ?? responseRequestId,
    errors: isRecord(body.errors)
      ? Object.fromEntries(
          Object.entries(body.errors).flatMap(([key, value]) =>
            Array.isArray(value) && value.every((item) => typeof item === 'string')
              ? [[key, value as string[]]]
              : [],
          ),
        )
      : undefined,
  };
}

export const networkProblem = (timedOut: boolean): ApiProblem => ({
  type: 'https://auvra.com/problems/network',
  title: timedOut ? 'Request timed out' : 'Network request failed',
  status: 0,
  code: timedOut ? 'request_timeout' : 'network_error',
  detail: timedOut
    ? 'The server did not respond in time. Please try again.'
    : 'Check your internet connection and try again.',
});
