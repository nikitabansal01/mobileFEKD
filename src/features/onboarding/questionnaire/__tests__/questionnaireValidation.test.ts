import { questionnaireSteps } from '../questionnaireData';
import { isStepComplete } from '../questionnaireValidation';

describe('questionnaire validation', () => {
  it('blocks the first step until both required values are valid', () => {
    const firstStep = questionnaireSteps[0];
    expect(isStepComplete(firstStep, { name: 'Ava', age: 0 })).toBe(false);
    expect(isStepComplete(firstStep, { name: '  ', age: 27 })).toBe(false);
    expect(isStepComplete(firstStep, { name: 'Ava', age: 27 })).toBe(true);
  });

  it('accepts the legacy optional subheading concerns step', () => {
    expect(isStepComplete(questionnaireSteps[3], {})).toBe(true);
  });

  it('requires schema-valid age and all lifestyle fields despite presentation subheadings', () => {
    expect(isStepComplete(questionnaireSteps[0], { name: 'Ava', age: 12 })).toBe(false);
    expect(isStepComplete(questionnaireSteps[0], { name: 'Ava', age: 121 })).toBe(false);
    expect(isStepComplete(questionnaireSteps[7], {
      workoutIntensity: 'Low', sleepDuration: '7-8 hours',
    })).toBe(false);
    expect(isStepComplete(questionnaireSteps[7], {
      workoutIntensity: 'Low', sleepDuration: '7-8 hours', stressLevel: 'Moderate',
    })).toBe(true);
  });
});
