import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Pressable, Alert, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import AuvraCharacter from '@/components/AuvraCharacter';
import DialogueBubble from '@/components/DialogueBubble';
import PrimaryButton from '@/components/PrimaryButton';
import SVG from '@/assets/images/SVG';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BackButton from '@/components/BackButton';
import { useRouter } from 'expo-router';
import LoadingScreen from '@/app/screens/LoadingScreen';
import sessionService from '@/services/sessionService';

import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import OptionButtonsContainer from '@/components/customComponent/OptionButtonsContainer';
import TextInputContainer from '@/components/customComponent/TextInputContainer';
import ChipOptionContainer from '@/components/customComponent/ChipOptionContainer';
import NotSureButton from '@/components/customComponent/NotSureButton';

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
          "Dysmenorrhea (painful periods)",
          "Amenorrhea (absence of periods)",
          "Menorrhagia (prolonged/heavy bleeding)",
          "Metrorrhagia (irregular bleeding)",
          "Cushing’s Syndrome (PMS)",
          "Premenstrual Syndrome (PMS)",
          "None of the above",
          "Others (please specify)"
        ],
        key: "diagnosedCondition",
      }
    ]
  },
];

const QuestionScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const othersInputRef = useRef<TextInput>(null);

  const totalSteps = questionSteps.length;
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
    if (currentStep > 0) {
      // 이전 단계로 이동 (답변은 유지됨)
      setCurrentStep(currentStep - 1);
    } else {
      // 첫 번째 단계에서 백버튼을 누르면 intro screen으로 이동
      router.push('/screens/IntroScreen');
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
    
    if (type === 'multiple-choice') {
      setAnswers(prev => {
        const existingAnswers = (prev[key] as string[]) || [];
        const newAnswers = existingAnswers.includes(normalizedValue)
          ? existingAnswers.filter(item => item !== normalizedValue)
          : [...existingAnswers, normalizedValue];
        return { ...prev, [key]: newAnswers };
      });
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



  // Clear 버튼 핸들러
  const handleClearInput = (key: string) => {
    setAnswers(prev => ({ ...prev, [key]: '' }));
  };

  const handleContinue = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 질문일 때 답변 저장
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
            router.push('/screens/ResultScreen');
          }, loadingTime);
        } else {
          console.error('답변 저장 실패');
          // 실패해도 결과 화면으로 이동 (최소 1초 로딩)
          setTimeout(() => {
            setShowLoading(false);
            router.push('/screens/ResultScreen');
          }, 1000);
        }
      } catch (error) {
        console.error('답변 저장 중 오류:', error);
        // 오류 발생해도 결과 화면으로 이동 (최소 1초 로딩)
      setTimeout(() => {
        setShowLoading(false);
        router.push('/screens/ResultScreen');
        }, 1000);
      }
    }
  };

  const currentStepData = questionSteps[currentStep];



  if (showLoading) {
    return <LoadingScreen />;
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
          extraScrollHeight={0}
          extraHeight={0}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            console.log('[KeyboardAwareScrollView] 스크롤 발생:', event.nativeEvent.contentOffset.y);
          }}
        >
          <View style={styles.mainContent}>
          {/* 캐릭터와 질문 텍스트 */}
          <View style={styles.characterAndQuestion}>
            <View style={styles.characterContainer}>
              <AuvraCharacter size={responsiveWidth(25)} />
            </View>
            <View style={styles.questionTextContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.questionText}>
                    {currentStepData.dialogue}
                  </Text>
                }
                style={styles.maskedView}
              >
                <LinearGradient
                  colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                  locations={[0, 0.32, 0.5, 0.73, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientText}
                />
              </MaskedView>
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
                      styles.textInput, 
                      answers[q.key] && styles.optionButtonSelected,
                      {
                        width: '100%',
                        alignSelf: 'stretch',
                      }
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={answers[q.key] ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {answers[q.key] as string || q.placeholder}
                    </Text>
                  </TouchableOpacity>
                ) : q.key === 'cycleLength' || q.optionsLayout === 'wrap' ? (
                  <ChipOptionContainer
                    options={q.options?.filter(option => 
                      !(option === 'Others (please specify)' && (q.key === 'diagnosedCondition' || q.key === 'otherConcerns'))
                    ).map(option => ({
                      id: option,
                      text: option,
                      value: option,
                    })) || []}
                    selectedValue={q.inputType === 'single-choice' ? answers[q.key] as string : answers[q.key] as string[]}
                    onSelect={(value) => handleAnswer(q.key, value, q.inputType)}
                    multiple={q.inputType === 'multiple-choice'}
                  />
                ) : (
                  <>
                    <OptionButtonsContainer
                      options={q.options?.map(option => ({
                        id: option,
                        text: option,
                        value: option,
                      })) || []}
                      selectedValue={q.inputType === 'single-choice' ? answers[q.key] as string : answers[q.key] as string[]}
                      onSelect={(value) => {
                        if (value === 'Others (please specify)') {
                          handleOthersSelect(q.key, value, q.inputType);
                        } else {
                          handleAnswer(q.key, value, q.inputType);
                        }
                      }}
                      layout={q.optionsLayout || 'default'}
                      multiple={q.inputType === 'multiple-choice'}
                    />
                    {/* Others 입력창을 항상 렌더링하되 조건부로 숨김 처리 */}
                    {q.key === 'otherConcerns' && (
                      <View style={{ 
                        height: isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice') ? 'auto' : 0,
                        overflow: 'hidden',
                        opacity: isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice') ? 1 : 0,
                        alignSelf: 'stretch', // 전체 너비 사용
                        width: '100%', // 전체 너비 사용
                        marginBottom: responsiveHeight(25), // 그라디언트 영역을 위한 추가 여백
                      }}>
                        <TextInputContainer
                          placeholder="Please specify your concern"
                          value={answers.otherConcernsText as string || ''}
                          onChangeText={(text) => handleAnswer('otherConcernsText', text, 'text')}
                          containerStyle={{
                            width: '100%',
                            alignSelf: 'stretch',
                          }}
                          onFocus={() => {
                            console.log('[otherConcernsText] Others TextInput 포커스 - 키보드 스크롤 시작');
                            console.log('[otherConcernsText] extraScrollHeight: ' + responsiveHeight(15) + ', extraHeight: ' + responsiveHeight(20));
                            console.log('[otherConcernsText] 추가 여백: ' + responsiveHeight(25));
                          }}
                        />
                      </View>
                    )}
                  </>
                )}
                
                {/* Diagnosed Condition Others 텍스트 입력 */}
                {q.key === 'diagnosedCondition' && q.options?.includes('Others (please specify)') && (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.optionButton, isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice') && styles.optionButtonSelected]}
                      onPress={() => handleOthersSelect(q.key, 'Others (please specify)', 'multiple-choice')}
                    >
                      <Text style={[styles.optionText, isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice') && styles.optionTextSelected]}>
                        Others (please specify)
                      </Text>
                    </TouchableOpacity>
                    
                    {isOptionSelected(q.key, 'Others (please specify)', 'multiple-choice') && (
                      <TextInputContainer
                        placeholder="Please specify your condition"
                        value={answers.diagnosedConditionText as string || ''}
                        onChangeText={(text) => handleAnswer('diagnosedConditionText', text, 'text')}
                        containerStyle={{
                          width: '100%',
                          alignSelf: 'stretch',
                        }}
                      />
                    )}
                  </View>
                )}
                {q.notSureText && (
                  <NotSureButton
                    text={q.notSureText}
                    onPress={() => handleAnswer(q.key, q.notSureText || '', 'single-choice')}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
        </KeyboardAwareScrollView>

                 {/* 하단 그라디언트 배경과 버튼 */}

       </View>
       <FixedBottomContainer> 
         <PrimaryButton
           title="Continue"
           onPress={handleContinue}
           style={styles.continueButton}
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
        gap: responsiveWidth(3),
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
        paddingTop: responsiveHeight(3),
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
    gradientText: {
        width: '100%',
        height: '100%',
    },
    questionText: {
        fontFamily: 'NotoSerif600',
        fontSize: responsiveFontSize(2.2),
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
    fontSize: responsiveFontSize(1.6),
    color: '#c17ec9',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  inputLabelText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.7),
    color: '#000000',
    lineHeight: responsiveHeight(1.7),
    textAlign: 'center',
  },
    textInput: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        width: responsiveWidth(80),
        height: 60,
        paddingHorizontal: 20,
        fontFamily: 'Inter400',
        fontSize: responsiveFontSize(1.7),
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        textAlign: 'left',
    },
  datePickerText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.5),
    color: '#000000',
    textAlign: 'left',
  },
  datePickerPlaceholder: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.2),
    color: '#b3b3b3',
    textAlign: 'left',
  },
      optionsContainer: {
        gap: responsiveHeight(2.25),
        alignSelf: 'stretch',
    },
  optionButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    height: responsiveHeight(4.5),
    paddingHorizontal: responsiveWidth(5),
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  chipOptionButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#c17ec9',
    borderWidth: 1.5,
  },
  optionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.2),
    color: '#000000',
  },
  chipOptionText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.5),
    color: '#000000',
  },
  optionTextSelected: {
    color: '#000000',
  },

  wrappedOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    },
    continueButton: {
    width: responsiveWidth(88),
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
    fontSize: responsiveFontSize(1.3),
    color: '#b3b3b3',
    zIndex: 1,
  },
  inputText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.8),
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
    fontSize: responsiveFontSize(1.7),
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
    fontSize: responsiveFontSize(1.6),
    color: '#6f6f6f',
    textAlign: 'center',
    marginTop: responsiveHeight(1),
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
});

export default QuestionScreen; 