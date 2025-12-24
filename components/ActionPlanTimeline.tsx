// ActionPlanTimeline.tsx
import Images from '@/assets/images';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import MultiSelectCheckSvg from '../assets/images/SVG/MultiSelectCheckSvg';

// ====== Type imports ======
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== Time slot icon mapping ======
const TIME_ICONS: Record<string, string> = {
  completed: '', // No icon for completed section (just the gradient line)
  morning: '🌤️',
  afternoon: '☀️',
  evening: '🌙',
  anytime: '', // No icon for anytime
  // Add common variations
  'Morning': '🌤️',
  'Afternoon': '☀️',
  'Evening': '🌙',
  'Anytime': '', // No icon for anytime
  // Add more common API variations
  'am': '🌤️',
  'pm': '☀️',
  'breakfast': '🌤️',
  'lunch': '☀️',
  'dinner': '🌙',
  '1': '🌤️',
  '2': '☀️',
  '3': '🌙',
};

// ====== Time slot Y position calculation helper ======
type TimeSlotPosition = {
  timeSlot: string;
  iconY: number;
  isCapCenter: boolean; // Whether cap is at center position
};

// ====== Animated Path ======
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ====== Tomorrow dummy data (first item only) ======
const DUMMY_TOMORROW_DATA: Assignment[] = [
  {
    id: 999,
    recommendation_id: 1,
    title: "Pumpkin Seeds",
    purpose: "Acne, PCOS",
    category: "food",
    conditions: ["acne", "pcos"],
    symptoms: ["skin_issues"],
    hormones: ["androgens", "progesterone"], // Added hormone information
    is_completed: false,
    completed_at: "",
    advices: [{ type: 'tip', title: 'Take 1 spoon with breakfast' }],
    food_amounts: ["1 spoon"],
    food_items: ["pumpkin_seeds"],
    exercise_durations: [],
    exercise_types: [],
    exercise_intensities: [],
    mindfulness_durations: [],
    mindfulness_techniques: [],
  },
];

// ====== Main component ======
/**
 * Props for the ActionPlanTimeline component
 */
type Props = {
  /** Date label for the top section (e.g., "August 25, 2025") */
  dateLabel?: string;
  /** Time-based action assignments */
  assignments?: AssignmentsMap;
};

/**
 * ActionPlanTimeline Component
 * 
 * Displays a timeline view of action plans organized by time slots.
 * Shows today's and tomorrow's actions with visual timeline connections.
 * 
 * @param props - Component props
 * @param props.dateLabel - Date label for display
 * @param props.assignments - Time-based action assignments
 * @returns JSX.Element
 */
