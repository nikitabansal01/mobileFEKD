import type { ApiRequestOptions } from "@/src/core/api/client";

/**
 * Feature adapters call the typed {@link V2Client}, which renders OpenAPI path
 * templates and forwards one transport call to {@link ApiClient}. Tests assert
 * that final transport call, so path templating, query encoding, revision
 * headers and idempotency keys stay covered end to end.
 */
export interface TransportSpy {
  request: jest.Mock;
}

/** The transport call a feature adapter produced, without unset options. */
export type TransportCall = [string, Partial<ApiRequestOptions>];

/**
 * Build the `@/src/core/api/runtimeClient` module replacement: a mocked
 * transport wrapped by the real typed client.
 */
export function runtimeClientMock(): {
  apiClient: TransportSpy;
  v2Client: unknown;
} {
  const { V2Client } = jest.requireActual("@/src/core/api/v2Client");
  const apiClient: TransportSpy = { request: jest.fn() };
  return { apiClient, v2Client: new V2Client(apiClient) };
}

/**
 * Read one recorded transport call. Options the adapter left unset are dropped
 * so expectations describe intent instead of the client's fixed option shape.
 */
export function transportCall(
  request: jest.Mock,
  index: number,
): TransportCall {
  const call = request.mock.calls[index];
  if (!call) {
    throw new Error(
      `Expected a transport call at index ${index}; saw ${request.mock.calls.length}.`,
    );
  }
  const [path, options = {}] = call as [string, Record<string, unknown>];
  const setOptions = Object.entries(options).filter(
    ([, value]) => value !== undefined,
  );
  return [path, Object.fromEntries(setOptions) as Partial<ApiRequestOptions>];
}
