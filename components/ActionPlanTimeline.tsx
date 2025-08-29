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

// ====== 타입 import ======
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== 시간대 아이콘 매핑 ======
const TIME_ICONS: Record<string, string> = {
  completed: '', // completed는 아이콘 없음
  morning: '🌤️',
  afternoon: '☀️',
  evening: '🌙',
  anytime: '⏰',
};

// ====== 시간대별 Y 위치 계산 헬퍼 ======
type TimeSlotPosition = {
  timeSlot: string;
  iconY: number;
  isCapCenter: boolean; // Cap 중앙 위치 여부
};

// ====== Animated Path ======
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ====== Tomorrow 더미 데이터 (첫 번째만) ======
const DUMMY_TOMORROW_DATA: Assignment[] = [
  {
    id: 999,
    recommendation_id: 1,
    title: "Pumpkin Seeds",
    purpose: "Acne, PCOS",
    category: "food",
    conditions: ["acne", "pcos"],
    symptoms: ["skin_issues"],
    hormones: ["androgens", "progesterone"], // 호르몬 정보 추가
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

// ====== 본 컴포넌트 ======
type Props = {
  dateLabel?: string;              // 상단 날짜 라벨 (예: "August 25, 2025")
  assignments?: AssignmentsMap;    // 시간대별 액션들
};

export default function ActionPlanTimeline({
  dateLabel = formatToday(new Date()),
  assignments = {},
}: Props) {
  const navigation = useNavigation();
  
  // React Navigation을 사용한 네비게이션
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
  // 1) Today와 Tomorrow 액션을 분리해서 관리
  const todayAssignments: Assignment[] = useMemo(() => {
    const arr: Assignment[] = [];
    Object.values(assignments).forEach((group) => {
      group?.forEach((a) => arr.push(a));
    });
    
    console.log('🔍 Today Assignments 처리:', {
      originalAssignments: assignments,
      processedTodayAssignments: arr,
      assignmentsKeys: Object.keys(assignments),
      totalItems: arr.length
    });
    
    return arr;
  }, [assignments]);

  const tomorrowAssignments: Assignment[] = DUMMY_TOMORROW_DATA;

  // 2) 모든 레이아웃 계산값 (컨테이너 기준)
  const { width: SCREEN_W } = Dimensions.get('window');
  
  // 3) 타임라인 배경/진행 (SVG) - canvasW를 먼저 선언
  const [canvasW, setCanvasW] = useState(SCREEN_W - responsiveWidth(0)); // 초기값 설정

  const geom = useMemo(() => {
    if (!canvasW || canvasW <= 0) return null;

    const CENTER_X      = Math.round(canvasW / 2);
    const CIRCLE_RADIUS = Math.round(responsiveWidth(9.72));     // pw() → responsiveWidth로 통일
    const OFFSET_X      = Math.round(responsiveWidth(26));    // pw() → responsiveWidth로 통일
    const LEFT_X        = CENTER_X - OFFSET_X;                   // 아이템 "중심 X"
    const RIGHT_X       = CENTER_X + OFFSET_X;

    // 세로 값들은 기존처럼 responsiveHeight 쓰되, 마지막에 반올림만
    const BASE_TOP      = Math.round(responsiveHeight(0));      // 컨테이너 제일 위 기준점
    const ITEM_BLOCK_H  = Math.round(responsiveHeight(18));      // 아이템 간 세로 간격
    const CAP_TOP       = Math.round(responsiveHeight(7));
    const CAP_BOTTOM    = Math.round(responsiveHeight(7));
    const BRIDGE_DROP   = Math.round(Math.min(responsiveHeight(2.25), 0.5 * CAP_TOP));

    return { CENTER_X, CIRCLE_RADIUS, LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP };
  }, [canvasW]);

  const [anchors, setAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  const [pathD, setPathD] = useState('');
  const [contentHeight, setContentHeight] = useState(responsiveHeight(200)); // 초기값 증가로 즉시 스크롤 가능하게
  const [pathLen, setPathLen] = useState(0);
  const svgPathRef = useRef<Path>(null);

  // 4) 진행도 애니메이션 (Today만 계산)
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
      useNativeDriver: false, // strokeDashoffset은 네이티브 드라이버 X
    }).start();
  }, [doneRatio, progressValue]);

  // 5) Today와 Tomorrow 앵커 생성 - 분리된 타임라인
  const [todayAnchors, setTodayAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  const [tomorrowAnchors, setTomorrowAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  
  // 6) 시간대별 아이콘 위치 계산
  const [timeSlotPositions, setTimeSlotPositions] = useState<TimeSlotPosition[]>([]);
  
  useEffect(() => {
    if (!geom) return;
    const { LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, CAP_BOTTOM } = geom;

    // Today 앵커 생성
    const todayNext = todayAssignments.map((a, idx) => {
      const x = (idx % 2 === 0) ? LEFT_X : RIGHT_X;
      const y = BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2 + idx * ITEM_BLOCK_H;
      return { id: a.id.toString(), x, y };
    });
    setTodayAnchors(todayNext);

    // Tomorrow 시작 Y좌표 계산: Today 마지막 앵커 + 여백 + Tomorrow 라벨 공간 + 텍스트 영역
    const todayLastY = todayNext.at(-1)?.y ?? (BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2);
    const tomorrowTextHeight = responsiveHeight(6); // Tomorrow 텍스트 영역 높이 (제목 + 날짜 + 여백)
    const tomorrowStartY = todayLastY + ITEM_BLOCK_H / 2 + CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;

    // Tomorrow 앵커 생성: 독립적인 타임라인
    const tomorrowNext = tomorrowAssignments.map((a, idx) => {
      const x = (idx % 2 === 0) ? LEFT_X : RIGHT_X;
      const y = tomorrowStartY + CAP_TOP + ITEM_BLOCK_H / 2 + idx * ITEM_BLOCK_H;
      return { id: a.id.toString(), x, y };
    });
    setTomorrowAnchors(tomorrowNext);

    // 간단한 높이 계산: Tomorrow 마지막 앵커까지
    const lastTomorrowY = tomorrowNext[tomorrowNext.length - 1]?.y ?? tomorrowStartY;
    const circleRadius = Math.round(responsiveWidth(9.72)); 
    const naturalHeight = lastTomorrowY + circleRadius; // 마지막 앵커 아래까지
    
    setContentHeight(naturalHeight);
    
    // 기존 anchors는 Today로 설정 (기존 로직 호환)
    setAnchors(todayNext);

    // 시간대별 아이콘 위치 계산 - 실제 받은 시간대만 처리
    const timeSlots = Object.keys(assignments).filter(slot => assignments[slot]?.length > 0); // 빈 배열 제외
    console.log('🔍 시간대별 아이콘 계산:', { 
      allKeys: Object.keys(assignments), 
      filteredSlots: timeSlots,
      assignmentsData: assignments 
    });
    
    const positions: TimeSlotPosition[] = [];
    
    if (timeSlots.length > 0) {
      let previousY = BASE_TOP; // 이전 섹션의 끝 Y좌표
      
      timeSlots.forEach((timeSlot, index) => {
        const slotAssignments = assignments[timeSlot] || [];
        
        if (index === 0) {
          // 첫 번째 시간대: Cap 중앙에 배치
          const iconY = BASE_TOP + CAP_TOP / 2;
          positions.push({
            timeSlot,
            iconY,
            isCapCenter: true,
          });
          
          // 이 시간대의 마지막 앵커 Y좌표 계산
          if (slotAssignments.length > 0) {
            const slotStartIdx = todayNext.findIndex(anchor => 
              slotAssignments.some(a => a.id.toString() === anchor.id)
            );
            const slotEndIdx = slotStartIdx + slotAssignments.length - 1;
            previousY = todayNext[slotEndIdx]?.y ?? previousY;
          }
        } else {
          // 다음 시간대들: 이전 앵커와 다음 앵커 사이의 수평선 중앙
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
            
            // 이 시간대의 마지막 앵커 Y좌표 업데이트
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

  // 6) Today와 Tomorrow Path 생성
  const [todayPathD, setTodayPathD] = useState('');
  const [tomorrowPathD, setTomorrowPathD] = useState('');
  const [completedPathD, setCompletedPathD] = useState('');
  
  useEffect(() => {
    if (!geom) return;
    const { CIRCLE_RADIUS, CENTER_X, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP, ITEM_BLOCK_H, BASE_TOP } = geom;
    
    // Today Path 생성
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
      setPathD(todayPath); // 기존 로직 호환

      // 완료된 앵커까지의 Path 생성 (앵커에서 정확히 끝남)
      const completedCount = todayAssignments.filter(a => a.is_completed).length;
      if (completedCount > 0) {
        const completedAnchors = todayAnchors.slice(0, completedCount);
        const completedPath = generateCompletedPath(
          completedAnchors,
          todayAnchors, // 전체 앵커도 전달 (첫 번째 세그먼트 계산용)
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

    // Tomorrow Path 생성: 첫 번째 앵커까지만
    if (tomorrowAnchors.length > 0) {
      const todayLastY = todayAnchors.at(-1)?.y ?? (BASE_TOP + CAP_TOP + ITEM_BLOCK_H / 2);
      const tomorrowTextHeight = responsiveHeight(6); // Tomorrow 텍스트 영역 높이
      const tomorrowBaseY = todayLastY + ITEM_BLOCK_H / 2 + CAP_BOTTOM + responsiveHeight(8) + tomorrowTextHeight;
      
      // 첫 번째 앵커까지만 Path 생성
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

  // 7) path 길이 측정
  useEffect(() => {
    if (!pathD) return;
    const t = setTimeout(() => {
      // @ts-ignore - react-native-svg Path has getTotalLength at runtime
      const len = (svgPathRef.current as any)?.getTotalLength?.() ?? 0;
      if (len && Math.abs(len - pathLen) > 1) setPathLen(len);
    }, 0);
    return () => clearTimeout(t);
  }, [pathD]); // eslint-disable-line react-hooks/exhaustive-deps

  // 8) dashoffset 바인딩
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
    // API에서 받아오는 purpose 필드만 사용 (ActionDetail로 전달용)
    return assignment.purpose || '';
  };

  const getActionSymptomsConditions = (assignment: Assignment): string => {
    // symptoms와 conditions를 순서대로 모아서 반환 (타임라인 표시용)
    const symptoms = assignment.symptoms || [];
    const conditions = assignment.conditions || [];
    
    const allItems = [...symptoms, ...conditions];
    return allItems.join(', ');
  };

  // 호르몬별 아이콘 반환 함수
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

  // 첫 번째 호르몬의 아이콘을 반환하는 함수
  const getFirstHormoneIcon = (assignment: Assignment): string => {
    if (assignment.hormones && assignment.hormones.length > 0) {
      return getHormoneIcon(assignment.hormones[0]);
    }
    return '🧬'; // 기본 아이콘
  };

  // anchorMap 생성 (Today 앵커만)
  const anchorMap = useMemo(() => new Map(todayAnchors.map(a => [a.id, a])), [todayAnchors]);

  // 🎨 공통 선 스타일 설정
  const commonLineStyles = {
    stroke: "#EFEFEF",        // 연한 회색 선 색깔
    strokeWidth: 15,
    fill: "none",
    strokeLinejoin: "round" as const,
    strokeDasharray: `${responsiveWidth(11)} ${responsiveWidth(2.75)}`,   // 점선 패턴
  };

  const lineOpacity = {
    today: 1.0,      // Today 완전 불투명
    tomorrow: 1.0,   // Tomorrow도 완전 불투명
  };

  // 9) 렌더
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
          {/* SVG 타임라인 */}
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            width={canvasW}            // "100%" 말고 숫자
            height={contentHeight}
          >
            <Defs>
              <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#C17EC9" />
                <Stop offset="1" stopColor="#A36CFF" />
              </SvgLinearGradient>
              
              {/* 완료된 섹션용 그라디언트 - GradientText와 동일한 색상 */}
              <SvgLinearGradient id="completedSectionGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#A29AEA" />
                <Stop offset="0.32" stopColor="#C17EC9" />
                <Stop offset="0.5" stopColor="#D482B9" />
                <Stop offset="0.73" stopColor="#E98BAC" />
                <Stop offset="1" stopColor="#FDC6D1" />
              </SvgLinearGradient>
            </Defs>

            {/* Today 회색 베이스 라인 (점선) */}
            {!!todayPathD && (
              <Path
                d={todayPathD}
                opacity={lineOpacity.today}
                {...commonLineStyles}
              />
            )}

            {/* 완료된 앵커까지 그라디언트 라인 (직선) */}
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

            {/* Today 진행 라인 (그라디언트) - 기존 애니메이션 유지 */}
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

            {/* Tomorrow 점선 (미래 계획) */}
            {!!tomorrowPathD && (
              <Path
                d={tomorrowPathD}
                opacity={lineOpacity.tomorrow}
                {...commonLineStyles}
              />
            )}
          </Svg>



          {/* Today 아이템들: 좌/우 교차 배치 (원+텍스트) */}
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

            // 상세 디버그: Today 아이템 렌더링 정보
            console.log(`🎯 Today 아이템 렌더링 ${idx}:`, {
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
                {/* 이미지 원(아이콘 대체) */}
                <TouchableOpacity
                  style={[
                    styles.imageCircle,
                    { 
                      left: xImage, 
                      top: yImage,
                      borderColor: a.is_completed ? '#DDC2E9' : '#EFEFEF', // 완료 시 라벤더 색깔
                    },
                  ]}
                  onLongPress={!a.is_completed ? () => {
                    // ActionCompletedScreen으로 이동 (완료되지 않은 경우만)
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
                  delayLongPress={2000} // 2초간 꾹 누르기
                >
                  <Text style={styles.imageFallback} allowFontScaling={false}>
                    📋
                  </Text>
                  {/* 호르몬 이미지 */}
                  <View style={[
                    styles.hormoneImage,
                    {
                      // 왼쪽 앵커일 때: 왼쪽 상단
                      // 오른쪽 앵커일 때: 오른쪽 상단
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(3) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(3),
                    }
                  ]}>
                    <Text style={styles.hormoneImageText} allowFontScaling={false}>
                      {getFirstHormoneIcon(a)}
                    </Text>
                  </View>
                  
                  {/* 호르몬 숫자 (이미지 대비 위치) */}
                  <View style={[
                    styles.hormoneBadge,
                    {
                      // 왼쪽 앵커일 때: 이미지 왼쪽
                      // 오른쪽 앵커일 때: 이미지 오른쪽
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

                {/* 텍스트 */}
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

          {/* 시간대별 아이콘 표시 */}
          {geom && timeSlotPositions.map((position, index) => {
            const { CENTER_X } = geom;
            const iconSize = responsiveWidth(8); // 26px 상당
            const iconLeft = CENTER_X - iconSize / 2;
            const iconTop = position.iconY - iconSize / 2;
            
            console.log(`🎯 아이콘 렌더링 ${index}:`, {
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

          {/* Tomorrow 라벨 - 홈화면과 동일한 스타일 */}
          {geom && tomorrowAnchors.length > 0 && (() => {
            // Today 타임라인 끝 지점 계산
            const todayLastY = todayAnchors.at(-1)?.y ?? 0;
            const todayEndY = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM;
            
            // Tomorrow 타임라인 시작 지점 계산 (라벨 위치용 - 기본 간격만)
            const tomorrowStartYForLabel = todayLastY + geom.ITEM_BLOCK_H / 2 + geom.CAP_BOTTOM + responsiveHeight(8);
            
            // 두 타임라인 사이 공간의 정확한 중앙 (라벨 표시용)
            const gapCenterY = todayEndY + (tomorrowStartYForLabel - todayEndY) / 2;
            
            // 날짜 계산 (내일)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.getDate();
            const tomorrowMonth = tomorrow.toLocaleString('en-US', { month: 'long' });
            
                          return (
                <View style={[styles.tomorrowHeaderContainer, { 
                  top: gapCenterY - responsiveHeight(1.5), // 선과 겹치지 않도록 조정
                }]}>
                  <Text style={styles.tomorrowSectionTitle}>Tomorrow</Text>
                  <Text style={styles.tomorrowDateText}>{tomorrowDate}th {tomorrowMonth}, {tomorrow.getFullYear()}</Text>
                  
                  {/* 자물쇠 아이콘 - 아래 선 위에 렌더링 */}
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

          {/* Tomorrow 첫 번째 아이템만 표시 */}
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
                {/* Tomorrow 이미지 원 */}
                <View
                  style={[
                    styles.imageCircle,
                    { left: xImage, top: yImage },
                  ]}
                >
                  <Text style={styles.imageFallback}>🥜</Text>
                  
                  {/* Tomorrow 호르몬 이미지 */}
                  <View style={[
                    styles.hormoneImage,
                    {
                      // 왼쪽 앵커일 때: 왼쪽 상단
                      // 오른쪽 앵커일 때: 오른쪽 상단
                      top: isLeft ? -responsiveHeight(3) : -responsiveHeight(3),
                      left: isLeft ? -responsiveWidth(3) : undefined,
                      right: isLeft ? undefined : -responsiveWidth(3),
                    }
                  ]}>
                    <Text style={styles.hormoneImageText} allowFontScaling={false}>
                      {getFirstHormoneIcon(a)}
                    </Text>
                  </View>
                  
                  {/* Tomorrow 호르몬 숫자 (이미지 대비 위치) */}
                  <View style={[
                    styles.hormoneBadge,
                    {
                      // 왼쪽 앵커일 때: 이미지 왼쪽
                      // 오른쪽 앵커일 때: 이미지 오른쪽
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

                {/* Tomorrow 텍스트 박스 */}
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
        </View>
      </View>
    </View>
  );
}

// ====== 유틸: 날짜 포맷 ======
function formatToday(d: Date) {
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * []자(직각) 타임라인 Path 생성 (요청한 모양)
 * - 시작: centerX에서 아래로 TOP_CAP만큼 ↓, 거기서 첫 원의 "센터 쪽 가장자리"로 — 이동, 그 다음 ↓ 원 중심 높이로
 * - 각 쌍(a→b):
 *    a 원에서 살짝 ↓(mid) → — 긴 수평으로 b 원 가장자리 → ↓ b 원 중심
 * - 끝: 마지막 원에서 조금 ↓ → — centerX로 이동 → ↓ BOTTOM_CAP만큼
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

  // 둥근 코너를 위한 헬퍼 함수
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

  // 여러 개의 분리된 path 세그먼트를 생성
  const segments: string[] = [];

  // 첫 번째 세그먼트: 시작점에서 첫 번째 앵커 상단까지
  const firstSegmentPoints: [number, number][] = [
    [centerX, BASE_TOP],
    [centerX, BASE_TOP + TOP_CAP],
    [first.x, BASE_TOP + TOP_CAP],
    [first.x, first.y - circleR] // 첫 번째 앵커 상단 가장자리까지
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

  // 중간 세그먼트들: 각 앵커 하단에서 다음 앵커 상단까지
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const yMid = a.y + circleR + (b.y - circleR - (a.y + circleR)) / 2;
    
    const segmentPoints: [number, number][] = [
      [a.x, a.y + circleR], // 현재 앵커 하단 가장자리
      [a.x, yMid],
      [b.x, yMid],
      [b.x, b.y - circleR] // 다음 앵커 상단 가장자리
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

 // 마지막 세그먼트: 마지막 앵커 하단에서 끝점까지 (첫 번째와 대칭)
 const lastBottomY = last.y + circleR;
 const lastMidY = lastBottomY + itemBlockH / 2 - circleR; // 첫 번째와 대칭으로 circleR 빼기
 const lastSegmentPoints: [number, number][] = [
   [last.x, lastBottomY], // 마지막 앵커 하단 가장자리
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

  // 모든 세그먼트를 하나의 path로 결합
  return segments.join(' ');
}

/**
 * Tomorrow 타임라인: 첫 번째 앵커까지만 그리는 함수
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

  // 둥근 코너를 위한 헬퍼 함수
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

  // Path 점들 배열 - 첫 번째 앵커 상단 가장자리까지만
  const pathPoints: [number, number][] = [
    [centerX, BASE_TOP],
    [centerX, BASE_TOP + TOP_CAP],
    [first.x, BASE_TOP + TOP_CAP],
    [first.x, first.y - circleR] // 첫 번째 앵커 상단 가장자리까지
  ];

  // Path 생성
  let d = `M ${s(pathPoints[0][0])},${s(pathPoints[0][1])}`;

  // 둥근 코너로 연결
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const [x1, y1] = pathPoints[i - 1];
    const [x2, y2] = pathPoints[i];
    const [x3, y3] = pathPoints[i + 1];
    
    d += addRoundedCorner(x1, y1, x2, y2, x3, y3);
  }

  // 마지막 점까지 직선
  const [lastX, lastY] = pathPoints[pathPoints.length - 1];
  d += ` L ${s(lastX)},${s(lastY)}`;

  return d;
}

/**
 * 완료된 앵커까지만 그리는 Path 생성 함수 (앵커 중심에서 정확히 끝남)
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

  // 둥근 코너를 위한 헬퍼 함수
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

  // 첫 번째 세그먼트: 시작점에서 첫 번째 앵커 상단까지
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

  // 중간 세그먼트들: 각 앵커 하단에서 다음 앵커 상단까지 (완료된 앵커만)
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

  // 마지막 완료된 앵커에서 끝 (추가 세그먼트 없음)

  return segments.join(' ');
}

// ====== 스타일 ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  imageCircle: {
    width: responsiveWidth(19.44),   // Figma 디자인: 70px (360px 기준 19.44%)
    height: responsiveWidth(19.44),  // 정사각형 유지
    borderRadius: responsiveWidth(9.72), // 반지름 (19.44/2)
    backgroundColor: '#F2F2F7',      // 원래 배경색으로 복구
    borderWidth: responsiveWidth(2.78),  // Figma 디자인: 10px 테두리 (360px 기준 2.78%)
    borderColor: '#EFEFEF',          // 연한 회색 테두리로 변경
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
    fontSize: responsiveFontSize(1.7), //12px (Figma 기준)
    color: '#666666',
  },
  hormoneBadgeText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.1), //9px (Figma 기준)
    fontWeight: '600',
  },
  textBox: {
    position: 'absolute',
    width: responsiveWidth(45), // Figma 기준: 150px 정도
  },
  itemTitle: {
    fontSize: responsiveFontSize(1.98), //14px (Figma 기준)
    fontFamily: 'NotoSerif500', // Noto Serif Medium
    color: '#000000', // Figma 기준 Black
  },
  itemArrow: {
    fontSize: responsiveFontSize(1.98), //14px (title과 동일)
    fontWeight: '300',
    color: '#949494', // Figma 기준 Grey Light
    marginLeft: 8,
  },
  itemSub: {
    marginTop: 4,
    fontSize: responsiveFontSize(1.7), //12px (Figma 기준)
    fontFamily: 'Inter400', // Inter Regular
    color: '#949494', // Figma 기준 Grey Light
  },
  
  // Tomorrow 라벨 스타일 (홈화면과 동일)
  tomorrowHeaderContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    left: 0,
    right: 0,
    paddingHorizontal: responsiveWidth(5),
    backgroundColor: '#FFFFFF', // 배경색 추가로 선 가리기
    paddingVertical: responsiveHeight(1), // 위아래 여백 추가
  },
  tomorrowSectionTitle: {
    fontSize: responsiveFontSize(1.98), //14px (Figma 기준)
    fontFamily: 'NotoSerif500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  tomorrowDateText: {
    fontSize: responsiveFontSize(1.7), //12px (Figma 기준)
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
  
  // Tomorrow 아이템 흐림 효과
  tomorrowItem: {
    opacity: 0.6,
  },
  
  // 시간대별 아이콘 스타일
  timeIcon: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: responsiveWidth(8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // 테두리 제거
  },
  timeIconText: {
    fontSize: responsiveFontSize(2.2), // 아이콘 텍스트 크기 증가 (2.2 → 2.8)
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});