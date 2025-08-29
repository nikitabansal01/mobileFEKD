/**
 * Question options and survey data for the hormone insight application
 * 
 * Contains predefined options for various health-related questions including:
 * - Period and cycle information
 * - Medical conditions and family history
 * - Lifestyle factors (exercise, sleep, stress)
 * - Health concerns and symptoms
 */
export const QUESTION_OPTIONS = {
  /** Period regularity and description options */
  periodDescription: [
    { id: '1', text: 'Regular', value: 'Regular', description: 'Your cycle comes at roughly the same time each month, with a consistent length that\'s easy to track and predict.' },
    { id: '2', text: 'Irregular', value: 'Irregular', description: 'Your cycle length varies from month to month periods come early, late, or are hard to predict.' },
    { id: '3', text: 'Occasional Skips', value: 'Occasional Skips', description: 'You get periods most months, but sometimes skip one unexpectedly without a clear reason or pattern.' },
    { id: '4', text: 'I don\'t get periods', value: 'I don\'t get periods', description: 'You don\'t get periods, possibly due to birth control or a health condition.' },
  ],
  
  /** Birth control method options */
  birthControl: [
    { id: '1', text: 'Hormonal Birth Control Pills', value: 'Hormonal Birth Control Pills', description: 'Pills that prevent pregnancy and may affect your periods.' },
    { id: '2', text: 'IUD (Intrauterine Device)', value: 'IUD (Intrauterine Device)', description: 'A hormonal device that may stop or lighten periods.' },
    { id: '3', text: 'Copper IUD (Intrauterine Device)', value: 'Copper IUD (Intrauterine Device)', description: 'A non-hormonal device that prevents pregnancy and keeps your natural cycle.' },
  ],
  
  /** Menstrual cycle length options */
  cycleLength: [
    { id: '1', text: 'Less than 21 days', value: 'Less than 21 days', description: 'You get your period again in less than 21 days after the last one.' },
    { id: '2', text: '21-25 days', value: '21-25 days', description: 'You get your period around 21 to 25 days after your last one.' },
    { id: '3', text: '26-30 days', value: '26-30 days', description: 'You get your period around 26 to 30 days after your last one.' },
    { id: '4', text: '31-35 days', value: '31-35 days', description: 'You get your period around 31 to 35 days after your last one.' },
    { id: '5', text: '35+ days', value: '35+ days', description: 'You get your period more than 35 days after the last one.' },
  ],
  
  /** Diagnosed medical conditions */
  diagnosedCondition: [
    { id: '1', text: 'PCOS', value: 'PCOS', description: 'Polycystic Ovarian Syndrome' },
    { id: '2', text: 'PCOD', value: 'PCOD', description: 'Polycystic Ovarian Disease' },
    { id: '3', text: 'Endometriosis', value: 'Endometriosis', description: 'Tissue grows outside the uterus, causing pain.' },
    { id: '4', text: 'Dysmenorrhea', value: 'Dysmenorrhea', description: 'Painful periods or severe cramps.' },
    { id: '5', text: 'Amenorrhea', value: 'Amenorrhea', description: 'No periods for several months.' },
    { id: '6', text: 'Menorrhagia', value: 'Menorrhagia', description: 'Very heavy or long periods.' },
    { id: '7', text: 'Metrorrhagia', value: 'Metrorrhagia', description: 'Bleeding between periods.' },
    { id: '8', text: 'Cushing\'s Syndrome', value: 'Cushing\'s Syndrome', description: 'High cortisol with cycle changes.' },
    { id: '9', text: 'Premenstrual Syndrome', value: 'Premenstrual Syndrome', description: 'Mild Mood or body changes before period.' },
    { id: '10', text: 'Diabetes', value: 'Diabetes', description: 'Trouble managing sugar levels' },
    { id: '11', text: 'PMDD', value: 'PMDD', description: 'Severe mood swings and physical pain that disrupt daily life.' },
    { id: '12', text: 'None of the above', value: 'None of the above', description: 'I haven\'t been diagnosed with any of these' },
    { id: '13', text: 'Others (please specify)', value: 'Others (please specify)', description: 'Enter a condition not listed here.' },
  ],
  
  /** Exercise intensity levels */
  workoutIntensity: [
    { id: '1', text: 'Low', value: 'Low', description: 'Light movement like walking or stretching.' },
    { id: '2', text: 'Moderate', value: 'Moderate', description: 'Regular cardio or weight training, still able to talk.' },
    { id: '3', text: 'High', value: 'High', description: 'Intense workouts that leave you breathless.' },
  ],
  
  /** Sleep duration options */
  sleepDuration: [
    { id: '1', text: '<6 hours', value: '<6 hours', description: 'Often feel tired and irritable.' },
    { id: '2', text: '6-7 hours', value: '6-7 hours', description: 'Generally fine, but low energy at times.' },
    { id: '3', text: '7-8 hours', value: '7-8 hours', description: 'Decently well rested.' },
    { id: '4', text: '8+ hours', value: '8+ hours', description: 'Feel well-rested and alert.' },
  ],
  
  /** Stress level options */
  stressLevel: [
    { id: '1', text: 'Low', value: 'Low', description: 'Calm and relaxed.' },
    { id: '2', text: 'Moderate', value: 'Moderate', description: 'Managing, but sometimes tense.' },
    { id: '3', text: 'High', value: 'High', description: 'Often overwhelmed or drained.' },
  ],
  
  /** Family medical history conditions */
  familyHistory: [
    { id: '1', text: 'PCOS', value: 'PCOS', description: 'Polycystic Ovarian Syndrome' },
    { id: '2', text: 'PCOD', value: 'PCOD', description: 'Polycystic Ovarian Disease' },
    { id: '3', text: 'Endometriosis', value: 'Endometriosis', description: 'Tissue grows outside the uterus, causing pain.' },
    { id: '4', text: 'Dysmenorrhea', value: 'Dysmenorrhea', description: 'Painful periods or severe cramps.' },
    { id: '5', text: 'Amenorrhea', value: 'Amenorrhea', description: 'No periods for several months.' },
    { id: '6', text: 'Menorrhagia', value: 'Menorrhagia', description: 'Very heavy or long periods.' },
    { id: '7', text: 'Metrorrhagia', value: 'Metrorrhagia', description: 'Bleeding between periods.' },
    { id: '8', text: 'Cushing\'s Syndrome', value: 'Cushing\'s Syndrome', description: 'High cortisol with cycle changes.' },
    { id: '9', text: 'Premenstrual Syndrome', value: 'Premenstrual Syndrome', description: 'Mild Mood or body changes before period.' },
    { id: '10', text: 'Diabetes', value: 'Diabetes', description: 'Trouble managing sugar levels' },
    { id: '11', text: 'PMDD', value: 'PMDD', description: 'Severe mood swings and physical pain that disrupt daily life.' },
    { id: '12', text: 'None of the above', value: 'None of the above', description: 'I haven\'t been diagnosed with any of these' },
    { id: '13', text: 'Others (please specify)', value: 'Others (please specify)', description: 'Enter a condition not listed here.' },
  ],
  
  /** Period-related concerns (legacy options without descriptions) */
  periodConcerns: [
    'Irregular Periods',
    'Painful Periods', 
    'Light periods / Spotting',
    'Heavy periods',
  ],
  
  /** Body-related health concerns */
  bodyConcerns: [
    'Bloating',
    'Hot Flashes',
    'Nausea',
    'Difficulty losing weight / stubborn belly fat',
    'Recent weight gain',
    'Menstrual headaches',
  ],
  
  /** Skin and hair-related concerns */
  skinAndHairConcerns: [
    'Hirsutism (hair growth on chin, nipples etc)',
    'Thinning of hair',
    'Adult Acne',
  ],
  
  /** Mental health concerns */
  mentalHealthConcerns: [
    'Mood swings', 
    'Stress', 
    'Fatigue'
  ],
};

/**
 * Helper function to get options with descriptions
 * 
 * @param key - Key of the options to retrieve
 * @returns Array of option objects with descriptions
 */
export const getOptionsWithDescriptions = (key: string) => {
  const options = QUESTION_OPTIONS[key as keyof typeof QUESTION_OPTIONS];
  if (Array.isArray(options)) {
    return options;
  }
  return [];
};

/**
 * Helper function to convert string arrays to option objects
 * 
 * @param options - Array of string options
 * @returns Array of option objects with id, text, and value properties
 */
export const convertStringOptionsToObjects = (options: string[]) => {
  return options.map((option, index) => ({
    id: String(index + 1),
    text: option,
    value: option,
  }));
};
