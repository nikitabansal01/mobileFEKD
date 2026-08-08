import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import {
  getLatestPlanGeneration,
  getProgressSummary,
  getTodayPlan,
} from "@/src/features/plans/api";
import { ApiProblemError } from "@/src/core/api/problem";
import { isClosedPlanDate } from "@/src/features/plans/localDate";
import { prefetchPublishedPlan } from "@/src/features/plans/planReadiness";

import { createOperationKeyStore } from "./operationKeys";
import { usePlanEngagement } from "./usePlanEngagement";
import { usePlanGeneration } from "./usePlanGeneration";
import {
  homeErrorMessage,
  initialHomeModel,
  type HomeModel,
} from "./v2HomeModel";

/** Retained Home flow backed solely by canonical v2 plan and engagement facts. */
export function useV2HomeController() {
  const [model, setModel] = useState(initialHomeModel);
  const active = useRef(true);
  const keys = useRef(createOperationKeyStore()).current;

  const load = useCallback(async (allowJobRecovery = true) => {
    setModel((current) => ({ ...current, state: "loading", error: null }));
    try {
      const [plan, progress] = await Promise.all([
        getTodayPlan(),
        getProgressSummary().catch(() => null),
      ]);
      await prefetchPublishedPlan(plan);
      if (active.current)
        setModel((current) => ({ ...current, state: "ready", plan, progress }));
    } catch (error) {
      if (allowJobRecovery && isPlanAbsent(error)) {
        await recoverMissingPlan(setModel, active);
        return;
      }
      if (active.current)
        setModel((current) => ({
          ...current,
          state: "error",
          plan: null,
          error: homeErrorMessage(error, "Unable to load your plan."),
        }));
    }
  }, []);

  const generation = usePlanGeneration({ active, keys, load, setModel });
  const engagement = usePlanEngagement({ keys, load, model, setModel });
  const openReview = useCallback(() => {
    if (!model.plan) return;
    if (!isClosedPlanDate(model.plan.local_date, model.plan.timezone)) {
      setModel((current) => ({
        ...current,
        reviewError: "Daily review is available after this plan date closes.",
      }));
      return;
    }
    setModel((current) => ({
      ...current,
      reviewVisible: true,
      reviewError: null,
    }));
  }, [model.plan]);

  const imageFailure = useCallback(() => {
    setModel((current) => ({
      ...current,
      state: "error",
      plan: null,
      error: "A plan image failed to load. Retry to prepare the full plan.",
    }));
  }, []);

  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!model.recoveringJob || !model.job) return;
    void generation.recover(model.job);
  }, [generation, model.job, model.recoveringJob]);

  return {
    ...model,
    load,
    generate: generation.generate,
    imageFailure,
    ...engagement,
    openReview,
    closeReview: () =>
      setModel((current) => ({
        ...current,
        reviewVisible: false,
        reviewError: null,
      })),
  };
}

const isPlanAbsent = (error: unknown) =>
  error instanceof ApiProblemError && error.problem.status === 404;

async function recoverMissingPlan(
  setModel: Dispatch<SetStateAction<HomeModel>>,
  active: MutableRefObject<boolean>,
) {
  try {
    const job = await getLatestPlanGeneration();
    if (!active.current) return;
    setModel((current) => ({
      ...current,
      job,
      recoveringJob: true,
      state: "generating",
      error: null,
    }));
  } catch (error) {
    if (!active.current) return;
    setModel((current) => ({
      ...current,
      state: "error",
      plan: null,
      error: homeErrorMessage(
        error,
        "No plan generation is available to recover.",
      ),
    }));
  }
}
