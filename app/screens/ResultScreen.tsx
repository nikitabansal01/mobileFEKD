import Images from '@/assets/images';
import SVG from '@/assets/images/SVG';
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
  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [healthyMessage, setHealthyMessage] = useState<string | null>(null);

  const CARD_MIN_HEIGHT = responsiveHeight(15.5);

  /**
   * Get variant character image based on hormone.
   * All hormones now use BothHand images regardless of level (high/low/moderate).
   */
  const getHormoneImage = (hormone?: string, level?: string, priority?: string, isPrimary?: boolean, score?: number) => {
    const h = (hormone || '').toLowerCase();

    // Helper to prefer existing key safely
    const safe = (img: any, fallback: any) => img ? img : fallback;

    // All hormones use BothHand images regardless of level
    if (h === 'progesterone') {
      return safe(Images.ProgesteroneBothHand, Images.ProgesteroneCharacter);
    }

    if (h === 'androgens') {
      return safe(Images.AndrogensBothHand, Images.AndrogensCharacter);
    }

    if (h === 'testosterone') {
      return safe(Images.TestosteroneBothHand, Images.TestosteroneCharacter);
    }

    if (h === 'estrogen') {
      return safe(Images.EstrogenBothHand, Images.EstrogenCharacter);
    }

    if (h === 'insulin') {
      return safe(Images.InsulinBothHand, Images.InsulinCharacter);
    }

    if (h === 'cortisol') {
      return safe(Images.CortisolBothHand, Images.CortisolCharacter);
    }

    if (h === 'thyroid') {
      return safe(Images.ThyroidBothHand, Images.ThyroidCharacter);
    }

    // Fallback generic neutral graphic if hormone not recognized
    return Images.GraphicGnRHDefault;
  };

  /**
   * Old/prototype-style card art: absolutely positioned inside the card so
   * we don't reserve too much horizontal space for the illustration.
   */
  const getHormoneArtContainerStyle = (hormone?: string) => {
    const h = (hormone || '').toLowerCase();

    // Default: bottom-right inside the card  
    const base = {
      // Keep characters inside card bounds - reduced sizes for better fit
      right: scale(-8),
      bottom: verticalScale(-2),
      width: scale(90),
      height: scale(90),
    };

    if (h === 'progesterone') {
      return {
        ...base,
        width: scale(118),
        height: scale(118),
        right: scale(-14),
        bottom: verticalScale(-8),
      };
    }

    if (h === 'testosterone' || h === 'androgens') {
      return {
        ...base,
        // Reduced size to fit within card bounds
        width: scale(95),
        height: scale(95),
        right: scale(-10),
        bottom: verticalScale(-4),
      };
    }

    if (h === 'estrogen') {
      return {
        ...base,
        width: scale(112),
        height: scale(112),
        right: scale(-14),
        bottom: verticalScale(-8),
      };
    }

    if (h === 'insulin') {
      return {
        ...base,
        width: scale(110),
        height: scale(110),
        // Keep the waving arm away from the text.
        right: scale(-16),
        bottom: verticalScale(-10),
      };
    }

    if (h === 'thyroid') {
      return {
        ...base,
        // Smaller size to fit within card properly
        width: scale(90),
        height: scale(90),
        right: scale(-8),
        bottom: verticalScale(-2),
      };
    }

    if (h === 'cortisol') {
      return {
        ...base,
        // Reduced size to fit within card bounds
        width: scale(90),
        height: scale(90),
        right: scale(-8),
        bottom: verticalScale(-2),
      };
    }

    return {
      ...base,
    };
  };

  const getHormoneArtImageStyle = (hormone?: string) => {
    const h = (hormone || '').toLowerCase();

    // Slightly tone down tall assets
    if (h === 'insulin' || h === 'thyroid') {
      return {
        width: '100%' as const,
        height: '100%' as const,
        resizeMode: 'contain' as const,
        transform: [{ scale: 0.92 }],
      };
    }

    return {
      width: '100%' as const,
      height: '100%' as const,
      resizeMode: 'contain' as const,
      transform: [{ scale: 0.98 }],
    };
  };

  const handleCardLayout = (height: number) => {
    setMaxCardHeight((prev) => {
      const prevValue = prev ?? 0;
      const next = Math.max(prevValue, height, CARD_MIN_HEIGHT);
      return next === prevValue ? prev : next;
    });
  };

  // Fetch hormone analysis on mount
  useEffect(() => {
    let isMounted = true;

    const loadHormoneAnalysis = async () => {
      try {
        const result = await sessionService.getHormoneAnalysis();
        if (!isMounted) return;

        // Check if user is healthy (no significant symptoms)
        if (result && result.is_healthy) {
          setIsHealthy(true);
          setHealthyMessage(result.message || 'Based on your responses, your hormones appear to be balanced. This app is designed for users experiencing hormonal symptoms.');
        } else if (result && Array.isArray(result.hormone_cards) && result.hormone_cards.length > 0) {
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#A29AEA" />
      </SafeAreaView>
    );
  }

  // Healthy user screen - show when no significant symptoms detected
  if (isHealthy) {
    const handleHealthyBack = () => {
      // Navigate to OnboardingScreen for healthy users
      navigation.reset({
        index: 0,
        routes: [{ name: 'OnboardingScreen' }],
      });
    };

    return (
      <SafeAreaView style={styles.container}>
        {/* Decorative sparkles */}
        <View style={{ position: 'absolute', top: responsiveHeight(8), left: responsiveWidth(8), zIndex: 10 }} pointerEvents="none">
          <SVG.GraphicSparkle width={30} height={30} />
        </View>
        <View style={{ position: 'absolute', top: responsiveHeight(15), right: responsiveWidth(6), zIndex: 10 }} pointerEvents="none">
          <SVG.GraphicSparkle1 width={24} height={28} />
        </View>
        <View style={{ position: 'absolute', bottom: responsiveHeight(35), left: responsiveWidth(5), zIndex: 10 }} pointerEvents="none">
          <SVG.GraphicSparkle1 width={20} height={24} />
        </View>
        <View style={{ position: 'absolute', bottom: responsiveHeight(45), right: responsiveWidth(10), zIndex: 10 }} pointerEvents="none">
          <SVG.GraphicSparkle width={25} height={25} />
        </View>

        {/* Back button */}
        <View style={styles.backButtonContainer}>
          <BackButton onPress={handleHealthyBack} />
        </View>

        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.mainContent,
            { minHeight: '100%', justifyContent: 'center', paddingBottom: responsiveHeight(15) }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainContent, { alignItems: 'center' }]}>
            {/* Auvra character with glow effect */}
            <View style={styles.headerSection}>
              <View style={[styles.characterContainer, { marginBottom: responsiveHeight(2), alignItems: 'center', justifyContent: 'center' }]}>
                {/* Glow circle - perfectly centered behind character */}
                <View style={{
                  position: 'absolute',
                  width: responsiveWidth(38),
                  height: responsiveWidth(38),
                  borderRadius: responsiveWidth(19),
                  backgroundColor: 'rgba(187, 68, 113, 0.08)',
                }} />
                <AuvraCharacter size={responsiveWidth(28)} />
              </View>

              <View style={styles.titleContainer}>
                <View style={styles.maskedView}>
                  <MaskedView
                    style={{ height: 50, width: '100%' }}
                    maskElement={
                      <Text style={[styles.healthyTitle, { color: 'black' }]}>
                        You&apos;re doing great!
                      </Text>
                    }
                  >
                    <LinearGradient
                      colors={['#BB4471', '#D76B8C', '#E8A4B8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 50, width: '100%' }}
                    />
                  </MaskedView>
                </View>
                <Text style={styles.healthySubtitle}>
                  Your hormones appear balanced
                </Text>
              </View>
            </View>

            {/* Premium message card */}
            <View style={[styles.cardsContainer, { marginTop: responsiveHeight(3) }]}>
              <LinearGradient
                colors={['rgba(187, 68, 113, 0.06)', 'rgba(255, 255, 255, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 2,
                  marginHorizontal: responsiveWidth(2),
                }}
              >
                <View style={[styles.hormoneCard, {
                  paddingVertical: responsiveHeight(3.5),
                  paddingHorizontal: responsiveWidth(5),
                  borderRadius: 18,
                  backgroundColor: '#FEFEFE',
                }]}>
                  {/* Celebration emoji */}
                  <Text style={{ fontSize: responsiveFontSize(4), textAlign: 'center', marginBottom: responsiveHeight(1.5) }}>
                    🌸
                  </Text>

                  <Text style={styles.healthyCardTitle}>
                    Based on your responses, your hormones seem well-balanced.
                  </Text>

                  <View style={{
                    height: 1,
                    backgroundColor: 'rgba(187, 68, 113, 0.1)',
                    marginVertical: responsiveHeight(2),
                    marginHorizontal: responsiveWidth(5),
                  }} />

                  <Text style={styles.healthyCardBody}>
                    Auvra is designed for users experiencing hormonal symptoms like irregular periods, acne, mood swings, or other concerns.
                  </Text>

                  <Text style={styles.healthyCardNote}>
                    If you feel something isn&apos;t quite right, we always recommend consulting with a healthcare provider. 💜
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Soft encouragement */}
            <View style={{ marginTop: responsiveHeight(3), alignItems: 'center' }}>
              <Text style={styles.healthyFooter}>
                Keep taking care of yourself!
              </Text>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Fixed bottom area */}
        <FixedBottomContainer>
          <PrimaryButton
            title="Return to Home"
            onPress={handleHealthyBack}
          />
        </FixedBottomContainer>
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
                <View
                  style={[
                    styles.hormoneCard,
                    { minHeight: CARD_MIN_HEIGHT },
                    maxCardHeight ? { height: maxCardHeight } : null,
                  ]}
                  onLayout={(e) => handleCardLayout(e.nativeEvent.layout.height)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.titleSubtitleContainer}>
                      <Text style={styles.hormoneTitleStrong}>
                        {primaryCard.name}
                        <Text style={styles.hormoneTitleSoft}>, {primaryCard.subtitle}</Text>
                      </Text>
                    </View>

                    <View style={styles.textSection}>
                      <Text style={styles.hormoneDescription} numberOfLines={4} ellipsizeMode="tail">
                        {primaryCard.icon ? <Text style={styles.alertIconText}>{primaryCard.icon} </Text> : null}
                        {primaryCard.description}
                      </Text>
                    </View>

                    <View pointerEvents="none" style={[styles.graphicSection, getHormoneArtContainerStyle(primaryCard.hormone)]}>
                      <Image
                        source={getHormoneImage(primaryCard.hormone, primaryCard.level, primaryCard.priority, primaryCard.is_primary, primaryCard.score)}
                        style={getHormoneArtImageStyle(primaryCard.hormone)}
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
                <View
                  style={[
                    styles.hormoneCard,
                    { minHeight: CARD_MIN_HEIGHT },
                    maxCardHeight ? { height: maxCardHeight } : null,
                  ]}
                  onLayout={(e) => handleCardLayout(e.nativeEvent.layout.height)}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.titleSubtitleContainer}>
                      <Text style={styles.hormoneTitleStrong}>
                        {secondaryCard.name}
                        <Text style={styles.hormoneTitleSoft}>, {secondaryCard.subtitle}</Text>
                      </Text>
                    </View>

                    <View style={styles.textSection}>
                      <Text style={styles.hormoneDescription} numberOfLines={4} ellipsizeMode="tail">
                        {secondaryCard.icon ? <Text style={styles.alertIconText}>{secondaryCard.icon} </Text> : null}
                        {secondaryCard.description}
                      </Text>
                    </View>

                    <View pointerEvents="none" style={[styles.graphicSection, getHormoneArtContainerStyle(secondaryCard.hormone)]}>
                      <Image
                        source={getHormoneImage(secondaryCard.hormone, secondaryCard.level, secondaryCard.priority, secondaryCard.is_primary, secondaryCard.score)}
                        style={getHormoneArtImageStyle(secondaryCard.hormone)}
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
    width: responsiveWidth(82),
    gap: responsiveHeight(2.7),
  },
  cardWrapper: {
    position: 'relative',
    marginTop: responsiveHeight(1), // Margin for High Priority tag
  },
  hormoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: responsiveWidth(5.4),
    paddingTop: responsiveHeight(2.0),
    paddingBottom: responsiveHeight(1.9),
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E7E7EE',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    // Android shadow
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    position: 'relative',
    paddingRight: scale(8),
  },
  titleSubtitleContainer: {
    // Use padding (not a smaller maxWidth) so titles can wrap naturally while
    // still leaving breathing room for the buddy art.
    paddingRight: scale(96),
    marginBottom: responsiveHeight(0.35),
    zIndex: 2,
  },
  textSection: {
    paddingRight: scale(96),
    zIndex: 2,
  },
  graphicSection: {
    position: 'absolute',
    zIndex: 1,
  },
  hormoneTitleStrong: {
    fontSize: responsiveFontSize(2.05),
    color: '#0B0B0F',
    fontFamily: 'Inter600',
    lineHeight: responsiveFontSize(2.45),
  },
  hormoneTitleSoft: {
    fontSize: responsiveFontSize(1.9),
    color: '#66666F',
    fontFamily: 'Inter400',
  },
  hormoneDescription: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.78),
    color: '#66666F',
    lineHeight: responsiveFontSize(2.2),
    marginTop: responsiveHeight(0.8),
  },
  alertIconText: {
    color: '#E34B4B',
    fontFamily: 'Inter600',
  },
  underlineText: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(0,0,0,0.5)',
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
    fontSize: responsiveFontSize(1.42), //10px
    color: '#6f6f6f',
    textAlign: 'center',
    fontFamily: 'Inter500',
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
  // Healthy user screen styles
  healthyTitle: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(3.2),
    textAlign: 'center',
    lineHeight: responsiveFontSize(4),
  },
  healthySubtitle: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.9),
    color: '#6F6F6F',
    textAlign: 'center',
    marginTop: responsiveHeight(0.5),
  },
  healthyCardTitle: {
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(2),
    color: '#404040',
    textAlign: 'center',
    lineHeight: responsiveFontSize(2.8),
  },
  healthyCardBody: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.75),
    color: '#666666',
    textAlign: 'center',
    lineHeight: responsiveFontSize(2.5),
  },
  healthyCardNote: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.6),
    color: '#888888',
    textAlign: 'center',
    marginTop: responsiveHeight(1.5),
    fontStyle: 'italic',
    lineHeight: responsiveFontSize(2.2),
  },
  healthyFooter: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.7),
    color: '#BB4471',
    textAlign: 'center',
  },
});

export default ResultScreen;
