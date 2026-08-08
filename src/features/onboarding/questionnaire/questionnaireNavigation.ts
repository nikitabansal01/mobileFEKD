import type { QuestionnaireAnswers } from './types';
import { hasSelectedSymptoms } from './questionnaireValidation';

export type ContinueIntent =
  | { type: 'setStep'; step: number }
  | { type: 'showAdditionalPrompt' }
  | { type: 'submit' };

export function continueIntent(currentStep: number, answers: QuestionnaireAnswers): ContinueIntent {
  if (currentStep < 5) {
    return { type: 'setStep', step: currentStep === 3 && !hasSelectedSymptoms(answers) ? 5 : currentStep + 1 };
  }
  if (currentStep === 5) return { type: 'showAdditionalPrompt' };
  if (currentStep === 6) return { type: 'setStep', step: 7 };
  return { type: 'submit' };
}

export type BackIntent = 'closeAdditionalPrompt' | 'previousStep' | 'intro';

export function backIntent(currentStep: number, isAdditionalPromptVisible: boolean): BackIntent {
  if (isAdditionalPromptVisible) return 'closeAdditionalPrompt';
  return currentStep > 0 ? 'previousStep' : 'intro';
}

export function retryIntent(): ContinueIntent {
  return { type: 'submit' };
}
