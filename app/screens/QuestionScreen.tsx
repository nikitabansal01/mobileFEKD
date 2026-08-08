import LoadingScreen from '@/app/screens/LoadingScreen';
import { QuestionnaireError } from '@/src/features/onboarding/questionnaire/QuestionnaireError';
import { QuestionnairePrompt } from '@/src/features/onboarding/questionnaire/QuestionnairePrompt';
import { QuestionnaireScreenView } from '@/src/features/onboarding/questionnaire/QuestionnaireScreenView';
import { useQuestionnaireController } from '@/src/features/onboarding/questionnaire/useQuestionnaireController';

const QuestionScreen = () => {
  const controller = useQuestionnaireController();
  if (controller.initialization === 'loading' || controller.state.submission === 'submitting') return <LoadingScreen />;
  if (controller.initialization === 'failed') return <QuestionnaireError message="We couldn't start your questionnaire. Please try again." onRetry={controller.retryInitialization} />;
  if (controller.state.submission === 'failed') return <QuestionnaireError message={controller.state.submissionError ?? 'We could not save your answers.'} onRetry={controller.retrySubmission} />;
  if (controller.state.isAdditionalPromptVisible) return <QuestionnairePrompt onBack={controller.goBack} onContinue={controller.continueAdditionalQuestions} onSkip={controller.retrySubmission} />;
  return <QuestionnaireScreenView answers={controller.state.answers} currentStep={controller.currentStep} currentStepIndex={controller.state.currentStep} onAnswer={controller.selectAnswer} onBack={controller.goBack} onContinue={controller.continueQuestionnaire} submission={controller.state.submission} />;
};

export default QuestionScreen;
