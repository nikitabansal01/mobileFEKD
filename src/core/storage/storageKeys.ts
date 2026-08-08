export const SECURE_DRAFT_KEYS = {
  onboardingAnswers: 'auvra.draft.onboarding.answers.v1',
  onboardingName: 'auvra.draft.onboarding.name.v1',
  onboardingLifestyleFocus: 'auvra.draft.onboarding.lifestyle_focus.v1',
  dailyReview: (planId: string | number) => `auvra.draft.daily_review.${planId}`,
} as const;

export const ONBOARDING_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const DAILY_REVIEW_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;
