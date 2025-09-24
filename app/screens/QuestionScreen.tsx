import LoadingScreen from '@/app/screens/LoadingScreen';
import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import sessionService from '@/services/sessionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import ChipOptionContainer from '@/components/customComponent/ChipOptionContainer';
import NotSureButton from '@/components/customComponent/NotSureButton';
import OptionButtonsContainer from '@/components/customComponent/OptionButtonsContainer';
import OthersOption from '@/components/customComponent/OthersOption';
import TextInputContainer from '@/components/customComponent/TextInputContainer';
import GradientText from "@/components/GradientText";
import { getOptionsWithDescriptions } from '@/constants/QuestionOptions';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Question {
    id: number;
    question: string;
    inputType: 'text' | 'number' | 'single-choice' | 'multiple-choice' | 'date';
    placeholder?: string;
    key: string;
    options?: string[];
    notSureText?: string;
    isSubheading?: boolean;
    optionsLayout?: 'default' | 'wrap' | 'row';
}

interface QuestionStep {
    step: number;
    dialogue: string;
    subtitle?: string;
    questions: Question[];
}

/**
 * Question steps configuration for the onboarding questionnaire
 * Each step contains dialogue text and associated questions
 */
const questionSteps: QuestionStep[] = [
  {
    step: 1,
    dialogue: "Tell me about yourself?",
    questions: [
      {
        id: 1,
        question: "What should I call you?",
        inputType: 'text',
        placeholder: 'Your Name',
        key: 'name',
      },
      {
        id: 2,
        question: "How young are you?",
        inputType: 'number',
        placeholder: 'Your Age',
        key: 'age',
      },
    ],
  },
  {
    step: 2,
    dialogue: "How would you describe your periods?🩸",
    questions: [
      {
        id: 3,
        question: '',
        inputType: 'single-choice',
        options: ['Regular', 'Irregular', 'Occasional Skips', 'I don\'t get periods'],
        key: 'periodDescription',
        notSureText: "I'm not sure",
      },
      {
        id: 4,
        question: 'Also let me know if you use...',
        inputType: 'multiple-choice',
        options: ['Hormonal Birth Control Pills', 'IUD (Intrauterine Device)'],
        key: 'birthControl',
        isSubheading: true,
      },
    ],
  },
  {
    step: 3,
    dialogue: "Tell me more about your periods",
    questions: [
        {
            id: 5,
            question: 'When did your last period start?',
            inputType: 'date',
            placeholder: 'MM/DD/YYYY',
            key: 'lastPeriodDate',
            notSureText: "I'm not sure",
        },
        {
            id: 6,
            question: 'What is your average cycle length?',
            inputType: 'single-choice',
            options: ['Less than 21 days', '21-25 days', '26-30 days', '31-35 days', '35+ days'],
            key: 'cycleLength',
            notSureText: "I'm not sure",
            optionsLayout: 'wrap',
        },
    ],
  },
  {
    step: 4,
    dialogue: 'What concerns have been worrying you?',
    subtitle: 'Choose all the concerns that apply',
    questions: [
      {
        id: 7,
        question: '🩸Period concerns',
        isSubheading: true,
        key: 'periodConcerns',
        inputType: 'multiple-choice',
        optionsLayout: 'wrap',
        options: [
          'Irregular Periods',
          'Painful Periods',
          'Light periods / Spotting',
          'Heavy periods',
        ],
      },
      {
        id: 8,
        question: '🧘 Body concerns',
        isSubheading: true,
        key: 'bodyConcerns',
        inputType: 'multiple-choice',
        optionsLayout: 'wrap',
        options: [
          'Bloating',
          'Hot Flashes',
          'Nausea',
          'Difficulty losing weight / stubborn belly fat',
          'Recent weight gain',
          'Menstrual headaches',
        ],
      },
      {
        id: 9,
        question: '💆‍♀️ Skin and hair concerns',
        isSubheading: true,
        key: 'skinAndHairConcerns',
        inputType: 'multiple-choice',
        optionsLayout: 'wrap',
        options: [
          'Hirsutism (hair growth on chin, nipples etc)',
          'Thinning of hair',
          'Adult Acne',
        ],
      },
      {
        id: 10,
        question: '💭 Mental health concerns',
        isSubheading: true,
        key: 'mentalHealthConcerns',
        inputType: 'multiple-choice',
        optionsLayout: 'wrap',
        options: ['Mood swings', 'Stress', 'Fatigue'],
      },
      {
        id: 11,
        question: 'Other concerns',
        isSubheading: true,
        key: 'otherConcerns',
        inputType: 'multiple-choice',
        optionsLayout: 'default',
        options: ['None of these', 'Others (please specify)'],
      },
    ],
  },
  // Additional questions based on Figma design (step 5)
  {
    step: 5,
    dialogue: "Out of these, what is your top concern at the moment?",
    subtitle: "Choose any one to get started",
    questions: [
      {
        id: 12,
        question: "",
        inputType: "single-choice",
        options: [
          "Painful Periods",
          "Bloating",
          "Recent weight gain",
          "Hirsutism (hair growth on chin, nipples etc)",
          "Adult Acne",
          "Mood swings"
        ],
        key: "topConcern",
      }
    ]
  },
  // Additional questions based on Figma design (step 6)
  {
    step: 6,
    dialogue: "Is there any diagnosed health condition that I should know about?",
    subtitle: "Choose any one to get started",
    questions: [
      {
        id: 13,
        question: "",
        inputType: "multiple-choice",
        optionsLayout: "wrap",
        options: [
          "PCOS",
          "PCOD",
          "Endometriosis",
          "Dysmenorrhea",
          "Amenorrhea",
          "Menorrhagia",
          "Metrorrhagia",
          "Cushing's Syndrome",
          "Premenstrual Syndrome",
          "None of the above",
          "Others (please specify)"
        ],
        key: "diagnosedCondition",
      }
    ]
  },
  // Additional questions - family history
  {
    step: 7,
    dialogue: "Have any immediate family members been diagnosed with any of these conditions?",
    subtitle: "Choose all the diagnosis that apply",
    questions: [
      {
        id: 14,
        question: "",
        inputType: "multiple-choice",
        optionsLayout: "wrap",
        options: [
          "PCOS",
          "PCOD",
          "Endometriosis",
          "Dysmenorrhea",
          "Amenorrhea",
          "Menorrhagia",
          "Metrorrhagia",
          "Cushing's Syndrome",
          "Premenstrual Syndrome",
          "None of the above",
          "Others (please specify)"
        ],
        key: "familyHistory",
      }
    ]
  },
  // Additional questions - lifestyle
  {
    step: 8,
    dialogue: "Tell me more about your lifestyle?",
    subtitle: "Select one from each category",
    questions: [
      {
        id: 15,
        question: "💪🏼 Workout Intensity",
        inputType: "single-choice",
        optionsLayout: "wrap",
        options: [
          "Low",
          "Moderate", 
          "High"
        ],
        key: "workoutIntensity",
        isSubheading: true,
      },
      {
        id: 16,
        question: "😴 Sleep",
        inputType: "single-choice",
        optionsLayout: "wrap",
        options: [
          "<6 hours",
          "6-7 hours",
          "7-8 hours",
          "8+ hours"
        ],
        key: "sleepDuration",
        isSubheading: true,
      },
      {
        id: 17,
        question: "😓️ Stress levels",
        inputType: "single-choice",
        optionsLayout: "wrap",
        options: [
          "Low",
          "Moderate",
          "High"
        ],
        key: "stressLevel",
        isSubheading: true,
      }
    ]
  },
];

