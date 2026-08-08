import { mapQuestionnaireAnswers } from '../assessmentMapper';

describe('mapQuestionnaireAnswers', () => {
  it('emits only exact snake_case v2 fields and normalizes dates, nulls, and custom Others', () => {
    expect(mapQuestionnaireAnswers({
      name: 'Ava — UI only',
      age: 27,
      periodDescription: "I'm not sure",
      lastPeriodDate: '2/3/2026',
      otherConcerns: ['None of these', 'Others (please specify)'],
      otherConcernsText: '  a custom concern  ',
      diagnosedCondition: ['PCOS', 'Others (please specify)'],
      diagnosedConditionText: '  Hashimoto\'s  ',
      familyHistory: ['None of the above'],
    })).toEqual({
      age: 27,
      last_period_date: '2026-02-03',
      other_concerns: ['Others: a custom concern'],
      diagnosed_conditions: ['PCOS', "Others: Hashimoto's"],
      family_history: ['None of the above'],
    });
  });

  it('omits invalid local fields rather than emitting non-contract values', () => {
    expect(mapQuestionnaireAnswers({ age: 0, lastPeriodDate: '2026-02-31' })).toEqual({});
  });
});
