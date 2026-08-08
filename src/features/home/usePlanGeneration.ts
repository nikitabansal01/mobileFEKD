import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type { JobDto } from "@/src/core/api/contracts";
import { createPlanGeneration } from "@/src/features/plans/api";
import { getJob } from "@/src/features/jobs/api";
import { isTerminalJobState } from "@/src/features/jobs/jobState";

import type { HomeModel } from "./v2HomeModel";
import { homeErrorMessage } from "./v2HomeModel";
import type { OperationKeyStore } from "./operationKeys";

interface GenerationOptions {
  active: MutableRefObject<boolean>;
  keys: OperationKeyStore;
  load: (allowJobRecovery?: boolean) => Promise<void>;
  setModel: Dispatch<SetStateAction<HomeModel>>;
}

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 2_000));

export function usePlanGeneration({
  active,
  keys,
  load,
  setModel,
}: GenerationOptions) {
  const poll = useCallback(
    async (jobId: string) => {
      while (active.current) {
        const job = await getJob(jobId);
        if (!active.current) return;
        setModel((current) => updateFromJob(current, job));
        if (isTerminalJobState(job.state)) {
          if (job.state === "ready") await load();
          else setGenerationError(setModel, job.state);
          return;
        }
        await wait();
      }
    },
    [active, load, setModel],
  );

  const generate = useCallback(async () => {
    setModel((current) => ({ ...current, state: "generating", error: null }));
    try {
      const job = await createPlanGeneration({}, keys.get("plan-generation"));
      if (active.current)
        setModel((current) => ({ ...current, job, state: "generating" }));
      await poll(job.job_id);
    } catch (error) {
      if (active.current) {
        setModel((current) => ({
          ...current,
          state: "error",
          error: homeErrorMessage(error, "Unable to start plan generation."),
        }));
      }
    }
  }, [active, keys, poll, setModel]);

  const recover = useCallback(
    async (job: JobDto) => {
      setModel((current) => ({ ...current, recoveringJob: false }));
      if (job.state === "ready") {
        await load(false);
        return;
      }
      if (isTerminalJobState(job.state)) {
        setGenerationError(setModel, job.state);
        return;
      }
      await poll(job.job_id);
    },
    [load, poll, setModel],
  );

  return { generate, recover };
}

function updateFromJob(current: HomeModel, job: JobDto): HomeModel {
  return {
    ...current,
    job,
    state: isTerminalJobState(job.state) ? current.state : "generating",
  };
}

function setGenerationError(
  setModel: Dispatch<SetStateAction<HomeModel>>,
  state: JobDto["state"],
) {
  setModel((current) => ({
    ...current,
    state: "error",
    error: `Plan generation ${state.replace("_", " ")}. Retry when ready.`,
  }));
}
