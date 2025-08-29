// TypeActionPlan.tsx
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    Image
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Svg, { Defs, Line, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';


// ====== Type imports ======
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== Main component ======
/**
 * Props for the TypeActionPlan component
 */
type Props = {
  /** Date label for the top section (e.g., "August 25, 2025") */
  dateLabel?: string;
  /** Time-based action assignments */
  assignments?: AssignmentsMap;
};

/**
 * Category definitions for action types
 */
const CATEGORIES = [
  { key: 'food', emoji: '🥗', name: 'Eat' },
  { key: 'exercise', emoji: '🏃‍♀️‍', name: 'Move' },
  { key: 'mindfulness', emoji: '🧘‍♀️', name: 'Pause' },
] as const;

/**
 * Time slot emoji mapping
 */
const TIME_EMOJI_MAP: Record<string, string> = {
  completed: '', // No icon for completed
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
  anytime: '⏰',
  night: '🌙',
};

/**
 * TypeActionPlan Component
 * 
 * Displays categorized action plans organized by time slots and categories.
 * Shows food, exercise, and mindfulness actions with completion tracking.
 * 
 * @param props - Component props
 * @param props.dateLabel - Date label for display
 * @param props.assignments - Time-based action assignments
 * @returns JSX.Element
 */
export default function TypeActionPlan({
  dateLabel = formatToday(new Date()),
  assignments = {},
}: Props) {
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set());
  const navigation = useNavigation();
  
  /**
   * Handles navigation to action detail screen using React Navigation
   * 
   * @param actionData - Action data to pass to detail screen
   */
  const handleNavigation = (actionData: any) => {
    try {
      navigation.navigate('ActionDetailScreen', {
        action: JSON.stringify(actionData)
      });
    } catch (error) {
      console.error('Navigation error:', error);
      console.log('Navigation data:', actionData);
    }
  };
  
  /**
   * Combines all actions into a single array and categorizes them
   * Uses API category field first, then falls back to data field analysis
   */
  const categorizedAssignments = useMemo(() => {
    const allAssignments: (Assignment & { timeSlot: string })[] = [];
    
    // Collect actions from all time slots
    Object.entries(assignments).forEach(([timeSlot, timeAssignments]) => {
      if (timeAssignments && timeAssignments.length > 0) {
        timeAssignments.forEach(assignment => {
          allAssignments.push({ ...assignment, timeSlot });
        });
      }
    });

    // Categorize by type
    const categorized: Record<string, (Assignment & { timeSlot: string })[]> = {
      food: [],
      exercise: [],
      mindfulness: [],
    };

    allAssignments.forEach(assignment => {
      // Category determination logic - prioritize API category field
      const category = assignment.category?.toLowerCase() || '';
      
      // 1. API category field-based classification
      if (category.includes('food') || category.includes('nutrition') || category.includes('diet')) {
        categorized.food.push(assignment);
      } else if (category.includes('exercise') || category.includes('movement') || category.includes('physical')) {
        categorized.exercise.push(assignment);
      } else if (category.includes('mindfulness') || category.includes('meditation') || category.includes('mental')) {
        categorized.mindfulness.push(assignment);
      } 
      // 2. Data field-based classification
      else if (assignment.food_items && assignment.food_items.length > 0) {
        categorized.food.push(assignment);
      } else if (assignment.exercise_types && assignment.exercise_types.length > 0) {
        categorized.exercise.push(assignment);
      } else if (assignment.mindfulness_techniques && assignment.mindfulness_techniques.length > 0) {
        categorized.mindfulness.push(assignment);
      } 
      // 3. Title-based classification (fallback)
      else {
        const title = assignment.title.toLowerCase();
        if (title.includes('seed') || title.includes('ashwagandha') || title.includes('food') || title.includes('eat') || title.includes('nutrition')) {
          categorized.food.push(assignment);
        } else if (title.includes('walk') || title.includes('exercise') || title.includes('move') || title.includes('run') || title.includes('workout')) {
          categorized.exercise.push(assignment);
        } else if (title.includes('yoga') || title.includes('meditation') || title.includes('mindful') || title.includes('breathe') || title.includes('relax')) {
          categorized.mindfulness.push(assignment);
        } else {
          // Default to food category
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
    return assignment.purpose || '';
  };

  const getActionSymptomsConditions = (assignment: Assignment): string => {
    // Collect symptoms and conditions in order and return (for timeline display)
    const symptoms = assignment.symptoms || [];
    const conditions = assignment.conditions || [];
    
    const allItems = [...symptoms, ...conditions];
    return allItems.join(', ');
  };

  const getHormoneCount = (assignment: Assignment): number => {
    return assignment.hormones?.length || 0;
  };

  // Hormone-specific color return function
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

  // Hormone-specific icon return function
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

  // Function to return first hormone color
  const getFirstHormoneColor = (assignment: Assignment): string => {
    if (assignment.hormones && assignment.hormones.length > 0) {
      return getProgressColor(assignment.hormones[0]);
    }
    return '#A36CFF'; // Default color
  };

  // Function to return first hormone icon
  const getFirstHormoneIcon = (assignment: Assignment): string => {
    if (assignment.hormones && assignment.hormones.length > 0) {
      return getHormoneIcon(assignment.hormones[0]);
    }
    return '💊'; // Default icon
  };

  const getTimeEmoji = (timeSlot: string): string => {
    return TIME_EMOJI_MAP[timeSlot] || '⏰';
  };

  // First line: from top to category start (gradient)
  const renderTopLine = () => {
    const lineHeight = responsiveHeight(7); // Match with ActionPlanTimeline TOP_CAP
    const screenWidth = Dimensions.get('window').width;
    const centerX = screenWidth / 2;
    
    return (
      <View style={styles.topLineContainer}>
        <Svg 
          width={screenWidth} 
          height={lineHeight}
          viewBox={`0 0 ${screenWidth} ${lineHeight}`}
        >
          <Defs>
            <SvgLinearGradient id="topGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FDC6D1" stopOpacity="1" />
              <Stop offset="25%" stopColor="#E98BAC" stopOpacity="1" />
              <Stop offset="50%" stopColor="#D482B9" stopOpacity="1" />
              <Stop offset="75%" stopColor="#C17EC9" stopOpacity="1" />
              <Stop offset="100%" stopColor="#A29AEA" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={lineHeight}
            stroke="url(#topGrad)"
            strokeWidth="15"
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  };

  // second line: from action plan end to Tomorrow label start (grey dashed line)
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

  // Third line: from Tomorrow label bottom to next list + lock
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
          
          {/* Lock icon */}
          <View style={styles.svgLockIcon}>
            <Image 
              source={require('../assets/icons/IconLock.png')}
              style={styles.svgLockIconImage}
              resizeMode="contain"
            />
          </View>
        </Svg>
      </View>
    );
  };

  // Action item rendering
  const renderActionItem = (assignment: Assignment & { timeSlot: string }) => {
    const handleActionPress = () => {
      handleNavigation({
        id: assignment.id,
        title: assignment.title,
        purpose: getActionPurpose(assignment),
        hormones: assignment.hormones || [],
        specific_action: assignment.specific_action,
        conditions: assignment.conditions,
        symptoms: assignment.symptoms,
        advices: assignment.advices,
      });
    };

    return (
      <View key={assignment.id.toString()} style={styles.actionItem}>
        {/* Image circle */}
        <TouchableOpacity 
          style={styles.imageContainer} 
          onLongPress={!assignment.is_completed ? () => {
            // Navigate to ActionCompletedScreen (only if not completed)
            try {
              navigation.navigate('ActionCompletedScreen', {
                action: JSON.stringify({
                  id: assignment.id,
                  title: assignment.title,
                  purpose: getActionPurpose(assignment),
                  hormones: assignment.hormones || [],
                  specific_action: assignment.specific_action,
                  conditions: assignment.conditions,
                  symptoms: assignment.symptoms,
                  advices: assignment.advices,
                })
              });
            } catch (error) {
              console.error('Navigation to ActionCompletedScreen error:', error);
            }
          } : undefined}
          delayLongPress={2000} // 2 second long press
        >
          {/* Use emoji instead of actual image */}
          <Text style={styles.actionImage}>📋</Text>
        </TouchableOpacity>
      
      {/* Action information */}
      <View style={styles.actionDetails}>
        <TouchableOpacity 
          onPress={handleActionPress}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
                                  <Text style={styles.actionTitle}>{assignment.title}</Text>
                        <Text style={styles.actionArrow}>></Text>
        </TouchableOpacity>
        <View style={styles.actionMeta}>
          <Text style={styles.actionAmount}>{getActionAmount(assignment)}</Text>
          <View style={styles.separator} />
          <Text style={styles.actionPurpose}>{getActionSymptomsConditions(assignment)}</Text>
          <View style={styles.separator} />
          <View style={styles.hormoneInfo}>
            <Text style={[styles.hormoneCount, { color: getFirstHormoneColor(assignment) }]}>+{getHormoneCount(assignment)}</Text>
            <View style={[styles.hormoneIcon, { backgroundColor: getFirstHormoneColor(assignment) }]}>
              <Text style={styles.hormoneIconText}>{getFirstHormoneIcon(assignment)}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <Text style={styles.timeEmoji}>{getTimeEmoji(assignment.timeSlot)}</Text>
        </View>
      </View>
    </View>
    );
  };

  // Category section rendering
  const renderCategorySection = (category: typeof CATEGORIES[0]) => {
    const categoryAssignments = categorizedAssignments[category.key];
    
    if (categoryAssignments.length === 0) {
      return null;
    }

    return (
      <View key={category.key} style={styles.categorySection}>
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <View style={styles.dividerLeft} />
          <Text style={styles.categoryTitle}>
            {category.emoji} {category.name}
          </Text>
          <View style={styles.dividerRight} />
        </View>
        
        {/* Category actions */}
        <View style={styles.categoryActions}>
          {categoryAssignments.map(renderActionItem)}
        </View>
      </View>
    );
  };

     return (
     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
       <View style={styles.content}>
         {/* First line: top gradient line */}
         {renderTopLine()}
         
         {/* Actions by category */}
         {CATEGORIES.map(renderCategorySection)}
         
         {/* Second line: from action plan end to Tomorrow start */}
         {renderMiddleLine()}
         
         {/* Tomorrow section */}
         <View style={styles.tomorrowSection}>
           <View style={styles.tomorrowHeader}>
             <Text style={styles.tomorrowSectionTitle}>Tomorrow</Text>
             <Text style={styles.tomorrowDateText}>16th July, 2025</Text>
           </View>
         </View>

         {/* Third line: from Tomorrow label bottom to next list + lock */}
         {renderBottomLine()}

         {/* Tomorrow action plan preview */}
         <View style={styles.tomorrowPreview}>
           <View style={styles.tomorrowBlurredContent}>
             {/* Category header */}
             <View style={styles.tomorrowCategoryHeader}>
               <View style={styles.dividerLeft} />
               <Text style={styles.tomorrowCategoryTitle}>
                 🥗 Eat
               </Text>
               <View style={styles.dividerRight} />
             </View>

             {/* First action item preview */}
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
                     <Text style={[styles.hormoneCount, { color: '#FF6991' }]}>+1</Text>
                     <View style={[styles.hormoneIcon, { backgroundColor: '#FF6991' }]}>
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

// ====== Utility: Date formatting ======
function formatToday(d: Date) {
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

// ====== Styles ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: responsiveWidth(8),
    // Remove paddingVertical to start flush with ActionPlanTimeline
  },
  
  // Vertical line containers
  topLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(2),
  },
  
  middleLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(2), // Match ActionPlanTimeline
  },
  
  bottomLineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(2), // Match ActionPlanTimeline
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
    fontSize: responsiveFontSize(1.98), // 14px equivalent
    fontFamily: 'NotoSerif500', // Noto Serif Medium
    color: '#6F6F6F', // Grey Medium
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
    fontSize: responsiveFontSize(1.98), // 14px equivalent
    fontFamily: 'NotoSerif500', // Noto Serif Medium
    color: '#000000', // Black
  },
  actionArrow: {
    fontSize: responsiveFontSize(1.98), //14px (same as title)
    fontWeight: '300',
    color: '#949494', // Grey Light
    marginLeft: 8,
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1.5),
  },
  actionAmount: {
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    fontFamily: 'Inter400', // Inter Regular
    color: '#949494', // Grey Light
  },
  actionPurpose: {
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    fontFamily: 'Inter400', // Inter Regular
    color: '#949494', // Grey Light
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
    fontSize: responsiveFontSize(1.7), // 12px equivalent
    fontFamily: 'Inter400', // Inter Regular
    color: '#949494', // Grey Light
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
    fontSize: responsiveFontSize(1.1), // 9px equivalent
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeEmoji: {
    fontSize: responsiveFontSize(2.2),
  },
  
  // Tomorrow section styles
  tomorrowSection: {
    marginTop: responsiveHeight(1),
    marginBottom: responsiveHeight(1),
  },
  tomorrowHeader: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(1),
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
    marginTop: responsiveHeight(2),
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
  svgLockIconImage: {
    width: 20,
    height: 20,
    tintColor: '#949494',
  },
});
