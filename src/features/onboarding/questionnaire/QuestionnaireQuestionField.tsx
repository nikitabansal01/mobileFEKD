import { Text, View } from 'react-native';
import { responsiveHeight } from 'react-native-responsive-dimensions';

import DatePickerButton from '@/components/DatePickerButton';
import ChipOptionContainer from '@/components/customComponent/ChipOptionContainer';
import NotSureButton from '@/components/customComponent/NotSureButton';
import OptionButtonsContainer from '@/components/customComponent/OptionButtonsContainer';
import OthersOption from '@/components/customComponent/OthersOption';
import TextInputContainer from '@/components/customComponent/TextInputContainer';
import { getOptionsWithDescriptions } from '@/constants/QuestionOptions';
import { createInputStyle } from '@/utils/inputStyles';

import { questionnaireStyles as styles } from './questionnaireStyles';
import type { QuestionnaireAnswers, QuestionnaireQuestion } from './types';

interface QuestionnaireQuestionFieldProps {
  readonly answers: QuestionnaireAnswers;
  readonly onAnswer: (key: string, value: string, inputType: QuestionnaireQuestion['inputType']) => void;
  readonly question: QuestionnaireQuestion;
  readonly scrollToInput: (node: number | null) => void;
}

const othersQuestionKeys = new Set(['otherConcerns', 'diagnosedCondition', 'familyHistory']);

