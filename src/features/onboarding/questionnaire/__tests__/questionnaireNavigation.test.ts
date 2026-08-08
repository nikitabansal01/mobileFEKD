import { backIntent, continueIntent, retryIntent } from '../questionnaireNavigation';

describe('questionnaire navigation', () => {
  it('skips top concern when no symptom is selected', () => {
    expect(continueIntent(3, { otherConcerns: ['None of these'] })).toEqual({ type: 'setStep', step: 5 });
  });

  it('shows the additional prompt and submits on the final step', () => {
    expect(continueIntent(5, {})).toEqual({ type: 'showAdditionalPrompt' });
    expect(continueIntent(7, {})).toEqual({ type: 'submit' });
  });

  it('keeps back navigation and retry decisions explicit', () => {
    expect(backIntent(0, false)).toBe('intro');
    expect(backIntent(5, true)).toBe('closeAdditionalPrompt');
    expect(retryIntent()).toEqual({ type: 'submit' });
  });
});
