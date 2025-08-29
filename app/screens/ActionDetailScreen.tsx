import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, } from 'react-native';
import AppIntroSlider from "react-native-app-intro-slider";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import PrimaryButton from '@/components/PrimaryButton';
import GradientText from '@/components/GradientText';

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
    advices?: Array<{
      type: string;
      title: string;
      image?: string;
    }>;
  } : null;

  /**
   * Get hormone-specific description text
   * @param hormones - Array of hormone names
   * @returns Description text for the hormone
   */
  const getHormoneDescription = (hormones: string[]) => {
    if (hormones.includes('progesterone')) {
      return "I'm Progesterone — in your luteal phase, I tend to dip, causing mood swings or cramps.";
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
              <Text style={styles.backButtonText}>‹</Text>
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
                  <GradientText
                    text={action?.specific_action || ''}
                    textStyle={styles.title}
                    containerStyle={styles.gradientContainer}
                    key={`how-title-${action?.specific_action || 'default'}`}
                  />
                </View>
                <View style={styles.imageContainer}>
                  <View style={styles.actionImage}>
                    <Text style={styles.imageText}>📋</Text>
                  </View>
                  <View style={styles.imageBorder} />
                </View>
              </View>

              {/* Conditions and Symptoms */}
              <View style={styles.conditionsSection}>
                <Text style={styles.conditionsSubtitle}>
                  Eating suggestions based on your preferences and concerns
                </Text>
                <View style={styles.conditionsTags}>
                  {[...(action?.conditions || []), ...(action?.symptoms || [])].map((condition, index) => (
                    <View key={index} style={styles.conditionTag}>
                      <Text style={styles.conditionTagText}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Advice Slider */}
              {action?.advices && action.advices.length > 0 && (
                <View style={styles.adviceSection}>
                  <View 
                    style={styles.sliderContainer}
                    onTouchStart={() => setScrollEnabled(false)}
                    onTouchEnd={() => setScrollEnabled(true)}
                  >
                    <AppIntroSlider
                      data={action.advices}
                      keyExtractor={(item, index) => `advice-${index}`}
                      renderItem={({ item, index }) => (
                        <View style={styles.adviceSlideWrapper}>
                          <View style={styles.adviceCard}>
                            {/* Background Image */}
                            <View style={styles.adviceBackgroundImage}>
                              <Text style={styles.adviceBackgroundText}>
                                {item.image || '🍽️'}
                              </Text>
                            </View>
                            
                            {/* Type Badge - Top Left */}
                            <View style={styles.adviceTypeBadge}>
                              <Text style={styles.adviceTypeBadgeText}>
                                {item.type || 'Easy'}
                              </Text>
                            </View>
                            
                            {/* Title - Bottom Left */}
                            <View style={styles.adviceTitleContainer}>
                              <Text style={styles.adviceTitle}>
                                {item.title || 'Roasted pumpkin seeds'}
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
                          {action?.advices?.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.sliderDot,
                                index === activeIndex && styles.sliderDotActive
                              ]}
                            />
                          ))}
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
                  <GradientText
                    text={`💡 Why ${action?.title || 'Pumpkin Seeds'}?`}
                    textStyle={styles.title}
                    containerStyle={styles.gradientContainer}
                    key={`action-title-${action?.title || 'default'}`}
                  />
                </View>
                <View style={styles.imageContainer}>
                  <View style={styles.actionImage}>
                    <Text style={styles.imageText}>📋</Text>
                  </View>
                  <View style={styles.imageBorder} />
                </View>
                
                {/* Hormone Graphic */}
                <View style={styles.hormoneGraphic}>
                  <Text style={styles.hormoneGraphicText}>🧬</Text>
                </View>
              </View>

              {/* Description Card */}
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {getHormoneDescription(action?.hormones || [])}
                  {'\n\n'}
                  {action?.purpose || 'This action helps support your hormone balance.'}
                </Text>
              </View>

              {/* Study Details */}
              <View style={styles.studyDetails}>
                <TouchableOpacity style={styles.studyDetailsButton}>
                  <Text style={styles.studyDetailsText}>View study details</Text>
                  <Text style={styles.studyDetailsArrow}>›</Text>
                </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    height: responsiveHeight(10),
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10),
  },
  backButton: {
    position: 'absolute',
    left: responsiveWidth(5),
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10),
    width: responsiveWidth(10),
  },
  backButtonText: {
    fontSize: responsiveFontSize(3.5),
    color: '#000000',
  },
  closeButtonContainer: {
    position: 'absolute',
    right: responsiveWidth(5),
    justifyContent: 'center',
    alignItems: 'center',
    height: responsiveHeight(10),
  },
  headerTitle: {
    fontSize: responsiveFontSize(1.7),
    color: '#6F6F6F',
    fontFamily: 'Inter400',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: responsiveFontSize(1.7),
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
    paddingHorizontal: responsiveWidth(10),
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
    lineHeight: responsiveHeight(2.4),
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(5),
    width: '100%',
  },
  gradientContainer: {
    width: responsiveWidth(85),
    height: responsiveHeight(5),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: responsiveWidth(27.78),
    height: responsiveWidth(27.78),
    borderRadius: responsiveWidth(27.78) / 2,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  actionImage: {
    width: responsiveWidth(18),
    height: responsiveWidth(18),
    borderRadius: responsiveWidth(18) / 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: responsiveWidth(36.67),
    height: responsiveHeight(20),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: responsiveWidth(6.11),
    elevation: 5,
    alignSelf: 'center',
  },
  hormoneGraphicText: {
    fontSize: responsiveFontSize(6),
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(5.56),
    padding: responsiveWidth(5.56),
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#949494',
    marginBottom: responsiveHeight(2.5),
    alignSelf: 'center',
  },
  descriptionText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#000000',
    lineHeight: responsiveHeight(1.8),
  },
  studyDetails: {
    width: '100%',
    paddingVertical: responsiveHeight(2.5),
    alignSelf: 'center',
  },
  studyDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  studyDetailsText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#C17EC9',
  },
  studyDetailsArrow: {
    fontSize: responsiveFontSize(1.7),
    color: '#C17EC9',
    transform: [{ rotate: '270deg' }],
  },
  // How Mode Styles
  conditionsSection: {
    alignItems: 'center',
    marginTop: responsiveHeight(7),
    width: '100%',
  },
  conditionsSubtitle: {
    fontSize: responsiveFontSize(1.42),
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
    gap: responsiveWidth(1.5),
  },
  conditionTag: {
    backgroundColor: 'rgba(218, 214, 219, 0.37)',
    paddingHorizontal: responsiveWidth(1.5),
    paddingVertical: responsiveHeight(0.5),
    borderRadius: responsiveWidth(2.78),
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
