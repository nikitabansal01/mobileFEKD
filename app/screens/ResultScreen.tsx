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
  const [maxCardHeight, setMaxCardHeight] = useState<number | null>(null);

  const CARD_MIN_HEIGHT = responsiveHeight(17);

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
   * Get hormone-specific image styling to ensure visual consistency across all cards.
   * Different hormones have different character shapes, so we adjust sizing accordingly.
   */
  const getHormoneArtStyle = (hormone?: string) => {
    const h = (hormone || '').toLowerCase();

    // Designed to match the Figma: oversized character art that peeks outside the card.
    // Each hormone asset has different proportions, so we tune placement per hormone.
    if (h === 'progesterone') {
      return {
        width: scale(170),
        height: scale(170),
        right: scale(-42),
        bottom: verticalScale(-34),
        transform: [{ scale: 1 }],
      };
    }

    if (h === 'testosterone' || h === 'androgens') {
      return {
        width: scale(150),
        height: scale(150),
        right: scale(-30),
        bottom: verticalScale(-28),
        transform: [{ scale: 1 }],
      };
    }

    if (h === 'estrogen') {
      return {
        width: scale(135),
        height: scale(135),
        right: scale(-22),
        bottom: verticalScale(-24),
        transform: [{ scale: 1 }],
      };
    }

    if (h === 'insulin') {
      return {
        width: scale(140),
        height: scale(140),
        right: scale(-26),
        bottom: verticalScale(-26),
        // Slightly smaller to avoid the "too dominant" perception.
        transform: [{ scale: 0.9 }],
      };
    }

    if (h === 'thyroid') {
      return {
        width: scale(140),
        height: scale(140),
        right: scale(-26),
        bottom: verticalScale(-26),
        transform: [{ scale: 0.9 }],
      };
    }

    if (h === 'cortisol') {
      return {
        width: scale(140),
        height: scale(140),
        right: scale(-26),
        bottom: verticalScale(-26),
        transform: [{ scale: 0.95 }],
      };
    }

    return {
      width: scale(140),
      height: scale(140),
      right: scale(-26),
      bottom: verticalScale(-26),
      transform: [{ scale: 0.95 }],
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
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
                <View
                  style={[
                    styles.hormoneCard,
                    { minHeight: CARD_MIN_HEIGHT },
                    maxCardHeight ? { height: maxCardHeight } : null,
                  ]}
                  onLayout={(e) => handleCardLayout(e.nativeEvent.layout.height)}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.hormoneTitleLine} numberOfLines={1} ellipsizeMode="tail">
                      <Text style={styles.hormoneTitleStrong}>{primaryCard.name}</Text>
                      <Text style={styles.hormoneTitlePunct}>, </Text>
                      <Text style={styles.hormoneTitleSoft}>{primaryCard.subtitle}</Text>
                    </Text>

                    <Text style={styles.hormoneDescription} numberOfLines={4} ellipsizeMode="tail">
                      {primaryCard.icon ? <Text style={styles.alertIconText}>{primaryCard.icon} </Text> : null}
                      {primaryCard.description}
                    </Text>
                  </View>

                  <Image
                    pointerEvents="none"
                    source={getHormoneImage(primaryCard.hormone, primaryCard.level, primaryCard.priority, primaryCard.is_primary, primaryCard.score)}
                    style={[styles.cardArt, getHormoneArtStyle(primaryCard.hormone)]}
                  />
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
                    <Text style={styles.hormoneTitleLine} numberOfLines={1} ellipsizeMode="tail">
                      <Text style={styles.hormoneTitleStrong}>{secondaryCard.name}</Text>
                      <Text style={styles.hormoneTitlePunct}>, </Text>
                      <Text style={styles.hormoneTitleSoft}>{secondaryCard.subtitle}</Text>
                    </Text>

                    <Text style={styles.hormoneDescription} numberOfLines={4} ellipsizeMode="tail">
                      {secondaryCard.icon ? <Text style={styles.alertIconText}>{secondaryCard.icon} </Text> : null}
                      {secondaryCard.description}
                    </Text>
                  </View>

                  <Image
                    pointerEvents="none"
                    source={getHormoneImage(secondaryCard.hormone, secondaryCard.level, secondaryCard.priority, secondaryCard.is_primary, secondaryCard.score)}
                    style={[styles.cardArt, getHormoneArtStyle(secondaryCard.hormone)]}
                  />
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
    width: responsiveWidth(86),
    gap: responsiveHeight(2.7),
  },
  cardWrapper: {
    position: 'relative',
    marginTop: responsiveHeight(1), // Margin for High Priority tag
  },
  hormoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: responsiveWidth(6),
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
    overflow: 'visible',
  },
  cardContent: {
    // Keep enough right padding so text never collides with oversized art.
    paddingRight: scale(118),
    minWidth: 0,
  },
  cardArt: {
    position: 'absolute',
    resizeMode: 'contain',
  },
  hormoneTitleLine: {
    lineHeight: responsiveFontSize(2.35),
  },
  hormoneTitleStrong: {
    fontSize: responsiveFontSize(2.05),
    color: '#0B0B0F',
    fontFamily: 'Inter600',
  },
  hormoneTitlePunct: {
    fontSize: responsiveFontSize(2.05),
    color: '#0B0B0F',
    fontFamily: 'Inter600',
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
    fontFamily: 'Inter500',
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
  titleSubtitleContainer: {
    flex: 1,
    marginBottom: responsiveHeight(0.5),
    zIndex: 2, // Display above image (zIndex: 1)
  },
});

export default ResultScreen; 