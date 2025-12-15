import Images from '@/assets/images';
import ActionPlanTimeline from '@/components/ActionPlanTimeline';
import AuvraChatModal from '@/components/AuvraChatModal';
import CalendarBottomSheet from '@/components/CalendarBottomSheet';
import apiPromiseManager from '@/services/apiPromiseManager';
import homeService, { AssignmentsResponse, CycleInfo, HormoneStats, ProgressStatsResponse } from '@/services/homeService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Circle, Defs, Line, Polygon, Stop, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient } from 'react-native-svg';
import TypeActionPlan from '../../components/TypeActionPlan';

type RootStackParamList = {
  ChatbotScreen: {
    conversationContext?: {
      initialMessage: string;
      userResponse: string;
      context: string;
    };
  };
  MainScreenTabs: {
    activeTab?: string;
    chatContext?: {
      chatId: string;
      conversationContext?: {
        initialMessage: string;
        userResponse: string;
        context: string;
      };
    };
  };
};

interface HomeScreenProps {
  route?: { 
    params?: { 
      refreshedData?: AssignmentsResponse;
      cyclePhaseData?: any;
      skipLoading?: boolean;
      skipTodayLoading?: boolean;
      freshSignup?: boolean;
    }; 
  };
}

const FRESH_SIGNUP_FLAG = 'fresh_signup_pending_refresh';

