import type { WeeklyQuestionDto } from "./api";

import type { ConversationOption } from "./conversationTypes";

export function isWeeklyMultiSelect(
  question: WeeklyQuestionDto | null,
): boolean {
  return question?.answer_type === "multi_select";
}

export function isWeeklySlider(question: WeeklyQuestionDto | null): boolean {
  return question?.answer_type === "scale";
}

export function selectedOptionText(
  options: ConversationOption[],
  selectedIds: string[],
): string {
  const selected = new Set(selectedIds);
  return options
    .filter((option) => selected.has(option.id))
    .map((option) => option.text.trim())
    .filter(Boolean)
    .join(", ");
}

export function weeklySelectionValue(
  question: WeeklyQuestionDto | null,
  selectedIds: string[],
): string | string[] | null {
  if (!selectedIds.length) return null;
  return isWeeklyMultiSelect(question) ? selectedIds : selectedIds[0] || null;
}

export function weeklySliderLabel(
  question: WeeklyQuestionDto | null,
  value: number,
): string {
  const labels = (question?.answer_schema.labels || {}) as Record<
    string,
    string
  >;
  if (labels[String(value)]) return labels[String(value)];
  if (value <= 3) return labels["3"] || "Mild";
  if (value <= 5) return labels["5"] || "Moderate";
  if (value <= 7) return labels["7"] || "Strong";
  return labels["9"] || "Extreme";
}

export function sliderButtonLabel(
  question: WeeklyQuestionDto | null,
  value: number,
): string {
  return `${value} of 9, ${weeklySliderLabel(question, value)}`;
}