/**
 * Question screen component for collecting user health information
 * Features multi-step questionnaire with various input types and auto-sliding
 */
const QuestionScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] | number | null }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<string>('');
  const [showLoading, setShowLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [showAdditionalQuestionsPrompt, setShowAdditionalQuestionsPrompt] = useState(false);

  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const othersInputRef = useRef<TextInput>(null);

  const totalSteps = questionSteps.length;
  // KeyboardAwareScrollView reference storage
  const scrollRef = useRef<any>(null);
  const progress = (currentStep + 1) / totalSteps;

  const scrollToInput = (node: any) => {
    try {
      scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
    } catch {}
  };

  // Storage key for persisting answers
  const STORAGE_KEY = 'QuestionScreen_answers';

  // Load saved answers on component mount
  const loadSavedAnswers = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        console.log('💾 Loaded saved answers:', parsedAnswers);
        setAnswers(parsedAnswers);
      }
    } catch (error) {
      console.error('❌ Failed to load saved answers:', error);
    }
  };

  // Save answers to AsyncStorage
  const saveAnswersToStorage = async (answersToSave: typeof answers) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(answersToSave));
      console.log('💾 Answers saved to storage');
    } catch (error) {
      console.error('❌ Failed to save answers to storage:', error);
    }
  };

  // Clear saved answers from AsyncStorage
  const clearSavedAnswers = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Cleared saved answers from storage');
    } catch (error) {
      console.error('❌ Failed to clear saved answers from storage:', error);
    }
  };

  // Create session and load saved answers on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Load saved answers first
        await loadSavedAnswers();
        
        // Validate session and recreate if necessary
        const sessionValid = await sessionService.validateAndRefreshSession();
        if (sessionValid) {
            setSessionCreated(true);
        } else {
          console.error('Session initialization failed');
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      }
    };

    initializeSession();
  }, []);

  // Auto-save answers whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveAnswersToStorage(answers);
    }
  }, [answers]);



  /**
   * Handle back button press - navigate to previous question page
   */
  const handleBackPress = () => {
    if (showAdditionalQuestionsPrompt) {
      // Return to previous question from additional questions prompt screen
      setShowAdditionalQuestionsPrompt(false);
    } else if (currentStep > 0) {
      // Move to previous step (answers are preserved)
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to intro screen when back button is pressed on first step
      navigation.navigate('IntroScreen');
    }
  };

  /**
   * Normalize quotes in text input
   */
  const normalizeQuotes = (text: string): string => {
    return text
      .replace(/[''']/g, "'")  // Convert smart quotes to regular quotes
      .replace(/["""]/g, '"'); // Convert smart quotes to regular quotes
  };

  /**
   * Handle answer selection for different input types
   */
  const handleAnswer = (key: string, value: string, type: Question['inputType']) => {
    // Normalize value
    const normalizedValue = normalizeQuotes(value);
    
    // Handle "I'm not sure" as null
    if (normalizedValue === "I'm not sure") {
      setAnswers(prev => ({ ...prev, [key]: null }));
      return;
    }
    
    if (type === 'multiple-choice') {
      setAnswers(prev => {
        const existingAnswers = (prev[key] as string[]) || [];
        const newAnswers = existingAnswers.includes(normalizedValue)
          ? existingAnswers.filter(item => item !== normalizedValue)
          : [...existingAnswers, normalizedValue];
        return { ...prev, [key]: newAnswers };
      });
    } else if (type === 'number') {
      // Store age as number
      const numericValue = parseInt(normalizedValue) || 0;
      setAnswers(prev => ({ ...prev, [key]: numericValue }));
    } else {
      setAnswers(prev => ({ ...prev, [key]: normalizedValue }));
    }
  };

  /**
   * Check if an option is selected
   */
  const isOptionSelected = (key: string, option: string, type: Question['inputType']) => {
    if (type === 'multiple-choice') {
      return ((answers[key] as string[]) || []).includes(option);
    }
    return answers[key] === option;
  };
  
  /**
   * Handle date picker changes
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date change event:', event.type, 'Selected date:', selectedDate, 'Current field:', currentDateField);
    
    if (Platform.OS === 'ios') {
      // On iOS, close the picker when user dismisses it
      if (event.type === 'dismissed') {
        console.log('iOS date picker dismissed');
        setShowDatePicker(false);
        return;
      }
    }
    
    if (selectedDate && currentDateField) {
        const formattedDate = `${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getDate().toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
        console.log('Saving date:', formattedDate, 'to field:', currentDateField);
        handleAnswer(currentDateField, formattedDate, 'date');
    }
    
    // Close picker on Android and iOS after selection
    if (Platform.OS === 'android' || (Platform.OS === 'ios' && selectedDate)) {
      console.log('Closing date picker');
      setShowDatePicker(false);
    }
  };

  /**
   * Handle "Others" option selection with auto-scroll and focus
   */
  const handleOthersSelect = (key: string, value: string, type: Question['inputType']) => {
    handleAnswer(key, value, type);
    // TextInputContainer handles automatic keyboard scrolling
  };

  /**
   * Check if text input is filled
   */
  const isInputFilled = (key: string) => {
    const value = answers[key];
    return value && typeof value === 'string' && value.trim().length > 0;
  };

  /**
   * Check if all questions in current step are answered
   */
  const isCurrentStepComplete = () => {
    const currentQuestions = currentStepData.questions;
    
    return currentQuestions.every(q => {
      const answer = answers[q.key];
      
      // Subheadings don't require answers
      if (q.isSubheading) {
        return true;
      }
      
      // Text input validation
      if (q.inputType === 'text') {
        return answer && typeof answer === 'string' && answer.trim().length > 0;
      }
      
      // Number input validation (age)
      if (q.inputType === 'number') {
        return answer && typeof answer === 'number' && answer > 0;
      }
      
      // Date input validation (handles "I'm not sure" button)
      if (q.inputType === 'date') {
        return answer !== undefined && answer !== '';
      }
      
      // Single choice validation (handles "I'm not sure" button)
      if (q.inputType === 'single-choice') {
        return answer !== undefined && answer !== '';
      }
      
      // Multiple choice validation
      if (q.inputType === 'multiple-choice') {
        return Array.isArray(answer) && answer.length > 0;
      }
      
      return false;
    });
  };



  /**
   * Clear input handler
   */
  const handleClearInput = (key: string) => {
    setAnswers(prev => ({ ...prev, [key]: '' }));
  };

  /**
   * Handle continue button press
   */
  const handleContinue = async () => {
    if (currentStep < 5) {
      // Move to next step for steps 1-5
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      // Show additional questions prompt after step 6 completion
      setShowAdditionalQuestionsPrompt(true);
    } else if (currentStep === 6) {
      // Move to step 8 (lifestyle) after step 7 completion
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 7) {
      // Save answers and navigate to result screen after step 8 completion
      setShowLoading(true);
      
      try {
        // Collect all questions into a single array
        const allQuestions = questionSteps.flatMap(step => step.questions);
        
        // Record answer saving start time
        const startTime = Date.now();
        
        // Save answers
        const saveSuccess = await sessionService.saveAnswers(answers, allQuestions);
        
        // Calculate save completion time
        const saveTime = Date.now() - startTime;
        
        if (saveSuccess) {
          // Clear saved answers from AsyncStorage after successful submission
          await clearSavedAnswers();
          
          // Set minimum 1 second, maximum 3 seconds loading time
          const minLoadingTime = 1000;
          const maxLoadingTime = 3000;
          const loadingTime = Math.max(minLoadingTime, Math.min(saveTime + 500, maxLoadingTime));
          
          setTimeout(() => {
            setShowLoading(false);
            navigation.navigate('ResultScreen');
          }, loadingTime);
        } else {
          console.error('Answer saving failed');
          // Navigate to result screen even if failed (minimum 1 second loading)
          setTimeout(() => {
            setShowLoading(false);
            navigation.navigate('ResultScreen');
          }, 1000);
        }
      } catch (error) {
        console.error('Error during answer saving:', error);
        // Navigate to result screen even if error occurs (minimum 1 second loading)
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, 1000);
      }
    }
  };

  /**
   * Handle continue with additional questions
   */
  const handleAdditionalQuestionsContinue = async () => {
    // Continue with additional questions - move to additional questions screen
    setShowAdditionalQuestionsPrompt(false);
    // Additional questions are step 7 (family history questions) so set to step 7
    setCurrentStep(6); // currentStep 6 = step 7 (family history questions)
  };

  /**
   * Handle skip additional questions
   */
  const handleAdditionalQuestionsSkip = async () => {
    // Skip additional questions - save answers and navigate to result screen immediately
    setShowLoading(true);
    
    try {
      // Collect all questions into a single array
      const allQuestions = questionSteps.flatMap(step => step.questions);
      
      // Record answer saving start time
      const startTime = Date.now();
      
      // Save answers
      const saveSuccess = await sessionService.saveAnswers(answers, allQuestions);
      
      // Calculate save completion time
      const saveTime = Date.now() - startTime;
      
      if (saveSuccess) {
        // Clear saved answers from AsyncStorage after successful submission
        await clearSavedAnswers();
        
        // Set minimum 1 second, maximum 3 seconds loading time
        const minLoadingTime = 1000;
        const maxLoadingTime = 3000;
        const loadingTime = Math.max(minLoadingTime, Math.min(saveTime + 500, maxLoadingTime));
        
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, loadingTime);
      } else {
        console.error('Answer saving failed');
        // Navigate to result screen even if failed (minimum 1 second loading)
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, 1000);
      }
    } catch (error) {
      console.error('Error during answer saving:', error);
      // Navigate to result screen even if error occurs (minimum 1 second loading)
      setTimeout(() => {
        setShowLoading(false);
        navigation.navigate('ResultScreen');
      }, 1000);
    }
  };

  const currentStepData = questionSteps[currentStep];



  if (showLoading) {
    return <LoadingScreen />;
  }

  // Additional questions prompt screen
  if (showAdditionalQuestionsPrompt) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* Back button */}
        <View style={styles.backButtonContainer}>
          <BackButton onPress={() => setShowAdditionalQuestionsPrompt(false)} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Auvra character */}
          <View style={styles.characterContainer}>
            <AuvraCharacter size={responsiveWidth(20)} />
          </View>
          
          {/* Text container */}
          <View style={styles.textContainer}>
            <View style={styles.maskedViewContainer}>
              <GradientText
                text="Great! I have two more questions about your lifestyle and family medical history."
                textStyle={styles.descriptionText}
                containerStyle={styles.additionalQuestionsMaskedView}
              />
            </View>
          </View>
        </View>

        {/* Bottom buttons */}
        <FixedBottomContainer>
          <View style={styles.additionalQuestionsButtonsContainer}>
            <PrimaryButton
              title="Continue"
              onPress={handleAdditionalQuestionsContinue}
            />
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleAdditionalQuestionsSkip}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </FixedBottomContainer>
      </SafeAreaView>
    );
  }

  return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.flexColumnContainer}>
          {/* Header - back button and progress bar */}
          <View style={styles.header}>
            <BackButton onPress={handleBackPress} />
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarForeground, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {/* Main content - wrapped in ScrollView */}
            <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.mainContent,
              { minHeight: '100%' } // Set minimum height to 100% to protect gradient area
            ]}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            enableAutomaticScroll={true}
              extraScrollHeight={responsiveHeight(12)}
              extraHeight={responsiveHeight(4)}
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
              keyboardOpeningTime={220}
              innerRef={(ref: any) => {
                scrollRef.current = ref;
              }}
          >
            <View style={styles.mainContent}>
            {/* Character and question text */}
            <View style={styles.characterAndQuestion}>
              <View style={styles.characterContainer}>
                <AuvraCharacter size={responsiveWidth(20)} />
              </View>
              <View style={styles.questionTextContainer}>
                <GradientText
                  text={currentStepData.dialogue}
                  textStyle={styles.questionText}
                  containerStyle={styles.maskedView}
                />
                {currentStepData.subtitle && (
                  <Text style={styles.subtitleText}>
                    {currentStepData.subtitle}
                  </Text>
                )}
              </View>
            </View>

          {/* Input fields */}
          <View style={styles.inputFieldsContainer}>
            {currentStepData.questions.map((q) => (
              <View key={q.id} style={styles.inputFieldItem}>
                {q.question ? (
                  <View style={q.isSubheading ? (q.key === 'birthControl' ? styles.subheadingContainer : styles.categoryContainer) : null}>
                    {q.isSubheading && q.key !== 'birthControl' && <View style={styles.dividerLine} />}
                    <Text style={q.isSubheading ? (q.key === 'birthControl' ? styles.subQuestionTextLeft : styles.subQuestionText) : styles.inputLabelText}>
                      {q.question}
                    </Text>
                    {q.isSubheading && q.key !== 'birthControl' && <View style={styles.dividerLine} />}
                  </View>
                ) : null}
                {q.inputType === 'text' || q.inputType === 'number' ? (
                  <TextInputContainer
                    placeholder={q.placeholder || ''}
                    value={answers[q.key] as string || ''}
                    onChangeText={(text) => handleAnswer(q.key, text, q.inputType)}
                    keyboardType={q.inputType === 'number' ? 'numeric' : 'default'}
                    containerStyle={{
                      width: '100%',
                      alignSelf: 'stretch',
                    }}
                    onFocus={() => {
                      if (othersInputRef.current) {
                        scrollToInput(othersInputRef.current);
                      }
                    }}
                  />
                ) : q.inputType === 'date' ? (
                  <TouchableOpacity
                    style={[
                      createInputStyle(answers[q.key] ? 'selected' : 'default'),
                      {
                        width: '100%',
                        alignSelf: 'stretch',
                        height: responsiveHeight(7),
                        paddingVertical: responsiveHeight(2),
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      }
                    ]}
                    onPress={() => {
                      console.log('Date picker triggered for field:', q.key);
                      setShowDatePicker(true);
                      setCurrentDateField(q.key);
                    }}
                  >
                    <Text style={createInputTextStyle(answers[q.key] ? 'selected' : 'default')}>
                      {answers[q.key] as string || q.placeholder}
                    </Text>
                  </TouchableOpacity>
                ) : q.key === 'cycleLength' || q.optionsLayout === 'wrap' ? (
                  <>
                  <ChipOptionContainer
                    options={(() => {
                      // Options with descriptions
                      const optionsWithDescriptions = getOptionsWithDescriptions(q.key);
                      if (optionsWithDescriptions.length > 0) {
                        return optionsWithDescriptions.filter((option: any) => 
                          !(option.value === 'Others (please specify)' && (q.key === 'otherConcerns' || q.key === 'diagnosedCondition' || q.key === 'familyHistory'))
                        );
                      }
                      
                      // Existing string array options
                      return q.options?.filter(option => 
                        !(option === 'Others (please specify)' && (q.key === 'otherConcerns' || q.key === 'diagnosedCondition' || q.key === 'familyHistory'))
                      ) || [];
                    })()}
                    selectedValue={q.inputType === 'single-choice' ? answers[q.key] as string : answers[q.key] as string[]}
                    onSelect={(value) => handleAnswer(q.key, value, q.inputType)}
                    multiple={q.inputType === 'multiple-choice'}
                    showOthersOption={
                      q.key === 'otherConcerns' ||
                      (q.key === 'diagnosedCondition' && q.options?.includes('Others (please specify)')) ||
                      (q.key === 'familyHistory' && q.options?.includes('Others (please specify)'))
                    }
                    othersOptionProps={
                      q.key === 'otherConcerns' ? {
                        questionKey: q.key,
                        isSelected: isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice'),
                        onSelect: () => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice'),
                        placeholder: "Please specify your concern",
                        value: answers.otherConcernsText as string || '',
                         onChangeText: (text) => handleAnswer('otherConcernsText', text, 'text'),
                         onFocus: () => {
                         },
                          scrollToInput: (node) => {
                            try {
                              // Others has extra margin due to bottom fixed button (larger than usual)
                              scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                            } catch {}
                          },
                      } : q.key === 'diagnosedCondition' ? {
                        questionKey: q.key,
                        isSelected: isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice'),
                        onSelect: () => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice'),
                        placeholder: "Please specify your condition",
                        value: answers.diagnosedConditionText as string || '',
                         onChangeText: (text) => handleAnswer('diagnosedConditionText', text, 'text'),
                         onFocus: () => {
                         },
                          scrollToInput: (node) => {
                            try {
                              scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                            } catch {}
                          },
                      } : q.key === 'familyHistory' ? {
                        questionKey: q.key,
                        isSelected: isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice'),
                        onSelect: () => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice'),
                        placeholder: "Please specify the condition",
                        value: answers.familyHistoryText as string || '',
                         onChangeText: (text) => handleAnswer('familyHistoryText', text, 'text'),
                         onFocus: () => {
                         },
                          scrollToInput: (node) => {
                            try {
                              scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                            } catch {}
                          },
                      } : undefined
                                         }
                    />
                  </>
                  ) : (
                  <>
                    <OptionButtonsContainer
                      options={(() => {
                        // Options with descriptions
                        const optionsWithDescriptions = getOptionsWithDescriptions(q.key);
                        if (optionsWithDescriptions.length > 0) {
                          return optionsWithDescriptions.filter((option: any) => 
                            !(option.value === 'Others (please specify)' && (q.key === 'diagnosedCondition' || q.key === 'otherConcerns' || q.key === 'familyHistory'))
                          );
                        }
                        
                        // Existing string array options
                        return q.options?.filter(option => 
                          !(option === 'Others (please specify)' && (q.key === 'diagnosedCondition' || q.key === 'otherConcerns' || q.key === 'familyHistory'))
                        ) || [];
                      })()}
                      selectedValue={q.inputType === 'single-choice' ? answers[q.key] as string : answers[q.key] as string[]}
                      onSelect={(value) => handleAnswer(q.key, value, q.inputType)}
                      layout={q.optionsLayout || 'default'}
                      multiple={q.inputType === 'multiple-choice'}
                    />
                    {/* Others options - rendered in default mode */}
                     {q.key === 'otherConcerns' && (
                      <OthersOption
                        questionKey={q.key}
                        isSelected={isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice')}
                        onSelect={() => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice')}
                        placeholder="Please specify your concern"
                        value={answers.otherConcernsText as string || ''}
                        onChangeText={(text) => handleAnswer('otherConcernsText', text, 'text')}
                        onFocus={() => {
                        }}
                        containerStyle={{
                          marginBottom: 0, // Remove margin
                        }}
                         scrollToInput={(node) => {
                           try {
                             scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                           } catch {}
                         }}
                      />
                    )}
                     {q.key === 'diagnosedCondition' && q.options?.includes('Others (please specify)') && (
                      <OthersOption
                        questionKey={q.key}
                        isSelected={isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice')}
                        onSelect={() => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice')}
                        placeholder="Please specify your condition"
                        value={answers.diagnosedConditionText as string || ''}
                        onChangeText={(text) => handleAnswer('diagnosedConditionText', text, 'text')}
                        expandedMode={true}
                          scrollToInput={(node) => {
                            try {
                              scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                            } catch {}
                          }}
                      />
                    )}
                     {q.key === 'familyHistory' && q.options?.includes('Others (please specify)') && (
                      <OthersOption
                        questionKey={q.key}
                        isSelected={isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice')}
                        onSelect={() => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice')}
                        placeholder="Please specify the condition"
                        value={answers.familyHistoryText as string || ''}
                        onChangeText={(text) => handleAnswer('familyHistoryText', text, 'text')}
                        expandedMode={true}
                          scrollToInput={(node) => {
                            try {
                              scrollRef.current?.scrollToFocusedInput(node, responsiveHeight(28), 220);
                            } catch {}
                          }}
                      />
                    )}
                  </>
                )}
                {q.notSureText && (
                  <NotSureButton
                    text={q.notSureText}
                    onPress={() => handleAnswer(q.key, q.notSureText || '', q.inputType)}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
        </KeyboardAwareScrollView>

                 {/* Bottom gradient background and button */}

       </View>
       <FixedBottomContainer avoidKeyboard={false}> 
         <PrimaryButton
           title="Continue"
           onPress={handleContinue}
           disabled={!isCurrentStepComplete()}
         />
       </FixedBottomContainer>
      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={(() => {
              if (currentDateField && answers[currentDateField]) {
                const dateValue = answers[currentDateField] as string;
                // Try to parse the date - handle MM/DD/YYYY format
                if (typeof dateValue === 'string' && dateValue.includes('/')) {
                  const [month, day, year] = dateValue.split('/');
                  const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate;
                  }
                }
                // Fallback to direct parsing
                const directParse = new Date(dateValue);
                if (!isNaN(directParse.getTime())) {
                  return directParse;
                }
              }
              return new Date();
            })()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            style={styles.datePicker}
            textColor="#000000"
            themeVariant="light"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
  flexColumnContainer: {
    flex: 1,
  },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: responsiveWidth(5),
        paddingVertical: responsiveHeight(2),
        height: responsiveHeight(9),
    },
    progressBarBackground: {
        flex: 1,
        height: 10,
        backgroundColor: '#E8E8E8',
        borderRadius: 5,
    },
    progressBarForeground: {
        height: 10,
        backgroundColor: '#EDD9EF',
        borderRadius: 5,
    },

    mainContent: {
        paddingHorizontal: responsiveWidth(5),
        paddingTop: responsiveHeight(2),
        paddingBottom: responsiveHeight(20), // Sufficient space for gradient area
        alignItems: 'center',
        flexGrow: 1, // Use full height even when content is small
    },
    characterAndQuestion: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsiveHeight(3),
        marginBottom: responsiveHeight(3),
    },
    characterContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionTextContainer: {
        width: responsiveWidth(85),
        alignItems: 'center',
        justifyContent: 'center',
    },
    maskedView: {
        width: '100%',
        height: responsiveHeight(6),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // MaskedView style for additional questions screen
    additionalQuestionsMaskedView: {
        width: responsiveWidth(80),
        height: responsiveHeight(8),
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientText: {
        width: '100%',
        height: '100%',
    },
    questionText: {
        fontFamily: 'NotoSerif600',
        fontSize: responsiveFontSize(2.27), //16px
        textAlign: 'center',
        lineHeight: responsiveHeight(2.8),
        width: responsiveWidth(85),
    },
    inputFieldsContainer: {
        width: responsiveWidth(90),
        gap: responsiveHeight(3),
        alignItems: 'stretch',
    },
    inputFieldItem: {
        gap: responsiveHeight(1.5),
        alignItems: 'center',
    },
  subQuestionText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.7), //12px
    color: '#c17ec9',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  inputLabelText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.7),
    color: '#000000',
    lineHeight: responsiveHeight(1.8),
    textAlign: 'center',
  },

      optionsContainer: {
        gap: responsiveHeight(2.25),
        alignSelf: 'stretch',
    },


  wrappedOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    },


  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  textInputContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    width: responsiveWidth(80),
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    position: 'relative',
  },
  textInputContainerFocused: {
    borderColor: '#B3B3B3',
  },
  floatingLabel: {
    position: 'absolute',
    top: 8,
    left: 20,
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), //10px
    color: '#b3b3b3',
    zIndex: 1,
  },
  inputText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.7), //12px
    color: '#000000',
    marginTop: 8,
  },
  hiddenTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  clearButtonText: {
    fontSize: responsiveFontSize(1.4),
    color: '#666666',
    fontWeight: 'bold',
  },
  defaultPlaceholder: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), //12px
    color: '#b3b3b3',
    position: 'absolute',
    left: 20,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  subtitleText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), // 12px
    color: '#6f6f6f', // Figma: #6f6f6f
    textAlign: 'center',
    lineHeight: responsiveFontSize(1.6) * 1.25, // line-height 1.25
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveWidth(2),
    marginVertical: responsiveHeight(1),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  subQuestionTextLeft: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.6),
    color: '#c17ec9',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  subheadingContainer: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginVertical: responsiveHeight(1),
  },
  additionalQuestionsButtonsContainer: {
    gap: responsiveHeight(2),
    alignItems: 'center',
    width: '100%',
  },
  skipButton: {
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(10),
  },
  skipButtonText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.98), //14px
    color: '#6f6f6f',
    textAlign: 'center',
  },
  // Styles identical to IntroScreen
  backButtonContainer: {
    position: 'absolute',
    top: responsiveHeight(6),
    left: responsiveWidth(4),
    zIndex: 30,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(10),
  },
  textContainer: {
    alignItems: 'center',
  },
  maskedViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(2.27), //16px
    textAlign: 'center',
    lineHeight: responsiveHeight(2.4),
  },
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: responsiveHeight(1),
    marginHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? responsiveHeight(25) : 'auto',
    backgroundColor: 'transparent',
  },
});

export default QuestionScreen; 