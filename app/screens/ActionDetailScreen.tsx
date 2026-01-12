import Images from '@/assets/images';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Linking, TextInput, ActivityIndicator, Alert } from 'react-native';
import AppIntroSlider from "react-native-app-intro-slider";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import homeService from '@/services/homeService';
import { rewardService, RefreshStatus } from '@/services/rewardService';
import { getImageSource } from '@/utils/imageUtils';

// Replacement reasons for "Not for me" feedback
const REPLACEMENT_REASONS = [
  { id: 'dont_like' as const, emoji: '😕', text: "Don't like this" },
  { id: 'allergic' as const, emoji: '🚫', text: "I'm allergic" },
  { id: 'no_ingredients' as const, emoji: '🛒', text: "Don't have ingredients" },
  { id: 'no_time' as const, emoji: '⏰', text: "No time today" },
  { id: 'already_done' as const, emoji: '✅', text: "Already did similar" },
  { id: 'other' as const, emoji: '💬', text: "Other..." },
];

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: { shouldRefresh?: boolean };
  ActionDetailScreen: { action?: string; };
  ActionCompletedScreen: { action?: string; };
};

type ActionDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActionDetailScreen'>;

interface ActionDetailScreenProps {
  route?: { params?: { action?: string; }; };
}

const ActionDetailScreen: React.FC<ActionDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<ActionDetailScreenNavigationProp>();
  const actionParam = route?.params?.action;

  // Parse action object from route params
  const action = actionParam ? (typeof actionParam === 'string' ? JSON.parse(actionParam) : actionParam) as {
    id: number;
    title: string;
    purpose: string;
    hormones: string[];
    image?: string;
    conditions?: string[];
    symptoms?: string[];
    specific_action?: string;
    hero_image_url?: string;
    hormone_persona_intro?: string;
    // Category for determining heading format
    category?: 'food' | 'movement' | 'mindfulness';
    // Category-specific fields for heading
    food_items?: string[];
    food_amounts?: string[];
    exercise_types?: string[];
    exercise_durations?: string[];
    exercise_intensities?: string[];
    mindfulness_techniques?: string[];
    mindfulness_durations?: string[];
    research_studies?: Array<{
      title: string;
      authors?: string;
      year: number;
      journal: string;
      finding: string;
      participants?: string | number;
      doi?: string;
      pmid?: string;
      verification_link?: string;
      source?: string;
    }>;
    variants?: Array<{
      variant_type: string;
      title: string;
      description: string;
      image_url: string;
    }>;
    advices?: Array<{
      type: string;
      title: string;
      image?: string;
    }>;
  } : null;

  /**
   * Formats the "How?" screen heading based on category.
   * Shows short, actionable text like Figma design:
   * - Food: "Eat at least 1 cup of Quinoa"
   * - Movement: "Morning Yoga for 15 minutes"
   * - Mindfulness: "Deep Breathing for 5 minutes"
   */
  const formatHowHeading = (): string => {
    if (!action) return '';

    const { title, category, food_amounts, exercise_durations, mindfulness_durations } = action;

    switch (category) {
      case 'food':
        const amount = food_amounts?.[0] || '';
        if (amount) {
          // Figma design: "Eat at least 1 cup of Quinoa today"
          return `Eat at least ${amount} of ${title} today`;
        }
        return `Eat ${title} today`;

      case 'movement':
        const duration = exercise_durations?.[0] || '';
        if (duration) {
          // Figma design: "Do Yoga for 15 minutes today"
          return `Do ${title} for ${duration} today`;
        }
        return `Do ${title} today`;

      case 'mindfulness':
        const mDuration = mindfulness_durations?.[0] || '';
        if (mDuration) {
          // Figma design: "Practice Deep Breathing for 5 minutes today"
          return `Practice ${title} for ${mDuration} today`;
        }
        return `Practice ${title} today`;

      default:
        // Fallback: if no category, just use title
        return title || '';
    }
  };

  // State management
  const [isHowMode, setIsHowMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showStudyDetails, setShowStudyDetails] = useState(false);
  const sliderRef = React.useRef<AppIntroSlider>(null);

  // Feedback state
  const [selectedFeedback, setSelectedFeedback] = useState<'loved' | 'completed' | 'skipped' | 'not_for_me' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<typeof REPLACEMENT_REASONS[number]['id'] | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  // Refresh status for 2x plan refresh reward
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);

  // Fetch refresh status on screen focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchRefreshStatus = async () => {
        try {
          const rewardsData = await rewardService.getRewardsStatus();
          if (rewardsData?.refresh_status) {
            setRefreshStatus(rewardsData.refresh_status);
          }
        } catch (error) {
          console.log('Could not fetch refresh status:', error);
        }
      };
      fetchRefreshStatus();
    }, [])
  );

  // Auto-slide logic for Advice Slider
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHowMode && action?.variants && action.variants.length > 1) {
      const variantsLength = action.variants.length;
      interval = setInterval(() => {
        const nextIndex = (currentSlideIndex + 1) % variantsLength;
        // Direct jump when looping back to index 0 to avoid "sliding back through" all items
        const shouldAnimate = nextIndex !== 0;
        sliderRef.current?.goToSlide(nextIndex, shouldAnimate);
        setCurrentSlideIndex(nextIndex);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHowMode, currentSlideIndex, action?.variants]);

  // Disable back gesture when using AppIntroSlider
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );


  /**
   * Pick the appropriate hormone character image for the first hormone
   */
  const getHormoneCharacter = (hormones?: string[]) => {
    if (!hormones || hormones.length === 0) return null;
    const hormone = hormones[0]?.toLowerCase();
    switch (hormone) {
      case 'progesterone':
        return Images.ProgesteroneBothHandsUp;
      case 'estrogen':
        return Images.EstrogenBothHand;
      case 'thyroid':
        return Images.ThyroidBothHand;
      case 'insulin':
        return Images.InsulinBothHand;
      case 'cortisol':
        return Images.CortisolBothHand;
      case 'testosterone':
        return Images.TestosteroneBothHand;
      case 'androgens':
        return Images.AndrogensBothHand;
      default:
        return null;
    }
  };

  /**
   * Get hormone-specific description text
   * @param hormones - Array of hormone names
   * @returns Description text for the hormone
   */
  const getHormoneDescription = (hormones: string[]) => {
    if (hormones.includes('progesterone')) {
      return "I'm Progesterone — in your luteal phase, I tend to dip, causing mood swings or cramps.\n\n";
    }
    return "";
  };

  /**
   * Handle close button press
   */
  const handleClose = () => {
    navigation.goBack();
  };

  /**
   * Handle "Tell me best ways to consume" button press
   */
  const handleTellMeMore = () => {
    // TODO: Implement "Tell me best ways to consume" functionality
  };

  /**
   * Handle saving feedback
   */
  const handleSaveFeedback = async () => {
    if (!action?.id || !selectedFeedback) return;

    setIsSavingFeedback(true);
    try {
      const result = await homeService.submitActionFeedback(
        action.id,
        selectedFeedback,
        feedbackText || undefined,
        'detail'
      );

      if (result?.success) {
        setFeedbackSaved(true);
        // Show success feedback briefly
        setTimeout(() => {
          setFeedbackSaved(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save feedback:', error);
      Alert.alert('Error', 'Failed to save feedback. Please try again.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  /**
   * Handle replacing action with a new one
   */
  const handleReplaceAction = async () => {
    if (!action?.id || !selectedReason) return;

    setIsReplacing(true);
    try {
      const reasonText = selectedReason === 'other' ? customReason : undefined;
      const result = await homeService.replaceAction(
        action.id,
        reasonText,
        selectedReason
      );

      if (result?.success) {
        setShowReplaceModal(false);
        Alert.alert(
          'Action Replaced! 🎉',
          'Your new action is ready!',
          [{
            text: 'OK',
            onPress: () => {
              // Go back to HomeScreen - it will auto-refresh on focus
              navigation.goBack();
            }
          }]
        );
      } else {
        Alert.alert('Error', 'Failed to replace action. Please try again.');
      }
    } catch (error) {
      console.error('Failed to replace action:', error);
      Alert.alert('Error', 'Failed to replace action. Please try again.');
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        {isHowMode ? (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsHowMode(false)}
            >
              <Ionicons name="chevron-back" size={responsiveFontSize(3.5)} color="#9E9E9E" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text
                style={styles.headerTitle}
                allowFontScaling={false}
              >
                How?
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <View style={styles.closeButton}>
                <Ionicons name="close" size={responsiveFontSize(3.5)} color="#9E9E9E" />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.backButton} />
            <View style={styles.headerTitleContainer}>
              <Text
                style={styles.headerTitle}
                allowFontScaling={false}
              >
                Why?
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <View style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#9E9E9E" />
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: responsiveHeight(20) }} // Increased to ensure content scrolls above button
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
          {isHowMode ? (
            // How Mode Content
            <>
              {/* Title and Image Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <MaskedView
                    style={styles.gradientContainer}
                    maskElement={
                      <View style={{ backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                        <Text
                          style={styles.title}
                          allowFontScaling={false}
                          numberOfLines={4}
                        >
                          {formatHowHeading()}
                        </Text>
                      </View>
                    }
                  >
                    <LinearGradient
                      colors={['#D8A7CA', '#C17EC9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, width: '100%', minHeight: responsiveHeight(18) }}
                    />
                  </MaskedView>
                </View>
                <View style={styles.imageContainer}>
                  {getImageSource(action?.hero_image_url) ? (
                    <Image
                      source={getImageSource(action?.hero_image_url)!}
                      style={styles.actionImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.actionImage}>
                      <Text style={styles.imageText}>📋</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Conditions and Symptoms */}
              <View style={[styles.conditionsSection, { marginTop: responsiveHeight(4.5) }]}>
                <Text
                  style={styles.conditionsSubtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                  allowFontScaling={false}
                >
                  Eating suggestions based on your preferences and concerns
                </Text>
                <View style={styles.conditionsTags}>
                  {[...(action?.conditions || []), ...(action?.symptoms || [])].map((condition, index) => (
                    <View key={index} style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Advice Slider */}
              {action?.variants && action.variants.length > 0 && (
                <View style={styles.adviceSection}>
                  <View style={styles.sliderContainer}>
                    <AppIntroSlider
                      ref={sliderRef}
                      data={action.variants}
                      keyExtractor={(item, index) => `advice-${index}`}
                      renderItem={({ item, index }) => (
                        <View style={styles.adviceSlideWrapper}>
                          <View style={styles.adviceCard}>
                            {/* Background Image */}
                            <View style={styles.adviceBackgroundImage}>
                              {item.image_url ? (
                                <Image
                                  source={{ uri: item.image_url }}
                                  style={styles.adviceBackgroundFullImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={styles.adviceBackgroundText}>🍽️</Text>
                              )}
                            </View>

                            {/* Dark Gradient Overlay for title readability */}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.adviceGradientOverlay}
                            />

                            {/* Category Tag - Top Left */}
                            <View style={styles.adviceTypeBadge}>
                              <Text style={styles.adviceTypeBadgeText}>
                                {(item.variant_type || 'Healthy').charAt(0).toUpperCase() + (item.variant_type || 'Healthy').slice(1)}
                              </Text>
                            </View>

                            {/* Title - Bottom Left */}
                            <View style={styles.adviceTitleContainer}>
                              <Text style={styles.adviceTitle}>
                                {item.title || ''}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                      showSkipButton={false}
                      showNextButton={false}
                      showDoneButton={false}
                      showPrevButton={false}
                      dotStyle={styles.sliderDot}
                      activeDotStyle={styles.sliderDotActive}
                      onSlideChange={(index) => setCurrentSlideIndex(index)}
                      bottomButton={false}
                      pagingEnabled={true}
                      horizontal={true}
                      nestedScrollEnabled={true}
                      renderPagination={(activeIndex) => (
                        <View style={styles.customPagination}>
                          {action?.variants?.map((_, index) => {
                            const isActive = index === activeIndex;
                            const isAdjacent = Math.abs(index - activeIndex) === 1;

                            return (
                              <View
                                key={index}
                                style={[
                                  styles.sliderDot,
                                  isActive && styles.sliderDotActive,
                                  isAdjacent && { opacity: 0.4 }
                                ]}
                              />
                            );
                          })}
                        </View>
                      )}
                    />
                  </View>
                </View>
              )}
            </>
          ) : (
            // Why Mode Content
            <>
              {/* Title and Image Section */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <MaskedView
                    style={styles.gradientContainer}
                    maskElement={
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={styles.title}>
                          💡 Why {action?.title || 'Pumpkin Seeds'}?
                        </Text>
                      </View>
                    }
                  >
                    <LinearGradient
                      colors={['#D8A7CA', '#C17EC9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, width: '100%', height: '100%' }}
                    />
                  </MaskedView>
                </View>
                <View style={styles.imageContainer}>
                  {getImageSource(action?.hero_image_url) ? (
                    <Image
                      source={getImageSource(action?.hero_image_url)!}
                      style={styles.actionImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.actionImage}>
                      <Text style={styles.imageText}>📋</Text>
                    </View>
                  )}
                </View>

                {/* Hormone Graphic - Straddling image and card */}
                <View style={styles.hormoneGraphic}>
                  {getHormoneCharacter(action?.hormones) ? (
                    <Image
                      source={getHormoneCharacter(action?.hormones) as any}
                      style={styles.hormoneGraphicImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.hormoneGraphicText}>🧬</Text>
                  )}
                </View>
              </View>

              {/* Description Card */}
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {action?.hormone_persona_intro ? `${action.hormone_persona_intro}\n\n` : ''}
                  {action?.purpose || 'This action helps support your hormone balance.'}
                </Text>
              </View>

              {/* Study Details */}
              <View style={styles.studyDetails}>
                <TouchableOpacity
                  style={styles.studyDetailsButton}
                  onPress={() => setShowStudyDetails(!showStudyDetails)}
                >
                  <Text style={styles.studyDetailsText}>
                    {showStudyDetails ? 'Hide study details' : 'View study details'}
                  </Text>
                  <Ionicons
                    name={showStudyDetails ? "chevron-up" : "chevron-down"} // Corrected to match mockup chevron style
                    size={responsiveFontSize(1.7)}
                    color="#C17EC9"
                  />
                </TouchableOpacity>

                {/* Study Details Content */}
                {showStudyDetails && action?.research_studies && Array.isArray(action.research_studies) && action.research_studies.length > 0 && (
                  <View style={styles.studyDetailsContent}>
                    {action.research_studies
                      .filter((study: any) => study && typeof study === 'object' && study.title && typeof study.title === 'string')
                      .map((study: any, index: number) => {
                        // Safely extract all values as strings
                        const title = String(study.title || 'Research Study');
                        const journal = String(study.journal || 'Journal');
                        const year = String(study.year || 'N/A');
                        const finding = study.finding ? String(study.finding) : null;
                        const participants = typeof study.participants === 'number' && study.participants > 0 ? study.participants : null;
                        const pmid = study.pmid ? String(study.pmid) : null;
                        const verificationLink = study.verification_link ? String(study.verification_link) : null;

                        return (
                          <View key={index} style={styles.studyCard}>
                            <View style={styles.studyTitleRow}>
                              <Text style={styles.studyIcon}>🔗</Text>
                              <Text style={styles.studyTitle}>{title}</Text>
                            </View>

                            <View style={styles.studyInfoSection}>
                              <Text style={styles.studyInfoLabel}>Journal: </Text>
                              <Text style={styles.studyInfoValue}>
                                {`${journal} (${year})`}
                              </Text>
                            </View>

                            {participants !== null && (
                              <View style={styles.studyInfoSection}>
                                <Text style={styles.studyInfoLabel}>Study conducted with: </Text>
                                <Text style={styles.studyInfoValue}>
                                  {`${participants} women`}
                                </Text>
                              </View>
                            )}

                            {finding !== null && (
                              <View style={styles.studyInfoSection}>
                                <Text style={styles.studyInfoLabel}>Results: </Text>
                                <Text style={styles.studyInfoValue}>
                                  {finding}
                                </Text>
                              </View>
                            )}

                            {(pmid || verificationLink) && (
                              <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={() => {
                                  const url = verificationLink || (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null);
                                  if (url) Linking.openURL(url);
                                }}
                              >
                                <Text style={styles.verifyButtonText}>
                                  {pmid ? 'See details in PubMed' : 'View Study →'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                  </View>
                )}

                {/* No studies available message */}
                {showStudyDetails && (!action?.research_studies || action.research_studies.length === 0) && (
                  <View style={styles.noStudiesContainer}>
                    <Text style={styles.noStudiesText}>
                      No research studies available for this action yet.
                    </Text>
                  </View>
                )}
              </View>

              {/* Feedback Section */}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>💬 How was this for you?</Text>

                {/* Quick Reaction Buttons */}
                <View style={styles.feedbackButtons}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      selectedFeedback === 'loved' && styles.feedbackButtonActive
                    ]}
                    onPress={() => setSelectedFeedback('loved')}
                  >
                    <Text style={styles.feedbackEmoji}>😊</Text>
                    <Text style={[
                      styles.feedbackButtonText,
                      selectedFeedback === 'loved' && styles.feedbackButtonTextActive
                    ]}>Loved it</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      selectedFeedback === 'skipped' && styles.feedbackButtonActive
                    ]}
                    onPress={() => setSelectedFeedback('skipped')}
                  >
                    <Text style={styles.feedbackEmoji}>😐</Text>
                    <Text style={[
                      styles.feedbackButtonText,
                      selectedFeedback === 'skipped' && styles.feedbackButtonTextActive
                    ]}>Skipped</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      selectedFeedback === 'not_for_me' && styles.feedbackButtonActive
                    ]}
                    onPress={() => setSelectedFeedback('not_for_me')}
                  >
                    <Text style={styles.feedbackEmoji}>👎</Text>
                    <Text style={[
                      styles.feedbackButtonText,
                      selectedFeedback === 'not_for_me' && styles.feedbackButtonTextActive
                    ]}>Not for me</Text>
                  </TouchableOpacity>
                </View>

                {/* Text Input (shows after selection) */}
                {selectedFeedback && (
                  <View style={styles.textFeedbackContainer}>
                    <TextInput
                      style={styles.textFeedbackInput}
                      placeholder="Want to share more? (optional)"
                      placeholderTextColor="#9E9E9E"
                      multiline
                      numberOfLines={3}
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.saveFeedbackButton,
                        feedbackSaved && styles.saveFeedbackButtonSuccess
                      ]}
                      onPress={handleSaveFeedback}
                      disabled={isSavingFeedback || feedbackSaved}
                    >
                      {isSavingFeedback ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveFeedbackButtonText}>
                          {feedbackSaved ? '✓ Saved!' : 'Save Feedback'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Replace Option (for "Skipped" or "Not for me") */}
                {(selectedFeedback === 'skipped' || selectedFeedback === 'not_for_me') && (
                  <TouchableOpacity
                    style={[
                      styles.replaceButton,
                      refreshStatus && !refreshStatus.can_refresh && styles.replaceButtonDisabled
                    ]}
                    onPress={() => {
                      if (refreshStatus && !refreshStatus.can_refresh) {
                        Alert.alert(
                          'No Refreshes Left',
                          `You've used all ${refreshStatus.limit} refresh${refreshStatus.limit > 1 ? 'es' : ''} for today. Come back tomorrow!`,
                          [{ text: 'OK' }]
                        );
                        return;
                      }
                      setShowReplaceModal(true);
                    }}
                    disabled={refreshStatus ? !refreshStatus.can_refresh : false}
                  >
                    <Text style={[
                      styles.replaceButtonText,
                      refreshStatus && !refreshStatus.can_refresh && styles.replaceButtonTextDisabled
                    ]}>
                      🔄 Get a different action {refreshStatus ? `(${refreshStatus.remaining}/${refreshStatus.limit} left)` : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Replace Action Modal */}
      <Modal
        visible={showReplaceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReplaceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.replaceModal}>
            <Text style={styles.replaceModalTitle}>Why doesn't this work for you?</Text>

            {/* Reason Selection */}
            <View style={styles.reasonOptions}>
              {REPLACEMENT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason.id && styles.reasonOptionActive
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason.id && styles.reasonTextActive
                  ]}>{reason.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Input */}
            {selectedReason === 'other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Tell us more..."
                placeholderTextColor="#9E9E9E"
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={2}
              />
            )}

            {/* Actions */}
            <View style={styles.replaceModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowReplaceModal(false);
                  setSelectedReason(null);
                  setCustomReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.getNewActionButton,
                  !selectedReason && styles.getNewActionButtonDisabled
                ]}
                onPress={handleReplaceAction}
                disabled={!selectedReason || isReplacing}
              >
                {isReplacing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.getNewActionButtonText}>Get New Action</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Fixed Bottom Container */}
      <FixedBottomContainer>
        {isHowMode ? (
          <View style={styles.bottomButtonsContainer}>
            <PrimaryButton
              title="Mark as complete ✅"
              onPress={() => {
                navigation.navigate('ActionCompletedScreen', {
                  action: JSON.stringify(action)
                });
              }}
            />
            <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={() => {
                setIsHowMode(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.backToHomeButtonText}>Back to homescreen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PrimaryButton
            title="Tell me best ways to consume →"
            onPress={() => setIsHowMode(true)}
          />
        )}
      </FixedBottomContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBar: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(2),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(10),
    height: responsiveHeight(10),
    backgroundColor: '#FFFFFF',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    height: responsiveHeight(20),
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: responsiveWidth(25),
    height: responsiveHeight(20),
    paddingLeft: responsiveWidth(2),
  },
  backButtonText: {
    fontSize: responsiveFontSize(4),
    color: '#4A4A4A',
    fontFamily: 'Inter400',
  },
  closeButtonContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: responsiveWidth(20),
    height: responsiveHeight(20),
    paddingRight: responsiveWidth(2),
  },
  headerTitle: {
    fontSize: moderateScale(12, 1.5),
    color: '#9E9E9E',
    fontFamily: 'Inter500',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: responsiveFontSize(2),
    letterSpacing: 0.5,
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveHeight(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: responsiveFontSize(3.5),
    color: '#4A4A4A', // Dark grey, not black
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: responsiveFontSize(3.5),
  },
  content: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: verticalScale(20),
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(2), // Reduced from 4 to 2 to fix large gap
    width: '100%',
  },
  title: {
    fontSize: moderateScale(22, 1), // Precise scale for Serif
    fontFamily: 'NotoSerif600',
    color: '#D8A7CA',
    textAlign: 'center',
    lineHeight: 34,
    maxWidth: '92%',
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(1.5), // Reduced from 2 to 1.5 to fix large gap
    width: '100%',
  },
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsiveHeight(18), // Increased from 12 to 18 to prevent truncation of multi-line titles
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: responsiveWidth(35.78),
    height: responsiveWidth(35.78),
    borderRadius: responsiveWidth(35.78) / 2,
    backgroundColor: '#FCDDEC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: responsiveWidth(5.56),
    borderColor: '#FCDDEC',
    overflow: 'hidden',
  },
  actionImage: {
    width: responsiveWidth(18),
    height: responsiveWidth(18),
    borderRadius: responsiveWidth(18) / 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionImageFull: {
    width: '100%',
    height: '100%',
  },
  imageText: {
    fontSize: responsiveFontSize(6),
  },
  imageBorder: {
    position: 'absolute',
    top: -responsiveWidth(5.56),
    left: -responsiveWidth(5.56),
    right: -responsiveWidth(5.56),
    bottom: -responsiveWidth(5.56),
    borderWidth: responsiveWidth(5.56),
    borderColor: '#FCDDEC',
    borderRadius: responsiveWidth(27.78) / 2 + responsiveWidth(5.56),
  },
  hormoneGraphic: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: responsiveHeight(2), // Add space from top
    marginBottom: responsiveHeight(-1.5), // Increased negative margin for deeper hug
    height: responsiveHeight(12),
    width: responsiveWidth(40),
    zIndex: 1, // Behind the description card
  },
  hormoneGraphicText: {
    fontSize: responsiveFontSize(6),
  },
  hormoneGraphicImage: {
    width: responsiveWidth(40),
    height: responsiveHeight(12),
    marginTop: 0,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(5.56),
    paddingHorizontal: responsiveWidth(5.56),
    paddingVertical: responsiveWidth(5.56),
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#949494',
    marginTop: 0,
    marginBottom: responsiveHeight(2.5),
    alignSelf: 'center',
    zIndex: 2, // Above the hormone graphic
  },
  descriptionText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    lineHeight: moderateScale(20, 1.5),
    color: '#000000',
    verticalAlign: 'top',
    textAlign: 'left',
    paddingBottom: verticalScale(2),
  },
  studyDetails: {
    width: '100%',
    // paddingVertical: verticalScale(10),
    alignSelf: 'center',
  },
  studyDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  studyDetailsText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#C17EC9',
  },
  studyDetailsArrow: {
    fontSize: moderateScale(12, 1.5),
    color: '#C17EC9',
    transform: [{ rotate: '270deg' }],
  },
  studyDetailsContent: {
    marginTop: verticalScale(12),
    width: '100%',
  },
  studyCard: {
    backgroundColor: '#F9F1FB', // Light lavender from mockup
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(10),
  },
  studyTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(6),
    marginBottom: verticalScale(12),
  },
  studyIcon: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
    color: '#6F6F6F',
    opacity: 0.7,
  },
  studyTitle: {
    flex: 1,
    fontSize: moderateScale(13.5, 1.5),
    fontFamily: 'Inter500',
    color: '#6F6F6F',
    lineHeight: moderateScale(18),
  },
  studyInfoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(4),
  },
  studyInfoLabel: {
    fontSize: moderateScale(12.5, 1.5),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  studyInfoValue: {
    fontSize: moderateScale(12.5, 1.5),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    flexShrink: 1,
  },
  studyMeta: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#666666',
    marginBottom: verticalScale(4),
  },
  studyJournal: {
    fontSize: moderateScale(11, 1.5),
    fontFamily: 'Inter400',
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: verticalScale(10),
  },
  studyFinding: {
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter400',
    color: '#444444',
    lineHeight: moderateScale(20),
  },
  studyFindingLabel: {
    fontFamily: 'Inter600',
    color: '#C17EC9',
  },
  doiLink: {
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#C17EC9',
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
  },
  doiText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  verifyButton: {
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#C17EC9',
    borderRadius: moderateScale(8),
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    fontSize: moderateScale(11, 1.5),
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  noStudiesContainer: {
    marginTop: verticalScale(12),
    padding: moderateScale(16),
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  noStudiesText: {
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter400',
    color: '#888888',
    textAlign: 'center',
  },
  // How Mode Styles
  conditionsSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(4), // Balanced airiness
    width: '100%',
  },
  conditionsSubtitle: {
    fontSize: moderateScale(12, 1),
    color: '#9E9E9E',
    fontFamily: 'Inter400',
    marginBottom: responsiveHeight(1.5),
    textAlign: 'center',
    width: '100%',
    opacity: 0.7,
  },
  conditionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: responsiveWidth(1.5), // Tighter tags
  },
  conditionTag: {
    backgroundColor: '#F5F5F5', // Request: faint grey/white
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: verticalScale(6),
    borderRadius: 50, // Request: 50px
  },
  conditionTagText: {
    fontSize: moderateScale(11),
    color: '#4A4A4A',
    fontFamily: 'Inter400',
  },
  adviceSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(2),
    width: '100%',
  },
  adviceCard: {
    width: responsiveWidth(88), // Wider card for move
    height: responsiveHeight(22), // Taller card for detail
    backgroundColor: '#F0F0F0',
    borderRadius: 16, // Smoother corners for premium feel
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  adviceBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  adviceGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', // Targeted fade
  },
  adviceBackgroundFullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  adviceBackgroundText: {
    fontSize: responsiveFontSize(8),
    color: '#CCCCCC',
  },
  adviceTypeBadge: {
    position: 'absolute',
    top: responsiveHeight(1),
    left: responsiveWidth(2),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: 50, // Pill shape
  },
  adviceTypeBadgeText: {
    fontSize: moderateScale(11),
    color: '#000000',
    fontFamily: 'Inter500',
  },
  adviceTitleContainer: {
    position: 'absolute',
    bottom: responsiveHeight(1.75),
    left: responsiveWidth(1.75),
    right: responsiveWidth(1.75),
  },
  adviceTitle: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontFamily: 'Inter500',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sliderContainer: {
    width: responsiveWidth(100), // Allow slide to bleed into margins
    height: responsiveHeight(28),
    position: 'relative',
  },
  adviceSlideWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  sliderPagination: {
    bottom: responsiveHeight(2),
  },
  customPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: responsiveHeight(2),
    left: 0,
    right: 0,
    gap: responsiveWidth(1),
  },
  sliderDot: {
    width: responsiveWidth(2),
    height: responsiveWidth(2),
    borderRadius: responsiveWidth(1),
    backgroundColor: '#C17EC9',
    opacity: 0.2,
    marginHorizontal: responsiveWidth(1),
  },
  sliderDotActive: {
    opacity: 1,
    backgroundColor: '#C17EC9',
    width: responsiveWidth(2.5),
    height: responsiveWidth(2.5),
  },
  bottomButtonsContainer: {
    gap: responsiveHeight(2),
    alignItems: 'center',
    width: '100%',
  },
  backToHomeButton: {
    paddingVertical: responsiveHeight(1.25),
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: responsiveFontSize(1.98),
    color: '#6F6F6F',
    fontFamily: 'Inter500',
  },

  // ============ FEEDBACK SECTION STYLES ============
  feedbackSection: {
    width: '100%',
    marginTop: responsiveHeight(3),
    paddingTop: responsiveHeight(2),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  feedbackTitle: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'Inter500',
    color: '#333333',
    marginBottom: responsiveHeight(1.5),
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: responsiveHeight(2),
  },
  feedbackButton: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(2),
    borderRadius: moderateScale(12),
    backgroundColor: '#F9F1FB',
    minWidth: responsiveWidth(18),
  },
  feedbackButtonActive: {
    backgroundColor: '#C17EC9',
    transform: [{ scale: 1.05 }],
  },
  feedbackEmoji: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(4),
  },
  feedbackButtonText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: 'Inter500',
    color: '#666666',
  },
  feedbackButtonTextActive: {
    color: '#FFFFFF',
  },
  textFeedbackContainer: {
    marginTop: responsiveHeight(1),
    marginBottom: responsiveHeight(1),
  },
  textFeedbackInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter400',
    color: '#333333',
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
    marginBottom: responsiveHeight(1.5),
  },
  saveFeedbackButton: {
    backgroundColor: '#C17EC9',
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(6),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFeedbackButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  saveFeedbackButtonText: {
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter600',
    color: '#FFFFFF',
  },
  replaceButton: {
    backgroundColor: '#FFF3E0',
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(4),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    marginTop: responsiveHeight(1),
  },
  replaceButtonText: {
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter600',
    color: '#E65100',
  },
  replaceButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BDBDBD',
  },
  replaceButtonTextDisabled: {
    color: '#9E9E9E',
  },

  // ============ REPLACE MODAL STYLES ============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  replaceModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: responsiveHeight(3),
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(5),
    maxHeight: '80%',
  },
  replaceModalTitle: {
    fontSize: moderateScale(18, 1.5),
    fontFamily: 'Inter600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: responsiveHeight(2.5),
  },
  reasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(10),
    marginBottom: responsiveHeight(2),
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F1FB',
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonOptionActive: {
    backgroundColor: '#F3E5F5',
    borderColor: '#C17EC9',
  },
  reasonEmoji: {
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
  },
  reasonText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#666666',
  },
  reasonTextActive: {
    color: '#C17EC9',
    fontFamily: 'Inter600',
  },
  customReasonInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(13, 1.5),
    fontFamily: 'Inter400',
    color: '#333333',
    minHeight: verticalScale(60),
    textAlignVertical: 'top',
    marginBottom: responsiveHeight(2),
  },
  replaceModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: responsiveHeight(2),
  },
  cancelButton: {
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(5),
  },
  cancelButtonText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'Inter500',
    color: '#9E9E9E',
  },
  getNewActionButton: {
    backgroundColor: '#C17EC9',
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(6),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  getNewActionButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  getNewActionButtonText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'Inter600',
    color: '#FFFFFF',
  },
});

export default ActionDetailScreen;
