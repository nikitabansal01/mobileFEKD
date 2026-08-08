import { useMutation, useQuery } from "@tanstack/react-query";

import { createIdempotencyKey } from "@/src/core/api/client";
import { v2Client } from "@/src/core/api/runtimeClient";
import type {
  ActionEventRequest,
  ActionEventResponse,
  CreatePlanGenerationRequest,
  CreatePlanGenerationResponse,
  DailyReviewRequest,
  DailyReviewResponse,
  PlanDto,
  PlanReplacementRequest,
  PlanReplacementResponse,
  ProgressSummaryResponse,
  UUID,
} from "@/src/core/api/contracts";
import { queryClient } from "@/src/core/query/queryClient";

export const planKeys = {
  all: ["plans"] as const,
  today: () => [...planKeys.all, "today"] as const,
  detail: (planId: UUID) => [...planKeys.all, planId] as const,
};

export const getTodayPlan = (signal?: AbortSignal): Promise<PlanDto> =>
  v2Client.request("get", "/api/v2/me/plans/today", { signal });

/** Durable cold-start recovery read; this never starts a generation operation. */
export const getLatestPlanGeneration = (
  localDate?: string,
  signal?: AbortSignal,
): Promise<CreatePlanGenerationResponse> =>
  v2Client.request("get", "/api/v2/me/plan-generations/latest", {
    query: localDate ? { local_date: localDate } : undefined,
    signal,
  });

export const getPlan = (planId: UUID, signal?: AbortSignal): Promise<PlanDto> =>
  // v2 currently exposes the current plan only. Keep this adapter deliberately
  // unavailable instead of falling back to an unaudited v1 route.
  Promise.reject(
    new Error(`Plan detail ${planId} is not available in API v2 yet.`),
  );

const planRevisionHeaders = (revision: number): Record<string, string> => ({
  "If-Match": `"${revision}"`,
});

export const recordActionEvent = (
  planId: UUID,
  itemId: UUID,
  revision: number,
  request: ActionEventRequest,
  idempotencyKey: string,
): Promise<ActionEventResponse> =>
  v2Client.request(
    "post",
    "/api/v2/me/plans/{plan_id}/items/{item_id}/events",
    {
      path: { plan_id: planId, item_id: itemId },
      body: request,
      headers: planRevisionHeaders(revision),
      idempotencyKey,
    },
  );

export const submitDailyReview = (
  planId: UUID,
  revision: number,
  request: DailyReviewRequest,
  idempotencyKey: string,
): Promise<DailyReviewResponse> =>
  v2Client.request("put", "/api/v2/me/plans/{plan_id}/daily-review", {
    path: { plan_id: planId },
    body: request,
    headers: planRevisionHeaders(revision),
    idempotencyKey,
  });

export const replaceWithSelectedVariant = (
  planId: UUID,
  revision: number,
  request: PlanReplacementRequest,
  idempotencyKey: string,
): Promise<PlanReplacementResponse> =>
  v2Client.request("post", "/api/v2/me/plans/{plan_id}/replacements", {
    path: { plan_id: planId },
    body: request,
    headers: planRevisionHeaders(revision),
    idempotencyKey,
  });

export const getProgressSummary = (
  signal?: AbortSignal,
): Promise<ProgressSummaryResponse> =>
  v2Client.request("get", "/api/v2/me/progress/summary", {
    signal,
  });

export const createPlanGeneration = (
  request: CreatePlanGenerationRequest,
  idempotencyKey: string,
): Promise<CreatePlanGenerationResponse> =>
  v2Client.request("post", "/api/v2/plan-generations", {
    body: request,
    idempotencyKey,
  });

export const useTodayPlan = () =>
  useQuery({
    queryKey: planKeys.today(),
    queryFn: ({ signal }) => getTodayPlan(signal),
  });

export const useCreatePlanGeneration = () =>
  useMutation({
    mutationFn: (request: CreatePlanGenerationRequest) =>
      createPlanGeneration(request, createIdempotencyKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
