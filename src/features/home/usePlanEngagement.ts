import { useCallback, type Dispatch, type SetStateAction } from "react";

import type {
  DailyReviewItemInput,
  PlanItemDto,
  PlanItemVariantDto,
} from "@/src/core/api/contracts";
import {
  recordActionEvent,
  replaceWithSelectedVariant,
  submitDailyReview,
} from "@/src/features/plans/api";

import type { HomeModel } from "./v2HomeModel";
import { homeErrorMessage } from "./v2HomeModel";
import type { OperationKeyStore } from "./operationKeys";

interface EngagementOptions {
  keys: OperationKeyStore;
  load: () => Promise<void>;
  model: HomeModel;
  setModel: Dispatch<SetStateAction<HomeModel>>;
}

export function usePlanEngagement({
  keys,
  load,
  model,
  setModel,
}: EngagementOptions) {
  const event = useCallback(
    (item: PlanItemDto, eventType: "completed" | "skipped") => {
      const plan = model.plan;
      if (!plan || model.busyItemId) return;
      const operation = `event:${plan.plan_id}:${item.item_id}:${eventType}`;
      void runItemOperation(
        setModel,
        item.item_id,
        async () => {
          await recordActionEvent(
            plan.plan_id,
            item.item_id,
            plan.revision,
            {
              client_event_id: keys.get(`${operation}:client`),
              event_type: eventType,
              occurred_at: new Date().toISOString(),
              payload: {},
            },
            keys.get(operation),
          );
          await load();
        },
        "Action could not be saved.",
      );
    },
    [keys, load, model.busyItemId, model.plan, setModel],
  );

  const replace = useCallback(
    (item: PlanItemDto, variant: PlanItemVariantDto) => {
      const plan = model.plan;
      if (!plan || model.busyItemId) return;
      const operation = `replace:${plan.plan_id}:${item.item_id}:${variant.variant_id}`;
      void runItemOperation(
        setModel,
        item.item_id,
        async () => {
          await replaceWithSelectedVariant(
            plan.plan_id,
            plan.revision,
            {
              item_id: item.item_id,
              selected_variant_id: variant.variant_id,
              reason: "not_a_fit",
            },
            keys.get(operation),
          );
          await load();
        },
        "Replacement could not be saved.",
      );
    },
    [keys, load, model.busyItemId, model.plan, setModel],
  );

  const review = useCallback(
    async (items: DailyReviewItemInput[]) => {
      const plan = model.plan;
      if (!plan || model.reviewSubmitting) return;
      const operation = `review:${plan.plan_id}:${plan.revision}`;
      setModel((current) => ({
        ...current,
        reviewSubmitting: true,
        reviewError: null,
      }));
      try {
        await submitDailyReview(
          plan.plan_id,
          plan.revision,
          { items },
          keys.get(operation),
        );
        keys.clear(operation);
        await load();
        setModel((current) => ({ ...current, reviewVisible: false }));
      } catch (error) {
        setModel((current) => ({
          ...current,
          reviewError: homeErrorMessage(error, "Review could not be saved."),
        }));
      } finally {
        setModel((current) => ({ ...current, reviewSubmitting: false }));
      }
    },
    [keys, load, model.plan, model.reviewSubmitting, setModel],
  );

  return { event, replace, review };
}

async function runItemOperation(
  setModel: Dispatch<SetStateAction<HomeModel>>,
  itemId: string,
  operation: () => Promise<void>,
  fallback: string,
) {
  setModel((current) => ({ ...current, busyItemId: itemId }));
  try {
    await operation();
  } catch (error) {
    setModel((current) => ({
      ...current,
      error: homeErrorMessage(error, fallback),
    }));
  } finally {
    setModel((current) => ({ ...current, busyItemId: null }));
  }
}
