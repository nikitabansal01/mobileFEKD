import Images from '@/assets/images';
import AuvraCharacter from '@/components/AuvraCharacter';
import BackButton from '@/components/BackButton';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import sessionService from '@/services/sessionService';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

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

  const [isLoading, setIsLoading] = useState(true);
  const [primaryCard, setPrimaryCard] = useState<any | null>(null);
  const [secondaryCard, setSecondaryCard] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get variant character image based on hormone + level + priority.
   * We intentionally support expressive poses to differentiate states (e.g. high vs low) when assets exist.
   * Asset naming strategy (current assumptions based on existing files):
   * - <Hormone>Character.png           → Neutral / baseline ("moderate" display / unknown)
   * - <Hormone>BothHand.png / BothHandsUp.png → Elevated / "high" energetic state
   * - <Hormone>LeftHand.png            → "low" / subdued state
   * - ProgesteroneSadCalmer / VerySadCalmer   → Low progesterone (severity mapped by priority)
   * - ProgesteroneSuperExcitedCalmer / ExcitedCalmer → (reserved for potential future high state if introduced)
   * If an expected variant is missing, we gracefully fall back to the neutral Character.
   */
  const getHormoneImage = (hormone?: string, level?: string, priority?: string, isPrimary?: boolean, score?: number) => {
    const h = (hormone || '').toLowerCase();
    const lvl = (level || '').toLowerCase();
    const sc = typeof score === 'number' ? score : 0;

    // Helper to prefer existing key safely
    const safe = (img: any, fallback: any) => img ? img : fallback;

    // Severity tiers (coarse): allow broader score range future-proofing
    // Tier 3 (strong): sc >= 8, Tier 2 (moderate): sc >= 4, Tier 1 (mild): <4
    const tier3 = sc >= 8;
    const tier2 = sc >= 4 && sc < 8;

    // Progesterone (only low state currently returned by backend)
    if (h === 'progesterone') {
      if (lvl === 'low') {
        if (tier3) return safe(Images.ProgesteroneVerySadCalmer, Images.ProgesteroneSadCalmer);
        if (tier2) return safe(Images.ProgesteroneSadCalmer, Images.ProgesteroneCharacter);
        // Mild → neutral calmer baseline
        return safe(Images.ProgesteroneCalmer, Images.ProgesteroneCharacter);
      }
      // Future: map high progesterone if ever supported
      return Images.ProgesteroneCharacter;
    }

    // Testosterone / Androgens
    if (h === 'androgens') {
      if (lvl === 'high') {
        return safe(Images.AndrogensBothHand, Images.AndrogensCharacter);
      } else if (lvl === 'low') {
        return safe(Images.AndrogensLeftHand, Images.AndrogensCharacter);
      }
      return Images.AndrogensCharacter;
    }

    if (h === 'testosterone') {
      if (lvl === 'high') {
        // Energetic pose if available
        return safe(Images.TestosteroneBothHand, Images.TestosteroneCharacter);
      } else if (lvl === 'low') {
        // Subdued pose
        return safe(Images.TestosteroneLeftHand, Images.TestosteroneCharacter);
      }
      return Images.TestosteroneCharacter;
    }

    if (h === 'estrogen') {
      if (lvl === 'high') return safe(Images.EstrogenBothHand, Images.EstrogenCharacter);
      if (lvl === 'low') return safe(Images.EstrogenLeftHand, Images.EstrogenCharacter);
      return Images.EstrogenCharacter;
    }

    if (h === 'insulin') {
      if (lvl === 'high') return safe(Images.InsulinBothHand, Images.InsulinCharacter);
      if (lvl === 'low') return safe(Images.InsulinLeftHand, Images.InsulinCharacter);
      return Images.InsulinCharacter;
    }

    if (h === 'cortisol') {
      if (lvl === 'high') return safe(Images.CortisolBothHand, Images.CortisolCharacter);
      if (lvl === 'low') return safe(Images.CortisolLeftHand, Images.CortisolCharacter);
      return Images.CortisolCharacter;
    }

    if (h === 'thyroid') {
      if (lvl === 'low') return safe(Images.ThyroidLeftHand, Images.ThyroidCharacter); // Only low state currently modeled
      if (lvl === 'high') return safe(Images.ThyroidBothHand, Images.ThyroidCharacter); // Future-proof
      return Images.ThyroidCharacter;
    }

    // Fallback generic neutral graphic if hormone not recognized
    return Images.GraphicGnRHDefault;
  };

  // Fetch hormone analysis on mount
  useEffect(() => {
    let isMounted = true;

    const loadHormoneAnalysis = async () => {
      try {
        const result = await sessionService.getHormoneAnalysis();
        if (!isMounted) return;

        if (result && Array.isArray(result.hormone_cards) && result.hormone_cards.length > 0) {
          // First card = primary (high priority)
          setPrimaryCard(result.hormone_cards[0]);
          // Second card = secondary (moderate) if exists
          setSecondaryCard(result.hormone_cards.length > 1 ? result.hormone_cards[1] : null);
        } else {
          setError('No hormone analysis available.');
        }
      } catch (e) {
        console.error('Error loading hormone analysis:', e);
        if (isMounted) {
          setError('Failed to load hormone analysis.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHormoneAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // While loading backend data, keep layout simple
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }] }>
        <ActivityIndicator size="large" color="#A29AEA" />
      </SafeAreaView>
    );
  }

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
              <AuvraCharacter size={responsiveWidth(20)} />
            </View>
            
            <View style={styles.titleContainer}>
              <View style={styles.maskedView}>
                <MaskedView
                  style={{ height: 60, width: '100%' }}
                  maskElement={
                    <Text style={[styles.title, { color: 'black' }]}>
                      Some of your hormone buddies are feeling off
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 60, width: '100%' }}
                  />
                </MaskedView>
              </View>
            </View>
          </View>

          {/* Hormone cards */}
          <View style={styles.cardsContainer}>
            {/* Primary hormone card */}
            {primaryCard && (
              <View style={styles.cardWrapper}>
                <View style={styles.hormoneCard}>
                  <View style={styles.cardContent}>
                    {/* Title and Subtitle */}
                    <View style={styles.titleSubtitleContainer}>
                      <Text style={styles.hormoneName}>
                        {primaryCard.name}, <Text style={styles.hormoneSubtitle}>{primaryCard.subtitle}</Text>
                      </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.textSection}>
                      <Text style={styles.hormoneDescription}>
                        {primaryCard.icon}{' '}
                        {primaryCard.description}
                      </Text>
                    </View>

                    {/* Hormone-specific character image */}
                    <View style={[styles.graphicSection, styles.progesteroneGraphic]}>
                      <Image
                        source={getHormoneImage(primaryCard.hormone, primaryCard.level, primaryCard.priority, primaryCard.is_primary, primaryCard.score)}
                        style={{ width: scale(120), height: verticalScale(120), resizeMode: 'contain' }}
                      />
                    </View>
                  </View>
                </View>
                {primaryCard.priority ? (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>{primaryCard.priority}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Secondary hormone card */}
            {secondaryCard && (
              <View style={styles.cardWrapper}>
                <View style={styles.hormoneCard}>
                  <View style={styles.cardContent}>
                    {/* Title and Subtitle */}
                    <View style={styles.titleSubtitleContainer}>
                      <Text style={styles.hormoneName}>
                        {secondaryCard.name}, <Text style={styles.hormoneSubtitle}>{secondaryCard.subtitle}</Text>
                      </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.textSection}>
                      <Text style={styles.hormoneDescription}>
                        {secondaryCard.icon}{' '}
                        {secondaryCard.description}
                      </Text>
                    </View>

                    {/* Hormone-specific character image */}
                    <View style={[styles.graphicSection, styles.testosteroneGraphic]}>
                      <Image
                        source={getHormoneImage(secondaryCard.hormone, secondaryCard.level, secondaryCard.priority, secondaryCard.is_primary, secondaryCard.score)}
                        style={{ width: scale(120), height: verticalScale(120), resizeMode: 'contain' }}
                      />
                    </View>
                  </View>
                </View>
                {secondaryCard.priority ? (
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>{secondaryCard.priority}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Fallback when no cards */}
            {!primaryCard && !secondaryCard && (
              <View style={styles.cardWrapper}>
                <View style={styles.hormoneCard}>
                  <Text style={styles.hormoneDescription}>
                    {error || 'We could not determine a clear hormone imbalance from your answers.'}
                  </Text>
                </View>
              </View>
            )}
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
    paddingTop: responsiveHeight(5), // Move Auvra character position up
    paddingHorizontal: responsiveWidth(5),
    // paddingBottom: responsiveHeight(10), // Sufficient space for bottom button
    // flexGrow: 1, // Use full height even when content is small
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
    fontSize: moderateScale(16, 1.5),
    textAlign: 'center',
    lineHeight: moderateScale(16, 1.5) * 1.5, // 150% line height
    letterSpacing: 0,
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
    right: scale(-22), // Progesterone image position
    bottom: verticalScale(-38), // Relative position from card bottom
  },
  testosteroneGraphic: {
    // right: responsiveWidth(-21), // Testosterone image position (more to the right)
    // bottom: responsiveHeight(-8.5), // Relative position from card bottom
    right: scale(-22), // Progesterone image position
    bottom: verticalScale(-25)
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