import ActionPlanTimeline from '@/components/ActionPlanTimeline';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import homeService, { AssignmentsResponse, CycleInfo, HormoneStats, ProgressStatsResponse } from '@/services/homeService';
// import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import TypeActionPlan from '../../components/TypeActionPlan';


const HomeScreen: React.FC = () => {
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentsResponse | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'type'>('time'); // 정렬 방식 상태




  useEffect(() => {
    loadHomeData();
  }, []);



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
        const hormoneStats: HormoneStats = {};
        const supportedHormones = ['androgens', 'progesterone', 'estrogen', 'thyroid', 'insulin', 'cortisol', 'FSH', 'LH', 'prolactin', 'ghrelin'];
        
        supportedHormones.forEach(hormone => {
          if (assignmentsData.hormone_stats[hormone]) {
            hormoneStats[hormone as keyof HormoneStats] = {
              completed: assignmentsData.hormone_stats[hormone].completed || 0,
              total: assignmentsData.hormone_stats[hormone].total || 0
            };
          }
        });
        
        setProgressStats({ hormone_stats: hormoneStats });
      } else {
        setProgressStats(null);
      }
    } catch (error) {
      console.error('홈 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
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
      default: return '#C17EC9';
    }
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
      >
        {/* 배경 그라데이션 */}
        <LinearGradient
          colors={['#F8F9FA', '#FFFFFF']}
          style={styles.backgroundGradient}
        />

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

          {/* 정렬 버튼 */}
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
        </View>

        {/* 내일 미리보기 - type 모드에서만 표시 */}
        {sortBy === 'type' && (
          <View style={styles.tomorrowSection}>
            <View style={styles.tomorrowHeader}>
              <Text style={styles.sectionTitle}>Tomorrow</Text>
              <Text style={styles.dateText}>16th July, 2025</Text>
            </View>

            {/* Lock 아이콘 - 날짜와 구분선 사이 */}
            <View style={styles.tomorrowLockContainer}>
              <Text style={styles.tomorrowLockIcon}>🔒</Text>
            </View>

            {/* Tomorrow 액션 플랜 (첫 번째만, blur 처리) */}
            <View style={styles.tomorrowPreview}>
              {/* 전체 blur 처리된 컨텐츠 */}
              <View style={styles.tomorrowBlurredContent}>
                {/* 카테고리 헤더 */}
                <View style={styles.tomorrowCategoryHeader}>
                  <View style={styles.dividerLeft} />
                  <Text style={styles.tomorrowCategoryTitle}>
                    🥗 Eat
                  </Text>
                  <View style={styles.dividerRight} />
                </View>

                {/* 첫 번째 액션 아이템 미리보기 */}
                <View style={styles.tomorrowActionPreview}>
                  <View style={styles.tomorrowImageContainer}>
                    <Text style={styles.tomorrowActionImage}>📋</Text>
                  </View>
                  
                  <View style={styles.tomorrowActionDetails}>
                    <Text style={styles.actionTitle}>Pumpkin Seeds</Text>
                    <View style={styles.tomorrowActionMeta}>
                      <Text style={styles.actionAmount}>1 spoon</Text>
                      <View style={styles.actionSeparator} />
                      <Text style={styles.actionPurpose}>Acne, PCOS</Text>
                      <View style={styles.actionSeparator} />
                      <View style={styles.hormoneInfo}>
                        <Text style={styles.hormoneCount}>+1</Text>
                        <View style={styles.hormoneIcon}>
                          <Text style={styles.hormoneIconText}>H</Text>
                        </View>
                      </View>
                      <View style={styles.actionSeparator} />
                      <Text style={styles.timeEmoji}>🌤️</Text>
                    </View>
                  </View>
                </View>

                {/* 강한 Blur 오버레이 - 임시 비활성화 */}
                {/* <BlurView 
                  intensity={150} 
                  style={styles.blurOverlay}
                  tint="light"
                /> */}
                
                {/* 추가 노이즈/해상도 저하 효과 - 다중 레이어 */}
                <View style={styles.noiseOverlay} />
                <View style={styles.pixelOverlay} />
                <View style={styles.staticOverlay} />
              </View>
            </View>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
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
    paddingBottom: responsiveHeight(15), // 네비게이션 바 높이만큼 여백
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(40),
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
    width: responsiveWidth(18),
    height: responsiveHeight(8),
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
    width: responsiveWidth(12),
    height: responsiveHeight(0.5),
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
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: responsiveHeight(2),
    borderRadius: responsiveWidth(2),
    overflow: 'hidden',
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
    marginVertical: responsiveHeight(1.5),
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
