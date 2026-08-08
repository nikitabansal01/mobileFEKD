import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/components/PrimaryButton';

import { questionnaireStyles as styles } from './questionnaireStyles';

interface QuestionnaireErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function QuestionnaireError({ message, onRetry }: QuestionnaireErrorProps) {
  return <SafeAreaView edges={['top']} style={styles.container}>
    <View accessibilityRole="alert" style={styles.errorContent}>
      <Text style={styles.errorText}>{message}</Text>
      <PrimaryButton title="Try again" onPress={onRetry} />
    </View>
  </SafeAreaView>;
}
