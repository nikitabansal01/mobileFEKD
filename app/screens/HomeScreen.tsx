import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import homeService, { CycleInfo, AssignmentsResponse, ProgressStatsResponse } from '@/services/homeService';

// 임시 이미지 데이터
const TEMP_IMAGES = {
  pumpkinSeeds: 'https://via.placeholder.com/50x50/DDC2E9/FFFFFF?text=🎃',
  briskWalk: 'https://via.placeholder.com/50x50/F0F0F0/FFFFFF?text=🚶',
  ashwagandha: 'https://via.placeholder.com/50x50/F0F0F0/FFFFFF?text=🌿',
  lightYoga: 'https://via.placeholder.com/50x50/F0F0F0/FFFFFF?text=🧘',
  progesterone: 'https://via.placeholder.com/75x75/FFE9F1/FFFFFF?text=🌸',
  testosterone: 'https://via.placeholder.com/75x75/FFFBD4/FFFFFF?text=💪',
};

const HomeScreen: React.FC = () => {
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentsResponse | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 API 호출
      const [cycleData, assignmentsData, progressData] = await Promise.all([
        homeService.getCyclePhase(),
        homeService.getTodayAssignments(),
        homeService.getProgressStats(),
      ]);

      setCycleInfo(cycleData?.cycle_info || null);
      setAssignments(assignmentsData);
      setProgressStats(progressData);
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
      default: return '⏰';
    }
  };

  const getHormoneIcon = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'progesterone': return '🌸';
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
      case 'progesterone': return '#FF6991';
      case 'testosterone': return '#F6C34C';
      default: return '#C17EC9';
    }
  };

  const getProgressBgColor = (hormone: string) => {
    switch (hormone.toLowerCase()) {
      case 'progesterone': return '#FDEEF5';
      case 'testosterone': return '#FFFBD4';
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
            <Text style={styles.cycleInfo}>
              Cycle Day {cycleInfo?.cycle_day || 0} | {cycleInfo?.phase || 'Unknown phase'}
            </Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* 호르몬 퀘스트 섹션 */}
        <View style={styles.questSection}>
          <Text style={styles.sectionTitle}>🏆 Today's Hormone Quests 🏆</Text>
          <View style={styles.questContainer}>
            {/* Progesterone Quest */}
            <View style={styles.questItem}>
              <View style={styles.questImageContainer}>
                <Image 
                  source={{ uri: TEMP_IMAGES.progesterone }}
                  style={styles.questImage}
                />
              </View>
              <Text style={styles.questName}>Progesterone</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: getProgressBgColor('progesterone') }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: getProgressColor('progesterone'),
                        width: `${getProgressPercentage(
                          progressStats?.hormone_stats.progesterone.completed || 0,
                          progressStats?.hormone_stats.progesterone.total || 2
                        )}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressStats?.hormone_stats.progesterone.completed || 0}/{progressStats?.hormone_stats.progesterone.total || 2}
                </Text>
              </View>
            </View>

            {/* Testosterone Quest */}
            <View style={styles.questItem}>
              <View style={styles.questImageContainer}>
                <Image 
                  source={{ uri: TEMP_IMAGES.testosterone }}
                  style={styles.questImage}
                />
              </View>
              <Text style={styles.questName}>Testosterone</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: getProgressBgColor('testosterone') }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: getProgressColor('testosterone'),
                        width: `${getProgressPercentage(
                          progressStats?.hormone_stats.testosterone.completed || 0,
                          progressStats?.hormone_stats.testosterone.total || 2
                        )}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressStats?.hormone_stats.testosterone.completed || 0}/{progressStats?.hormone_stats.testosterone.total || 2}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

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
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonText}>Type</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortButton, styles.sortButtonActive]}>
              <Text style={[styles.sortButtonText, styles.sortButtonTextActive]}>Time</Text>
            </TouchableOpacity>
          </View>

          {/* 액션 아이템들 */}
          <View style={styles.actionItemsContainer}>
            {/* Morning Section */}
            <View style={styles.timeSection}>
              <View style={styles.timeIconContainer}>
                <Text style={styles.timeIcon}>🌤️</Text>
              </View>
              
              {/* Pumpkin Seeds */}
              <View style={styles.actionItem}>
                <View style={styles.actionImageContainer}>
                  <Image 
                    source={{ uri: TEMP_IMAGES.pumpkinSeeds }}
                    style={styles.actionImage}
                  />
                  <View style={styles.hormoneBadge}>
                    <Text style={styles.hormoneBadgeText}>+1</Text>
                  </View>
                </View>
                <View style={styles.actionDetails}>
                  <Text style={styles.actionTitle}>Pumpkin Seeds</Text>
                  <View style={styles.actionMeta}>
                    <Text style={styles.actionAmount}>1 spoon</Text>
                    <Text style={styles.actionSeparator}>•</Text>
                    <Text style={styles.actionPurpose}>Acne, PCOS</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Afternoon Section */}
            <View style={styles.timeSection}>
              <View style={styles.timeIconContainer}>
                <Text style={styles.timeIcon}>☀️</Text>
              </View>
              
              {/* Brisk Walk */}
              <View style={[styles.actionItem, styles.actionItemRight]}>
                <View style={styles.actionDetails}>
                  <Text style={styles.actionTitle}>Brisk Walk</Text>
                  <View style={styles.actionMeta}>
                    <Text style={styles.actionAmount}>15 min</Text>
                    <Text style={styles.actionSeparator}>•</Text>
                    <Text style={styles.actionPurpose}>Stress</Text>
                  </View>
                </View>
                <View style={styles.actionImageContainer}>
                  <Image 
                    source={{ uri: TEMP_IMAGES.briskWalk }}
                    style={styles.actionImage}
                  />
                  <View style={styles.hormoneBadge}>
                    <Text style={styles.hormoneBadgeText}>+1</Text>
                  </View>
                </View>
              </View>

              {/* Ashwagandha */}
              <View style={styles.actionItem}>
                <View style={styles.actionImageContainer}>
                  <Image 
                    source={{ uri: TEMP_IMAGES.ashwagandha }}
                    style={styles.actionImage}
                  />
                  <View style={styles.hormoneBadge}>
                    <Text style={styles.hormoneBadgeText}>+1</Text>
                  </View>
                </View>
                <View style={styles.actionDetails}>
                  <Text style={styles.actionTitle}>Ashwagandha</Text>
                  <View style={styles.actionMeta}>
                    <Text style={styles.actionAmount}>1 spoon</Text>
                    <Text style={styles.actionSeparator}>•</Text>
                    <Text style={styles.actionPurpose}>Stress</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Night Section */}
            <View style={styles.timeSection}>
              <View style={styles.timeIconContainer}>
                <Text style={styles.timeIcon}>🌙</Text>
              </View>
              
              {/* Light Yoga */}
              <View style={[styles.actionItem, styles.actionItemRight]}>
                <View style={styles.actionDetails}>
                  <Text style={styles.actionTitle}>Light Yoga</Text>
                  <View style={styles.actionMeta}>
                    <Text style={styles.actionAmount}>10 min</Text>
                    <Text style={styles.actionSeparator}>•</Text>
                    <Text style={styles.actionPurpose}>Stress</Text>
                  </View>
                </View>
                <View style={styles.actionImageContainer}>
                  <Image 
                    source={{ uri: TEMP_IMAGES.lightYoga }}
                    style={styles.actionImage}
                  />
                  <View style={styles.hormoneBadge}>
                    <Text style={styles.hormoneBadgeText}>+1</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 내일 미리보기 */}
        <View style={styles.tomorrowSection}>
          <View style={styles.tomorrowHeader}>
            <Text style={styles.sectionTitle}>Tomorrow</Text>
            <Text style={styles.dateText}>16th July, 2025</Text>
          </View>
          
          <View style={styles.tomorrowPreview}>
            <View style={styles.lockIconContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <View style={styles.blurredContent}>
              <Text style={styles.blurredText}>내일의 액션 플랜이 여기에 표시됩니다</Text>
            </View>
          </View>
        </View>

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
    paddingTop: responsiveHeight(8),
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
  menuButton: {
    padding: responsiveWidth(1.5),
  },
  menuIcon: {
    fontSize: responsiveFontSize(2),
    color: '#000000',
  },
  questSection: {
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(3),
  },
  sectionTitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },
  questContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  questItem: {
    alignItems: 'center',
  },
  questImageContainer: {
    width: responsiveWidth(20),
    height: responsiveHeight(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  questImage: {
    width: responsiveWidth(18),
    height: responsiveHeight(10),
    borderRadius: responsiveWidth(9),
  },
  questName: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'NotoSerif400',
    color: '#000000',
    marginBottom: responsiveHeight(1),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  progressBar: {
    width: responsiveWidth(13),
    height: responsiveHeight(0.6),
    borderRadius: responsiveWidth(6.5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: responsiveWidth(6.5),
  },
  progressText: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  divider: {
    height: 1,
    backgroundColor: '#CFCFCF',
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(3),
  },
  actionPlanSection: {
    paddingHorizontal: responsiveWidth(5),
  },
  actionPlanHeader: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  dateText: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: responsiveHeight(2),
  },
  sortButton: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(1.5),
    backgroundColor: '#FFFFFF',
    borderWidth: 0.25,
    borderColor: '#CFCFCF',
  },
  sortButtonActive: {
    backgroundColor: '#C17EC9',
    borderColor: '#C17EC9',
  },
  sortButtonText: {
    fontSize: responsiveFontSize(1.2),
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
  timeIconContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -responsiveWidth(3) }],
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(3),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timeIcon: {
    fontSize: responsiveFontSize(2),
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
    fontSize: responsiveFontSize(0.9),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
  },
  actionDetails: {
    flex: 1,
    marginHorizontal: responsiveWidth(3),
  },
  actionTitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#949494',
  },
  actionSeparator: {
    fontSize: responsiveFontSize(1.2),
    color: '#949494',
    marginHorizontal: responsiveWidth(1),
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.2),
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
  tomorrowPreview: {
    height: responsiveHeight(15),
    backgroundColor: '#F8F9FA',
    borderRadius: responsiveWidth(2),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lockIconContainer: {
    position: 'absolute',
    top: responsiveHeight(2),
    left: '50%',
    transform: [{ translateX: -responsiveWidth(3) }],
  },
  lockIcon: {
    fontSize: responsiveFontSize(2),
    color: '#949494',
  },
  blurredContent: {
    opacity: 0.3,
  },
  blurredText: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: responsiveHeight(5),
  },
});

export default HomeScreen;
