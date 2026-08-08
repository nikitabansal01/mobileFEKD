import { randomUUID } from 'expo-crypto';

import type { ApiProblem } from './contracts';
import { getApiBaseUrl } from './config';
import { ApiProblemError, networkProblem, problemFromResponse } from './problem';

export type AccessTokenProvider = () => Promise<string | null>;
export type IdempotencyKeyFactory = () => string;

export interface ApiClientOptions {
  baseUrl?: string;
  tokenProvider?: AccessTokenProvider;
  fetchImplementation?: typeof fetch;
  idempotencyKeyFactory?: IdempotencyKeyFactory;
  requestIdFactory?: () => string;
  defaultTimeoutMs?: number;
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  authenticated?: boolean;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Create once per user operation and reuse for every retry of that operation. */
export const createIdempotencyKey: IdempotencyKeyFactory = randomUUID;

const normalizedResourcePath = (path: string): string => {
  if (!path.startsWith('/') || path.startsWith('//') || /^https?:/i.test(path)) {
    throw new Error('API request paths must be root-relative and cannot be absolute URLs.');
  }
  return path;
};

const abortError = (): Error => {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenProvider?: AccessTokenProvider;
  private readonly fetchImplementation: typeof fetch;
  private readonly idempotencyKeyFactory: IdempotencyKeyFactory;
  private readonly requestIdFactory: () => string;
  private readonly defaultTimeoutMs: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? getApiBaseUrl()).replace(/\/+$/, '');
    this.tokenProvider = options.tokenProvider;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.idempotencyKeyFactory = options.idempotencyKeyFactory ?? createIdempotencyKey;
    this.requestIdFactory = options.requestIdFactory ?? randomUUID;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 20_000;
  }

  async request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const resourcePath = normalizedResourcePath(path);
    const method = options.method ?? 'GET';
    const authenticated = options.authenticated ?? true;
    const headers = new Headers(options.headers);
    const controller = new AbortController();
    let timedOut = false;

    headers.set('Accept', 'application/json');
    headers.set('X-Request-ID', this.requestIdFactory());

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (MUTATING_METHODS.has(method)) {
      headers.set('Idempotency-Key', options.idempotencyKey ?? this.idempotencyKeyFactory());
    }

    if (authenticated) {
      const token = await this.tokenProvider?.();
      if (!token) {
        throw new ApiProblemError({
          type: 'https://auvra.com/problems/authentication-required',
          title: 'Authentication required',
          status: 401,
          code: 'authentication_required',
        });
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const onExternalAbort = () => controller.abort();
    if (options.signal?.aborted) {
      throw abortError();
    }
    options.signal?.addEventListener('abort', onExternalAbort, { once: true });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeoutMs ?? this.defaultTimeoutMs);

    try {
      const response = await this.fetchImplementation(
        `${this.baseUrl}${resourcePath}`,
        {
          method,
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new ApiProblemError(await problemFromResponse(response));
      }
      if (response.status === 204) {
        return undefined as TResponse;
      }
      return (await response.json()) as TResponse;
    } catch (error) {
      if (error instanceof ApiProblemError) {
        throw error;
      }
      if (options.signal?.aborted && !timedOut) {
        throw abortError();
      }
      throw new ApiProblemError(networkProblem(timedOut));
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const isRetryableApiProblem = (problem: ApiProblem): boolean =>
  problem.status === 0 || problem.status === 408 || problem.status === 429 || problem.status >= 500;
