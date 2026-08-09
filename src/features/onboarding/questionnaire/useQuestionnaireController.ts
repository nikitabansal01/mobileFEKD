import { useCallback, useEffect, useReducer, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import sessionService from '@/services/sessionService';

import { questionnaireQuestions, stepForAnswers } from './questionnaireData';
import { backIntent, continueIntent } from './questionnaireNavigation';
import { initialQuestionnaireState, questionnaireReducer } from './questionnaireReducer';
import { useQuestionnaireDraft } from './useQuestionnaireDraft';
import type { QuestionInputType, QuestionnaireAnswers } from './types';

type QuestionnaireNavigation = StackNavigationProp<Record<string, object | undefined>>;

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function useQuestionnaireController() {
  const navigation = useNavigation<QuestionnaireNavigation>();
  const [state, dispatch] = useReducer(questionnaireReducer, initialQuestionnaireState);
  const [initialization, setInitialization] = useState<'loading' | 'ready' | 'failed'>('loading');
  const restoreAnswers = useCallback((answers: QuestionnaireAnswers) => dispatch({ type: 'hydrate', answers }), []);
  const { clearDraft, restoreDraft } = useQuestionnaireDraft({
    answers: state.answers,
    onRestore: restoreAnswers,
  });
  const currentStep = stepForAnswers(state.currentStep, state.answers);

  const initialize = useCallback(async () => {
    setInitialization('loading');
    try {
      console.log('[QUESTIONNAIRE] Starting initialization...');
      const before = await sessionService.getSessionId();
      console.log('[QUESTIONNAIRE] Got existing session ID:', before ? 'yes' : 'none');
      const valid = await sessionService.validateAndRefreshSession();
      console.log('[QUESTIONNAIRE] validateAndRefreshSession returned:', valid);
      const after = await sessionService.getSessionId();
      console.log('[QUESTIONNAIRE] Session ID after validation:', after ? 'yes' : 'none');
      if (!valid) throw new Error('Unable to start your questionnaire session.');
      if (before && before === after) await restoreDraft();
      else await clearDraft();
      setInitialization('ready');
      console.log('[QUESTIONNAIRE] Initialization complete - ready!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[QUESTIONNAIRE] Initialization FAILED:', message);
      setInitialization('failed');
    }
  }, [clearDraft, restoreDraft]);

  useEffect(() => { void initialize(); }, [initialize]);

  const submit = async () => {
    dispatch({ type: 'submit', state: 'submitting' });
    const startedAt = Date.now();
    try {
      const saved = await sessionService.saveAnswers(state.answers, questionnaireQuestions);
      if (!saved) throw new Error('Your answers could not be saved.');
      await clearDraft();
      const elapsed = Date.now() - startedAt;
      await wait(Math.max(1000, Math.min(elapsed + 500, 3000)));
      dispatch({ type: 'submit', state: 'idle' });
      navigation.navigate('ResultScreen');
    } catch {
      dispatch({ type: 'submit', state: 'failed', error: 'We could not save your answers. Please try again.' });
    }
  };

  const continueQuestionnaire = () => {
    const intent = continueIntent(state.currentStep, state.answers);
    if (intent.type === 'setStep') dispatch({ type: 'setStep', step: intent.step });
    if (intent.type === 'showAdditionalPrompt') dispatch({ type: 'showAdditionalPrompt', visible: true });
    if (intent.type === 'submit') void submit();
  };

  const goBack = () => {
    const intent = backIntent(state.currentStep, state.isAdditionalPromptVisible);
    if (intent === 'closeAdditionalPrompt') dispatch({ type: 'showAdditionalPrompt', visible: false });
    if (intent === 'previousStep') dispatch({ type: 'setStep', step: state.currentStep - 1 });
    if (intent === 'intro') navigation.navigate('IntroScreen');
  };

  return {
    currentStep,
    initialization,
    state,
    continueAdditionalQuestions: () => {
      dispatch({ type: 'showAdditionalPrompt', visible: false });
      dispatch({ type: 'setStep', step: 6 });
    },
    continueQuestionnaire,
    goBack,
    retryInitialization: () => void initialize(),
    retrySubmission: () => void submit(),
    selectAnswer: (key: string, value: string, inputType: QuestionInputType) => dispatch({ type: 'answer', key, value, inputType }),
    setAdditionalPromptVisible: (visible: boolean) => dispatch({ type: 'showAdditionalPrompt', visible }),
  };
}
