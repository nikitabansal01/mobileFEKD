// ActionPlanTimeline.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
// import { BlurView } from 'expo-blur';

// ====== Type imports ======
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== Time slot icon mapping ======
const TIME_ICONS: Record<string, string> = {
  completed: '', // No icon for completed
  morning: '🌤️',
  afternoon: '☀️',
  evening: '🌙',
  anytime: '⏰',
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
    advices: ["Take 1 spoon with breakfast"],
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
   * Separates and manages Today and Tomorrow actions
   */
  const todayAssignments: Assignment[] = useMemo(() => {
    const arr: Assignment[] = [];
    Object.values(assignments).forEach((group) => {
      group?.forEach((a) => arr.push(a));
    });
    
    console.log('🔍 Today Assignments processing:', {
      originalAssignments: assignments,
      processedTodayAssignments: arr,
      assignmentsKeys: Object.keys(assignments),
      totalItems: arr.length
    });
    
    return arr;
  }, [assignments]);

  const tomorrowAssignments: Assignment[] = DUMMY_TOMORROW_DATA;

  // All layout calculation values (container-based)
  const { width: SCREEN_W } = Dimensions.get('window');
  
  // Timeline background/progress (SVG) - declare canvasW first
  const [canvasW, setCanvasW] = useState(SCREEN_W - responsiveWidth(0)); // Set initial value

  const geom = useMemo(() => {
    if (!canvasW || canvasW <= 0) return null;

    const CENTER_X      = Math.round(canvasW / 2);
    const CIRCLE_RADIUS = Math.round(responsiveWidth(9.72));     // Unified to responsiveWidth
    const OFFSET_X      = Math.round(responsiveWidth(26));    // Unified to responsiveWidth
    const LEFT_X        = CENTER_X - OFFSET_X;                   // Item center X
    const RIGHT_X       = CENTER_X + OFFSET_X;

    // Use responsiveHeight as before, but round at the end
    const BASE_TOP      = Math.round(responsiveHeight(0));      // Container top reference point
    const ITEM_BLOCK_H  = Math.round(responsiveHeight(18));      // Vertical spacing between items
    const CAP_TOP       = Math.round(responsiveHeight(7));
    const CAP_BOTTOM    = Math.round(responsiveHeight(7));
    const BRIDGE_DROP   = Math.round(Math.min(responsiveHeight(2.25), 0.5 * CAP_TOP));

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

    // Calculate time slot icon positions - process only actual received time slots
    const timeSlots = Object.keys(assignments).filter(slot => assignments[slot]?.length > 0); // Exclude empty arrays
    console.log('🔍 Time slot icon calculation:', { 
      allKeys: Object.keys(assignments), 
      filteredSlots: timeSlots,
      assignmentsData: assignments 
    });
    
    const positions: TimeSlotPosition[] = [];
    
    if (timeSlots.length > 0) {
      let previousY = BASE_TOP; // End Y coordinate of previous section
      
      timeSlots.forEach((timeSlot, index) => {
        const slotAssignments = assignments[timeSlot] || [];
        
        if (index === 0) {
          // First time slot: place at Cap center
          const iconY = BASE_TOP + CAP_TOP / 2;
          positions.push({
            timeSlot,
            iconY,
            isCapCenter: true,
          });
          
          // Calculate this time slot's last anchor Y coordinate
          if (slotAssignments.length > 0) {
            const slotStartIdx = todayNext.findIndex(anchor => 
              slotAssignments.some(a => a.id.toString() === anchor.id)
            );
            const slotEndIdx = slotStartIdx + slotAssignments.length - 1;
            previousY = todayNext[slotEndIdx]?.y ?? previousY;
          }
        } else {
          // Next time slots: center of horizontal line between previous and next anchor
          const slotStartIdx = todayNext.findIndex(anchor => 
            slotAssignments.some(a => a.id.toString() === anchor.id)
          );
          
          if (slotStartIdx > 0) {
            const prevAnchorY = todayNext[slotStartIdx - 1]?.y ?? previousY;
            const currentAnchorY = todayNext[slotStartIdx]?.y ?? (prevAnchorY + ITEM_BLOCK_H);
            const iconY = (prevAnchorY + currentAnchorY) / 2;
            
            positions.push({
              timeSlot,
              iconY,
              isCapCenter: false,
            });
            
            // Update this time slot's last anchor Y coordinate
            if (slotAssignments.length > 0) {
              const slotEndIdx = slotStartIdx + slotAssignments.length - 1;
              previousY = todayNext[slotEndIdx]?.y ?? previousY;
            }
          }
        }
      });
    }
    
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

      // Generate path to completed anchors (ends exactly at anchors)
      const completedCount = todayAssignments.filter(a => a.is_completed).length;
      if (completedCount > 0) {
        const completedAnchors = todayAnchors.slice(0, completedCount);
        const completedPath = generateCompletedPath(
          completedAnchors,
          todayAnchors, // total anchors also passed (for first segment calculation)
          CIRCLE_RADIUS,
          CENTER_X,
          CAP_TOP,
          BRIDGE_DROP,
          ITEM_BLOCK_H,
          BASE_TOP
        );
        setCompletedPathD(completedPath);
      } else {
        setCompletedPathD('');
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
    if (assignment.food_amounts?.length) return assignment.food_amounts[0];
    if (assignment.exercise_durations?.length) return assignment.exercise_durations[0];
    if (assignment.mindfulness_durations?.length) return assignment.mindfulness_durations[0];
    return '';
  };
  const getActionPurpose = (assignment: Assignment): string => {
    // Use only purpose field from API (for ActionDetail)
    return assignment.purpose || '';
  };

  const getActionSymptomsConditions = (assignment: Assignment): string => {
    // Collect symptoms and conditions in order and return (for timeline display)
    const symptoms = assignment.symptoms || [];
    const conditions = assignment.conditions || [];
    
    const allItems = [...symptoms, ...conditions];
    return allItems.join(', ');
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

  // Function to return first hormone icon
  const getFirstHormoneIcon = (assignment: Assignment): string => {
    if (assignment.hormones && assignment.hormones.length > 0) {
      return getHormoneIcon(assignment.hormones[0]);
    }
    return '🧬'; // Default icon
  };

  // Generate anchorMap (Today anchors only)
  const anchorMap = useMemo(() => new Map(todayAnchors.map(a => [a.id, a])), [todayAnchors]);

  // Common line style settings
  const commonLineStyles = {
    stroke: "#EFEFEF",        // Light gray line color
    strokeWidth: 15,
    fill: "none",
    strokeLinejoin: "round" as const,
    strokeDasharray: `${responsiveWidth(11)} ${responsiveWidth(2.75)}`,   // Dashed line pattern
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
          style={{ height: contentHeight, overflow: 'hidden' }}
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
                strokeWidth={15}
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
                strokeWidth={15}
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
              : xCenter - CIRCLE_RADIUS - responsiveWidth(45) - responsiveWidth(3);

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
                {/* Image circle (icon replacement) */}
                <TouchableOpacity
                  style={[
                    styles.imageCircle,
                    { 
                      left: xImage, 
                      top: yImage,
                      borderColor: a.is_completed ? '#DDC2E9' : '#EFEFEF', // Lavender color when completed
                    },
                  ]}
                  onLongPress={!a.is_completed ? () => {
                    // Navigate to ActionCompletedScreen (only for non-completed actions)
                    try {
                      navigation.navigate('ActionCompletedScreen', {
                        action: JSON.stringify({
                          id: a.id,
                          title: a.title,
                          purpose: getActionPurpose(a),
                          hormones: a.hormones || [],
                          specific_action: a.specific_action,
                          conditions: a.conditions,
                          symptoms: a.symptoms,
                          advices: a.advices,
                        })
                      });
                    } catch (error) {
                      console.error('Navigation to ActionCompletedScreen error:', error);
                    }
                  } : undefined}
                  delayLongPress={2000} // 2 seconds long press
                >
                  <Text style={styles.imageFallback} allowFontScaling={false}>
                    📋
                  </Text>
                  {/* Hormone image */}
                  <View style={[
                    styles.hormoneImage,
                    {
                      // When left anchor: top left
                      // When right anchor: top right
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(3) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(3),
                    }
                  ]}>
                    <Text style={styles.hormoneImageText} allowFontScaling={false}>
                      {getFirstHormoneIcon(a)}
                    </Text>
                  </View>
                  
                  {/* Hormone number (relative to image) */}
                  <View style={[
                    styles.hormoneBadge,
                    {
                      // When left anchor: left of image
                      // When right anchor: right of image
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(8) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(8),
                    }
                  ]}>
                    <Text style={styles.hormoneBadgeText} allowFontScaling={false}>
                      +{a.hormones?.length || 0}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Text */}
                <View
                  style={[
                    styles.textBox,
                    { left: textLeft, top: yCenter - 28, alignItems: isLeft ? 'flex-start' : 'flex-end' },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      handleNavigation({
                        id: a.id,
                        title: a.title,
                        purpose: getActionPurpose(a),
                        hormones: a.hormones || [],
                        specific_action: a.specific_action,
                        conditions: a.conditions,
                        symptoms: a.symptoms,
                        advices: a.advices,
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Text style={styles.itemTitle}>
                      {a.title}
                    </Text>
                    <Text style={styles.itemArrow} allowFontScaling={false}>
                      >
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.itemSub} numberOfLines={1} allowFontScaling={false}>
                    {getActionAmount(a)}{getActionSymptomsConditions(a) ? ' | ' : ''}{getActionSymptomsConditions(a)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Time-based icon display */}
          {geom && timeSlotPositions.map((position, index) => {
            const { CENTER_X } = geom;
            const iconSize = responsiveWidth(8); // 26px equivalent
            const iconLeft = CENTER_X - iconSize / 2;
            const iconTop = position.iconY - iconSize / 2;
            
            console.log(`🎯 Icon rendering ${index}:`, {
              timeSlot: position.timeSlot,
              icon: TIME_ICONS[position.timeSlot] || TIME_ICONS.anytime,
              position: { iconLeft, iconTop },
              isCapCenter: position.isCapCenter
            });
            
            return (
              <View
                key={`time-icon-${position.timeSlot}`}
                style={[
                  styles.timeIcon,
                  {
                    left: iconLeft,
                    top: iconTop,
                    width: iconSize,
                    height: iconSize,
                  }
                ]}
              >
                <Text style={styles.timeIconText} allowFontScaling={false}>
                  {TIME_ICONS[position.timeSlot] || TIME_ICONS.anytime}
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
                  <Text style={styles.tomorrowDateText}>{tomorrowDate}th {tomorrowMonth}, {tomorrow.getFullYear()}</Text>
                  
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
              : xCenter - CIRCLE_RADIUS - responsiveWidth(45) - responsiveWidth(3);

            return (
              <View key={a.id.toString()} style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
                      // When left anchor: top left
                      // When right anchor: top right
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(3) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(3),
                    }
                  ]}>
                    <Text style={styles.hormoneImageText} allowFontScaling={false}>
                      {getFirstHormoneIcon(a)}
                    </Text>
                  </View>
                  
                  {/* Tomorrow hormone number (relative to image) */}
                  <View style={[
                    styles.hormoneBadge,
                    {
                      // When left anchor: left of image
                      // When right anchor: right of image
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(8) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(8),
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
                    { left: textLeft, top: yCenter - 28, alignItems: isLeft ? 'flex-start' : 'flex-end' },
                  ]}
                >
                  <Text style={styles.itemTitle}>
                    {a.title}
                  </Text>
                  <Text style={styles.itemSub} numberOfLines={1} allowFontScaling={false}>
                    {getActionAmount(a)}{getActionSymptomsConditions(a) ? ' | ' : ''}{getActionSymptomsConditions(a)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Tomorrow blur overlay - positioned after all items to appear on top */}
          {/* COMMENTED OUT FOR BUILD - BlurView not working in APK
          {geom && tomorrowAnchors.length > 0 && (() => {
            const todayLastY = todayAnchors.at(-1)?.y ?? 0;
            const tomorrowTextHeight = responsiveHeight(6);
            const tomorrowStartY = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;
            
            return (
              <BlurView
                intensity={80}
                tint="light"
                style={[
                  styles.tomorrowSectionBlur,
                  {
                    top: tomorrowStartY,
                    height: contentHeight - tomorrowStartY,
                    zIndex: 100, // Ensure it's on top
                  }
                ]}
              />
            );
          })()}
          */}
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
  },
  imageFallback: {
    fontSize: responsiveFontSize(2.5),
    color: '#111',
  },
  hormoneBadge: {
    position: 'absolute',
    backgroundColor: '#A36CFF',
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
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: responsiveWidth(0.5),
    borderColor: '#E0E0E0',
  },
  hormoneImageText: {
    fontSize: responsiveFontSize(1.7),
    color: '#666666',
  },
  hormoneBadgeText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.1),
    fontWeight: '600',
  },
  textBox: {
    position: 'absolute',
    width: responsiveWidth(45),
  },
  itemTitle: {
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'NotoSerif500',
    color: '#000000',
  },
  itemArrow: {
    fontSize: responsiveFontSize(1.98),
    fontWeight: '300',
    color: '#949494',
    marginLeft: 8,
  },
  itemSub: {
    marginTop: 4,
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
    opacity: 0.6,
  },
  
  // Tomorrow section blur overlay
  tomorrowSectionBlur: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  
  // Time-based icon style
  timeIcon: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeIconText: {
    fontSize: responsiveFontSize(2.2),
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});