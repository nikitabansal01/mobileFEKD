import Images from '@/assets/images';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Linking } from 'react-native';
import AppIntroSlider from "react-native-app-intro-slider";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, verticalScale } from 'react-native-size-matters';

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
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

  // State management
  const [isHowMode, setIsHowMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showStudyDetails, setShowStudyDetails] = useState(false);

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
    research_studies?: Array<{
      title: string;
      authors: string;
      year: number;
      journal: string;
      finding: string;
      participants?: string;
      doi?: string;
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

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        {isHowMode ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setIsHowMode(false)}>
              <Ionicons name="chevron-back" size={responsiveFontSize(3.5)} color="#6F6F6F" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>How?</Text>
            </View>
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.backButton}>
              {/* Empty space to maintain layout */}
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Why?</Text>
            </View>
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
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
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={styles.title}>
                          {action?.specific_action || ''}
                        </Text>
                      </View>
                    }
                  >
                    <LinearGradient
                      colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, width: '100%', height: '100%' }}
                    />
                  </MaskedView>
                </View>
                <View style={styles.imageContainer}>
                  {action?.hero_image_url ? (
                    <Image
                      source={{ uri: action.hero_image_url }}
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

              {/* Conditions and Symptoms - only show if available and valid */}
              {(() => {
                // Filter out 'None of the above', empty strings, and null values
                const validConditions = [...(action?.conditions || []), ...(action?.symptoms || [])]
                  .filter(c => c && c.toLowerCase() !== 'none of the above' && c.toLowerCase() !== 'none' && c.trim() !== '');

                return validConditions.length > 0 ? (
                  <View style={styles.conditionsSection}>
                    <Text style={styles.conditionsSubtitle}>
                      Eating suggestions based on your preferences and concerns
                    </Text>
                    <View style={styles.conditionsTags}>
                      {validConditions.map((condition, index) => (
                        <View key={index} style={styles.conditionTag}>
                          <Text style={styles.conditionTagText}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null;
              })()}

              {/* Advice Slider - show advices or fallback to variants */}
              {((action?.advices && action.advices.length > 0) || (action?.variants && action.variants.length > 0)) && (
                <View style={styles.adviceSection}>
                  <View
                    style={styles.sliderContainer}
                    onTouchStart={() => setScrollEnabled(false)}
                    onTouchEnd={() => setScrollEnabled(true)}
                  >
                    <AppIntroSlider
                      data={action?.advices && action.advices.length > 0
                        ? action.advices.map(a => ({
                          type: a.type,
                          title: a.title,
                          image_url: a.image, // Map image to image_url for consistency
                          description: '',
                        }))
                        : (action?.variants || []).map(v => ({
                          type: v.variant_type,
                          title: v.title || v.description || 'Option',
                          image_url: v.image_url,
                          description: v.description || '',
                        }))
                      }
                      keyExtractor={(item, index) => `advice-${index}`}
                      renderItem={({ item, index }) => (
                        <View style={styles.adviceSlideWrapper}>
                          <View style={styles.adviceCard}>
                            {/* Background Image */}
                            {item.image_url ? (
                              <Image
                                source={{ uri: item.image_url }}
                                style={styles.adviceBackgroundFullImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.adviceBackgroundImage}>
                                <Text style={styles.adviceBackgroundText}>
                                  🍽️
                                </Text>
                              </View>
                            )}

                            {/* Type Badge - Top Left */}
                            <View style={styles.adviceTypeBadge}>
                              <Text style={styles.adviceTypeBadgeText}>
                                {/* Capitalize first letter for display */}
                                {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Easy'}
                              </Text>
                            </View>

                            {/* Title - Bottom Left */}
                            <View style={styles.adviceTitleContainer}>
                              <Text style={styles.adviceTitle}>
                                {item.title || 'Try this option'}
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
                      renderPagination={(activeIndex) => {
                        const dataLength = (action?.advices && action.advices.length > 0)
                          ? action.advices.length
                          : (action?.variants?.length || 0);
                        return (
                          <View style={styles.customPagination}>
                            {Array.from({ length: dataLength }).map((_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.sliderDot,
                                  index === activeIndex && styles.sliderDotActive
                                ]}
                              />
                            ))}
                          </View>
                        );
                      }}
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
                      colors={['#A29AEA', '#C17EC9', '#E98BAC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, width: '100%', height: '100%' }}
                    />
                  </MaskedView>
                </View>
                <View style={styles.imageContainer}>
                  {action?.hero_image_url ? (
                    <Image
                      source={{ uri: action.hero_image_url }}
                      style={styles.actionImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.actionImage}>
                      <Text style={styles.imageText}>📋</Text>
                    </View>
                  )}
                </View>

                {/* Hormone Graphic */}
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
                  {action?.hormone_persona_intro || action?.purpose || 'This action helps support your hormone balance.'}
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
                    name={showStudyDetails ? "chevron-up" : "chevron-down"}
                    size={responsiveFontSize(1.7)}
                    color="#C17EC9"
                  />
                </TouchableOpacity>

                {/* Study Details Content */}
                {showStudyDetails && action?.research_studies && action.research_studies.length > 0 && (
                  <View style={styles.studyDetailsContent}>
                    {action.research_studies.map((study, index) => (
                      <View key={index} style={styles.studyCard}>
                        <View style={styles.studyTitleRow}>
                          <Text style={styles.studyIcon}>🔗</Text>
                          <Text style={styles.studyTitle}>{study.title}</Text>
                        </View>
                        <Text style={styles.studyJournalLine}>
                          Journal: {study.journal} ({study.year})
                        </Text>
                        {study.participants && (
                          <Text style={styles.studyMetaLine}>
                            Participants: {study.participants}
                          </Text>
                        )}
                        <Text style={styles.studyResultLine}>
                          Results: {study.finding}
                        </Text>
                      </View>
                    ))}
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
            </>
          )}
        </View>
      </ScrollView>

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
    paddingLeft: responsiveWidth(1),
  },
  backButtonText: {
    fontSize: responsiveFontSize(4),
    color: '#000000',
    fontWeight: 'bold',
  },
  closeButtonContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: responsiveWidth(20),
    height: responsiveHeight(20),
    paddingRight: responsiveWidth(2),
  },
  headerTitle: {
    fontSize: responsiveFontSize(1.7),
    color: '#6F6F6F',
    fontFamily: 'Inter400',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: responsiveFontSize(2),
  },
  closeButton: {
    width: responsiveWidth(10),
    height: responsiveHeight(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: responsiveFontSize(3.5),
    color: '#6F6F6F',
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
    marginTop: responsiveHeight(7),
    width: '100%',
  },
  title: {
    fontSize: responsiveFontSize(2.27),
    fontFamily: 'NotoSerif600',
    textAlign: 'center',
    lineHeight: responsiveHeight(3.2),
    maxWidth: '90%',
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(2),
    width: '100%',
  },
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsiveHeight(8),
    maxHeight: responsiveHeight(12),
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: responsiveWidth(35.78),
    height: responsiveWidth(35.78),
    borderRadius: responsiveWidth(35.78) / 2,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: responsiveWidth(5.56),
    borderColor: '#FCDDEC',
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
    borderRadius: responsiveWidth(35.78) / 2,
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
    marginBottom: responsiveHeight(-1), // Negative margin to extend behind description
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
    // paddingTop: 0,
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
    lineHeight: moderateScale(16, 1.5),
    color: '#000000',
    verticalAlign: 'top',
    textAlign: 'left',
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
    gap: verticalScale(12),
  },
  studyCard: {
    backgroundColor: '#F9F5FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E8D4EB',
  },
  studyTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  studyIcon: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
  },
  studyTitle: {
    flex: 1,
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'Inter600',
    color: '#333333',
    lineHeight: moderateScale(20),
  },
  studyJournalLine: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#666666',
    marginBottom: verticalScale(4),
  },
  studyMetaLine: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#666666',
    marginBottom: verticalScale(4),
  },
  studyResultLine: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#444444',
    lineHeight: moderateScale(18),
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
    marginTop: verticalScale(25),
    width: '100%',
  },
  conditionsSubtitle: {
    fontSize: moderateScale(12, 1.5),
    color: '#949494',
    fontFamily: 'Inter500',
    marginBottom: responsiveHeight(1),
    textAlign: 'center',
    opacity: 0.7,
  },
  conditionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: verticalScale(20),
  },
  conditionTag: {
    backgroundColor: 'rgba(218, 214, 219, 0.37)',
    paddingHorizontal: verticalScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: verticalScale(5),
  },
  conditionTagText: {
    fontSize: responsiveFontSize(1.7),
    color: '#6F6F6F',
    fontFamily: 'Inter400',
  },
  adviceSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(2),
    width: '100%',
  },
  adviceCard: {
    width: '100%',
    height: responsiveHeight(18),
    backgroundColor: '#F0F0F0',
    borderRadius: responsiveWidth(2.78),
    position: 'relative',
    overflow: 'hidden',
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
    top: responsiveHeight(0.75),
    left: responsiveWidth(1.75),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: responsiveWidth(1.5),
    paddingVertical: responsiveHeight(0.75),
    borderRadius: responsiveWidth(2.78),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adviceTypeBadgeText: {
    fontSize: responsiveFontSize(1.4),
    color: '#000000',
    fontFamily: 'Inter500',
    fontWeight: '500',
  },
  adviceTitleContainer: {
    position: 'absolute',
    bottom: responsiveHeight(1.75),
    left: responsiveWidth(1.75),
    right: responsiveWidth(1.75),
  },
  adviceTitle: {
    fontSize: responsiveFontSize(1.7),
    color: '#000000',
    fontFamily: 'Inter500',
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sliderContainer: {
    width: '100%',
    height: responsiveHeight(25),
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
    opacity: 0.3,
    marginHorizontal: responsiveWidth(1),
  },
  sliderDotActive: {
    opacity: 1,
    backgroundColor: '#C17EC9',
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
});

export default ActionDetailScreen;
