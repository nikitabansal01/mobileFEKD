import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import GradientText from "@/components/GradientText";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import PrimaryButton from '@/components/PrimaryButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import GraphicProgesterone1 from '@/assets/images/SVG/GraphicProgesterone1';
import GraphicTestosterone1 from '@/assets/images/SVG/GraphicTestosterone1';

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
};

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResultScreen'>;

/**
 * Result screen component for displaying hormone analysis results
 * Features hormone cards with priority badges and navigation to next step
 */
const ResultScreen = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();

  /**
   * Handle continue navigation to result loading screen
   */
  const handleContinue = () => {
    navigation.navigate('ResultLoadingScreen');
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <View style={styles.backButtonContainer}>
        <BackButton onPress={handleBack} />
      </View>

      {/* Main content */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.mainContent,
          { minHeight: '100%' }
        ]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={0}
        extraHeight={0}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Auvra character and title */}
          <View style={styles.headerSection}>
            <View style={styles.characterContainer}>
              <AuvraCharacter size={responsiveWidth(15)} />
            </View>
            
            <View style={styles.titleContainer}>
              <GradientText
                text="Some of your hormone buddies are feeling off"
                textStyle={styles.title}
                containerStyle={styles.maskedView}
              />
            </View>
          </View>

          {/* Hormone cards */}
          <View style={styles.cardsContainer}>
            {/* Progesterone card */}
            <View style={styles.cardWrapper}>
              <View style={styles.hormoneCard}>
                <View style={styles.cardContent}>
                  {/* Title and Subtitle - not affected by maxWidth */}
                  <View style={styles.titleSubtitleContainer}>
                    <Text style={styles.hormoneName}>
                      Progesterone, <Text style={styles.hormoneSubtitle}>The calmer</Text>
                    </Text>
                  </View>
                  
                  {/* Description only affected by maxWidth */}
                  <View style={styles.textSection}>
                    <Text style={styles.hormoneDescription}>
                      🔻 Lower levels may be contributing to{' '}
                      <Text style={styles.underlineText}>painful periods</Text>
                      , and{' '}
                      <Text style={styles.underlineText}>mood changes</Text>.
                    </Text>
                  </View>
                  <View style={[styles.graphicSection, styles.progesteroneGraphic]}>
                    <GraphicProgesterone1 
                      width={responsiveWidth(50)} 
                      height={responsiveWidth(50)} 
                    />
                  </View>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>High Priority</Text>
              </View>
            </View>

            {/* Testosterone card */}
            <View style={styles.cardWrapper}>
              <View style={styles.hormoneCard}>
                <View style={styles.cardContent}>
                  {/* Title and Subtitle - not affected by maxWidth */}
                  <View style={styles.titleSubtitleContainer}>
                    <Text style={styles.hormoneName}>
                      Testosterone, <Text style={styles.hormoneSubtitle}>The titan</Text>
                    </Text>
                  </View>
                  
                  {/* Description only affected by maxWidth */}
                  <View style={styles.textSection}>
                    <Text style={styles.hormoneDescription}>
                      🔺 Higher levels may be contributing to{' '}
                      <Text style={styles.underlineText}>acne</Text>
                      ,{' '}
                      <Text style={styles.underlineText}>excess hair</Text>
                      , and{' '}
                      <Text style={styles.underlineText}>mood swings</Text>
                      , common in{' '}
                      <Text style={styles.underlineText}>PCOS</Text>.
                    </Text>
                  </View>
                  <View style={[styles.graphicSection, styles.testosteroneGraphic]}>
                    <GraphicTestosterone1 
                      width={responsiveWidth(50)} 
                      height={responsiveWidth(50)} 
                    />
                  </View>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Moderate</Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Fixed bottom area */}
      <FixedBottomContainer>
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            This analysis is for informational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.
          </Text>
        </View>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
        />
      </FixedBottomContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButtonContainer: {
    position: 'absolute',
    top: responsiveHeight(6),
    left: responsiveWidth(4),
    zIndex: 30,
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: responsiveHeight(8), // Move Auvra character position up
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(20), // Sufficient space for bottom button
    flexGrow: 1, // Use full height even when content is small
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedView: {
    width: responsiveWidth(80),
    height: responsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientText: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(2.27),
    textAlign: 'center',
    lineHeight: responsiveHeight(2.8),
  },
  cardsContainer: {
    width: responsiveWidth(78),
    gap: responsiveHeight(2.7),
  },
  cardWrapper: {
    position: 'relative',
    marginTop: responsiveHeight(1), // Margin for High Priority tag
  },
  hormoneCard: {
    backgroundColor: '#FFFBFC',
    borderRadius: 12,
    padding: responsiveWidth(6),
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#cfcfcf',
    elevation: 3,
    overflow: 'hidden', // Clip parts that extend beyond card area
  },
  cardContent: {
    flexDirection: 'column', // Vertical layout
    alignItems: 'flex-start', // Left alignment
    position: 'relative', // Reference point for absolute positioned elements
  },
  textSection: {
    maxWidth: responsiveWidth(46), // Limit maximum width for text area (description only)
    zIndex: 2, // Display above image (zIndex: 1)
  },
  hormoneName: {
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(1.98), //14px
    color: '#000000',
    lineHeight: responsiveHeight(2),
    fontWeight: '600',
  },
  hormoneSubtitle: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), //12px
    color: '#6f6f6f',
  },
  hormoneDescription: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7), //12px
    color: '#6f6f6f',
    lineHeight: responsiveHeight(2),
    marginTop: responsiveHeight(0.5),
  },
  underlineText: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(0,0,0,0.5)',
  },
  graphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute', // Absolute positioning
    zIndex: 1, // Display behind text
  },
  progesteroneGraphic: {
    right: responsiveWidth(-18), // Progesterone image position
    bottom: responsiveHeight(-8.5), // Relative position from card bottom
  },
  testosteroneGraphic: {
    right: responsiveWidth(-21), // Testosterone image position (more to the right)
    bottom: responsiveHeight(-8.5), // Relative position from card bottom
  },
  priorityBadge: {
    position: 'absolute',
    top: responsiveHeight(-1.3), // Slightly above card
    left: responsiveWidth(4),
    backgroundColor: '#F2F0F2',
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.3),
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    elevation: 1,
    zIndex: 10, // Display above image (zIndex: 1) with high zIndex
  },
  priorityText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.42), //10px
    color: '#6f6f6f',
    textAlign: 'center',
    fontWeight: '500',
  },
  disclaimerContainer: {
    marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
  },
  disclaimerText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42), //10px
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveHeight(1.5),
  },
  titleSubtitleContainer: {
    flex: 1,
    marginBottom: responsiveHeight(0.5),
    zIndex: 2, // Display above image (zIndex: 1)
  },
});

export default ResultScreen; 