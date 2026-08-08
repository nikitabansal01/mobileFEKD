import type { PlanDto, PlanImageDto } from "@/src/core/api/contracts";

import { prefetchPlanImageUrls } from "./components/PlanImage";

const isPermanentReadyImage = (image: PlanImageDto): boolean =>
  image.status === "ready" && /^https:\/\//i.test(image.public_url);

/** Every hero and variant is part of the published-plan reveal contract. */
export const requiredPlanImages = (plan: PlanDto): PlanImageDto[] =>
  plan.items.flatMap((item) => [
    item.hero_image,
    ...item.variants.map((variant) => variant.image),
  ]);

export const planHasPermanentReadyImages = (plan: PlanDto): boolean => {
  const images = requiredPlanImages(plan);
  return images.length === 16 && images.every(isPermanentReadyImage);
};

export async function prefetchPublishedPlan(plan: PlanDto): Promise<void> {
  if (!planHasPermanentReadyImages(plan)) {
    throw new Error("This plan is missing a permanent ready image.");
  }
  const urls = requiredPlanImages(plan).map((image) => image.public_url);
  await prefetchPlanImageUrls(urls);
}
