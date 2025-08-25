// TypeActionPlan.tsx
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

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
         {/* 카테고리별 액션들 */}
         {CATEGORIES.map(renderCategorySection)}
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
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(1),
  },
  
  categorySection: {
    marginBottom: responsiveHeight(4),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
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
});