const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentsResponse | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [hasRetried, setHasRetried] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time');
  
  // Auvra chat modal state
  const [showAuvraChat, setShowAuvraChat] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const freshSignupCheckRef = useRef<boolean>(false);
  const initialDataLoadedRef = useRef<boolean>(false); // Prevent duplicate initial fetches

  // Note: Fresh signup data loading is now handled by SignupLoadingScreen
  // which waits until data is ready before navigating to HomeScreen

  // Disable swipe back gesture to prevent interference with scrolling
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

  // Reset inactivity timer - Shows Auvra modal after period of inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (!showAuvraChat) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowAuvraChat(true);
      }, 15000); // 15 seconds 
    }
  };

  // Handle user interaction
  const handleUserInteraction = () => {
    // Only reset timer if Auvra chat is not showing
    // Don't hide the chat when user interacts with screen
    if (!showAuvraChat) {
      resetInactivityTimer();
    }
  };

  // Handle Auvra chat responses - Navigate to chatbot for plan changes
  const handleAuvraResponse = (response: 'positive' | 'negative' | string) => {
    setShowAuvraChat(false);
    
    // Map response to user message
    let userMessage = '👍 It works for me';
    if (response === 'negative') {
      userMessage = '👎 I want to change it';
    } else if (typeof response === 'string' && response !== 'positive') {
      userMessage = response;
    }
    
    // Navigate to MainScreenTabs with auvra tab active and chat context
    const conversationContext = {
      initialMessage: "How does your care plan look today?",
      userResponse: userMessage,
      context: "care_plan_modal"
    };
    
    console.log('HomeScreen - Navigating to Care Plan check-in with:', {
      activeTab: 'auvra',
      chatContext: {
        chatId: '1',
        conversationContext
      }
    });
    
    // Navigate to the chatbot via MainScreenTabs
    navigation.navigate('MainScreenTabs', { 
      activeTab: 'auvra',
      chatContext: {
        chatId: '1', // Care Plan check-in chat ID
        conversationContext
      }
    });
  };

  // Handle calendar button click
  const handleCalendarPress = () => {
    setShowCalendar(true);
  };

  // Handle Auvra chat close
  const handleAuvraClose = () => {
    setShowAuvraChat(false);
    resetInactivityTimer(); // Reset timer when user closes manually
  };

  // Start timer when component mounts and data is loaded
  useEffect(() => {
    if (!loading && assignments) {
      resetInactivityTimer();
    }
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [loading, assignments, showAuvraChat]);

  /**
   * Convert hormone_stats data to HormoneStats interface
   * @param hormoneStatsData - Raw hormone stats data from API
   * @returns Formatted hormone stats object
   */
  const convertHormoneStats = (hormoneStatsData: any) => {
    const hormoneStats: HormoneStats = {};
    const supportedHormones = ['androgens', 'progesterone', 'estrogen', 'thyroid', 'insulin', 'cortisol', 'FSH', 'LH', 'prolactin', 'ghrelin', 'testosterone'];
    
    supportedHormones.forEach(hormone => {
      if (hormoneStatsData[hormone]) {
        hormoneStats[hormone as keyof HormoneStats] = {
          completed: hormoneStatsData[hormone].completed || 0,
          total: hormoneStatsData[hormone].total || 0
        };
      }
    });
    
    return hormoneStats;
  };

  useEffect(() => {
    // Check for refreshed data from ActionCompletedScreen
    const refreshedData = route?.params?.refreshedData;
    const cyclePhaseData = route?.params?.cyclePhaseData;
    const skipLoading = route?.params?.skipLoading;
    const skipTodayLoading = route?.params?.skipTodayLoading;

    if (refreshedData && skipLoading) {
      // All data completed - use refreshed data
      setAssignments(refreshedData);
      
      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }
      
      if (cyclePhaseData?.cycle_info) {
        setCycleInfo(cyclePhaseData.cycle_info);
      }
      
      setLoading(false);
      initialDataLoadedRef.current = true;
    } else if (refreshedData && skipTodayLoading) {
      // Only Today API completed - use partial data
      setAssignments(refreshedData);
      
      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }
      
      // Load cycle data separately without loading state
      homeService.getCyclePhase().then(cycleData => {
        setCycleInfo(cycleData?.cycle_info || null);
        setLoading(false);
        initialDataLoadedRef.current = true;
      });
    } else {
      // Prevent duplicate initial fetches
      if (initialDataLoadedRef.current && !hasRetried) {
        return;
      }
      
      // Check for active API promise from ActionCompletedScreen
      const activePromise = apiPromiseManager.getActivePromise();
      
      if (activePromise) {
        setLoading(true);
        
        // Wait for API promise result
        activePromise
          .then(result => {
            if (result.success) {
              if (result.todayAssignments) {
                setAssignments(result.todayAssignments);
                
                if (result.todayAssignments.hormone_stats) {
                  setProgressStats({ hormone_stats: convertHormoneStats(result.todayAssignments.hormone_stats) });
                }
              }

              if (result.cyclePhaseData?.cycle_info) {
                setCycleInfo(result.cyclePhaseData.cycle_info);
              }

              // Fallback to normal load if both failed
              if (!result.todayAssignments && !result.cyclePhaseData) {
                loadHomeDataWithoutLoading();
              }
            } else {
              // API call failed - use normal data load
              loadHomeDataWithoutLoading();
            }
          })
          .catch(error => {
            // Promise error - use normal data load
            loadHomeDataWithoutLoading();
          })
          .finally(() => {
            setLoading(false);
            initialDataLoadedRef.current = true;
          });
      } else {
        // Normal data load
        loadHomeData();
      }
    }
  }, [route?.params, hasRetried]);

  /**
   * Load home data with loading state
   */
  const loadHomeData = async () => {
    // Prevent duplicate fetches
    if (initialDataLoadedRef.current) {
      return;
    }
    initialDataLoadedRef.current = true;
    
    try {
      setLoading(true);
      
      // Call APIs in parallel
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        homeService.getTodayAssignments(),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);
      setAssignments(assignmentsData);
      
      if (assignmentsData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
      } else {
        setProgressStats(null);
      }

      // Auto-retry if we got empty assignments (session link might still be completing)
      if (assignmentsData?.total_assignments === 0 && !hasRetried) {
        console.log('📭 Got empty assignments, will auto-retry in 3 seconds...');
        setHasRetried(true);
        initialDataLoadedRef.current = false; // Allow retry
        
        setTimeout(async () => {
          console.log('🔄 Auto-retrying to fetch assignments...');
          try {
            const retryData = await homeService.getTodayAssignments();
            if (retryData && retryData.total_assignments > 0) {
              console.log('✅ Auto-retry successful, got', retryData.total_assignments, 'assignments');
              setAssignments(retryData);
              if (retryData.hormone_stats) {
                setProgressStats({ hormone_stats: convertHormoneStats(retryData.hormone_stats) });
              }
            } else {
              console.log('📭 Auto-retry still got empty assignments');
            }
          } catch (retryError) {
            console.log('❌ Auto-retry failed:', retryError);
          }
        }, 3000);
      }
    } catch (error) {
      // Handle error silently
      initialDataLoadedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load home data without changing loading state
   */
  const loadHomeDataWithoutLoading = async () => {
    try {
      // Call APIs in parallel
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        homeService.getTodayAssignments(),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);
      setAssignments(assignmentsData);
      
      if (assignmentsData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
      } else {
        setProgressStats(null);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  /**
   * Get greeting based on current time
   * @returns Greeting string (Morning/Afternoon/Evening)
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  /**
   * Format date string to readable format
   * @param dateString - Date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Get time slot icon
   * @param timeSlot - Time slot string
   * @returns Emoji icon for time slot
   */
  const getTimeIcon = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return '🌤️';
      case 'afternoon': return '☀️';
      case 'evening': return '🌙';  // Backend now uses 'evening'
      case 'night': return '🌙';     // Keep for backwards compatibility
      case 'anytime': return 'Anytime';
      default: return 'Anytime';
    }
  };

  /**
   * Get action amount based on category
   * @param assignment - Assignment object
   * @returns Amount string for the action
   */
  const getActionAmount = (assignment: any) => {
    switch (assignment.category?.toLowerCase()) {
      case 'food':
        return assignment.food_amounts?.[0] || '1 serving';
      case 'exercise':
        return assignment.exercise_durations?.[0] || '15 min';
      case 'supplement':
        return assignment.food_amounts?.[0] || '1 dose';
      case 'mindfulness':
        return assignment.mindfulness_durations?.[0] || '10 min';
      default:
        return '1 item';
    }
  };

  /**
   * Get action purpose from symptoms and conditions
   * @param assignment - Assignment object
   * @returns Purpose string
   */
  const getActionPurpose = (assignment: any) => {
    const allItems = [];
    
    if (assignment.symptoms && assignment.symptoms.length > 0) {
      allItems.push(...assignment.symptoms);
    }
    if (assignment.conditions && assignment.conditions.length > 0) {
      allItems.push(...assignment.conditions);
    }
    
    if (allItems.length > 0) {
      return allItems.join(', ');
    }
    
    return assignment.purpose || 'Health';
  };

  /**
   * Get hormone icon emoji or image
   * @param hormone - Hormone name
   * @returns Image source for hormone
   */
  const getHormoneIcon = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return Images.TestosteroneBothHand;
      case 'progesterone': return Images.ProgesteroneBothHand;
      case 'estrogen': return Images.EstrogenBothHand;
      case 'thyroid': return Images.ThyroidBothHand;
      case 'insulin': return Images.InsulinBothHand;
      case 'cortisol': return Images.CortisolBothHand;
      case 'fsh': return Images.EstrogenBothHand;
      case 'lh': return Images.LHCharacterBothHand;
      case 'prolactin': return Images.ProgesteroneBothHand;
      case 'ghrelin': return Images.InsulinBothHand;
      case 'testosterone': return Images.TestosteroneBothHand;
      default: return Images.ProgesteroneBothHand;
    }
  };

  /**
   * Calculate progress percentage
   * @param completed - Number of completed items
   * @param total - Total number of items
   * @returns Percentage value
   */
  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  /**
   * Get progress color for hormone
   * @param hormone - Hormone name
   * @returns Color hex string
   */
  const getProgressColor = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return '#FF6991';
      case 'progesterone': return '#CBF0FF';
      case 'estrogen': return '#FF8BA7';
      case 'thyroid': return '#F6C34C';
      case 'insulin': return '#90EE90';
      case 'cortisol': return '#FFA07A';
      case 'fsh': return '#98FB98';
      case 'lh': return '#FFD700';
      case 'prolactin': return '#F6C34C';
      case 'ghrelin': return '#FF6B6B';
      case 'testosterone': return '#A29AEA';
      default: return '#C17EC9';
    }
  };

  // Lighten a hex color by blending it toward white by the given factor (0..1)
  const lightenColor = (hex: string, factor: number = 0.85) => {
    const cleaned = hex.replace('#', '');
    const num = parseInt(cleaned, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);

    return `rgb(${lr}, ${lg}, ${lb})`;
  };

  /**
   * Get hormone quest colors for background gradients
   * @returns Object with first and second hormone colors
   */
  const getHormoneQuestColors = () => {
    const allHormones: string[] = [];
    
    // Get hormones directly from hormone_stats
    if (assignments?.hormone_stats) {
      Object.keys(assignments.hormone_stats).forEach(hormone => {
        allHormones.push(hormone);
      });
    }
    
    // Remove duplicates and get first and second hormone colors
    const uniqueHormones = [...new Set(allHormones)];
    const firstHormoneColor = uniqueHormones.length > 0 ? getProgressColor(uniqueHormones[0]) : '#C17EC9';
    const secondHormoneColor = uniqueHormones.length > 1 ? getProgressColor(uniqueHormones[1]) : '#87CEEB';
    
    return { firstHormoneColor, secondHormoneColor };
  };

  /**
   * Render large background radial gradients
   * @returns SVG component with overlapping gradients
   */
  const renderBackgroundGradients = () => {
    const { firstHormoneColor, secondHormoneColor } = getHormoneQuestColors();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    return (
      <View style={styles.backgroundGradientsContainer}>
        <Svg 
          width={screenWidth} 
          height={screenHeight}
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          <Defs>
            {/* First large radial gradient */}
            <SvgRadialGradient id="bgGrad1" cx="0.3" cy="0.4" r="0.5">
              <Stop offset="0%" stopColor={firstHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={firstHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={firstHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>
            
            {/* Second large radial gradient */}
            <SvgRadialGradient id="bgGrad2" cx="0.7" cy="0.4" r="0.5">
              <Stop offset="0%" stopColor={secondHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={secondHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={secondHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          
          {/* First large circular gradient */}
          <Circle
            cx={screenWidth * 0.3}
            cy={screenHeight * 0.4}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad1)"
          />
          
          {/* Second large circular gradient */}
          <Circle
            cx={screenWidth * 0.7}
            cy={screenHeight * 0.4}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad2)"
          />
        </Svg>
      </View>
    );
  };

  /**
   * Render VectorSpotlight as a foreground overlay above gradients and white circle
   */
  const renderSpotlightOverlay = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    return (
      <View style={styles.spotlightOverlayContainer} pointerEvents="none">
        <Svg 
          width={screenWidth} 
          height={screenHeight}
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          <Defs>
            <SvgLinearGradient id="spotlightLinear" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          {/* Foreground triangular spotlight starting from the top */}
          <Polygon
            points={`${screenWidth * 0.5},0 ${screenWidth * 0.12},${screenHeight * 0.32} ${screenWidth * 0.88},${screenHeight * 0.32}`}
            fill="url(#spotlightLinear)"
          />
        </Svg>
      </View>
    );
  };

  /**
   * Get progress background color for hormone
   * @param hormone - Hormone name
   * @returns Background color hex string
   */
  const getProgressBgColor = (hormone: string) => {
    // Use a lighter shade of the main progress color for the unfilled track
    const base = getProgressColor(hormone);
    return lightenColor(base, 0.75);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        onTouchStart={handleUserInteraction}
        onScroll={handleUserInteraction}
      >
        {/* Large radial gradient background */}
        {renderBackgroundGradients()}
        
        {/* White circle overlay effect - show in both views */}
        <View style={styles.whiteCircleOverlay} />

        {/* Foreground VectorSpotlight overlay (on top of gradients and white circle) */}
        {renderSpotlightOverlay()}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()} {cycleInfo?.user_name || 'User'}!
            </Text>
            {cycleInfo?.cycle_day && cycleInfo?.phase ? (
              <Text style={styles.cycleInfo}>
                Cycle Day {cycleInfo.cycle_day} | {cycleInfo.phase}
              </Text>
            ) : (
              <View style={styles.noCycleDataContainer}>
                <Text style={styles.noCycleDataText}>No cycle data yet</Text>
                <Text style={styles.separator}>|</Text>
                <TouchableOpacity>
                  <Text style={styles.logPeriodText}>Log period</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarPress}>
            <Image 
              source={require('../../assets/icons/IconCalendar.png')}
              style={styles.calendarIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Hormone Quests Section - only show if there are any non-zero hormone totals */}
        {progressStats?.hormone_stats && 
         Object.values(progressStats.hormone_stats).some(stats => stats && stats.total > 0) && (
        <View style={styles.questSection}>
          <Text style={styles.sectionTitle}>🏆 Your Hormone Quests 🏆</Text>
          <View style={styles.questContainer}>
              {Object.entries(progressStats.hormone_stats).map(([hormone, stats], index) => {
                const hormoneKey = hormone as keyof HormoneStats;
                const hormoneStats = progressStats.hormone_stats[hormoneKey];
                
                if (!hormoneStats || hormoneStats.total === 0) return null;
                
                // Determine rotation based on position (left = -15deg, right = +15deg)
                const isLeft = index % 2 === 0;
                const rotation = isLeft ? '-5deg' : '10deg';
                
                return (
                  <View key={hormone} style={styles.questItem}>
              <View style={styles.questImageContainer}>
                      {typeof getHormoneIcon(hormone) === 'string' ? (
                        <Text style={styles.questIcon}>{getHormoneIcon(hormone)}</Text>
                      ) : (
                        <View style={styles.questIconImageContainer}>
                          <Image 
                            source={getHormoneIcon(hormone)} 
                            style={[styles.questIconImage, { transform: [{ rotate: rotation }] }]}
                            resizeMode="contain"
                          />
                        </View>
                      )}
              </View>
                    <Text style={styles.questName}>{hormone.charAt(0).toUpperCase() + hormone.slice(1)}</Text>
              <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: getProgressBgColor(hormone) }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                              backgroundColor: getProgressColor(hormone),
                              width: `${getProgressPercentage(hormoneStats.completed, hormoneStats.total)}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                        {hormoneStats.completed}/{hormoneStats.total}
                </Text>
              </View>
            </View>
                );
              })}
          </View>
        </View>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Svg width={responsiveWidth(30)} height={1} style={styles.centerDivider}>
            <Line 
              x1="0" 
              y1="0" 
              x2="100%" 
              y2="0" 
              stroke="#CFCFCF" 
              strokeWidth="1" 
              strokeDasharray="2,2"
            />
          </Svg>
        </View>

        {/* Today's Action Plan */}
        <View style={styles.actionPlanSection}>
          <View style={styles.actionPlanHeader}>
            <Text style={styles.sectionTitle}>Today's Action Plan</Text>
            <Text style={styles.dateText}>
              {assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
            </Text>
          </View>

          {/* Timeline and sort buttons container */}
          <View style={styles.timelineContainer}>
            {/* Dynamic component rendering */}
            {assignments?.assignments && Object.keys(assignments.assignments).length > 0 ? (
              sortBy === 'time' ? (
                <ActionPlanTimeline
                  dateLabel={assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
                  assignments={assignments.assignments}
                />
              ) : (
                <TypeActionPlan
                  dateLabel={assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
                  assignments={assignments.assignments}
                />
              )
            ) : (
              <View style={styles.noAssignmentsContainer}>
                <Text style={styles.noAssignmentsText}>No assignments for today</Text>
              </View>
            )}

            {/* Sort buttons - positioned absolutely */}
            <View style={styles.sortContainer}>
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  styles.sortButtonLeft,
                  sortBy === 'type' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('type')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'type' && styles.sortButtonTextActive
                ]}>Type</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  styles.sortButtonRight,
                  sortBy === 'time' && styles.sortButtonActive
                ]}
                onPress={() => setSortBy('time')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'time' && styles.sortButtonTextActive
                ]}>Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Auvra Chat Modal */}
      {showAuvraChat && (
        <AuvraChatModal
          onClose={handleAuvraClose}
          onResponse={handleAuvraResponse}
        />
      )}

      {/* Calendar Bottom Sheet */}
      <CalendarBottomSheet
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8', // Light pink fallback - visible even if gradients fail
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: responsiveHeight(5),
    minHeight: responsiveHeight(120),
    zIndex: 1, // Ensure scroll content appears above background gradients
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  backgroundGradientsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  spotlightOverlayContainer: {
    position: 'absolute',
    top: verticalScale(-15),
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  whiteCircleOverlay: {
    position: 'absolute',
    top: responsiveHeight(27),
    left: (Dimensions.get('window').width / 2) - responsiveWidth(150),
    width: responsiveWidth(300),
    height: responsiveWidth(400),
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(150),
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8', // Ensure loading state has visible background
  },
  loadingText: {
    fontSize: responsiveFontSize(2),
    color: '#6F6F6F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6), // Increased top padding
    paddingBottom: verticalScale(30),
    zIndex: 10, // Ensure header appears above background elements
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter500',
    color: '#000000',
    opacity: 0.77,
    marginBottom: verticalScale(3),
  },
  cycleInfo: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  noCycleDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  noCycleDataText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  separator: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  logPeriodText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#C17EC9',
  },
  calendarButton: {
    padding: responsiveWidth(1.5),
  },
  calendarIcon: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    tintColor: '#000000',
  },
  questSection: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
    zIndex: 5, // Ensure quest section appears above background
  },
  sectionTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  questContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  questItem: {
    alignItems: 'center',
    minWidth: responsiveWidth(30),
    marginBottom: responsiveHeight(1),
  },
  questImageContainer: {
    width: responsiveWidth(25),
    height: responsiveHeight(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  questImage: {
    width: responsiveWidth(18),
    height: responsiveHeight(10),
    borderRadius: responsiveWidth(9),
  },
  questIcon: {
    fontSize: responsiveFontSize(2.5),
  },
  questIconImageContainer: {
    width: scale(128),
    height: verticalScale(100),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  questIconImage: {
    width: '100%',
    height: '100%',
  },
  questName: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'NotoSerif400',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  progressBar: {
    width: responsiveWidth(15),
    height: responsiveHeight(1),
    borderRadius: responsiveWidth(6),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: responsiveWidth(6),
  },
  progressText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  divider: {
    height: 1,
    backgroundColor: '#CFCFCF',
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(2),
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(2),
  },
  centerDivider: {
    width: responsiveWidth(30),
    height: 1,
    backgroundColor: 'transparent',
    // Custom dashed line will be implemented using SVG
  },
  actionPlanSection: {
    paddingHorizontal: responsiveWidth(5),
    zIndex: 5, // Ensure action plan appears above background
  },
  actionPlanHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  dateText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  timelineContainer: {
    position: 'relative',
  },
  sortContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    borderRadius: responsiveWidth(2),
    overflow: 'hidden',
    zIndex: 10,
  },
  sortButton: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    backgroundColor: '#FFFFFF',
    borderWidth: 0.25,
    borderColor: '#CFCFCF',
  },
  sortButtonActive: {
    backgroundColor: '#C17EC9',
    borderColor: '#C17EC9',
  },
  sortButtonLeft: {
    borderTopLeftRadius: responsiveWidth(2),
    borderBottomLeftRadius: responsiveWidth(2),
    borderRightWidth: 0,
  },
  sortButtonRight: {
    borderTopRightRadius: responsiveWidth(2),
    borderBottomRightRadius: responsiveWidth(2),
    borderLeftWidth: 0,
  },
  sortButtonText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  sortButtonTextActive: {
    fontFamily: 'Inter500',
    color: '#FFFFFF',
  },
  actionItemsContainer: {
    position: 'relative',
  },

  timeSection: {
    marginBottom: responsiveHeight(6),
    position: 'relative',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
    paddingLeft: responsiveWidth(15),
  },
  actionItemRight: {
    flexDirection: 'row-reverse',
    paddingLeft: 0,
    paddingRight: responsiveWidth(15),
  },
  actionImageContainer: {
    width: responsiveWidth(17),
    height: responsiveWidth(17),
    borderRadius: responsiveWidth(8.5),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionImage: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
  },
  actionIcon: {
    fontSize: responsiveFontSize(2.5),
  },
  hormoneBadge: {
    position: 'absolute',
    top: -responsiveHeight(1),
    left: -responsiveWidth(1),
    backgroundColor: '#FFE9F1',
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(1),
    paddingVertical: responsiveHeight(0.2),
  },
  hormoneBadgeText: {
    fontSize: responsiveFontSize(1.1),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  actionDetails: {
    flex: 1,
    marginHorizontal: responsiveWidth(3),
  },
  actionTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#949494',
  },
  actionSeparator: {
    fontSize: responsiveFontSize(1.7),
    color: '#949494',
    marginHorizontal: responsiveWidth(1),
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#949494',
  },
  tomorrowSection: {
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
  },
  tomorrowHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  tomorrowLockContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(2),
  },
  tomorrowLockIcon: {
    fontSize: responsiveFontSize(2.5),
    color: '#949494',
  },
  tomorrowPreview: {
    position: 'relative',
  },
  tomorrowBlurredContent: {
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
    opacity: 0.7,
  },
  pixelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.4)',
    zIndex: 3,
    opacity: 0.6,
  },
  staticOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
    zIndex: 4,
    opacity: 0.5,
  },
  tomorrowCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  tomorrowCategoryTitle: {
    fontSize: responsiveFontSize(2),
    fontWeight: '500',
    color: '#6F6F6F',
    paddingHorizontal: responsiveWidth(2),
  },
  dividerLeft: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
    marginRight: responsiveWidth(2),
  },
  dividerRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: responsiveWidth(2),
  },
  tomorrowActionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    gap: responsiveWidth(3),
  },

  sortButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  sortButtonTextDisabled: {
    color: '#C0C0C0',
  },
  tomorrowImageContainer: {
    width: responsiveWidth(12.5),
    height: responsiveWidth(12.5),
    borderRadius: responsiveWidth(6.25),
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tomorrowActionImage: {
    fontSize: responsiveFontSize(3),
  },
  tomorrowActionDetails: {
    flex: 1,
    gap: responsiveHeight(0.5),
  },
  tomorrowActionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  hormoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  hormoneCount: {
    fontSize: responsiveFontSize(1.6),
    color: '#949494',
  },
  hormoneIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    borderRadius: responsiveWidth(2),
    backgroundColor: '#A36CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneIconText: {
    fontSize: responsiveFontSize(1.2),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeEmoji: {
    fontSize: responsiveFontSize(2.2),
  },
  bottomSpacing: {
    height: responsiveHeight(5),
  },
  noAssignmentsContainer: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(4),
  },
  noAssignmentsText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
});

export default HomeScreen;
