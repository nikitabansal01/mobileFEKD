import { Text, TouchableOpacity, View } from 'react-native';
import { responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';

import { questionnaireStyles as styles } from './questionnaireStyles';

interface QuestionnairePromptProps {
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly onSkip: () => void;
}

export function QuestionnairePrompt({ onBack, onContinue, onSkip }: QuestionnairePromptProps) {
  return <SafeAreaView edges={['top']} style={styles.container}>
    <View style={styles.promptBackButton}><BackButton onPress={onBack} /></View>
    <View style={styles.promptContent}>
      <View style={styles.character}><AuvraCharacter size={responsiveWidth(35)} /></View>
      <View style={styles.promptText}>
        <View style={styles.promptMasked}>
          <MaskedView style={styles.maskedViewInner} maskElement={<Text style={[styles.promptDescription, { backgroundColor: 'transparent' }]}>Great! I have two more questions about your lifestyle and family medical history.</Text>}>
            <LinearGradient colors={['#A29AEA', '#C17EC9', '#E98BAC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientFill} />
          </MaskedView>
        </View>
      </View>
    </View>
    <FixedBottomContainer>
      <View style={styles.promptButtons}>
        <View style={styles.promptContinue}><PrimaryButton title="Continue" onPress={onContinue} /></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Skip additional questions for now" style={styles.skipButton} onPress={onSkip}><Text style={styles.skipButtonText}>Skip for now</Text></TouchableOpacity>
      </View>
    </FixedBottomContainer>
  </SafeAreaView>;
}
