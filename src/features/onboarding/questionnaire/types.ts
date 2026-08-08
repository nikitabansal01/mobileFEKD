export type QuestionInputType =
  | 'text'
  | 'number'
  | 'single-choice'
  | 'multiple-choice'
  | 'date';

export type AnswerValue = string | string[] | number | null;
export type QuestionnaireAnswers = Record<string, AnswerValue | undefined>;

export interface QuestionnaireQuestion {
  id: number;
  question: string;
  inputType: QuestionInputType;
  placeholder?: string;
  key: string;
  options?: string[];
  notSureText?: string;
  isSubheading?: boolean;
  optionsLayout?: 'default' | 'wrap' | 'row';
}

export interface QuestionnaireStep {
  step: number;
  dialogue: string;
  subtitle?: string;
  questions: QuestionnaireQuestion[];
}

export type SubmissionState = 'idle' | 'submitting' | 'failed';

export interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  currentStep: number;
  isAdditionalPromptVisible: boolean;
  submission: SubmissionState;
  submissionError: string | null;
}

export type QuestionnaireAction =
  | { type: 'answer'; key: string; value: string; inputType: QuestionInputType }
  | { type: 'clearAnswer'; key: string }
  | { type: 'hydrate'; answers: QuestionnaireAnswers }
  | { type: 'setStep'; step: number }
  | { type: 'showAdditionalPrompt'; visible: boolean }
  | { type: 'submit'; state: SubmissionState; error?: string };
