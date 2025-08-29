import ActionPlanTimeline from '@/components/ActionPlanTimeline';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import homeService, { AssignmentsResponse, CycleInfo, HormoneStats, ProgressStatsResponse } from '@/services/homeService';
import apiPromiseManager from '@/services/apiPromiseManager';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Circle, Stop } from 'react-native-svg';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import TypeActionPlan from '../../components/TypeActionPlan';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface HomeScreenProps {
  route?: { 
    params?: { 
      refreshedData?: AssignmentsResponse;
      cyclePhaseData?: any;
      skipLoading?: boolean;
      skipTodayLoading?: boolean;
    }; 
  };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentsResponse | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time');

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
      });
    } else {
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
          });
      } else {
        // Normal data load
        loadHomeData();
      }
    }
  }, [route?.params]);

  /**
   * Load home data with loading state
   */
  const loadHomeData = async () => {
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
    } catch (error) {
      // Handle error silently
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
      case 'night': return '🌙';
      case 'anytime': return 'Anytime';
      default: return '⏰';
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
   * Get hormone icon emoji
   * @param hormone - Hormone name
   * @returns Emoji icon for hormone
   */
  const getHormoneIcon = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'androgens': return '💪';
      case 'progesterone': return '🌸';
      case 'estrogen': return '🌺';
      case 'thyroid': return '🦋';
      case 'insulin': return '🍯';
      case 'cortisol': return '⚡';
      case 'fsh': return '🌱';
      case 'lh': return '🌿';
      case 'prolactin': return '🤱';
      case 'ghrelin': return '🍽️';
      case 'testosterone': return '💪';
      default: return '💊';
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
      case 'androgens': return '#F6C34C';
      case 'progesterone': return '#FF6991';
      case 'estrogen': return '#FF8BA7';
      case 'thyroid': return '#87CEEB';
      case 'insulin': return '#FFD700';
      case 'cortisol': return '#FF6B6B';
      case 'fsh': return '#98FB98';
      case 'lh': return '#90EE90';
      case 'prolactin': return '#DDA0DD';
      case 'ghrelin': return '#FFA07A';
      case 'testosterone': return '#F6C34C';
      default: return '#C17EC9';
    }
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
            <SvgRadialGradient id="bgGrad2" cx="0.7" cy="0.6" r="0.5">
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
            cy={screenHeight * 0.6}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad2)"
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
    switch (hormone.toLowerCase()) {
      case 'androgens': return '#FFFBD4';
      case 'progesterone': return '#FDEEF5';
      case 'estrogen': return '#FFE6F0';
      case 'thyroid': return '#E6F3FF';
      case 'insulin': return '#FFF8DC';
      case 'cortisol': return '#FFE6E6';
      case 'fsh': return '#F0FFF0';
      case 'lh': return '#F0FFF0';
      case 'prolactin': return '#F8F0FF';
      case 'ghrelin': return '#FFF5EE';
      default: return '#F0F0F0';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomNavigationBar activeTab="home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
      >
        {/* Large radial gradient background */}
        {renderBackgroundGradients()}
        
        {/* White circle overlay effect */}
        <View style={styles.whiteCircleOverlay} />

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
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Hormone Quests Section */}
        {progressStats?.hormone_stats && Object.keys(progressStats.hormone_stats).length > 0 && (
        <View style={styles.questSection}>
          <Text style={styles.sectionTitle}>🏆 Today's Hormone Quests 🏆</Text>
          <View style={styles.questContainer}>
              {Object.entries(progressStats.hormone_stats).map(([hormone, stats]) => {
                const hormoneKey = hormone as keyof HormoneStats;
                const hormoneStats = progressStats.hormone_stats[hormoneKey];
                
                if (!hormoneStats || hormoneStats.total === 0) return null;
                
                return (
                  <View key={hormone} style={styles.questItem}>
              <View style={styles.questImageContainer}>
                      <Text style={styles.questIcon}>{getHormoneIcon(hormone)}</Text>
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
          <View style={styles.centerDivider} />
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

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar activeTab="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveHeight(5),
    minHeight: responsiveHeight(120),
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(40),
  },
  backgroundGradientsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  whiteCircleOverlay: {
    position: 'absolute',
    top: responsiveHeight(23),
    left: (Dimensions.get('window').width / 2) - responsiveWidth(150),
    width: responsiveWidth(300),
    height: responsiveWidth(300),
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(150),
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: responsiveHeight(4),
    paddingBottom: responsiveHeight(3),
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter500',
    color: '#000000',
    opacity: 0.77,
    marginBottom: responsiveHeight(0.3),
  },
  cycleInfo: {
    fontSize: responsiveFontSize(1.2),
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
  menuButton: {
    padding: responsiveWidth(1.5),
  },
  menuIcon: {
    fontSize: responsiveFontSize(3),
    color: '#000000',
  },
  questSection: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
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
    marginVertical: responsiveHeight(3),
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: responsiveHeight(3),
  },
  centerDivider: {
    width: responsiveWidth(30),
    height: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#CFCFCF',
    borderStyle: 'dashed',
  },
  actionPlanSection: {
    paddingHorizontal: responsiveWidth(5),
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
