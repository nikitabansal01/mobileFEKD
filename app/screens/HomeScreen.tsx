import ActionPlanTimeline from '@/components/ActionPlanTimeline';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import homeService, { AssignmentsResponse, CycleInfo, HormoneStats, ProgressStatsResponse } from '@/services/homeService';
import apiPromiseManager from '@/services/apiPromiseManager';
// import { BlurView } from 'expo-blur';
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
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time'); // 정렬 방식 상태

  // 스와이프 뒤로가기 비활성화
  useFocusEffect(
    React.useCallback(() => {
      // 화면 포커스 시 뒤로가기 제스처 비활성화
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        // 화면 언포커스 시 뒤로가기 제스처 재활성화
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );




  // hormone_stats 변환 함수
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
    // ActionCompletedScreen에서 새로고침된 데이터가 있는지 확인
    const refreshedData = route?.params?.refreshedData;
    const cyclePhaseData = route?.params?.cyclePhaseData;
    const skipLoading = route?.params?.skipLoading;
    const skipTodayLoading = route?.params?.skipTodayLoading;

    if (refreshedData && skipLoading) {
      // 모든 데이터가 완료된 경우
      console.log('✅ ActionCompletedScreen에서 모든 데이터 사용');
      
      // 새로고침된 assignments 데이터 사용
      setAssignments(refreshedData);
      
      // hormone_stats를 동적으로 변환
      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }
      
      // cycle 데이터 설정
      if (cyclePhaseData?.cycle_info) {
        setCycleInfo(cyclePhaseData.cycle_info);
      }
      
      setLoading(false);
    } else if (refreshedData && skipTodayLoading) {
      // Today API만 완료된 경우
      console.log('✅ ActionCompletedScreen에서 Today 데이터만 사용, Cycle은 별도 로드');
      
      // 새로고침된 assignments 데이터 사용
      setAssignments(refreshedData);
      
      // hormone_stats를 동적으로 변환
      if (refreshedData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(refreshedData.hormone_stats) });
      }
      
      // 사이클 정보만 따로 로드 (loading 없이)
      homeService.getCyclePhase().then(cycleData => {
        setCycleInfo(cycleData?.cycle_info || null);
        setLoading(false);
      });
    } else {
      // ActionCompletedScreen에서 진행 중인 API Promise가 있는지 확인
      const activePromise = apiPromiseManager.getActivePromise();
      
      if (activePromise) {
        console.log('🔄 ActionCompletedScreen API Promise 발견 - 결과 대기 중');
        setLoading(true);
        
        // API Promise 결과 대기
        activePromise
          .then(result => {
            console.log('🔄 API Promise 결과:', result);
            
            if (result.success) {
              if (result.todayAssignments) {
                console.log('✅ Promise에서 Today 데이터 받음');
                setAssignments(result.todayAssignments);
                
                if (result.todayAssignments.hormone_stats) {
                  setProgressStats({ hormone_stats: convertHormoneStats(result.todayAssignments.hormone_stats) });
                }
              }

              if (result.cyclePhaseData?.cycle_info) {
                console.log('✅ Promise에서 Cycle 데이터 받음');
                setCycleInfo(result.cyclePhaseData.cycle_info);
              }

              // 둘 다 실패한 경우에만 일반 로드
              if (!result.todayAssignments && !result.cyclePhaseData) {
                console.log('❌ Promise에서 모든 데이터 실패 - 일반 로드로 전환');
                loadHomeDataWithoutLoading();
              }
            } else {
              console.log('❌ Promise 실패 - 일반 로드로 전환');
              // API 호출이 실패했으면 일반적인 데이터 로드
              loadHomeDataWithoutLoading();
            }
          })
          .catch(error => {
            console.error('❌ API Promise 오류:', error);
            // Promise에서 오류가 발생하면 일반적인 데이터 로드
            loadHomeDataWithoutLoading();
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // 일반적인 데이터 로드
        console.log('🔄 일반적인 데이터 로드');
        loadHomeData();
      }
    }
  }, [route?.params]);



  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 API 호출
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        homeService.getTodayAssignments(),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);
      setAssignments(assignmentsData);
      
      // hormone_stats를 동적으로 변환
      if (assignmentsData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
      } else {
        setProgressStats(null);
      }
    } catch (error) {
      console.error('홈 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // loading 상태 변경 없이 데이터만 로드하는 함수
  const loadHomeDataWithoutLoading = async () => {
    try {
      // 병렬로 API 호출
      const [cycleData, assignmentsData] = await Promise.all([
        homeService.getCyclePhase(),
        homeService.getTodayAssignments(),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);
      setAssignments(assignmentsData);
      
      // hormone_stats를 동적으로 변환
      if (assignmentsData?.hormone_stats) {
        setProgressStats({ hormone_stats: convertHormoneStats(assignmentsData.hormone_stats) });
      } else {
        setProgressStats(null);
      }
    } catch (error) {
      console.error('홈 데이터 로드 오류:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTimeIcon = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return '🌤️';
      case 'afternoon': return '☀️';
      case 'night': return '🌙';
      case 'anytime': return 'Anytime';
      default: return '⏰';
    }
  };

  const getActionAmount = (assignment: any) => {
    // 카테고리에 따라 다른 수량 정보 반환
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

  const getActionPurpose = (assignment: any) => {
    // symptoms와 conditions를 모두 나열
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

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

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

  // 호르몬 퀘스트에서 사용되는 호르몬들의 색상을 가져오는 함수
  const getHormoneQuestColors = () => {
    const allHormones: string[] = [];
    
    // hormone_stats에서 직접 호르몬들 가져오기
    if (assignments?.hormone_stats) {
      Object.keys(assignments.hormone_stats).forEach(hormone => {
        allHormones.push(hormone);
      });
    }
    
    // 중복 제거하고 첫 번째와 두 번째 호르몬 색상 반환
    const uniqueHormones = [...new Set(allHormones)];
    const firstHormoneColor = uniqueHormones.length > 0 ? getProgressColor(uniqueHormones[0]) : '#C17EC9';
    // 두 번째 색상을 더 대비되는 색상으로 설정
    const secondHormoneColor = uniqueHormones.length > 1 ? getProgressColor(uniqueHormones[1]) : '#87CEEB'; // 하늘색으로 변경
    
    return { firstHormoneColor, secondHormoneColor };
  };

  // 거대한 배경 방사형 그라디언트 렌더링 함수
  const renderBackgroundGradients = () => {
    const { firstHormoneColor, secondHormoneColor } = getHormoneQuestColors();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    console.log('그라디언트 색상:', { firstHormoneColor, secondHormoneColor });
    
    return (
      <View style={styles.backgroundGradientsContainer}>
        <Svg 
          width={screenWidth} 
          height={screenHeight}
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          <Defs>
            {/* 첫 번째 거대한 방사형 그라디언트 */}
            <SvgRadialGradient id="bgGrad1" cx="0.3" cy="0.4" r="0.5">
              <Stop offset="0%" stopColor={firstHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={firstHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={firstHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>
            
            {/* 두 번째 거대한 방사형 그라디언트 */}
            <SvgRadialGradient id="bgGrad2" cx="0.7" cy="0.6" r="0.5">
              <Stop offset="0%" stopColor={secondHormoneColor} stopOpacity="0.6" />
              <Stop offset="50%" stopColor={secondHormoneColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={secondHormoneColor} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          
          {/* 첫 번째 거대한 원형 그라디언트 */}
          <Circle
            cx={screenWidth * 0.3}
            cy={screenHeight * 0.4}
            r={Math.max(screenWidth, screenHeight) * 0.5}
            fill="url(#bgGrad1)"
          />
          
          {/* 두 번째 거대한 원형 그라디언트 */}
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
        {/* 거대한 방사형 그라디언트 배경 */}
        {renderBackgroundGradients()}
        
        {/* 흰색 원으로 가려진 효과 */}
        <View style={styles.whiteCircleOverlay} />

        {/* 상단 헤더 */}
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

        {/* 호르몬 퀘스트 섹션 */}
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

        {/* 구분선 */}
        <View style={styles.dividerContainer}>
          <View style={styles.centerDivider} />
        </View>

        {/* 오늘의 액션 플랜 */}
        <View style={styles.actionPlanSection}>
          <View style={styles.actionPlanHeader}>
            <Text style={styles.sectionTitle}>Today's Action Plan</Text>
            <Text style={styles.dateText}>
              {assignments?.date ? formatDate(assignments.date) : '15th July, 2025'}
            </Text>
          </View>

          {/* 타임라인과 정렬 버튼을 같은 공간에 배치 */}
          <View style={styles.timelineContainer}>
            {/* 동적 컴포넌트 렌더링 */}
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

            {/* 정렬 버튼 - absolute로 위에 떠있게 */}
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



        {/* 하단 여백 - Tomorrow 앵커 절반까지만 스크롤되도록 제거 */}
      </ScrollView>

      {/* 하단 네비게이션 바 */}
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
    paddingBottom: responsiveHeight(5), // 네비게이션 바가 앵커 절반 정도 가리도록
    minHeight: responsiveHeight(120), // 최소 높이 보장으로 즉시 스크롤 가능
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
    zIndex: -1, // 맨 뒤로 보내기
  },

  whiteCircleOverlay: {
    position: 'absolute',
    top: responsiveHeight(23), // 호르몬 퀘스트 영역 중간쯤
    left: (Dimensions.get('window').width / 2) - responsiveWidth(150), // 정확한 화면 중앙
    width: responsiveWidth(300),
    height: responsiveWidth(300),
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(150), // 반지름으로 수정
    zIndex: 0, // 그라디언트보다만 위에
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
    fontSize: responsiveFontSize(1.7), //12px
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  separator: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  logPeriodText: {
    fontSize: responsiveFontSize(1.7), //12px
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
    fontSize: responsiveFontSize(1.98),//14px
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
    width: responsiveWidth(25), // 18 → 25로 증가
    height: responsiveHeight(12), // 8 → 12로 증가
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
    fontSize: responsiveFontSize(1.7), //12px
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
    fontSize: responsiveFontSize(1.7), //12px
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
    width: responsiveWidth(30), // 화면 너비의 30%만 사용
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
    fontSize: responsiveFontSize(1.7), //12px
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  timelineContainer: {
    position: 'relative', // absolute 정렬 버튼을 위한 relative 컨테이너
  },
  sortContainer: {
    position: 'absolute',
    top: 0, // 타임라인 시작점과 같은 Y축
    right: 0, // 오른쪽 끝에 배치
    flexDirection: 'row',
    borderRadius: responsiveWidth(2),
    overflow: 'hidden',
    zIndex: 10, // 타임라인 위에 떠있게
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
    fontSize: responsiveFontSize(1.7),//12px
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
    fontSize: responsiveFontSize(1.1),//9px
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  actionDetails: {
    flex: 1,
    marginHorizontal: responsiveWidth(3),
  },
  actionTitle: {
    fontSize: responsiveFontSize(1.98),//14px
    fontFamily: 'NotoSerif500',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.7),//12px
    fontFamily: 'Inter400',
    color: '#949494',
  },
  actionSeparator: {
    fontSize: responsiveFontSize(1.7),//12px
    color: '#949494',
    marginHorizontal: responsiveWidth(1),
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.7),//12px
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
    // 픽셀화된 패턴 효과
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
    // 정적 노이즈 느낌
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
