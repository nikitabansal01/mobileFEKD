import type {
  JobDto,
  PlanDto,
  ProgressSummaryResponse,
} from "@/src/core/api/contracts";
import { ApiProblemError } from "@/src/core/api/problem";

export type V2HomeState = "loading" | "generating" | "ready" | "error";

export interface HomeModel {
  state: V2HomeState;
  plan: PlanDto | null;
  progress: ProgressSummaryResponse | null;
  job: JobDto | null;
  recoveringJob: boolean;
  error: string | null;
  busyItemId: string | null;
  reviewVisible: boolean;
  reviewSubmitting: boolean;
  reviewError: string | null;
}

export const initialHomeModel: HomeModel = {
  state: "loading",
  plan: null,
  progress: null,
  job: null,
  recoveringJob: false,
  error: null,
  busyItemId: null,
  reviewVisible: false,
  reviewSubmitting: false,
  reviewError: null,
};

export const homeErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiProblemError) {
    return error.problem.detail ?? error.problem.title;
  }
  return error instanceof Error ? error.message : fallback;
};
