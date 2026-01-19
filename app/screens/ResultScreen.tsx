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

  // ... (previous imports)

  // Reusable Hormone Card Component
  const HormoneCard = ({ cardData, isSecondary = false }: { cardData: any, isSecondary?: boolean }) => {
    if (!cardData) return null;

    const imageSource = getHormoneImage(
      cardData.hormone,
      cardData.level,
      cardData.priority,
      cardData.is_primary,
      cardData.score
    );

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.hormoneCard}>
          <View style={styles.cardContent}>
            {/* Left Side: Text Content */}
            <View style={styles.textContent}>
              {/* Title and Subtitle */}
              <Text style={styles.hormoneName}>
                {cardData.name}, <Text style={styles.hormoneSubtitle}>{cardData.subtitle}</Text>
              </Text>

              {/* Description */}
              <Text style={styles.hormoneDescription}>
                {cardData.icon}{' '}
                {cardData.description}
              </Text>
            </View>

            {/* Right Side: Image Content */}
            <View style={styles.imageContainer}>
              <Image
                source={imageSource}
                style={styles.hormoneImage}
              />
            </View>
          </View>
        </View>

        {/* Priority Badge */}
        {cardData.priority ? (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{cardData.priority}</Text>
          </View>
        ) : null}
      </View>
    );
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
            {primaryCard && <HormoneCard cardData={primaryCard} />}

            {/* Secondary hormone card */}
            {secondaryCard && <HormoneCard cardData={secondaryCard} isSecondary />}

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
  title: {
    fontFamily: 'NotoSerif600',
    fontSize: moderateScale(16, 1.5),
    textAlign: 'center',
    lineHeight: moderateScale(16, 1.5) * 1.5, // 150% line height
    letterSpacing: 0,
  },
  cardsContainer: {
    width: responsiveWidth(85), // Slightly wider container
    gap: responsiveHeight(2.5),
  },
  cardWrapper: {
    position: 'relative',
    marginTop: responsiveHeight(1),
  },
  hormoneCard: {
    backgroundColor: '#FFFBFC',
    borderRadius: 16,
    padding: responsiveWidth(5),
    borderWidth: 0.5,
    borderColor: '#cfcfcf',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
    minHeight: verticalScale(130), // Increased fixed min height for consistency
  },
  cardContent: {
    flexDirection: 'row', // KEY CHANGE: Flex Row layout
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  textContent: {
    flex: 1, // Takes up remaining space
    paddingRight: responsiveWidth(2),
    justifyContent: 'center',
  },
  imageContainer: {
    width: scale(100), // Fixed width for image container
    height: verticalScale(100), // Fixed height for image container
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Ensure image fits within container without cropping
  },
  hormoneName: {
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(2),
    color: '#000000',
    lineHeight: responsiveHeight(2.8),
    marginBottom: responsiveHeight(0.5),
  },
  hormoneSubtitle: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),
    color: '#6f6f6f',
  },
  hormoneDescription: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.6), // Slightly smaller for better fit
    color: '#6f6f6f',
    lineHeight: responsiveHeight(2.2),
  },
  priorityBadge: {
    position: 'absolute',
    top: responsiveHeight(-1.3),
    left: responsiveWidth(4),
    backgroundColor: '#F2F0F2',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.3),
    borderRadius: 13,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    elevation: 4,
    zIndex: 10,
  },
  priorityText: {
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(1.4),
    color: '#6f6f6f',
    textAlign: 'center',
  },
  disclaimerContainer: {
    marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
  },
  disclaimerText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42),
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveHeight(1.5),
  },
});

export default ResultScreen; 