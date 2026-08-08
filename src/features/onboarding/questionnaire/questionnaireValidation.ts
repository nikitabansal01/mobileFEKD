import type { QuestionnaireAnswers, QuestionnaireQuestion, QuestionnaireStep } from './types';

const ignoredConcernValues = new Set(['None of these', 'Others (please specify)']);
const symptomKeys = ['periodConcerns', 'bodyConcerns', 'skinAndHairConcerns', 'mentalHealthConcerns', 'otherConcerns'];
const optionalPresentationKeys = new Set([
  'birthControl',
  'periodConcerns',
  'bodyConcerns',
  'skinAndHairConcerns',
  'mentalHealthConcerns',
  'otherConcerns',
]);

export function isQuestionAnswered(question: QuestionnaireQuestion, answers: QuestionnaireAnswers): boolean {
  // A subheading is visual metadata, not a blanket optionality rule. In
  // particular, workout/sleep/stress remain required questionnaire fields.
  if (question.isSubheading && optionalPresentationKeys.has(question.key)) return true;
  const answer = answers[question.key];
  if (question.inputType === 'text') return typeof answer === 'string' && answer.trim().length > 0;
  if (question.inputType === 'number') return typeof answer === 'number' && Number.isInteger(answer) && answer >= 13 && answer <= 120;
  if (question.inputType === 'multiple-choice') return Array.isArray(answer) && answer.length > 0;
  return answer !== undefined && answer !== '';
}

export function isStepComplete(step: QuestionnaireStep, answers: QuestionnaireAnswers): boolean {
  return step.questions.every((question) => isQuestionAnswered(question, answers));
}

export function hasSelectedSymptoms(answers: QuestionnaireAnswers): boolean {
  return symptomKeys.some((key) => answerList(answers[key]).some((value) => !ignoredConcernValues.has(value)));
}

function answerList(value: QuestionnaireAnswers[string]): string[] {
  return Array.isArray(value) ? value : [];
}
