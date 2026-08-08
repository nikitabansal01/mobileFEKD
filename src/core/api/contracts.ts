import type { components } from "./v2.generated";

export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

/** RFC 9457 problem details returned by every v2 API error. */
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  request_id?: string;
  errors?: Record<string, string[]>;
}

export type JobState = components["schemas"]["JobResponse"]["state"];

/** Generated from app.v2.application.contracts.JobResponse. */
export type JobDto = components["schemas"]["JobResponse"];

/** Media is server-validated HTTPS before a plan is published. */
export type PlanImageDto = components["schemas"]["MediaAssetResponse"];
export type PlanItemVariantDto = components["schemas"]["PlanVariantResponse"];
export type PlanItemDto = components["schemas"]["PlanItemResponse"];

export type PlanState = components["schemas"]["CurrentPlanResponse"]["status"];
export type PlanDto = components["schemas"]["CurrentPlanResponse"];
export type ActionEventRequest = components["schemas"]["ActionEventRequest"];
export type ActionEventResponse = components["schemas"]["ActionEventResponse"];
export type DailyReviewItemInput = components["schemas"]["DailyReviewItemInput"];
export type DailyReviewRequest = components["schemas"]["DailyReviewRequest"];
export type DailyReviewResponse = components["schemas"]["DailyReviewResponse"];
export type PlanReplacementRequest = components["schemas"]["PlanReplacementRequest"];
export type PlanReplacementResponse = components["schemas"]["PlanReplacementResponse"];
export type ProgressSummaryResponse = components["schemas"]["ProgressSummaryResponse"];
export type CreatePlanGenerationRequest = components["schemas"]["PlanGenerationRequest"];
export type CreatePlanGenerationResponse = components["schemas"]["JobResponse"];
