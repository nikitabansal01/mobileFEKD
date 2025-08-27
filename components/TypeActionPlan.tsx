// TypeActionPlan.tsx
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Svg, { Defs, Line, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// ====== 타입 import ======
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== 본 컴포넌트 ======
type Props = {
  dateLabel?: string;              // 상단 날짜 라벨 (예: "August 25, 2025")
  assignments?: AssignmentsMap;    // 시간대별 액션들
};

// 카테고리 정의
const CATEGORIES = [
  { key: 'food', emoji: '🥗', name: 'Eat' },
  { key: 'exercise', emoji: '🏃‍♀️‍', name: 'Move' },
  { key: 'mindfulness', emoji: '🧘‍♀️', name: 'Pause' },
] as const;

// 시간대 이모지 매핑
const TIME_EMOJI_MAP: Record<string, string> = {
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
  anytime: '⏰',
  night: '🌙',
};

export default function TypeActionPlan({
  dateLabel = formatToday(new Date()),
  assignments = {},
}: Props) {
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set());
  
  // 1) 모든 액션을 하나의 배열로 합치고 카테고리별로 분류
  const categorizedAssignments = useMemo(() => {
    const allAssignments: (Assignment & { timeSlot: string })[] = [];
    
    // 모든 시간대의 액션들을 수집
    Object.entries(assignments).forEach(([timeSlot, timeAssignments]) => {
      if (timeAssignments && timeAssignments.length > 0) {
        timeAssignments.forEach(assignment => {
          allAssignments.push({ ...assignment, timeSlot });
        });
      }
    });

    // 카테고리별로 분류
    const categorized: Record<string, (Assignment & { timeSlot: string })[]> = {
      food: [],
      exercise: [],
      mindfulness: [],
    };

    allAssignments.forEach(assignment => {
      // 카테고리 결정 로직 - API의 category 필드를 우선 사용
      const category = assignment.category?.toLowerCase() || '';
      
      // 1. API category 필드 기반 분류
      if (category.includes('food') || category.includes('nutrition') || category.includes('diet')) {
        categorized.food.push(assignment);
      } else if (category.includes('exercise') || category.includes('movement') || category.includes('physical')) {
        categorized.exercise.push(assignment);
      } else if (category.includes('mindfulness') || category.includes('meditation') || category.includes('mental')) {
        categorized.mindfulness.push(assignment);
      } 
      // 2. 데이터 필드 기반 분류
      else if (assignment.food_items && assignment.food_items.length > 0) {
        categorized.food.push(assignment);
      } else if (assignment.exercise_types && assignment.exercise_types.length > 0) {
        categorized.exercise.push(assignment);
      } else if (assignment.mindfulness_techniques && assignment.mindfulness_techniques.length > 0) {
        categorized.mindfulness.push(assignment);
      } 
      // 3. 제목 기반 분류 (fallback)
      else {
        const title = assignment.title.toLowerCase();
        if (title.includes('seed') || title.includes('ashwagandha') || title.includes('food') || title.includes('eat') || title.includes('nutrition')) {
          categorized.food.push(assignment);
        } else if (title.includes('walk') || title.includes('exercise') || title.includes('move') || title.includes('run') || title.includes('workout')) {
          categorized.exercise.push(assignment);
        } else if (title.includes('yoga') || title.includes('meditation') || title.includes('mindful') || title.includes('breathe') || title.includes('relax')) {
          categorized.mindfulness.push(assignment);
        } else {
          // 기본값으로 food 카테고리에 배치
          categorized.food.push(assignment);
        }
      }
    });

    return categorized;
  }, [assignments]);

  // Helper functions
  const getActionAmount = (assignment: Assignment): string => {
    if (assignment.food_amounts && assignment.food_amounts.length > 0) {
      return assignment.food_amounts[0];
    }
    if (assignment.exercise_durations && assignment.exercise_durations.length > 0) {
      return assignment.exercise_durations[0];
    }
    if (assignment.mindfulness_durations && assignment.mindfulness_durations.length > 0) {
      return assignment.mindfulness_durations[0];
    }
    return '';
  };

  const getActionPurpose = (assignment: Assignment): string => {
    const allTags = [...(assignment.symptoms || []), ...(assignment.conditions || [])];
    return allTags.join(', ');
  };

  const getHormoneCount = (assignment: Assignment): number => {
    return assignment.hormones?.length || 0;
  };

  const getTimeEmoji = (timeSlot: string): string => {
    return TIME_EMOJI_MAP[timeSlot] || '⏰';
  };

  // 첫 번째 선: 맨 위에서 카테고리 시작 전까지 (그라디언트)
  const renderTopLine = () => {
    const lineHeight = responsiveHeight(8);
    const screenWidth = Dimensions.get('window').width;
    const centerX = screenWidth / 2;
    
    return (
      <View style={styles.topLineContainer}>
        <Svg 
          width={screenWidth} 
          height={lineHeight}
          viewBox={`0 0 ${screenWidth} ${lineHeight}`}
        >
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={lineHeight}
            stroke="#cfcfcf"
            strokeWidth="15"
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  };

  // 두 번째 선: 액션 플랜 끝에서 Tomorrow 라벨 시작까지 (회색 점선)
  const renderMiddleLine = () => {
    const lineHeight = responsiveHeight(8);
    const screenWidth = Dimensions.get('window').width;
    const centerX = screenWidth / 2;
    
    return (
      <View style={styles.middleLineContainer}>
        <Svg 
          width={screenWidth} 
          height={lineHeight}
          viewBox={`0 0 ${screenWidth} ${lineHeight}`}
        >
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={lineHeight}
            stroke="#EFEFEF"
            strokeWidth="15"
            fill="none"
            strokeLinejoin="round"
            strokeDasharray={`${responsiveWidth(8)} ${responsiveWidth(2)}`}
          />
        </Svg>
      </View>
    );
  };

  // 세 번째 선: Tomorrow 라벨 밑에서 다음 리스트까지 (회색 점선 + 자물쇠)
  const renderBottomLine = () => {
    const lineHeight = responsiveHeight(8);
    const screenWidth = Dimensions.get('window').width;
    const centerX = screenWidth / 2;
    
    return (
      <View style={styles.bottomLineContainer}>
        <Svg 
          width={screenWidth} 
          height={lineHeight}
          viewBox={`0 0 ${screenWidth} ${lineHeight}`}
        >
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={lineHeight}
            stroke="#EFEFEF"
            strokeWidth="15"
            fill="none"
            strokeLinejoin="round"
            strokeDasharray={`${responsiveWidth(8)} ${responsiveWidth(2)}`}
          />
          
          {/* 자물쇠 아이콘 */}
          <View style={styles.svgLockIcon}>
            <Text style={styles.svgLockIconText}>🔒</Text>
          </View>
        </Svg>
      </View>
    );
  };

  // 액션 아이템 렌더링
  const renderActionItem = (assignment: Assignment & { timeSlot: string }) => (
    <View key={assignment.id.toString()} style={styles.actionItem}>
      {/* 이미지 원 */}
      <View style={styles.imageContainer}>
        {/* 실제 이미지 대신 이모지 사용 */}
        <Text style={styles.actionImage}>📋</Text>
      </View>
      
      {/* 액션 정보 */}
      <View style={styles.actionDetails}>
        <Text style={styles.actionTitle}>{assignment.title}</Text>
        <View style={styles.actionMeta}>
          <Text style={styles.actionAmount}>{getActionAmount(assignment)}</Text>
          <View style={styles.separator} />
          <Text style={styles.actionPurpose}>{getActionPurpose(assignment)}</Text>
          <View style={styles.separator} />
          <View style={styles.hormoneInfo}>
            <Text style={styles.hormoneCount}>+{getHormoneCount(assignment)}</Text>
            <View style={styles.hormoneIcon}>
              <Text style={styles.hormoneIconText}>H</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <Text style={styles.timeEmoji}>{getTimeEmoji(assignment.timeSlot)}</Text>
        </View>
      </View>
    </View>
  );

  // 카테고리 섹션 렌더링
  const renderCategorySection = (category: typeof CATEGORIES[0]) => {
    const categoryAssignments = categorizedAssignments[category.key];
    
    if (categoryAssignments.length === 0) {
      return null;
    }

    return (
      <View key={category.key} style={styles.categorySection}>
        {/* 카테고리 헤더 */}
        <View style={styles.categoryHeader}>
          <View style={styles.dividerLeft} />
          <Text style={styles.categoryTitle}>
            {category.emoji} {category.name}
          </Text>
          <View style={styles.dividerRight} />
        </View>
        
        {/* 카테고리 액션들 */}
        <View style={styles.categoryActions}>
          {categoryAssignments.map(renderActionItem)}
        </View>
      </View>
    );
  };

     return (
     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
       <View style={styles.content}>
         {/* 첫 번째 선: 맨 위 그라디언트 선 */}
         {renderTopLine()}
         
         {/* 카테고리별 액션들 */}
         {CATEGORIES.map(renderCategorySection)}
         
         {/* 두 번째 선: 액션 플랜 끝에서 Tomorrow 시작까지 */}
         {renderMiddleLine()}
         
         {/* Tomorrow 섹션 */}
         <View style={styles.tomorrowSection}>
           <View style={styles.tomorrowHeader}>
             <Text style={styles.tomorrowSectionTitle}>Tomorrow</Text>
             <Text style={styles.tomorrowDateText}>16th July, 2025</Text>
           </View>
         </View>

         {/* 세 번째 선: Tomorrow 라벨 밑에서 다음 리스트까지 + 자물쇠 */}
         {renderBottomLine()}

         {/* Tomorrow 액션 플랜 미리보기 */}
         <View style={styles.tomorrowPreview}>
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

             
           </View>
         </View>
       </View>
     </ScrollView>
   );
}

// ====== 유틸: 날짜 포맷 ======
function formatToday(d: Date) {
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

// ====== 스타일 ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(1),
  },
  
  // 세로선 컨테이너들
  topLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(2),
  },
  
  middleLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  bottomLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  categorySection: {
    marginBottom: responsiveHeight(3),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(3),
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
  categoryTitle: {
    fontSize: responsiveFontSize(2),
    fontWeight: '500',
    color: '#6F6F6F',
    paddingHorizontal: responsiveWidth(2),
  },
  categoryActions: {
    gap: responsiveHeight(2),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(3),
  },
  imageContainer: {
    width: responsiveWidth(12.5),
    height: responsiveWidth(12.5),
    borderRadius: responsiveWidth(6.25),
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionImage: {
    fontSize: responsiveFontSize(3),
  },
  actionDetails: {
    flex: 1,
    gap: responsiveHeight(0.5),
  },
  actionTitle: {
    fontSize: responsiveFontSize(2),
    fontWeight: '500',
    color: '#000000',
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.6),
    color: '#949494',
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.6),
    color: '#949494',
  },
  separator: {
    width: 1,
    height: responsiveHeight(1.5),
    backgroundColor: '#E5E5EA',
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
  
  // Tomorrow 섹션 스타일
  tomorrowSection: {
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
  },
  tomorrowHeader: {
    alignItems: 'center',
  },
  tomorrowSectionTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  tomorrowDateText: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#6F6F6F',
    textAlign: 'center',
  },
  tomorrowLockContainer: {
    alignItems: 'center',

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
  tomorrowCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
    marginTop: responsiveHeight(2),
  },
  tomorrowCategoryTitle: {
    fontSize: responsiveFontSize(2),
    fontWeight: '500',
    color: '#6F6F6F',
    paddingHorizontal: responsiveWidth(2),
  },
  tomorrowActionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(3),
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
  actionSeparator: {
    width: 1,
    height: responsiveHeight(1.5),
    backgroundColor: '#E5E5EA',
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
  lockIcon: {
    fontSize: responsiveFontSize(2.5),
    color: '#949494',
  },
  svgLockIcon: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgLockIconText: {
    fontSize: 20,
    color: '#949494',
  },
});
