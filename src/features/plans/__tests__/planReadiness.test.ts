import type { PlanDto } from "@/src/core/api/contracts";

import { isClosedPlanDate, localDateAt } from "../localDate";
import {
  planHasPermanentReadyImages,
  requiredPlanImages,
} from "../planReadiness";

const image = (id: string, status: "ready" | "pending" = "ready") => ({
  asset_id: id,
  public_url: `https://cdn.example/${id}.webp`,
  alt_text: id,
  mime_type: "image/webp",
  width: 100,
  height: 100,
  status,
});

const plan = (): PlanDto => ({
  plan_id: "plan-1",
  revision: 1,
  status: "ready",
  local_date: "2026-03-08",
  timezone: "America/Los_Angeles",
  cycle_snapshot: {},
  published_at: "2026-03-08T12:00:00Z",
  items: Array.from({ length: 4 }, (_, itemIndex) => ({
    item_id: `item-${itemIndex}`,
    slot: itemIndex,
    category: "meal",
    title: `Item ${itemIndex}`,
    purpose: "Purpose",
    instructions: {},
    hero_image: image(`hero-${itemIndex}`),
    variants: Array.from({ length: 3 }, (_, variantIndex) => ({
      variant_id: `variant-${itemIndex}-${variantIndex}`,
      variant_type: "alternative",
      content: {},
      image: image(`variant-${itemIndex}-${variantIndex}`),
    })),
  })),
});

describe("published plan readiness", () => {
  it("requires all sixteen permanent ready hero and variant assets before reveal", () => {
    const value = plan();
    expect(requiredPlanImages(value)).toHaveLength(16);
    expect(planHasPermanentReadyImages(value)).toBe(true);

    value.items[1].variants[2].image.status = "pending";
    expect(planHasPermanentReadyImages(value)).toBe(false);
  });

  it("uses the plan timezone across the DST date to keep current days closed", () => {
    const beforeMidnight = new Date("2026-03-09T06:59:00Z");
    const afterMidnight = new Date("2026-03-09T07:01:00Z");
    expect(localDateAt(beforeMidnight, "America/Los_Angeles")).toBe(
      "2026-03-08",
    );
    expect(
      isClosedPlanDate("2026-03-08", "America/Los_Angeles", beforeMidnight),
    ).toBe(false);
    expect(
      isClosedPlanDate("2026-03-08", "America/Los_Angeles", afterMidnight),
    ).toBe(true);
  });
});