function dateFor(value: QuestionnaireAnswers[string]): Date {
  if (typeof value !== 'string' || !value) return new Date();
  const dateParts = value.split('/');
  const parsed = dateParts.length === 3
    ? new Date(Number(dateParts[2]), Number(dateParts[0]) - 1, Number(dateParts[1]))
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function optionList(question: QuestionnaireQuestion) {
  const described = getOptionsWithDescriptions(question.key);
  const options = described.length ? described : question.options ?? [];
  return options.filter((option: { value?: string } | string) => {
    const value = typeof option === 'string' ? option : option.value;
    return !(value === 'Others (please specify)' && othersQuestionKeys.has(question.key));
  });
}

function isSelected(answers: QuestionnaireAnswers, question: QuestionnaireQuestion, option: string): boolean {
  const answer = answers[question.key];
  return question.inputType === 'multiple-choice' ? Array.isArray(answer) && answer.includes(option) : answer === option;
}

function otherInputKey(questionKey: string): string {
  return `${questionKey}Text`;
}

export function QuestionnaireQuestionField({ answers, onAnswer, question, scrollToInput }: QuestionnaireQuestionFieldProps) {
  const selected = answers[question.key];
  const selectOther = () => onAnswer(question.key, 'Others (please specify)', 'multiple-choice');
  const displayOther = othersQuestionKeys.has(question.key) && question.options?.includes('Others (please specify)');
  const onDateChange = (date: Date) => {
    const formatted = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    onAnswer(question.key, formatted, 'date');
  };

  return (
    <View style={styles.field}>
      <QuestionLabel question={question} />
      {question.inputType === 'text' || question.inputType === 'number' ? (
        <TextInputContainer
          placeholder={question.placeholder ?? ''}
          value={typeof selected === 'string' || typeof selected === 'number' ? String(selected) : ''}
          onChangeText={(value) => onAnswer(question.key, value, question.inputType)}
          keyboardType={question.inputType === 'number' ? 'numeric' : 'default'}
          containerStyle={{ width: '100%', alignSelf: 'stretch' }}
          onFocus={() => scrollToInput(null)}
        />
      ) : question.inputType === 'date' ? (
        <DatePickerButton
          value={dateFor(selected)}
          onDateChange={onDateChange}
          placeholder={question.placeholder ?? 'Select Date'}
          style={[createInputStyle(selected ? 'selected' : 'default'), { width: '100%', alignSelf: 'stretch', height: responsiveHeight(7), paddingVertical: responsiveHeight(2), justifyContent: 'center', alignItems: 'flex-start' }]}
        />
      ) : question.key === 'cycleLength' || question.optionsLayout === 'wrap' ? (
        <ChipFields answers={answers} displayOther={displayOther} onAnswer={onAnswer} question={question} scrollToInput={scrollToInput} selectOther={selectOther} />
      ) : (
        <ButtonFields answers={answers} displayOther={displayOther} onAnswer={onAnswer} question={question} scrollToInput={scrollToInput} selectOther={selectOther} />
      )}
      {question.notSureText ? <NotSureButton text={question.notSureText} onPress={() => onAnswer(question.key, question.notSureText ?? '', question.inputType)} style={{ marginTop: -8 }} /> : null}
    </View>
  );
}

interface QuestionLabelProps { readonly question: QuestionnaireQuestion; }

function QuestionLabel({ question }: QuestionLabelProps) {
  if (!question.question) return null;
  if (!question.isSubheading) return <Text style={styles.label}>{question.question}</Text>;
  if (question.key === 'birthControl') return <View style={styles.sectionBirthControl}><Text style={styles.sectionText}>{question.question}</Text></View>;
  return <View style={styles.section}><View style={styles.divider} /><Text style={styles.sectionText}>{question.question}</Text><View style={styles.divider} /></View>;
}

interface ChoiceFieldsProps {
  readonly answers: QuestionnaireAnswers;
  readonly displayOther: boolean | undefined;
  readonly onAnswer: QuestionnaireQuestionFieldProps['onAnswer'];
  readonly question: QuestionnaireQuestion;
  readonly scrollToInput: QuestionnaireQuestionFieldProps['scrollToInput'];
  readonly selectOther: () => void;
}

function ChipFields(props: ChoiceFieldsProps) {
  const other = otherProps(props);
  return <ChipOptionContainer options={optionList(props.question)} selectedValue={selectionFor(props)} onSelect={(value) => props.onAnswer(props.question.key, value, props.question.inputType)} multiple={props.question.inputType === 'multiple-choice'} showOthersOption={Boolean(props.displayOther)} othersOptionProps={other} />;
}

function ButtonFields(props: ChoiceFieldsProps) {
  return <>
    <OptionButtonsContainer options={optionList(props.question)} selectedValue={selectionFor(props)} onSelect={(value) => props.onAnswer(props.question.key, value, props.question.inputType)} layout={props.question.optionsLayout ?? 'default'} multiple={props.question.inputType === 'multiple-choice'} />
    {props.displayOther ? <OtherOption {...props} /> : null}
  </>;
}

function OtherOption(props: ChoiceFieldsProps) {
  const textKey = otherInputKey(props.question.key);
  return <OthersOption questionKey={props.question.key} isSelected={isSelected(props.answers, props.question, 'Others (please specify)')} onSelect={props.selectOther} placeholder={otherPlaceholder(props.question.key)} value={typeof props.answers[textKey] === 'string' ? props.answers[textKey] : ''} onChangeText={(value) => props.onAnswer(textKey, value, 'text')} expandedMode={props.question.key !== 'otherConcerns'} containerStyle={props.question.key === 'otherConcerns' ? { marginBottom: 0 } : undefined} scrollToInput={props.scrollToInput} />;
}

function otherProps(props: ChoiceFieldsProps) {
  if (!props.displayOther) return undefined;
  const textKey = otherInputKey(props.question.key);
  return { questionKey: props.question.key, isSelected: isSelected(props.answers, props.question, 'Others (please specify)'), onSelect: props.selectOther, placeholder: otherPlaceholder(props.question.key), value: typeof props.answers[textKey] === 'string' ? props.answers[textKey] : '', onChangeText: (value: string) => props.onAnswer(textKey, value, 'text'), scrollToInput: props.scrollToInput };
}

function selectionFor(props: ChoiceFieldsProps): string | string[] | undefined {
  const value = props.answers[props.question.key];
  return typeof value === 'string' || Array.isArray(value) ? value : undefined;
}

function otherPlaceholder(questionKey: string): string {
  return questionKey === 'otherConcerns' ? 'Please specify your concern' : questionKey === 'diagnosedCondition' ? 'Please specify your condition' : 'Please specify the condition';
}
