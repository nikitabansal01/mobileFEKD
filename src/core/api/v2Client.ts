/** Compile-time checked v2 transport generated from the checked-in OpenAPI contract. */
import type { paths } from "./v2.generated";
import { ApiClient } from "./client";

type Method = "get" | "post" | "put" | "patch" | "delete";
type Operation<Path extends keyof paths, Verb extends Method> =
  Verb extends keyof paths[Path] ? NonNullable<paths[Path][Verb]> : never;

type PathsFor<Verb extends Method> = {
  [Path in keyof paths]: Operation<Path, Verb> extends never ? never : Path;
}[keyof paths];

type Parameters<OperationType> = OperationType extends {
  parameters: infer OperationParameters;
}
  ? OperationParameters
  : never;

type ParameterGroup<OperationType, Group extends PropertyKey> =
  Parameters<OperationType> extends infer OperationParameters
    ? Group extends keyof OperationParameters
      ? NonNullable<OperationParameters[Group]>
      : never
    : never;

type PathParameters<OperationType> = ParameterGroup<OperationType, "path">;
type QueryParameters<OperationType> = ParameterGroup<OperationType, "query">;
type HeaderParameters<OperationType> = ParameterGroup<OperationType, "header">;

type RequestBody<OperationType> = OperationType extends {
  requestBody: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

type JsonContent<ResponseType> = ResponseType extends {
  content: { "application/json": infer Body };
}
  ? Body
  : ResponseType extends { content: never }
    ? undefined
    : unknown;

type SuccessBody<OperationType> = OperationType extends {
  responses: infer Responses;
}
  ? {
      [Status in keyof Responses]: Status extends 200 | 201 | 202 | 204
        ? JsonContent<Responses[Status]>
        : never;
    }[keyof Responses]
  : never;

type RequiredKeys<Value> = Value extends object
  ? {
      [Key in keyof Value]-?: object extends Pick<Value, Key> ? never : Key;
    }[keyof Value]
  : never;

type WithoutIdempotencyHeader<Value> = Value extends object
  ? Omit<Value, "Idempotency-Key">
  : never;

type HasIdempotencyHeader<OperationType> =
  [HeaderParameters<OperationType>] extends [never]
    ? false
    : "Idempotency-Key" extends keyof HeaderParameters<OperationType>
      ? true
      : false;

type PathOptions<OperationType> = [PathParameters<OperationType>] extends [never]
  ? { path?: never }
  : { path: PathParameters<OperationType> };

type QueryOptions<OperationType> = [QueryParameters<OperationType>] extends [never]
  ? { query?: never }
  : RequiredKeys<QueryParameters<OperationType>> extends never
    ? { query?: QueryParameters<OperationType> }
    : { query: QueryParameters<OperationType> };

type HeaderOptions<OperationType> = [
  WithoutIdempotencyHeader<HeaderParameters<OperationType>>,
] extends [never]
  ? { headers?: never }
  : RequiredKeys<
        WithoutIdempotencyHeader<HeaderParameters<OperationType>>
      > extends never
    ? {
        headers?: WithoutIdempotencyHeader<HeaderParameters<OperationType>>;
      }
    : {
        headers: WithoutIdempotencyHeader<HeaderParameters<OperationType>>;
      };

type BodyOptions<OperationType> = [RequestBody<OperationType>] extends [never]
  ? { body?: never }
  : { body: RequestBody<OperationType> };

type IdempotencyOptions<OperationType> =
  HasIdempotencyHeader<OperationType> extends true
    ? { idempotencyKey: string }
    : { idempotencyKey?: never };

export type V2RequestOptions<OperationType> = PathOptions<OperationType> &
  QueryOptions<OperationType> &
  HeaderOptions<OperationType> &
  BodyOptions<OperationType> &
  IdempotencyOptions<OperationType> & {
    authenticated?: boolean;
    signal?: AbortSignal;
    timeoutMs?: number;
  };

type QueryValue = string | number | boolean | null | undefined;

const renderPath = (
  template: string,
  parameters?: Record<string, unknown>,
): string =>
  template.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = parameters?.[name];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing OpenAPI path parameter: ${name}`);
    }
    return encodeURIComponent(String(value));
  });

const appendQuery = (
  resourcePath: string,
  query?: Record<string, QueryValue | QueryValue[]>,
): string => {
  if (!query) return resourcePath;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([name, rawValue]) => {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (value !== undefined && value !== null) search.append(name, String(value));
    });
  });
  const encoded = search.toString();
  return encoded ? `${resourcePath}?${encoded}` : resourcePath;
};

const requestMethod = (method: Method): "GET" | "POST" | "PUT" | "PATCH" | "DELETE" =>
  method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const transportHeaders = (
  headers?: Record<string, unknown>,
): Record<string, string> | undefined => {
  if (!headers) return undefined;
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => [name, String(value)]),
  );
};

export class V2Client {
  constructor(private readonly api: ApiClient) {}

  request<Verb extends Method, Path extends PathsFor<Verb>>(
    method: Verb,
    template: Path,
    options: V2RequestOptions<Operation<Path, Verb>>,
  ): Promise<SuccessBody<Operation<Path, Verb>>> {
    const operationOptions = options as V2RequestOptions<Operation<Path, Verb>> & {
      path?: Record<string, unknown>;
      query?: Record<string, QueryValue | QueryValue[]>;
      headers?: Record<string, unknown>;
      body?: unknown;
    };
    const absolutePath = appendQuery(
      renderPath(String(template), operationOptions.path),
      operationOptions.query,
    );
    if (!absolutePath.startsWith("/api/v2/")) {
      throw new Error("Generated v2 paths must begin with /api/v2/.");
    }

    return this.api.request<SuccessBody<Operation<Path, Verb>>, unknown>(
      absolutePath.slice("/api/v2".length),
      {
        method: requestMethod(method),
        body: operationOptions.body,
        authenticated: operationOptions.authenticated,
        headers: transportHeaders(operationOptions.headers),
        idempotencyKey: operationOptions.idempotencyKey,
        signal: operationOptions.signal,
        timeoutMs: operationOptions.timeoutMs,
      },
    );
  }
}

export type OnboardingAssessmentOperation = Operation<
  "/api/v2/onboarding/sessions/{session_id}/assessment",
  "put"
>;
export type CurrentPlanOperation = Operation<
  "/api/v2/me/plans/today",
  "get"
>;
export type ConversationMessageOperation = Operation<
  "/api/v2/me/conversations/{conversation_id}/messages",
  "post"
>;
export type WeeklyCheckinAnswerOperation = Operation<
  "/api/v2/me/weekly-checkins/{checkin_id}/responses/{question_id}",
  "put"
>;
export type AccountDeletionOperation = Operation<"/api/v2/me", "delete">;
