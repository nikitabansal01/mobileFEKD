import type { QuestionnaireAction, QuestionnaireAnswers, QuestionnaireState } from './types';

export const initialQuestionnaireState: QuestionnaireState = {
  answers: {},
  currentStep: 0,
  isAdditionalPromptVisible: false,
  submission: 'idle',
  submissionError: null,
};

const normalizeQuotes = (value: string) => value.replace(/[''']/g, "'").replace(/["""]/g, '"');
const answerList = (answers: QuestionnaireAnswers, key: string) => Array.isArray(answers[key]) ? answers[key] : [];

function updateMultipleChoice(answers: QuestionnaireAnswers, key: string, value: string): QuestionnaireAnswers {
  const selected = answerList(answers, key);
  if (key === 'otherConcerns' && value === 'None of these') {
    const isSelected = selected.includes(value);
    return { ...answers, otherConcerns: isSelected ? selected.filter((item) => item !== value) : [value], periodConcerns: [], bodyConcerns: [], skinAndHairConcerns: [], mentalHealthConcerns: [] };
  }
  const withoutNone = key === 'otherConcerns' ? selected.filter((item) => item !== 'None of these') : selected;
  const next = withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
  return { ...answers, [key]: next, otherConcerns: answerList(answers, 'otherConcerns').filter((item) => item !== 'None of these') };
}

function updateAnswer(answers: QuestionnaireAnswers, action: Extract<QuestionnaireAction, { type: 'answer' }>): QuestionnaireAnswers {
  const value = normalizeQuotes(action.value);
  if (value === "I'm not sure") return { ...answers, [action.key]: null };
  if (action.inputType === 'multiple-choice') return updateMultipleChoice(answers, action.key, value);
  if (action.inputType === 'number') return { ...answers, [action.key]: Number.parseInt(value, 10) || 0 };
  return { ...answers, [action.key]: value };
}

export function questionnaireReducer(state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState {
  switch (action.type) {
    case 'answer': return { ...state, answers: updateAnswer(state.answers, action) };
    case 'clearAnswer': return { ...state, answers: { ...state.answers, [action.key]: '' } };
    case 'hydrate': return { ...state, answers: action.answers };
    case 'setStep': return { ...state, currentStep: action.step };
    case 'showAdditionalPrompt': return { ...state, isAdditionalPromptVisible: action.visible };
    case 'submit': return { ...state, submission: action.state, submissionError: action.error ?? null };
  }
}
