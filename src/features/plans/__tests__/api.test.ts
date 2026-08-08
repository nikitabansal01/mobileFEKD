import { apiClient } from "@/src/core/api/runtimeClient";
import { transportCall } from "@/src/test/transportSpy";

import {
  getLatestPlanGeneration,
  recordActionEvent,
  replaceWithSelectedVariant,
  submitDailyReview,
} from "../api";

jest.mock("@/src/core/api/runtimeClient", () =>
  jest.requireActual("@/src/test/transportSpy").runtimeClientMock(),
);

const request = apiClient.request as unknown as jest.Mock;

describe("canonical plan mutations", () => {
  beforeEach(() => request.mockResolvedValue({}));

  it("sends action events with an explicit revision and replay key", async () => {
    await recordActionEvent(
      "plan 1",
      "item 1",
      4,
      {
        client_event_id: "event-1",
        event_type: "completed",
        occurred_at: "2026-08-08T00:00:00Z",
      },
      "replay-1",
    );

    expect(transportCall(request, 0)).toEqual([
      "/me/plans/plan%201/items/item%201/events",
      {
        method: "POST",
        body: expect.objectContaining({ client_event_id: "event-1" }),
        headers: { "If-Match": '"4"' },
        idempotencyKey: "replay-1",
      },
    ]);
  });

  it("uses canonical replacement and closed-day review endpoints", async () => {
    await replaceWithSelectedVariant(
      "plan-1",
      5,
      {
        item_id: "item-1",
        selected_variant_id: "variant-1",
        reason: "not_a_fit",
      },
      "replace-1",
    );
    await submitDailyReview(
      "plan-1",
      6,
      {
        items: [{ plan_item_id: "item-1", outcome: "completed" }],
      },
      "review-1",
    );

    expect(transportCall(request, 0)).toEqual([
      "/me/plans/plan-1/replacements",
      {
        method: "POST",
        body: expect.objectContaining({ selected_variant_id: "variant-1" }),
        headers: { "If-Match": '"5"' },
        idempotencyKey: "replace-1",
      },
    ]);
    expect(transportCall(request, 1)).toEqual([
      "/me/plans/plan-1/daily-review",
      {
        method: "PUT",
        body: expect.any(Object),
        headers: { "If-Match": '"6"' },
        idempotencyKey: "review-1",
      },
    ]);
  });

  it("reads a cold-start recovery job without an idempotency key", async () => {
    await getLatestPlanGeneration("2026-08-08");

    expect(transportCall(request, 0)).toEqual([
      "/me/plan-generations/latest?local_date=2026-08-08",
      { method: "GET" },
    ]);
  });
});
