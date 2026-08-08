import { initialQuestionnaireState, questionnaireReducer } from '../questionnaireReducer';

describe('questionnaire reducer', () => {
  it('toggles multi-choice answers and keeps None of these mutually exclusive', () => {
    const withSymptom = questionnaireReducer(initialQuestionnaireState, {
      type: 'answer', key: 'periodConcerns', value: 'Painful Periods', inputType: 'multiple-choice',
    });
    const none = questionnaireReducer(withSymptom, {
      type: 'answer', key: 'otherConcerns', value: 'None of these', inputType: 'multiple-choice',
    });
    expect(none.answers.periodConcerns).toEqual([]);
    expect(none.answers.otherConcerns).toEqual(['None of these']);
    const symptomAgain = questionnaireReducer(none, {
      type: 'answer', key: 'bodyConcerns', value: 'Bloating', inputType: 'multiple-choice',
    });
    expect(symptomAgain.answers.otherConcerns).toEqual([]);
    expect(symptomAgain.answers.bodyConcerns).toEqual(['Bloating']);
  });

  it('makes failed submissions retryable without discarding answers', () => {
    const failed = questionnaireReducer({ ...initialQuestionnaireState, answers: { name: 'Ava' } }, {
      type: 'submit', state: 'failed', error: 'Unable to save',
    });
    const retrying = questionnaireReducer(failed, { type: 'submit', state: 'submitting' });
    expect(retrying.answers).toEqual({ name: 'Ava' });
    expect(retrying.submission).toBe('submitting');
    expect(retrying.submissionError).toBeNull();
  });
});
