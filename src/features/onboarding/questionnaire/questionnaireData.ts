import type { QuestionnaireAnswers, QuestionnaireStep } from './types';

export const questionnaireSteps: QuestionnaireStep[] = [
  {
    step: 1,
    dialogue: 'Tell me about yourself?',
    questions: [
      { id: 1, question: 'What should I call you?', inputType: 'text', placeholder: 'Your Name', key: 'name' },
      { id: 2, question: 'How young are you?', inputType: 'number', placeholder: 'Your Age', key: 'age' },
    ],
  },
  {
    step: 2,
    dialogue: 'How would you describe \n your periods?🩸',
    questions: [
      { id: 3, question: '', inputType: 'single-choice', options: ['Regular', 'Irregular', 'Occasional Skips', "I don't get periods"], key: 'periodDescription', notSureText: "I'm not sure" },
      { id: 4, question: 'Also let me know if you use...', inputType: 'multiple-choice', options: ['Hormonal Birth Control Pills', 'IUD (Intrauterine Device)'], key: 'birthControl', isSubheading: true },
    ],
  },
  {
    step: 3,
    dialogue: 'Tell me more about your periods',
    questions: [
      { id: 5, question: 'When did your last period start?', inputType: 'date', placeholder: 'MM/DD/YYYY', key: 'lastPeriodDate', notSureText: "I'm not sure" },
      { id: 6, question: 'What is your average cycle length?', inputType: 'single-choice', options: ['Less than 21 days', '21-25 days', '26-30 days', '31-35 days', '35+ days'], key: 'cycleLength', notSureText: "I'm not sure", optionsLayout: 'wrap' },
    ],
  },
  {
    step: 4,
    dialogue: 'What concerns have been worrying you?',
    subtitle: 'Choose all the concerns that apply',
    questions: [
      { id: 7, question: '🩸Period concerns', isSubheading: true, key: 'periodConcerns', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['Irregular Periods', 'Painful Periods', 'Light periods / Spotting', 'Heavy periods'] },
      { id: 8, question: '🧘 Body concerns', isSubheading: true, key: 'bodyConcerns', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['Bloating', 'Hot Flashes', 'Nausea', 'Difficulty losing weight / stubborn belly fat', 'Recent weight gain', 'Menstrual headaches'] },
      { id: 9, question: '💆‍♀️ Skin and hair concerns', isSubheading: true, key: 'skinAndHairConcerns', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['Hirsutism (hair growth on chin, nipples etc)', 'Thinning of hair', 'Adult Acne'] },
      { id: 10, question: '💭 Mental health concerns', isSubheading: true, key: 'mentalHealthConcerns', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['Mood swings', 'Stress', 'Fatigue'] },
      { id: 11, question: 'Other concerns', isSubheading: true, key: 'otherConcerns', inputType: 'multiple-choice', optionsLayout: 'default', options: ['None of these', 'Others (please specify)'] },
    ],
  },
  {
    step: 5,
    dialogue: 'Out of these, what is your top concern at the moment?',
    subtitle: 'Choose any one to get started',
    questions: [{ id: 12, question: '', inputType: 'single-choice', options: ['Painful Periods', 'Bloating', 'Recent weight gain', 'Hirsutism (hair growth on chin, nipples etc)', 'Adult Acne', 'Mood swings'], key: 'topConcern' }],
  },
  {
    step: 6,
    dialogue: 'Has your doctor diagnosed you with any of these?',
    subtitle: 'Choose any one to get started',
    questions: [{ id: 13, question: '', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['PCOS', 'PCOD', 'Endometriosis', 'Dysmenorrhea', 'Amenorrhea', 'Menorrhagia', 'Metrorrhagia', "Cushing's Syndrome", 'Premenstrual Syndrome', 'None of the above', 'Others (please specify)'], key: 'diagnosedCondition' }],
  },
  {
    step: 7,
    dialogue: 'Have any immediate family members been diagnosed with?',
    subtitle: 'Choose all the diagnosis that apply',
    questions: [{ id: 14, question: '', inputType: 'multiple-choice', optionsLayout: 'wrap', options: ['PCOS', 'PCOD', 'Endometriosis', 'Dysmenorrhea', 'Amenorrhea', 'Menorrhagia', 'Metrorrhagia', "Cushing's Syndrome", 'Premenstrual Syndrome', 'None of the above', 'Others (please specify)'], key: 'familyHistory' }],
  },
  {
    step: 8,
    dialogue: 'Tell me more about your lifestyle?',
    subtitle: 'Select one from each category',
    questions: [
      { id: 15, question: '💪🏼 Workout Intensity', inputType: 'single-choice', optionsLayout: 'wrap', options: ['Low', 'Moderate', 'High'], key: 'workoutIntensity', isSubheading: true },
      { id: 16, question: '😴 Sleep', inputType: 'single-choice', optionsLayout: 'wrap', options: ['<6 hours', '6-7 hours', '7-8 hours', '8+ hours'], key: 'sleepDuration', isSubheading: true },
      { id: 17, question: '😓️ Stress levels', inputType: 'single-choice', optionsLayout: 'wrap', options: ['Low', 'Moderate', 'High'], key: 'stressLevel', isSubheading: true },
    ],
  },
];

const concernKeys = ['periodConcerns', 'bodyConcerns', 'skinAndHairConcerns', 'mentalHealthConcerns', 'otherConcerns'] as const;

export function stepForAnswers(currentStep: number, answers: QuestionnaireAnswers): QuestionnaireStep {
  const baseStep = questionnaireSteps[currentStep];
  if (!baseStep || currentStep !== 4) return baseStep;
  const selected = concernKeys.flatMap((key) => Array.isArray(answers[key]) ? answers[key] : []);
  const custom = typeof answers.otherConcernsText === 'string' ? answers.otherConcernsText.trim() : '';
  const concerns = selected
    .filter((option) => option !== 'None of these' && option !== 'Others (please specify)')
    .concat(selected.includes('Others (please specify)') && custom ? [`Others: ${custom}`] : []);
  const options = [...new Set(concerns.filter(Boolean))];
  if (!options.length) return baseStep;
  return { ...baseStep, questions: baseStep.questions.map((question) => question.key === 'topConcern' ? { ...question, options } : question) };
}

export const questionnaireQuestions = questionnaireSteps.flatMap((step) => step.questions);
