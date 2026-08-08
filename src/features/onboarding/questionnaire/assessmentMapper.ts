import type { components } from '@/src/core/api/v2.generated';

import type { QuestionnaireAnswers } from './types';

export type MobileQuestionnaireV1 = components['schemas']['MobileQuestionnaireV1'];

const periodDescriptions = [
  'Regular',
  'Irregular',
  'Occasional Skips',
  "I don't get periods",
] as const;
const birthControls = [
  'Hormonal Birth Control Pills',
  'IUD (Intrauterine Device)',
  'Copper IUD (Intrauterine Device)',
] as const;
const cycleLengths = [
  'Less than 21 days',
  '21-25 days',
  '26-30 days',
  '31-35 days',
  '35+ days',
] as const;
const periodConcerns = [
  'Irregular Periods',
  'Painful Periods',
  'Light periods / Spotting',
  'Heavy periods',
] as const;
const bodyConcerns = [
  'Bloating',
  'Hot Flashes',
  'Nausea',
  'Difficulty losing weight / stubborn belly fat',
  'Recent weight gain',
  'Menstrual headaches',
] as const;
const skinHairConcerns = [
  'Hirsutism (hair growth on chin, nipples etc)',
  'Thinning of hair',
  'Adult Acne',
] as const;
const mentalHealthConcerns = ['Mood swings', 'Stress', 'Fatigue'] as const;
const workoutIntensities = ['Low', 'Moderate', 'High', "I'm yet to start"] as const;
const sleepDurations = ['<6 hours', '6-7 hours', '7-8 hours', '8+ hours'] as const;
const stressLevels = ['Low', 'Moderate', 'High'] as const;

const documentedNone = new Set(['None of these', 'Others (please specify)']);

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const choice = (value: unknown): string | undefined =>
  text(value) === "I'm not sure" ? undefined : text(value);

const allowedChoice = <Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): Value | undefined => {
  const normalized = choice(value);
  return normalized && (allowed as readonly string[]).includes(normalized)
    ? (normalized as Value)
    : undefined;
};

const list = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const normalized = [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  return normalized.length ? normalized : undefined;
};

const allowedList = <Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): Value[] | undefined => {
  const normalized = list(value)?.filter((item) =>
    (allowed as readonly string[]).includes(item),
  ) as Value[] | undefined;
  return normalized?.length ? normalized : undefined;
};

const customList = (
  selected: unknown,
  otherText: unknown,
): string[] | undefined => {
  const selectedValues = list(selected) ?? [];
  const custom = text(otherText);
  const normalized = selectedValues
    .filter((value) => !documentedNone.has(value))
    .concat(
      selectedValues.includes('Others (please specify)') && custom
        ? [`Others: ${custom}`]
        : [],
    );
  return normalized.length ? normalized : undefined;
};

const isoDate = (value: unknown): string | undefined => {
  const source = text(value);
  if (!source) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(source);
  if (!match) return undefined;
  const [, month, day, year] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return undefined;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/** Maps only validated v2 fields; UI-only values such as `name` never cross the API boundary. */
export function mapQuestionnaireAnswers(
  answers: QuestionnaireAnswers,
): MobileQuestionnaireV1 {
  const age =
    typeof answers.age === 'number' &&
    Number.isInteger(answers.age) &&
    answers.age >= 13 &&
    answers.age <= 120
      ? answers.age
      : undefined;

  return {
    age,
    period_description: allowedChoice(
      answers.periodDescription,
      periodDescriptions,
    ),
    birth_control: allowedList(answers.birthControl, birthControls),
    last_period_date: isoDate(answers.lastPeriodDate),
    cycle_length: allowedChoice(answers.cycleLength, cycleLengths),
    period_concerns: allowedList(answers.periodConcerns, periodConcerns),
    body_concerns: allowedList(answers.bodyConcerns, bodyConcerns),
    skin_hair_concerns: allowedList(
      answers.skinAndHairConcerns,
      skinHairConcerns,
    ),
    mental_health_concerns: allowedList(
      answers.mentalHealthConcerns,
      mentalHealthConcerns,
    ),
    other_concerns: customList(
      answers.otherConcerns,
      answers.otherConcernsText,
    ),
    top_concern: choice(answers.topConcern),
    diagnosed_conditions: customList(
      answers.diagnosedCondition,
      answers.diagnosedConditionText,
    ),
    family_history: customList(
      answers.familyHistory,
      answers.familyHistoryText,
    ),
    workout_intensity: allowedChoice(
      answers.workoutIntensity,
      workoutIntensities,
    ),
    sleep_duration: allowedChoice(answers.sleepDuration, sleepDurations),
    stress_level: allowedChoice(answers.stressLevel, stressLevels),
  };
}
