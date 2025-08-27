import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Pressable, Alert, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuvraCharacter from '@/components/AuvraCharacter';
import DialogueBubble from '@/components/DialogueBubble';
import PrimaryButton from '@/components/PrimaryButton';
import SVG from '@/assets/images/SVG';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BackButton from '@/components/BackButton';
import LoadingScreen from '@/app/screens/LoadingScreen';
import sessionService from '@/services/sessionService';

import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import GradientText from "@/components/GradientText";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import OptionButtonsContainer from '@/components/customComponent/OptionButtonsContainer';
import TextInputContainer from '@/components/customComponent/TextInputContainer';
import ChipOptionContainer from '@/components/customComponent/ChipOptionContainer';
import NotSureButton from '@/components/customComponent/NotSureButton';
import OthersOption from '@/components/customComponent/OthersOption';
import { createInputStyle, createInputTextStyle } from '@/utils/inputStyles';
import { INPUT_STATES } from '@/constants/InputStates';
import { getOptionsWithDescriptions, convertStringOptionsToObjects } from '@/constants/QuestionOptions';

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
        options: ['Regular', 'Irregular', 'Occasional Skips', 'I don’t get periods'],
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
  // Figma 기반 추가 질문 (step 5)
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
  // Figma 기반 추가 질문 (step 6)
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
          "Cushing’s Syndrome",
          "Premenstrual Syndrome",
          "None of the above",
          "Others (please specify)"
        ],
        key: "diagnosedCondition",
      }
    ]
  },
  // 추가 질문 - 가족력
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
  // 추가 질문 - 라이프스타일
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

const QuestionScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] | number | null }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [showAdditionalQuestionsPrompt, setShowAdditionalQuestionsPrompt] = useState(false);

  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const othersInputRef = useRef<TextInput>(null);

  const totalSteps = questionSteps.length;
  // KeyboardAwareScrollView 참조 저장
  const scrollRef = useRef<any>(null);
  const progress = (currentStep + 1) / totalSteps;

  // 컴포넌트 마운트 시 세션 생성
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 세션 유효성 확인 및 필요시 재생성
        const sessionValid = await sessionService.validateAndRefreshSession();
        if (sessionValid) {
            setSessionCreated(true);
          console.log('세션 초기화 완료');
        } else {
          console.error('세션 초기화 실패');
        }
      } catch (error) {
        console.error('세션 초기화 오류:', error);
      }
    };

    initializeSession();
  }, []);



  // 백버튼 핸들러 - 이전 질문 페이지로 이동
  const handleBackPress = () => {
    if (showAdditionalQuestionsPrompt) {
      // 추가 질문 의사 확인 화면에서 백버튼을 누르면 이전 질문으로 돌아감
      setShowAdditionalQuestionsPrompt(false);
    } else if (currentStep > 0) {
      // 이전 단계로 이동 (답변은 유지됨)
      setCurrentStep(currentStep - 1);
    } else {
      // 첫 번째 단계에서 백버튼을 누르면 intro screen으로 이동
      navigation.navigate('IntroScreen');
    }
  };

  // 따옴표 정규화 함수
  const normalizeQuotes = (text: string): string => {
    return text
      .replace(/[''']/g, "'")  // 스마트 따옴표를 일반 따옴표로 변환
      .replace(/["""]/g, '"'); // 스마트 따옴표를 일반 따옴표로 변환
  };

  const handleAnswer = (key: string, value: string, type: Question['inputType']) => {
    // 값 정규화
    const normalizedValue = normalizeQuotes(value);
    
    // "I'm not sure"를 null로 처리
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
      // 나이를 숫자로 저장
      const numericValue = parseInt(normalizedValue) || 0;
      setAnswers(prev => ({ ...prev, [key]: numericValue }));
    } else {
      setAnswers(prev => ({ ...prev, [key]: normalizedValue }));
    }
  };

  const isOptionSelected = (key: string, option: string, type: Question['inputType']) => {
    if (type === 'multiple-choice') {
      return ((answers[key] as string[]) || []).includes(option);
    }
    return answers[key] === option;
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until dismissal
    if (selectedDate) {
        const formattedDate = `${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getDate().toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
        handleAnswer('lastPeriodDate', formattedDate, 'date');
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  // Others 선택 시 자동 스크롤 및 포커스
  const handleOthersSelect = (key: string, value: string, type: Question['inputType']) => {
    handleAnswer(key, value, type);
    // TextInputContainer가 자동으로 키보드 위로 스크롤 처리
  };

  // TextInput 상태 확인 함수
  const isInputFilled = (key: string) => {
    const value = answers[key];
    return value && typeof value === 'string' && value.trim().length > 0;
  };

  // 현재 단계의 모든 질문에 답변이 있는지 확인하는 함수
  const isCurrentStepComplete = () => {
    const currentQuestions = currentStepData.questions;
    
    return currentQuestions.every(q => {
      const answer = answers[q.key];
      
      // 서브헤딩인 경우 답변 불필요
      if (q.isSubheading) {
        return true;
      }
      
      // 텍스트 입력의 경우
      if (q.inputType === 'text') {
        return answer && typeof answer === 'string' && answer.trim().length > 0;
      }
      
      // 숫자 입력의 경우 (나이)
      if (q.inputType === 'number') {
        return answer && typeof answer === 'number' && answer > 0;
      }
      
      // 날짜 입력의 경우 ("I'm not sure" 버튼 처리)
      if (q.inputType === 'date') {
        return answer !== undefined && answer !== '';
      }
      
      // 단일 선택의 경우 ("I'm not sure" 버튼 처리)
      if (q.inputType === 'single-choice') {
        return answer !== undefined && answer !== '';
      }
      
      // 다중 선택의 경우
      if (q.inputType === 'multiple-choice') {
        return Array.isArray(answer) && answer.length > 0;
      }
      
      return false;
    });
  };



  // Clear 버튼 핸들러
  const handleClearInput = (key: string) => {
    setAnswers(prev => ({ ...prev, [key]: '' }));
  };

  const handleContinue = async () => {
    if (currentStep < 5) {
      // step 1-5까지는 다음 스텝으로 이동
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      // step 6 완료 후 추가 질문 의사 확인 화면 표시
      setShowAdditionalQuestionsPrompt(true);
    } else if (currentStep === 6) {
      // step 7 완료 후 step 8(라이프스타일)로 이동
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 7) {
      // step 8 완료 후 답변 저장 및 결과 화면으로 이동
      setShowLoading(true);
      
      try {
        // 모든 질문을 하나의 배열로 수집
        const allQuestions = questionSteps.flatMap(step => step.questions);
        
        // 답변 저장 시작 시간 기록
        const startTime = Date.now();
        
        // 답변 저장
        const saveSuccess = await sessionService.saveAnswers(answers, allQuestions);
        
        // 저장 완료 시간 계산
        const saveTime = Date.now() - startTime;
        
        if (saveSuccess) {
          console.log('답변 저장 성공');
          // 최소 1초, 최대 3초 로딩 시간 설정
          const minLoadingTime = 1000;
          const maxLoadingTime = 3000;
          const loadingTime = Math.max(minLoadingTime, Math.min(saveTime + 500, maxLoadingTime));
          
          setTimeout(() => {
            setShowLoading(false);
            navigation.navigate('ResultScreen');
          }, loadingTime);
        } else {
          console.error('답변 저장 실패');
          // 실패해도 결과 화면으로 이동 (최소 1초 로딩)
          setTimeout(() => {
            setShowLoading(false);
            navigation.navigate('ResultScreen');
          }, 1000);
        }
      } catch (error) {
        console.error('답변 저장 중 오류:', error);
        // 오류 발생해도 결과 화면으로 이동 (최소 1초 로딩)
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, 1000);
      }
    }
  };

  const handleAdditionalQuestionsContinue = async () => {
    // 추가 질문 계속하기 - 추가 질문 화면으로 이동
    setShowAdditionalQuestionsPrompt(false);
    // 추가 질문은 step 7 (가족력 질문)이므로 step 7로 설정
    setCurrentStep(6); // currentStep 6 = step 7 (가족력 질문)
  };

  const handleAdditionalQuestionsSkip = async () => {
    // 추가 질문 건너뛰기 - 바로 답변 저장 후 결과 화면으로 이동
    setShowLoading(true);
    
    try {
      // 모든 질문을 하나의 배열로 수집
      const allQuestions = questionSteps.flatMap(step => step.questions);
      
      // 답변 저장 시작 시간 기록
      const startTime = Date.now();
      
      // 답변 저장
      const saveSuccess = await sessionService.saveAnswers(answers, allQuestions);
      
      // 저장 완료 시간 계산
      const saveTime = Date.now() - startTime;
      
      if (saveSuccess) {
        console.log('답변 저장 성공');
        // 최소 1초, 최대 3초 로딩 시간 설정
        const minLoadingTime = 1000;
        const maxLoadingTime = 3000;
        const loadingTime = Math.max(minLoadingTime, Math.min(saveTime + 500, maxLoadingTime));
        
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, loadingTime);
      } else {
        console.error('답변 저장 실패');
        // 실패해도 결과 화면으로 이동 (최소 1초 로딩)
        setTimeout(() => {
          setShowLoading(false);
          navigation.navigate('ResultScreen');
        }, 1000);
      }
    } catch (error) {
      console.error('답변 저장 중 오류:', error);
      // 오류 발생해도 결과 화면으로 이동 (최소 1초 로딩)
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

  // 추가 질문 의사 확인 화면
  if (showAdditionalQuestionsPrompt) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* 뒤로가기 버튼 */}
        <View style={styles.backButtonContainer}>
          <BackButton onPress={() => setShowAdditionalQuestionsPrompt(false)} />
        </View>

        {/* 메인 컨텐츠 */}
        <View style={styles.content}>
          {/* Auvra 캐릭터 */}
          <View style={styles.characterContainer}>
            <AuvraCharacter size={responsiveWidth(20)} />
          </View>
          
          {/* 텍스트 컨테이너 */}
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

        {/* 하단 버튼들 */}
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
        {/* 헤더 - 뒤로가기 버튼과 프로그레스 바 */}
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarForeground, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* 메인 컨텐츠 - ScrollView로 감싸기 */}
          <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.mainContent,
            { minHeight: '100%' } // 최소 높이를 100%로 설정하여 그라디언트 영역 보호
          ]}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
            extraScrollHeight={responsiveHeight(12)}
            extraHeight={responsiveHeight(4)}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            console.log('[KeyboardAwareScrollView] 스크롤 발생:', event.nativeEvent.contentOffset.y);
          }}
            keyboardOpeningTime={220}
            innerRef={(ref: any) => {
              scrollRef.current = ref;
            }}
        >
          <View style={styles.mainContent}>
          {/* 캐릭터와 질문 텍스트 */}
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

          {/* 입력 필드들 */}
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
                      console.log(`[${q.key}] TextInput 포커스 - 키보드 스크롤 시작`);
                      console.log(`[${q.key}] extraScrollHeight: ${responsiveHeight(15)}, extraHeight: ${responsiveHeight(20)}`);
                    }}
                  />
                ) : q.inputType === 'date' ? (
                  <TouchableOpacity
                    style={[
                      createInputStyle(answers[q.key] ? 'selected' : 'default'),
                      {
                        width: '100%',
                        alignSelf: 'stretch',
                        height: responsiveHeight(7), // DatePicker 높이 증가
                        paddingVertical: responsiveHeight(2), // 패딩도 증가
                        justifyContent: 'center', // 세로 중앙정렬
                        alignItems: 'flex-start', // 가로는 왼쪽 정렬
                      }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={createInputTextStyle(answers[q.key] ? 'selected' : 'default')}>
                      {answers[q.key] as string || q.placeholder}
                    </Text>
                  </TouchableOpacity>
                ) : q.key === 'cycleLength' || q.optionsLayout === 'wrap' ? (
                  <>
                  <ChipOptionContainer
                    options={(() => {
                      // 설명이 있는 옵션들
                      const optionsWithDescriptions = getOptionsWithDescriptions(q.key);
                      if (optionsWithDescriptions.length > 0) {
                        return optionsWithDescriptions.filter((option: any) => 
                          !(option.value === 'Others (please specify)' && (q.key === 'otherConcerns' || q.key === 'diagnosedCondition' || q.key === 'familyHistory'))
                        );
                      }
                      
                      // 기존 문자열 배열 옵션들
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
                           // Chip Others 포커스 시 보조 로그
                           console.log('[otherConcernsText] Others (chip) TextInput 포커스');
                         },
                          scrollToInput: (node) => {
                            try {
                              // Others는 하단 고정 버튼 때문에 여유를 더 줌 (일반보다 크게)
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
                           console.log('[diagnosedConditionText] Others (chip) TextInput 포커스');
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
                           console.log('[familyHistoryText] Others (chip) TextInput 포커스');
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
                        // 설명이 있는 옵션들
                        const optionsWithDescriptions = getOptionsWithDescriptions(q.key);
                        if (optionsWithDescriptions.length > 0) {
                          return optionsWithDescriptions.filter((option: any) => 
                            !(option.value === 'Others (please specify)' && (q.key === 'diagnosedCondition' || q.key === 'otherConcerns' || q.key === 'familyHistory'))
                          );
                        }
                        
                        // 기존 문자열 배열 옵션들
                        return q.options?.filter(option => 
                          !(option === 'Others (please specify)' && (q.key === 'diagnosedCondition' || q.key === 'otherConcerns' || q.key === 'familyHistory'))
                        ) || [];
                      })()}
                      selectedValue={q.inputType === 'single-choice' ? answers[q.key] as string : answers[q.key] as string[]}
                      onSelect={(value) => handleAnswer(q.key, value, q.inputType)}
                      layout={q.optionsLayout || 'default'}
                      multiple={q.inputType === 'multiple-choice'}
                    />
                    {/* Others 옵션들 - 기본 모드로 렌더링 */}
                     {q.key === 'otherConcerns' && (
                      <OthersOption
                        questionKey={q.key}
                        isSelected={isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice')}
                        onSelect={() => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice')}
                        placeholder="Please specify your concern"
                        value={answers.otherConcernsText as string || ''}
                        onChangeText={(text) => handleAnswer('otherConcernsText', text, 'text')}
                        onFocus={() => {
                          console.log('[otherConcernsText] Others TextInput 포커스 - 키보드 스크롤 시작');
                          console.log('[otherConcernsText] extraScrollHeight: ' + responsiveHeight(15) + ', extraHeight: ' + responsiveHeight(20));
                          console.log('[otherConcernsText] 추가 여백: ' + responsiveHeight(25));
                        }}
                        containerStyle={{
                          marginBottom: 0, // 여백 제거
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
                        onFocus={() => {
                          console.log('[diagnosedConditionText] Others TextInput 포커스 - 키보드 스크롤 시작');
                        }}
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
                        onFocus={() => {
                          console.log('[familyHistoryText] Others TextInput 포커스 - 키보드 스크롤 시작');
                        }}
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

                 {/* 하단 그라디언트 배경과 버튼 */}

       </View>
       <FixedBottomContainer avoidKeyboard={false}> 
         <PrimaryButton
           title="Continue"
           onPress={handleContinue}
           disabled={!isCurrentStepComplete()}
         />
       </FixedBottomContainer>
      {showDatePicker && (
        <DateTimePicker
          value={answers.lastPeriodDate && typeof answers.lastPeriodDate === 'string' && !isNaN(new Date(answers.lastPeriodDate).getTime()) ? new Date(answers.lastPeriodDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
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
        paddingBottom: responsiveHeight(20), // 그라디언트 영역을 위한 충분한 공간
        alignItems: 'center',
        flexGrow: 1, // 콘텐츠가 적을 때도 전체 높이 사용
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
    // 추가 질문 화면용 maskedView 스타일
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
  // IntroScreen 스타일과 동일한 스타일들
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
});

export default QuestionScreen; 