export default function ActionPlanTimeline({
  dateLabel = formatToday(new Date()),
  assignments = {},
}: Props) {
  const navigation = useNavigation<any>();

  // Pulsing animation for completed actions
  const pulsingAnimation = useRef(new Animated.Value(1)).current;

  // Full screen expansion animation
  const [expandingCircle, setExpandingCircle] = useState<{ x: number, y: number, id: string } | null>(null);
  const expandAnimation = useRef(new Animated.Value(0)).current;

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
   * Handles the expanding circle animation and navigation
   */
  const handleExpandingNavigation = (actionData: any, circlePosition: { x: number, y: number }) => {
    // Set the expanding circle position
    setExpandingCircle({ x: circlePosition.x, y: circlePosition.y, id: actionData.id.toString() });

    let hasNavigated = false; // Flag to prevent multiple navigations

    // Add listener to detect when animation reaches full screen
    const listenerId = expandAnimation.addListener(({ value }) => {
      // Navigate when animation reaches ~80% (full screen coverage)
      // This ensures the circle has expanded enough to cover the screen
      if (value >= 0.8 && !hasNavigated) {
        hasNavigated = true;
        // Navigate immediately when full screen is reached
        navigation.navigate('ActionCompletedScreen', {
          action: JSON.stringify(actionData)
        });
      }
    });

    // Start the expansion animation
    Animated.timing(expandAnimation, {
      toValue: 1,
      duration: 600, // Increased from 300 to 600ms for slower animation
      useNativeDriver: false, // We need to animate scale and position
    }).start(() => {
      // Remove listener and reset animation after completion
      expandAnimation.removeListener(listenerId);
      expandAnimation.setValue(0);
      setExpandingCircle(null);
    });
  };

  // Time slot priority for sorting (lower = earlier in day)
  const TIME_SLOT_PRIORITY: Record<string, number> = {
    'completed': 0, // Completed items have highest priority (show first)
    'morning': 1,
    'afternoon': 2,
    'evening': 3,
    'night': 3,
    'anytime': 4,
  };

  /**
   * Separates and manages Today and Tomorrow actions
   * SORTED: Completed items first, then pending items by time slot
   */
  const todayAssignments: Assignment[] = useMemo(() => {
    const arr: Assignment[] = [];

    // Add static "Weekly Check-in" assignment at the beginning
    const weeklyCheckIn: Assignment = {
      id: -1, // Special ID for static assignment
      recommendation_id: -1,
      title: 'Weekly Check-in',
      purpose: 'Vent your concerns & progress | Acne | 🌤️',
      category: 'mindfulness',
      conditions: [],
      symptoms: [],
      hormones: [],
      is_completed: false,
      completed_at: '',
      advices: [],
      food_amounts: [],
      food_items: [],
      exercise_durations: [],
      exercise_types: [],
      exercise_intensities: [],
      mindfulness_durations: [],
      mindfulness_techniques: [],
      time_slot: 'morning', // Add time_slot for sorting
    };

    // Process ALL keys from assignments object (including 'completed' if present)
    // This ensures we don't miss any items regardless of what keys the backend returns
    const allKeys = Object.keys(assignments);
    console.log('🔍 Processing assignment keys:', allKeys);

    allKeys.forEach((slot) => {
      const group = assignments[slot];
      group?.forEach((a) => {
        // Use the item's own time_slot if available, otherwise use the key
        const itemTimeSlot = a.time_slot || slot;
        arr.push({ ...a, time_slot: itemTimeSlot } as Assignment);
      });
    });

    // Sort: Completed items first, then by time slot priority
    arr.sort((a, b) => {
      // Primary sort: completed items first
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;

      // Secondary sort: by time slot priority
      const aPriority = TIME_SLOT_PRIORITY[(a as any).time_slot || 'anytime'] || 4;
      const bPriority = TIME_SLOT_PRIORITY[(b as any).time_slot || 'anytime'] || 4;
      return aPriority - bPriority;
    });

    // Add Weekly Check-in after completed items (so it's first among pending items)
    const completedCount = arr.filter(a => a.is_completed).length;
    arr.splice(completedCount, 0, weeklyCheckIn);

    console.log('🔍 Today Assignments processing (SORTED):', {
      originalAssignments: assignments,
      allKeys,
      processedTodayAssignments: arr.map(a => ({ id: a.id, title: a.title, completed: a.is_completed, time_slot: (a as any).time_slot })),
      totalItems: arr.length,
      completedCount
    });

    return arr;
  }, [assignments]);

  const tomorrowAssignments: Assignment[] = DUMMY_TOMORROW_DATA;

  // Start pulsing animation for completed actions
  useEffect(() => {
    const startPulsing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsingAnimation, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulsingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulsing();
  }, [pulsingAnimation]);


  // All layout calculation values (container-based)
  const { width: SCREEN_W } = Dimensions.get('window');

  // Timeline background/progress (SVG) - declare canvasW first
  const [canvasW, setCanvasW] = useState(SCREEN_W - responsiveWidth(0)); // Set initial value

  const geom = useMemo(() => {
    if (!canvasW || canvasW <= 0) return null;

    const CENTER_X = Math.round(canvasW / 2);
    const CIRCLE_RADIUS = Math.round(responsiveWidth(9.72));     // Unified to responsiveWidth
    const OFFSET_X = Math.round(responsiveWidth(26));    // Unified to responsiveWidth
    const LEFT_X = CENTER_X - OFFSET_X;                   // Item center X
    const RIGHT_X = CENTER_X + OFFSET_X;

    // Use responsiveHeight as before, but round at the end
    const BASE_TOP = Math.round(responsiveHeight(0));      // Container top reference point
    const ITEM_BLOCK_H = Math.round(responsiveHeight(14));      // Vertical spacing between items (reduced from 18)
    const CAP_TOP = Math.round(responsiveHeight(7));
    const CAP_BOTTOM = Math.round(responsiveHeight(7));
    const BRIDGE_DROP = Math.round(Math.min(responsiveHeight(2.25), 0.5 * CAP_TOP));

    return { CENTER_X, CIRCLE_RADIUS, LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP };
  }, [canvasW]);

  const [anchors, setAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  const [pathD, setPathD] = useState('');
  const [contentHeight, setContentHeight] = useState(responsiveHeight(200)); // Increase initial value for immediate scrolling
  const [pathLen, setPathLen] = useState(0);
  const svgPathRef = useRef<Path>(null);

  // Progress animation (Today only calculation)
  const progressValue = useRef(new Animated.Value(0)).current;
  const doneRatio = useMemo(() => {
    const total = todayAssignments.length || 1;
    const done = todayAssignments.filter((a) => a.is_completed).length;
    return Math.min(1, done / total);
  }, [todayAssignments]);

  // Find the next incomplete task for pulsing animation
  const nextIncompleteTask = useMemo(() => {
    return todayAssignments.find((a) => !a.is_completed);
  }, [todayAssignments]);

  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: doneRatio,
      duration: 700,
      useNativeDriver: false, // strokeDashoffset doesn't support native driver
    }).start();
  }, [doneRatio, progressValue]);

  // Today and Tomorrow anchor generation - separate timelines
  const [todayAnchors, setTodayAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  const [tomorrowAnchors, setTomorrowAnchors] = useState<{ id: string; x: number; y: number }[]>([]);

  // Time slot icon position calculation
  const [timeSlotPositions, setTimeSlotPositions] = useState<TimeSlotPosition[]>([]);

  useEffect(() => {
    if (!geom) return;
    const { LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, CAP_BOTTOM } = geom;

    // Generate Today anchors
    const todayNext = todayAssignments.map((a, idx) => {
      const x = (idx % 2 === 0) ? LEFT_X : RIGHT_X;
      const y = BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2 + idx * ITEM_BLOCK_H;
      return { id: a.id.toString(), x, y };
    });
    setTodayAnchors(todayNext);

    // Calculate Tomorrow start Y coordinate: Today last anchor + margin + Tomorrow label space + text area
    const todayLastY = todayNext.at(-1)?.y ?? (BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2);
    const tomorrowTextHeight = responsiveHeight(6); // Tomorrow text area height (title + date + margin)
    const tomorrowStartY = todayLastY + ITEM_BLOCK_H / 2 + CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;

    // Generate Tomorrow anchors: independent timeline
    const tomorrowNext = tomorrowAssignments.map((a, idx) => {
      const x = (idx % 2 === 0) ? LEFT_X : RIGHT_X;
      const y = tomorrowStartY + CAP_TOP + ITEM_BLOCK_H / 2 + idx * ITEM_BLOCK_H;
      return { id: a.id.toString(), x, y };
    });
    setTomorrowAnchors(tomorrowNext);

    // Simple height calculation: to Tomorrow last anchor
    const lastTomorrowY = tomorrowNext[tomorrowNext.length - 1]?.y ?? tomorrowStartY;
    const circleRadius = Math.round(responsiveWidth(9.72));
    const naturalHeight = lastTomorrowY + circleRadius; // To below last anchor

    setContentHeight(naturalHeight);

    // Set existing anchors to Today (for existing logic compatibility)
    setAnchors(todayNext);

    // Calculate time slot icon positions based on SORTED todayAssignments
    // Now we need to detect: 1) Completed section at top, 2) Pending sections by time slot
    const positions: TimeSlotPosition[] = [];

    // Find completed items count (they are at the top due to sorting)
    const completedItems = todayAssignments.filter(a => a.is_completed);
    const pendingItems = todayAssignments.filter(a => !a.is_completed);

    // If there are completed items, add "completed" icon at the top
    if (completedItems.length > 0) {
      const iconY = BASE_TOP + CAP_TOP / 2;
      positions.push({
        timeSlot: 'completed',
        iconY,
        isCapCenter: true,
      });
    }

    // Find unique time slots in pending items and their positions
    const pendingTimeSlots: string[] = [];
    const timeSlotFirstIndex: Record<string, number> = {};

    pendingItems.forEach((a, pendingIdx) => {
      const slot = (a as any).time_slot || 'anytime';
      if (!timeSlotFirstIndex.hasOwnProperty(slot)) {
        pendingTimeSlots.push(slot);
        // Calculate absolute index in todayAssignments (completed count + pending index)
        timeSlotFirstIndex[slot] = completedItems.length + pendingIdx;
      }
    });

    // Add icons for pending time slots
    pendingTimeSlots.forEach((timeSlot, idx) => {
      const absoluteIndex = timeSlotFirstIndex[timeSlot];

      if (completedItems.length === 0 && idx === 0) {
        // No completed items - first pending slot goes at cap center
        const iconY = BASE_TOP + CAP_TOP / 2;
        positions.push({
          timeSlot,
          iconY,
          isCapCenter: true,
        });
      } else if (absoluteIndex > 0) {
        // Position between previous anchor and current anchor
        const prevAnchorY = todayNext[absoluteIndex - 1]?.y ?? BASE_TOP;
        const currentAnchorY = todayNext[absoluteIndex]?.y ?? (prevAnchorY + ITEM_BLOCK_H);
        const iconY = (prevAnchorY + currentAnchorY) / 2;

        positions.push({
          timeSlot,
          iconY,
          isCapCenter: false,
        });
      }
    });

    console.log('🔍 Time slot icon calculation (SORTED):', {
      completedCount: completedItems.length,
      pendingTimeSlots,
      positions: positions.map(p => ({ slot: p.timeSlot, y: p.iconY })),
    });

    setTimeSlotPositions(positions);
  }, [todayAssignments, tomorrowAssignments, assignments, geom]);

  // Today and Tomorrow Path generation
  const [todayPathD, setTodayPathD] = useState('');
  const [tomorrowPathD, setTomorrowPathD] = useState('');
  const [completedPathD, setCompletedPathD] = useState('');

  useEffect(() => {
    if (!geom) return;
    const { CIRCLE_RADIUS, CENTER_X, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP, ITEM_BLOCK_H, BASE_TOP } = geom;

    // Today path generation
    if (todayAnchors.length > 0) {
      const todayPath = generatePathRectilinear(
        todayAnchors,
        CIRCLE_RADIUS,
        CENTER_X,
        CAP_TOP,
        CAP_BOTTOM,
        BRIDGE_DROP,
        ITEM_BLOCK_H,
        BASE_TOP
      );
      setTodayPathD(todayPath);
      setPathD(todayPath);

      // Generate path to next incomplete task (lavender path)
      const nextIncompleteIndex = todayAssignments.findIndex(a => !a.is_completed);
      if (nextIncompleteIndex >= 0) {
        // Include all completed tasks + the next incomplete task
        const pathUpToNextTask = todayAnchors.slice(0, nextIncompleteIndex + 1);
        const nextTaskPath = generateCompletedPath(
          pathUpToNextTask,
          todayAnchors,
          CIRCLE_RADIUS,
          CENTER_X,
          CAP_TOP,
          BRIDGE_DROP,
          ITEM_BLOCK_H,
          BASE_TOP
        );
        setCompletedPathD(nextTaskPath);
      } else {
        // All tasks completed - show full path
        const completedPath = generateCompletedPath(
          todayAnchors,
          todayAnchors,
          CIRCLE_RADIUS,
          CENTER_X,
          CAP_TOP,
          BRIDGE_DROP,
          ITEM_BLOCK_H,
          BASE_TOP
        );
        setCompletedPathD(completedPath);
      }
    }

    // Tomorrow Path generation: only to first anchor
    if (tomorrowAnchors.length > 0) {
      const todayLastY = todayAnchors.at(-1)?.y ?? (BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2);
      const tomorrowTextHeight = responsiveHeight(6); // Tomorrow text area height
      const tomorrowBaseY = todayLastY + ITEM_BLOCK_H / 2 + CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;

      // Generate path to first anchor only
      const firstAnchorOnly = [tomorrowAnchors[0]];
      const tomorrowPath = generateTomorrowPathToFirstAnchor(
        firstAnchorOnly,
        CENTER_X,
        CAP_TOP,
        ITEM_BLOCK_H,
        tomorrowBaseY,
        CIRCLE_RADIUS
      );
      setTomorrowPathD(tomorrowPath);
    }
  }, [todayAnchors, tomorrowAnchors, geom]);

  // 7) path length measurement
  useEffect(() => {
    if (!pathD) return;
    const t = setTimeout(() => {
      // @ts-ignore - react-native-svg Path has getTotalLength at runtime
      const len = (svgPathRef.current as any)?.getTotalLength?.() ?? 0;
      if (len && Math.abs(len - pathLen) > 1) setPathLen(len);
    }, 0);
    return () => clearTimeout(t);
  }, [pathD]); // eslint-disable-line react-hooks/exhaustive-deps

  // 8) dashoffset binding
  const dashOffset = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLen || 1, 0],
  });

  // helper
  const getActionAmount = (assignment: Assignment): string => {
    let amount = '';
    // Debug logging to see why amounts aren't showing
    if (assignment.food_amounts?.length || assignment.exercise_durations?.length || assignment.mindfulness_durations?.length) {
      console.log(`[HomeDebug] Item: ${assignment.title}, food: ${JSON.stringify(assignment.food_amounts)}, move: ${JSON.stringify(assignment.exercise_durations)}`);
    }

    if (assignment.food_amounts?.length) amount = assignment.food_amounts[0];
    else if (assignment.exercise_durations?.length) amount = assignment.exercise_durations[0];
    else if (assignment.mindfulness_durations?.length) amount = assignment.mindfulness_durations[0];

    // Shorten common units for timeline display
    return amount
      .replace(/tablespoon/gi, 'tbsp')
      .replace(/teaspoon/gi, 'tsp')
      .replace(/minutes/gi, 'min')
      .replace(/minute/gi, 'min')
      .replace(/hours/gi, 'hr')
      .replace(/hour/gi, 'hr');
  };
  const getActionPurpose = (assignment: Assignment): string => {
    // Use only purpose field from API (for ActionDetail)
    return assignment.purpose || '';
  };

  const getActionSymptomsConditions = (assignment: Assignment): string => {
    // Collect symptoms and conditions in order and return (for timeline display)
    // Filter out "None of the above" and similar invalid values
    const symptoms = (assignment.symptoms || []).filter(s =>
      s && s.toLowerCase() !== 'none of the above' && s.toLowerCase() !== 'none' && s.trim() !== ''
    );
    const conditions = (assignment.conditions || []).filter(c =>
      c && c.toLowerCase() !== 'none of the above' && c.toLowerCase() !== 'none' && c.trim() !== ''
    );

    const allItems = [...symptoms, ...conditions];
    return allItems.join(', ');
  };

  // Filter out "None of the above" and similar invalid values from conditions
  const filterConditions = (conditions: string[] | undefined): string[] => {
    if (!conditions) return [];
    return conditions.filter(c =>
      c &&
      c.toLowerCase() !== 'none of the above' &&
      c.toLowerCase() !== 'none' &&
      c.trim() !== ''
    );
  };

  // Hormone-specific icon return function (chooses left/right variant by side)
  const getHormoneIcon = (hormone: string, isLeft: boolean) => {
    switch (hormone.toLowerCase()) {
      case 'androgens':
        return isLeft ? Images.AndrogensLeftHand : Images.AndrogensRightHand;
      case 'progesterone':
        return isLeft ? Images.ProgesteroneLeftHand : Images.ProgesteroneRightHand;
      case 'estrogen':
        return isLeft ? Images.EstrogenLeftHand : Images.EstrogenRightHand;
      case 'thyroid':
        return isLeft ? Images.ThyroidLeftHand : Images.ThyroidRightHand;
      case 'insulin': return isLeft ? Images.InsulinLeftHand : Images.InsulinRightHand;
      case 'cortisol':
        return isLeft ? Images.CortisolLeftHand : Images.CortisolRightHand;
      case 'fsh': return '🌱';
      case 'lh': return '🌿';
      case 'prolactin': return '🤱';
      case 'ghrelin': return '🍽️';
      case 'testosterone': return isLeft ? Images.TestosteroneLeftHand : Images.TestosteroneRightHand;
      default: return '💊';
    }
  };

  // Function to return first hormone icon (left/right aware)
  const getFirstHormoneIcon = (assignment: Assignment, isLeft: boolean): string | any => {
    if (assignment.hormones && assignment.hormones.length > 0) {
      return getHormoneIcon(assignment.hormones[0], isLeft);
    }
    return '🧬'; // Default icon
  };

  // Hormone color mapping (for badge background)
  const getHormoneColor = (hormone?: string) => {
    const h = (hormone || '').toLowerCase();
    switch (h) {
      case 'androgens': return '#A29AEA';
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

  // Smart time slot detection based on assignment content
  const getSmartTimeSlot = (assignment: Assignment): string => {
    const title = assignment.title.toLowerCase();
    const category = assignment.category?.toLowerCase() || '';

    // Morning indicators (breakfast foods, morning routines)
    if (title.includes('pumpkin') || title.includes('seed') ||
      title.includes('pomegranate') || title.includes('juice') ||
      title.includes('breakfast') || title.includes('morning') ||
      (category === 'food' && (title.includes('smoothie') || title.includes('cereal')))) {
      return 'morning';
    }

    // Afternoon indicators (exercise, lunch, afternoon activities)
    if (title.includes('yoga') || title.includes('practice') ||
      title.includes('lunch') || title.includes('afternoon') ||
      (category === 'movement' && (title.includes('cardio') || title.includes('walk')))) {
      return 'afternoon';
    }

    // Evening indicators (dinner, evening routines, strength training)
    if (title.includes('strength') || title.includes('training') ||
      title.includes('dinner') || title.includes('evening') ||
      title.includes('meditation') || title.includes('sleep')) {
      return 'evening';
    }

    // Default fallback
    return 'anytime';
  };

  // Generate anchorMap (Today anchors only)
  const anchorMap = useMemo(() => new Map(todayAnchors.map(a => [a.id, a])), [todayAnchors]);

  // Common line style settings
  const commonLineStyles = {
    stroke: "#EFEFEF",        // Light gray line color
    strokeWidth: 11,           // Reduced from 15 to 8
    fill: "none",
    strokeLinejoin: "round" as const,
    strokeDasharray: `${responsiveWidth(10)} ${responsiveWidth(2.5)}`,   // Adjusted dash pattern for thinner line
  };

  const lineOpacity = {
    today: 1.0,      // Today fully opaque
    tomorrow: 1.0,   // Tomorrow also fully opaque
  };

  // Render
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View
          style={{ height: contentHeight, overflow: 'visible' }}
          onLayout={(e) => {
            const newWidth = Math.max(0, e.nativeEvent.layout.width);
            if (newWidth > 0 && newWidth !== canvasW) {
              setCanvasW(newWidth);
            }
          }}
        >
          {/* SVG timeline */}
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            width={canvasW}
            height={contentHeight}
          >
            <Defs>
              <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#C17EC9" />
                <Stop offset="1" stopColor="#A36CFF" />
              </SvgLinearGradient>

              {/* Gradient for completed section - same color as GradientText */}
              <SvgLinearGradient id="completedSectionGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#A29AEA" />
                <Stop offset="0.32" stopColor="#C17EC9" />
                <Stop offset="0.5" stopColor="#D482B9" />
                <Stop offset="0.73" stopColor="#E98BAC" />
                <Stop offset="1" stopColor="#FDC6D1" />
              </SvgLinearGradient>
            </Defs>

            {/* Today grey base line (dashed) */}
            {!!todayPathD && (
              <Path
                d={todayPathD}
                opacity={lineOpacity.today}
                {...commonLineStyles}
              />
            )}

            {/* Gradient line to completed anchors (straight) */}
            {!!completedPathD && (
              <Path
                d={completedPathD}
                stroke="url(#completedSectionGrad)"
                strokeWidth={11}
                fill="none"
                strokeLinejoin="round"
                opacity={1.0}
              />
            )}

            {/* Today progress line (gradient) - keep existing animation */}
            {!!todayPathD && pathLen > 0 && (
              <AnimatedPath
                ref={svgPathRef}
                d={todayPathD}
                stroke="url(#grad)"
                strokeWidth={11}
                fill="none"
                strokeLinejoin="round"
                strokeDasharray={`${pathLen}, ${pathLen}`}
                // @ts-ignore
                strokeDashoffset={dashOffset}
              />
            )}

            {/* Tomorrow dashed line (future plan) */}
            {!!tomorrowPathD && (
              <Path
                d={tomorrowPathD}
                opacity={lineOpacity.tomorrow}
                {...commonLineStyles}
              />
            )}
          </Svg>



          {/* Today items: left/right cross-arranged (circle+text) */}
          {geom && todayAssignments.map((a, idx) => {
            const { CIRCLE_RADIUS } = geom;
            const anchor = anchorMap.get(a.id.toString());
            if (!anchor) return null;

            const isLeft = idx % 2 === 0;
            const xCenter = anchor.x;
            const yCenter = anchor.y;

            const xImage = xCenter - CIRCLE_RADIUS;
            const yImage = yCenter - CIRCLE_RADIUS;
            const textLeft = isLeft
              ? xCenter + CIRCLE_RADIUS + responsiveWidth(3)
              : xCenter - CIRCLE_RADIUS - responsiveWidth(35) - responsiveWidth(3);

            // Detailed debug: Today item rendering info
            console.log(`🎯 Today item rendering ${idx}:`, {
              id: a.id,
              title: a.title,
              category: a.category,
              isCompleted: a.is_completed,
              anchor: { x: xCenter, y: yCenter },
              position: { xImage, yImage, textLeft },
              isLeft: isLeft
            });



            return (
              <View key={a.id.toString()} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* Hormone image behind the circle - hide for Weekly Check-in */}
                {a.id !== -1 && (
                  <View
                    style={[
                      styles.hormoneImage,
                      {
                        top: isLeft ? (yImage - responsiveHeight(4)) : (yImage - responsiveHeight(4)),
                        left: isLeft ? (xImage - responsiveWidth(6)) : (xImage + responsiveWidth(11)),
                      }
                    ]}
                    pointerEvents="none"
                  >
                    {typeof getFirstHormoneIcon(a, isLeft) === 'string' ? (
                      <Text style={styles.hormoneImageText} allowFontScaling={false}>
                        {getFirstHormoneIcon(a, isLeft)}
                      </Text>
                    ) : (
                      <Image
                        source={getFirstHormoneIcon(a, isLeft)}
                        style={[
                          styles.hormoneImageIcon,
                          { transform: isLeft ? [{ rotate: '333deg' }] : [{ rotate: '15deg' }] }
                        ]}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                )}

                {/* Pulsing animation ring for next incomplete task */}
                {a.id === nextIncompleteTask?.id && a.id !== -1 && (
                  <Animated.View
                    style={[
                      styles.pulsingRing,
                      {
                        left: xImage - 0,
                        top: yImage - 0,
                        transform: [{ scale: pulsingAnimation }],
                      },
                    ]}
                  />
                )}

                {/* Image circle (icon replacement) */}
                <TouchableOpacity
                  style={[
                    styles.imageCircle,
                    {
                      left: xImage,
                      top: yImage,
                      borderColor: a.is_completed ? '#DDC2E9' : (a.id === nextIncompleteTask?.id ? '#DDC2E9' : '#EFEFEF'), // Lavender for completed or next task
                    },
                  ]}
                  onPress={() => {
                    // Special handling for Weekly Check-in - navigate to ChatbotScreen
                    if (a.id === -1) {
                      navigation.navigate('ChatbotScreen', {
                        conversationContext: {
                          initialMessage: 'Weekly Check-in',
                          userResponse: 'Continue conversation',
                          context: 'weekly_checkin',
                        },
                      });
                      return;
                    }

                    // Trigger expanding animation for pulsing ring
                    if (a.id === nextIncompleteTask?.id) {
                      handleExpandingNavigation({
                        id: a.id,
                        title: a.title,
                        purpose: getActionPurpose(a),
                        hormones: a.hormones || [],
                        specific_action: a.specific_action,
                        conditions: filterConditions(a.conditions),
                        symptoms: a.symptoms,
                        advices: a.advices,
                        research_studies: a.research_studies || [],
                        variants: a.variants || [],
                        hero_image_url: a.hero_image_url,
                        hormone_persona_intro: a.hormone_persona_intro,
                      }, { x: xImage, y: yImage });
                    } else {
                      // Regular navigation for other items
                      handleNavigation({
                        id: a.id,
                        title: a.title,
                        purpose: getActionPurpose(a),
                        hormones: a.hormones || [],
                        specific_action: a.specific_action,
                        conditions: filterConditions(a.conditions),
                        symptoms: a.symptoms,
                        advices: a.advices,
                        research_studies: a.research_studies || [],
                        variants: a.variants || [],
                        hero_image_url: a.hero_image_url,
                        hormone_persona_intro: a.hormone_persona_intro,
                      });
                    }
                  }}
                  onLongPress={!a.is_completed ? () => {
                    // Trigger expanding animation before navigating to ActionCompletedScreen
                    handleExpandingNavigation({
                      id: a.id,
                      title: a.title,
                      purpose: getActionPurpose(a),
                      hormones: a.hormones || [],
                      specific_action: a.specific_action,
                      conditions: filterConditions(a.conditions),
                      symptoms: a.symptoms,
                      advices: a.advices,
                      research_studies: a.research_studies || [],
                      variants: a.variants || [],
                      hero_image_url: a.hero_image_url,
                      hormone_persona_intro: a.hormone_persona_intro,
                    }, { x: xImage, y: yImage });
                  } : undefined}
                  delayLongPress={2000} // 2 seconds long press
                >
                  {a.hero_image_url ? (
                    <Image
                      source={{ uri: a.hero_image_url }}
                      style={styles.circleImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.imageFallback} allowFontScaling={false}>
                      📋
                    </Text>
                  )}
                  {/* (hormone image rendered behind the circle) */}

                  {/* Hormone number (relative to image) - hide for Weekly Check-in */}
                  {/* Shows checkmark for completed items, +N for pending */}
                  {a.id !== -1 && (
                    <View style={[
                      styles.hormoneBadge,
                      {
                        // When left anchor: left of image
                        // When right anchor: right of image
                        top: isLeft ? -responsiveHeight(2) : -responsiveHeight(2.5),
                        left: isLeft ? -responsiveWidth(12) : undefined,
                        right: isLeft ? undefined : -responsiveWidth(12),
                        backgroundColor: a.is_completed ? '#4CAF50' : getHormoneColor(a.hormones?.[0]),
                      }
                    ]}>
                      <Text style={[styles.hormoneBadgeText, a.is_completed && { color: '#FFFFFF' }]} allowFontScaling={false}>
                        {a.is_completed ? '✓' : `+${a.hormones?.length || 0}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Text */}
                <View
                  style={[
                    styles.textBox,
                    { left: textLeft, top: yCenter - responsiveHeight(3.5), alignItems: isLeft ? 'flex-start' : 'flex-end', justifyContent: 'center' },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      // Special handling for Weekly Check-in - navigate to ChatbotScreen
                      if (a.id === -1) {
                        navigation.navigate('ChatbotScreen', {
                          conversationContext: {
                            initialMessage: 'Weekly Check-in',
                            userResponse: 'Continue conversation',
                            context: 'weekly_checkin',
                          },
                        });
                        return;
                      }

                      handleNavigation({
                        id: a.id,
                        title: a.title,
                        purpose: getActionPurpose(a),
                        hormones: a.hormones || [],
                        specific_action: a.specific_action,
                        conditions: filterConditions(a.conditions),
                        symptoms: a.symptoms,
                        advices: a.advices,
                        research_studies: a.research_studies || [],
                        variants: a.variants || [],
                        hero_image_url: a.hero_image_url,
                        hormone_persona_intro: a.hormone_persona_intro,
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isLeft ? 'flex-start' : 'flex-end' }}
                  >
                    <Text
                      style={[styles.itemTitle, { textAlign: isLeft ? 'left' : 'right' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {a.title}
                    </Text>
                    <Text style={styles.itemArrow} allowFontScaling={false}>
                      {'>'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.itemSub, { textAlign: isLeft ? 'left' : 'right' }]} numberOfLines={1} allowFontScaling={false}>
                    {a.id === -1
                      ? (a.purpose || 'Vent your concerns & progress | Acne | 🌤️')
                      : `${getActionAmount(a)}${getActionSymptomsConditions(a) ? ' | ' : ''}${getActionSymptomsConditions(a)}`}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Time-based icon display */}
          {geom && timeSlotPositions.map((position, index) => {
            const { CENTER_X } = geom;
            const iconSize = responsiveWidth(8); // 40px equivalent (increased from 26px)
            const isAnytime = (TIME_ICONS[position.timeSlot] || TIME_ICONS.anytime) === 'Anytime';
            const containerWidth = isAnytime ? responsiveWidth(20) : iconSize;
            const containerHeight = isAnytime ? responsiveHeight(3) : iconSize;
            const iconLeft = CENTER_X - containerWidth / 2;
            const iconTop = position.iconY - containerHeight / 2;

            // Use the smart time slot from position calculation
            const smartTimeSlot = position.timeSlot;

            console.log(`🎯 ActionPlanTimeline Icon rendering ${index}:`, {
              originalTimeSlot: position.timeSlot,
              smartTimeSlot,
              icon: TIME_ICONS[smartTimeSlot] || TIME_ICONS.anytime,
              position: { iconLeft, iconTop },
              isCapCenter: position.isCapCenter,
              foundInMapping: !!TIME_ICONS[smartTimeSlot],
              fallbackUsed: !TIME_ICONS[smartTimeSlot],
              allAvailableKeys: Object.keys(TIME_ICONS)
            });

            return (
              <View
                key={`time-icon-${position.timeSlot}`}
                style={[
                  (TIME_ICONS[smartTimeSlot] || TIME_ICONS.anytime) === 'Anytime' ? styles.timeTextContainer : styles.timeIcon,
                  {
                    left: iconLeft,
                    top: iconTop,
                    width: containerWidth,
                    height: containerHeight,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.timeIconText,
                    (TIME_ICONS[smartTimeSlot] || TIME_ICONS.anytime) === 'Anytime' && styles.timeIconTextSmall,
                    (TIME_ICONS[smartTimeSlot] || TIME_ICONS.anytime) === '🌙' && styles.timeIconTextMoon
                  ]}
                  allowFontScaling={false}
                >
                  {TIME_ICONS[smartTimeSlot] || TIME_ICONS.anytime}
                </Text>
              </View>
            );
          })}

          {/* Tomorrow label - same style as home screen */}
          {geom && tomorrowAnchors.length > 0 && (() => {
            // Calculate end point of Today timeline
            const todayLastY = todayAnchors.at(-1)?.y ?? 0;
            const todayEndY = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM;

            // Calculate start point of Tomorrow timeline (for label position - based on default spacing)
            const tomorrowStartYForLabel = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM + responsiveHeight(8);

            // Exact center between the two timelines (for label display)
            const gapCenterY = todayEndY + (tomorrowStartYForLabel - todayEndY) / 2;

            // Calculate date (tomorrow)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.getDate();
            const tomorrowMonth = tomorrow.toLocaleString('en-US', { month: 'long' });

            return (
              <View style={[styles.tomorrowHeaderContainer, {
                top: gapCenterY - responsiveHeight(1.5), // Adjust to avoid overlap with line
              }]}>
                <Text style={styles.tomorrowSectionTitle}>Tomorrow</Text>
                <Text style={styles.tomorrowDateText}>{`${tomorrowMonth} ${tomorrowDate}, ${tomorrow.getFullYear()}`}</Text>

                {/* Lock icon - render below the line */}
                <View style={styles.tomorrowLockContainer}>
                  <Image
                    source={require('../assets/icons/IconLock.png')}
                    style={styles.tomorrowLockIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
            );
          })()}


          {/* Display only the first Tomorrow item */}
          {geom && tomorrowAnchors.slice(0, 1).map((anchor, idx) => {
            const { CIRCLE_RADIUS } = geom;
            const a = tomorrowAssignments[idx];
            if (!a) return null;

            const isLeft = idx % 2 === 0;
            const xCenter = anchor.x;
            const yCenter = anchor.y;

            const xImage = xCenter - CIRCLE_RADIUS;
            const yImage = yCenter - CIRCLE_RADIUS;

            const textLeft = isLeft
              ? xCenter + CIRCLE_RADIUS + responsiveWidth(3)
              : xCenter - CIRCLE_RADIUS - responsiveWidth(35) - responsiveWidth(3);

            return (
              <View key={a.id.toString()} style={[StyleSheet.absoluteFill, styles.tomorrowItem]} pointerEvents="box-none">
                {/* Tomorrow image circle */}
                <View
                  style={[
                    styles.imageCircle,
                    { left: xImage, top: yImage },
                  ]}
                >
                  <Text style={styles.imageFallback}>🥜</Text>

                  {/* Tomorrow hormone image */}
                  <View style={[
                    styles.hormoneImage,
                    {
                      // Revert to original working positioning
                      top: isLeft ? -responsiveHeight(5) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(8) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(8),

                    }
                  ]}
                    pointerEvents="none">
                    {(() => {
                      const hormoneIcon = getFirstHormoneIcon(a, isLeft);
                      console.log('🔍 Tomorrow hormone icon debug:', {
                        assignment: a.title,
                        hormones: a.hormones,
                        hormoneIcon,
                        isString: typeof hormoneIcon === 'string',
                        isLeft
                      });

                      return typeof hormoneIcon === 'string' ? (
                        <Text style={styles.hormoneImageText} allowFontScaling={false}>
                          {hormoneIcon}
                        </Text>
                      ) : (
                        <Image
                          source={hormoneIcon}
                          style={[
                            styles.hormoneImageIcon,
                            { transform: isLeft ? [{ rotate: '333deg' }] : [{ rotate: '30deg' }] }
                          ]}
                          resizeMode="contain"
                        />
                      );
                    })()}
                  </View>

                  {/* Tomorrow hormone number (relative to image) */}
                  <View style={[
                    styles.hormoneBadge,
                    {
                      // Match today section positioning
                      top: isLeft ? -responsiveHeight(2) : -responsiveHeight(2.5),
                      left: isLeft ? -responsiveWidth(12) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(12),
                      backgroundColor: getHormoneColor(a.hormones?.[0]),
                    }
                  ]}>
                    <Text style={styles.hormoneBadgeText} allowFontScaling={false}>
                      +{a.hormones?.length || 0}
                    </Text>
                  </View>
                </View>

                {/* Tomorrow text box */}
                <View
                  style={[
                    styles.textBox,
                    { left: textLeft, top: yCenter - responsiveHeight(3.5), alignItems: isLeft ? 'flex-start' : 'flex-end', justifyContent: 'center' },
                  ]}
                >
                  <Text style={[styles.itemTitle, { textAlign: isLeft ? 'left' : 'right' }]}>
                    {a.title}
                  </Text>
                  <Text style={[styles.itemSub, { textAlign: isLeft ? 'left' : 'right' }]} numberOfLines={1} allowFontScaling={false}>
                    {getActionAmount(a)}{getActionSymptomsConditions(a) ? ' | ' : ''}{getActionSymptomsConditions(a)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Tomorrow blur overlay - positioned after all items to appear on top */}
          {geom && tomorrowAnchors.length > 0 && (() => {
            const todayLastY = todayAnchors.at(-1)?.y ?? 0;
            const tomorrowTextHeight = responsiveHeight(6);
            const tomorrowStartY = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;

            return (
              <BlurView
                intensity={Platform.OS === 'android' ? 8 : 18}
                tint="light"
                // Use a more compatible blur method for Android to better handle SVG content behind
                {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as any } : {})}
                style={[
                  styles.tomorrowSectionBlur,
                  {
                    top: tomorrowStartY,
                    height: contentHeight - tomorrowStartY,
                    left: -responsiveWidth(5),
                    right: -responsiveWidth(5),
                    zIndex: 100,
                  }
                ]}
              />
            );
          })()}

          {/* Expanding circle animation overlay */}
          {expandingCircle && (
            <Animated.View
              style={[
                styles.expandingCircle,
                {
                  left: expandingCircle.x,
                  top: expandingCircle.y,
                  opacity: expandAnimation.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.8, 0.4, 0], // Fade out completely as it expands
                  }),
                  transform: [
                    {
                      scale: expandAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, Math.max(SCREEN_W, Dimensions.get('window').height) / 20], // Scale to cover full screen
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// ====== Utility: date format ======
function formatToday(d: Date) {
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * [rectilinear] timeline Path generation (requested shape)
 * - Start: from centerX down by TOP_CAP, then move to "center side edge" of first circle, then move down to center height of next circle
 * - For each pair (a→b):
 *    a circle: move down slightly (mid) → move horizontally to b circle edge → move down to b circle center
 * - End: from last circle move down slightly → move horizontally to centerX → move down by BOTTOM_CAP
 */
export function generatePathRectilinear(
  anchors: { id: string; x: number; y: number }[],
  circleR: number,
  centerX: number,
  TOP_CAP: number,
  BOTTOM_CAP: number,
  topBridgeDrop: number,
  itemBlockH: number,
  BASE_TOP: number,
) {
  if (!anchors.length) return '';
  const pts = [...anchors].sort((a, b) => a.y - b.y);

  const s = (n: number) => Math.round(n);
  const cornerR = 15;

  const first = pts[0];
  const last = pts[pts.length - 1];

  // Helper function for rounded corners
  const addRoundedCorner = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): string => {
    const dx1 = x2 - x1, dy1 = y2 - y1;
    const dx2 = x3 - x2, dy2 = y3 - y2;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (len1 < 1 || len2 < 1) return ` L ${s(x2)},${s(y2)}`;

    const ux1 = dx1 / len1, uy1 = dy1 / len1;
    const ux2 = dx2 / len2, uy2 = dy2 / len2;

    const maxR = Math.min(len1 * 0.4, len2 * 0.4);
    const actualR = Math.min(cornerR, maxR);

    if (actualR < 2) return ` L ${s(x2)},${s(y2)}`;

    const inX = x2 - ux1 * actualR;
    const inY = y2 - uy1 * actualR;
    const outX = x2 + ux2 * actualR;
    const outY = y2 + uy2 * actualR;

    const cross = dx1 * dy2 - dy1 * dx2;
    const sweep = cross > 0 ? 1 : 0;

    return ` L ${s(inX)},${s(inY)} A ${actualR} ${actualR} 0 0 ${sweep} ${s(outX)},${s(outY)}`;
  };

  // Generate multiple separate path segments
  const segments: string[] = [];

  // First segment: from start to first anchor top
  const firstSegmentPoints: [number, number][] = [
    [centerX, BASE_TOP],
    [centerX, BASE_TOP + TOP_CAP],
    [first.x, BASE_TOP + TOP_CAP],
    [first.x, first.y - circleR] // to first anchor top edge
  ];

  let segmentPath = `M ${s(firstSegmentPoints[0][0])},${s(firstSegmentPoints[0][1])}`;
  for (let i = 1; i < firstSegmentPoints.length - 1; i++) {
    const [x1, y1] = firstSegmentPoints[i - 1];
    const [x2, y2] = firstSegmentPoints[i];
    const [x3, y3] = firstSegmentPoints[i + 1];
    segmentPath += addRoundedCorner(x1, y1, x2, y2, x3, y3);
  }
  const [lastX, lastY] = firstSegmentPoints[firstSegmentPoints.length - 1];
  segmentPath += ` L ${s(lastX)},${s(lastY)}`;
  segments.push(segmentPath);

  // Middle segments: from each anchor bottom to next anchor top
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const yMid = a.y + circleR + (b.y - circleR - (a.y + circleR)) / 2;

    const segmentPoints: [number, number][] = [
      [a.x, a.y + circleR], // current anchor bottom edge
      [a.x, yMid],
      [b.x, yMid],
      [b.x, b.y - circleR] // next anchor top edge
    ];

    let midSegmentPath = `M ${s(segmentPoints[0][0])},${s(segmentPoints[0][1])}`;
    for (let j = 1; j < segmentPoints.length - 1; j++) {
      const [x1, y1] = segmentPoints[j - 1];
      const [x2, y2] = segmentPoints[j];
      const [x3, y3] = segmentPoints[j + 1];
      midSegmentPath += addRoundedCorner(x1, y1, x2, y2, x3, y3);
    }
    const [segLastX, segLastY] = segmentPoints[segmentPoints.length - 1];
    midSegmentPath += ` L ${s(segLastX)},${s(segLastY)}`;
    segments.push(midSegmentPath);
  }

  // Last segment: from last anchor bottom to end point (symmetric to first)
  const lastBottomY = last.y + circleR;
  const lastMidY = lastBottomY + itemBlockH / 2 - circleR; // subtract circleR symmetrically to first
  const lastSegmentPoints: [number, number][] = [
    [last.x, lastBottomY], // last anchor bottom edge
    [last.x, lastMidY],
    [centerX, lastMidY],
    [centerX, lastMidY + BOTTOM_CAP]
  ];

  let lastSegmentPath = `M ${s(lastSegmentPoints[0][0])},${s(lastSegmentPoints[0][1])}`;
  for (let i = 1; i < lastSegmentPoints.length - 1; i++) {
    const [x1, y1] = lastSegmentPoints[i - 1];
    const [x2, y2] = lastSegmentPoints[i];
    const [x3, y3] = lastSegmentPoints[i + 1];
    lastSegmentPath += addRoundedCorner(x1, y1, x2, y2, x3, y3);
  }
  const [finalX, finalY] = lastSegmentPoints[lastSegmentPoints.length - 1];
  lastSegmentPath += ` L ${s(finalX)},${s(finalY)}`;
  segments.push(lastSegmentPath);

  // Combine all segments into one path
  return segments.join(' ');
}

/**
 * Tomorrow timeline: function to draw only to first anchor
 */
function generateTomorrowPathToFirstAnchor(
  anchors: { id: string; x: number; y: number }[],
  centerX: number,
  TOP_CAP: number,
  ITEM_BLOCK_H: number,
  BASE_TOP: number,
  circleR: number,
) {
  if (!anchors.length) return '';

  const s = (n: number) => Math.round(n);
  const cornerR = 15;
  const first = anchors[0];

  // Helper function for rounded corners
  const addRoundedCorner = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): string => {
    const dx1 = x2 - x1, dy1 = y2 - y1;
    const dx2 = x3 - x2, dy2 = y3 - y2;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (len1 < 1 || len2 < 1) return ` L ${s(x2)},${s(y2)}`;

    const ux1 = dx1 / len1, uy1 = dy1 / len1;
    const ux2 = dx2 / len2, uy2 = dy2 / len2;

    const maxR = Math.min(len1 * 0.4, len2 * 0.4);
    const actualR = Math.min(cornerR, maxR);

    if (actualR < 2) return ` L ${s(x2)},${s(y2)}`;

    const inX = x2 - ux1 * actualR, inY = y2 - uy1 * actualR;
    const outX = x2 + ux2 * actualR, outY = y2 + uy2 * actualR;

    const cross = dx1 * dy2 - dy1 * dx2;
    const sweep = cross > 0 ? 1 : 0;

    return ` L ${s(inX)},${s(inY)} A ${actualR} ${actualR} 0 0 ${sweep} ${s(outX)},${s(outY)}`;
  };

  // Path points array - only to first anchor top edge
  const pathPoints: [number, number][] = [
    [centerX, BASE_TOP],
    [centerX, BASE_TOP + TOP_CAP],
    [first.x, BASE_TOP + TOP_CAP],
    [first.x, first.y - circleR] // to first anchor top edge
  ];

  // Path generation
  let d = `M ${s(pathPoints[0][0])},${s(pathPoints[0][1])}`;

  // Connect with rounded corners
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const [x1, y1] = pathPoints[i - 1];
    const [x2, y2] = pathPoints[i];
    const [x3, y3] = pathPoints[i + 1];

    d += addRoundedCorner(x1, y1, x2, y2, x3, y3);
  }

  // Straight to last point
  const [lastX, lastY] = pathPoints[pathPoints.length - 1];
  d += ` L ${s(lastX)},${s(lastY)}`;

  return d;
}

/**
 * Function to generate path to completed anchors (ends exactly at anchors)
 */
function generateCompletedPath(
  completedAnchors: { id: string; x: number; y: number }[],
  allAnchors: { id: string; x: number; y: number }[],
  circleR: number,
  centerX: number,
  TOP_CAP: number,
  topBridgeDrop: number,
  itemBlockH: number,
  BASE_TOP: number,
) {
  if (!completedAnchors.length) return '';

  const s = (n: number) => Math.round(n);
  const cornerR = 15;
  const pts = [...completedAnchors].sort((a, b) => a.y - b.y);
  const first = pts[0];
  const last = pts[pts.length - 1];

  // Helper function for rounded corners
  const addRoundedCorner = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): string => {
    const dx1 = x2 - x1, dy1 = y2 - y1;
    const dx2 = x3 - x2, dy2 = y3 - y2;

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (len1 < 1 || len2 < 1) return ` L ${s(x2)},${s(y2)}`;

    const ux1 = dx1 / len1, uy1 = dy1 / len1;
    const ux2 = dx2 / len2, uy2 = dy2 / len2;

    const maxR = Math.min(len1 * 0.4, len2 * 0.4);
    const actualR = Math.min(cornerR, maxR);

    if (actualR < 2) return ` L ${s(x2)},${s(y2)}`;

    const inX = x2 - ux1 * actualR;
    const inY = y2 - uy1 * actualR;
    const outX = x2 + ux2 * actualR;
    const outY = y2 + uy2 * actualR;

    const cross = dx1 * dy2 - dy1 * dx2;
    const sweep = cross > 0 ? 1 : 0;

    return ` L ${s(inX)},${s(inY)} A ${actualR} ${actualR} 0 0 ${sweep} ${s(outX)},${s(outY)}`;
  };

  const segments: string[] = [];

  // First segment: from start to first anchor top
  const firstSegmentPoints: [number, number][] = [
    [centerX, BASE_TOP],
    [centerX, BASE_TOP + TOP_CAP],
    [first.x, BASE_TOP + TOP_CAP],
    [first.x, first.y - circleR]
  ];

  let segmentPath = `M ${s(firstSegmentPoints[0][0])},${s(firstSegmentPoints[0][1])}`;
  for (let i = 1; i < firstSegmentPoints.length - 1; i++) {
    const [x1, y1] = firstSegmentPoints[i - 1];
    const [x2, y2] = firstSegmentPoints[i];
    const [x3, y3] = firstSegmentPoints[i + 1];
    segmentPath += addRoundedCorner(x1, y1, x2, y2, x3, y3);
  }
  const [lastX, lastY] = firstSegmentPoints[firstSegmentPoints.length - 1];
  segmentPath += ` L ${s(lastX)},${s(lastY)}`;
  segments.push(segmentPath);

  // Middle segments: from each anchor bottom to next anchor top (only completed anchors)
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const yMid = a.y + circleR + (b.y - circleR - (a.y + circleR)) / 2;

    const segmentPoints: [number, number][] = [
      [a.x, a.y + circleR],
      [a.x, yMid],
      [b.x, yMid],
      [b.x, b.y - circleR]
    ];

    let midSegmentPath = `M ${s(segmentPoints[0][0])},${s(segmentPoints[0][1])}`;
    for (let j = 1; j < segmentPoints.length - 1; j++) {
      const [x1, y1] = segmentPoints[j - 1];
      const [x2, y2] = segmentPoints[j];
      const [x3, y3] = segmentPoints[j + 1];
      midSegmentPath += addRoundedCorner(x1, y1, x2, y2, x3, y3);
    }
    const [segLastX, segLastY] = segmentPoints[segmentPoints.length - 1];
    midSegmentPath += ` L ${s(segLastX)},${s(segLastY)}`;
    segments.push(midSegmentPath);
  }

  // End at last completed anchor (no additional segments)

  return segments.join(' ');
}

// ====== Styles ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  imageCircle: {
    width: responsiveWidth(19.44),
    height: responsiveWidth(19.44),
    borderRadius: responsiveWidth(9.72),
    backgroundColor: '#F2F2F7',
    borderWidth: responsiveWidth(2.78),
    borderColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  circleImage: {
    width: '100%',
    height: '100%',
    borderRadius: responsiveWidth(9.72),
    zIndex: 1,
    backgroundColor: '#F2F2F7',
  },
  pulsingRing: {
    position: 'absolute',
    width: responsiveWidth(19.44),
    height: responsiveWidth(19.44),
    borderRadius: (responsiveWidth(19.44)) / 2,
    backgroundColor: '#DDC2E9',
    opacity: 0.5,
  },
  imageFallback: {
    fontSize: responsiveFontSize(2.5),
    color: '#111',
  },
  hormoneBadge: {
    position: 'absolute',
    // backgroundColor removed - will be set dynamically
    borderRadius: responsiveWidth(3),
    paddingHorizontal: responsiveWidth(1),
    paddingVertical: responsiveHeight(0.2),
    minWidth: responsiveWidth(6),
    height: responsiveHeight(2.4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneImage: {
    position: 'absolute',
    width: scale(50),
    height: verticalScale(50),
    borderRadius: responsiveWidth(6),
    paddingHorizontal: scale(1),
    paddingVertical: verticalScale(1),
    // backgroundColor: 'rgba(255, 0, 0, 0.3)', // Temporary red background for debugging
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: responsiveWidth(0.5),
    // borderColor: '#E0E0E0',
    zIndex: 0,
  },
  hormoneImageText: {
    fontSize: responsiveFontSize(1.7),
    color: '#666666',
  },
  hormoneImageIcon: {
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  hormoneBadgeText: {
    color: '#6F6F6F',
    fontSize: responsiveFontSize(1.1),
    fontWeight: '600',
  },
  textBox: {
    position: 'absolute',
    width: responsiveWidth(35),
    height: responsiveHeight(7), // Increased height to accommodate title + description
    justifyContent: 'center', // Center content vertically
  },
  itemTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
    lineHeight: responsiveFontSize(2.8),
  },
  itemArrow: {
    fontSize: responsiveFontSize(1.98),
    fontWeight: '300',
    color: '#949494',
    marginLeft: 8,
  },
  itemSub: {
    marginTop: 2,
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    color: '#949494',
  },

  // Tomorrow label style (same as Home screen)
  tomorrowHeaderContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    left: 0,
    right: 0,
    paddingHorizontal: responsiveWidth(5),
    backgroundColor: '#FFFFFF',
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
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    tintColor: '#949494',
  },

  // Tomorrow item blur effect
  tomorrowItem: {
    opacity: 0.9,
  },

  // Tomorrow section blur overlay
  tomorrowSectionBlur: {
    position: 'absolute',
    // backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'transparent', // Slight white overlay for better blur effect
    borderRadius: responsiveWidth(2),
  },

  // Android fallback for blur effect
  tomorrowSectionBlurAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 0, // Avoid curved edges causing visible borders on Android
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent', // Remove shadow to prevent border-like halo
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0, // Disable elevation halo
    // Slightly expand vertically to hide potential subpixel seams
    marginTop: -1,
    marginBottom: -1,
  },

  // Time-based icon style (matching Figma design)
  timeIcon: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(10) / 2, // Fully rounded (40px diameter)
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveWidth(0.2), // Small padding like Figma
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2, // Android shadow
  },
  timeTextContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(1),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(2),
    paddingVertical: responsiveHeight(0.2),
    minWidth: responsiveWidth(20),
    minHeight: responsiveHeight(3),
  },
  timeIconText: {
    fontSize: responsiveFontSize(3.0), // 30px equivalent (increased from 20px)
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#949494', // Grey color from Figma
  },
  timeIconTextSmall: {
    fontSize: moderateScale(12, 1.5), // Smaller font size for "Anytime" text
    fontWeight: '500',
  },
  timeIconTextMoon: {
    fontSize: responsiveFontSize(1.9), // Smaller size for moon emoji
    lineHeight: responsiveFontSize(2.5),
  },

  // Expanding circle animation styles
  expandingCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C17EC9', // Darker purple color
    zIndex: 10, // Ensure it's on top of everything
    marginLeft: -20, // Center the circle on the tap point
    marginTop: -20,
    // Ensure it can expand beyond the container bounds
    overflow: 'visible',
    opacity: 0.8, // Make it more visible
  },
});