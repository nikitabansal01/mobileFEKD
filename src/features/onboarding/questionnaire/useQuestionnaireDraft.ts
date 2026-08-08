import { useCallback, useEffect, useRef } from 'react';

import { deleteSecureJson, getSecureJson, setSecureJson } from '@/src/core/storage/secureJsonStore';
import { ONBOARDING_DRAFT_TTL_MS, SECURE_DRAFT_KEYS } from '@/src/core/storage/storageKeys';

import type { QuestionnaireAnswers } from './types';

interface UseQuestionnaireDraftParams {
  answers: QuestionnaireAnswers;
  onRestore: (answers: QuestionnaireAnswers) => void;
}

type Timer = ReturnType<typeof setTimeout>;

export function useQuestionnaireDraft({ answers, onRestore }: UseQuestionnaireDraftParams) {
  const saveTimer = useRef<Timer | null>(null);
  const lastSaved = useRef('');

  const clearDraft = useCallback(async () => {
    await deleteSecureJson(SECURE_DRAFT_KEYS.onboardingAnswers);
    lastSaved.current = '';
  }, []);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    if (!Object.keys(answers).length) return;
    const serialized = JSON.stringify(answers);
    if (serialized === lastSaved.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSecureJson(SECURE_DRAFT_KEYS.onboardingAnswers, answers, ONBOARDING_DRAFT_TTL_MS)
        .then(() => { lastSaved.current = serialized; })
        .catch(() => undefined);
    }, 1000);
  }, [answers]);

  const restoreDraft = useCallback(async () => {
    const saved = await getSecureJson<QuestionnaireAnswers>(SECURE_DRAFT_KEYS.onboardingAnswers);
    if (!saved) return;
    lastSaved.current = JSON.stringify(saved);
    onRestore(saved);
  }, [onRestore]);

  return { clearDraft, restoreDraft };
}
