import { useRef } from 'react';
import { Text, View } from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';

import { QuestionnaireQuestionField } from './QuestionnaireQuestionField';
import { questionnaireStyles as styles } from './questionnaireStyles';
import { isStepComplete } from './questionnaireValidation';
import type { QuestionnaireAnswers, QuestionnaireStep, SubmissionState } from './types';

interface QuestionnaireScreenViewProps {
  readonly answers: QuestionnaireAnswers;
  readonly currentStep: QuestionnaireStep;
  readonly currentStepIndex: number;
  readonly onAnswer: (key: string, value: string, type: 'text' | 'number' | 'single-choice' | 'multiple-choice' | 'date') => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly submission: SubmissionState;
}

export function QuestionnaireScreenView({ answers, currentStep, currentStepIndex, onAnswer, onBack, onContinue, submission }: QuestionnaireScreenViewProps) {
  const scroll = useRef<{ scrollToFocusedInput?: (node: number | null, offset: number, duration: number) => void } | null>(null);
  const progress = (currentStepIndex + 1) / 8;
  const scrollToInput = (node: number | null) => {
    try { scroll.current?.scrollToFocusedInput?.(node, responsiveHeight(28), 220); } catch { /* keyboard scrolling is best-effort */ }
  };
  const disabled = !isStepComplete(currentStep, answers) || submission === 'submitting';

  return <SafeAreaView edges={['top']} style={styles.container}>
    <View style={styles.flex}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 8, now: currentStepIndex + 1 }}>
          <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <KeyboardAwareScrollView style={styles.flex} contentContainerStyle={[styles.scrollContent, { minHeight: '100%' }]} keyboardShouldPersistTaps="handled" enableOnAndroid enableAutomaticScroll extraScrollHeight={responsiveHeight(12)} extraHeight={responsiveHeight(4)} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false} keyboardOpeningTime={220} innerRef={(reference) => { scroll.current = reference; }}>
        <View style={styles.questionContent}>
          <View style={styles.character}><AuvraCharacter size={responsiveWidth(20)} /></View>
          <View style={styles.questionTextContainer}>
            <View style={styles.maskedView}>
              <MaskedView style={styles.maskedViewInner} maskElement={<Text style={[styles.questionText, { backgroundColor: 'transparent' }]}>{currentStep.dialogue}</Text>}>
                <LinearGradient colors={['#A29AEA', '#C17EC9', '#E98BAC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill} />
              </MaskedView>
            </View>
            {currentStep.subtitle ? <Text style={styles.subtitle}>{currentStep.subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.fields}>
          {currentStep.questions.map((question) => <QuestionnaireQuestionField key={question.id} question={question} answers={answers} onAnswer={onAnswer} scrollToInput={scrollToInput} />)}
        </View>
      </KeyboardAwareScrollView>
    </View>
    <FixedBottomContainer avoidKeyboard={false}>
      <PrimaryButton title={submission === 'submitting' ? 'Saving...' : 'Continue'} onPress={onContinue} disabled={disabled} />
    </FixedBottomContainer>
  </SafeAreaView>;
}
