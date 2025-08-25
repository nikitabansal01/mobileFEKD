// ActionPlanTimeline.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// ====== 타입 import ======
import { Assignment } from '../services/homeService';
type AssignmentsMap = Record<string, Assignment[]>;

// ====== Animated Path ======
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ====== 본 컴포넌트 ======
type Props = {
  dateLabel?: string;              // 상단 날짜 라벨 (예: "August 25, 2025")
  assignments?: AssignmentsMap;    // 시간대별 액션들
};

export default function ActionPlanTimeline({
  dateLabel = formatToday(new Date()),
  assignments = {},
}: Props) {
  // 1) 모든 액션을 하나의 배열로 합치기 (순서 유지)
  const allAssignments: Assignment[] = useMemo(() => {
    const arr: Assignment[] = [];
    Object.values(assignments).forEach((group) => {
      group?.forEach((a) => arr.push(a));
    });
    return arr;
  }, [assignments]);

  // 2) 모든 레이아웃 계산값 (컨테이너 기준)
  const { width: SCREEN_W } = Dimensions.get('window');
  
  // 3) 타임라인 배경/진행 (SVG) - canvasW를 먼저 선언
  const [canvasW, setCanvasW] = useState(SCREEN_W - responsiveWidth(10)); // 초기값 설정

  const geom = useMemo(() => {
    if (!canvasW || canvasW <= 0) return null;

    // 퍼센트→px(컨테이너 기준) 헬퍼 (geom 내부로 이동)
    const pw = (p: number) => (canvasW * (p / 100));

    const CENTER_X      = Math.round(canvasW / 2);
    const CIRCLE_RADIUS = Math.round(pw(9.72));       // 기존 responsiveWidth 대체
    const OFFSET_X      = Math.round(pw(33.75));      // center에서 좌우로 뻗는 거리
    const LEFT_X        = CENTER_X - OFFSET_X;        // 아이템 "중심 X"
    const RIGHT_X       = CENTER_X + OFFSET_X;

    // 세로 값들은 기존처럼 responsiveHeight 쓰되, 마지막에 반올림만
    const BASE_TOP      = Math.round(responsiveHeight(12));      // 첫 아이템 시작 위치
    const ITEM_BLOCK_H  = Math.round(responsiveHeight(12));      // 아이템 간 세로 간격 (8 → 12로 증가)
    const CAP_TOP       = Math.round(responsiveHeight(3.5));
    const CAP_BOTTOM    = Math.round(responsiveHeight(3.5));
    const BRIDGE_DROP   = Math.round(Math.min(responsiveHeight(2.25), 0.5 * CAP_TOP));

    return { CENTER_X, CIRCLE_RADIUS, LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP, pw };
  }, [canvasW]);

  const [anchors, setAnchors] = useState<{ id: string; x: number; y: number }[]>([]);
  const [pathD, setPathD] = useState('');
  const [contentHeight, setContentHeight] = useState(responsiveHeight(130));
  const [pathLen, setPathLen] = useState(0);
  const svgPathRef = useRef<Path>(null);

  // 4) 진행도 애니메이션
  const progressValue = useRef(new Animated.Value(0)).current;
  const doneRatio = useMemo(() => {
    const total = allAssignments.length || 1;
    const done = allAssignments.filter((a) => a.is_completed).length;
    return Math.min(1, done / total);
  }, [allAssignments]);

  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: doneRatio,
      duration: 700,
      useNativeDriver: false, // strokeDashoffset은 네이티브 드라이버 X
    }).start();
  }, [doneRatio, progressValue]);

  // 5) anchors 생성 - ㄷ자 세로 라인의 중앙에 배치
  useEffect(() => {
    if (!geom) return;
    const { LEFT_X, RIGHT_X, BASE_TOP, ITEM_BLOCK_H, CAP_TOP, BRIDGE_DROP } = geom;

    const next = allAssignments.map((a, idx) => {
      const x = (idx % 2 === 0) ? LEFT_X : RIGHT_X;
      const baseY = BASE_TOP + idx * ITEM_BLOCK_H;
      
      // ㄷ자 세로 라인의 시작과 끝 Y 좌표 계산
      let verticalStartY, verticalEndY;
      
      if (idx === 0) {
        // 첫 번째: SVG 실제 세로 라인 범위 (87~103)
        const topHoriY = baseY - Math.max(8, Math.min(BRIDGE_DROP, CAP_TOP - 4));
        verticalStartY = topHoriY;  // 87
        verticalEndY = baseY;       // 103
      } else {
        // 두 번째 이후: SVG 실제 세로 라인 범위
        const prevY = BASE_TOP + (idx - 1) * ITEM_BLOCK_H;
        const prevBottomY = prevY + Math.max(12, (baseY - prevY) * 0.45);  // yMid
        verticalStartY = prevBottomY;  // 143
        verticalEndY = baseY;          // 191
      }
      
      // ㄷ자 세로 라인의 중앙 Y 좌표
      const y = (verticalStartY + verticalEndY) / 2;
      
      // 임시 디버그: 경로와 동일한 계산인지 확인
      if (idx < 2) {
        console.log(`Item ${idx} FIXED: range ${Math.round(verticalStartY)} ~ ${Math.round(verticalEndY)}, center: ${Math.round(y)}`);
      }
      
      return { id: a.id.toString(), x, y };
    });
    setAnchors(next);

    const lastY = (next.at(-1)?.y ?? BASE_TOP) + responsiveHeight(15);
    setContentHeight(Math.max(lastY, responsiveHeight(150)));
  }, [allAssignments, geom]);

  // 6) 직각(Z자) 경로 생성 - 이미지 앵커와 동일한 좌표 사용
  useEffect(() => {
    if (anchors.length < 1 || !geom) {
      setPathD('');
      return;
    }
    const { CIRCLE_RADIUS, CENTER_X, CAP_TOP, CAP_BOTTOM, BRIDGE_DROP, ITEM_BLOCK_H } = geom;
    
    // 이미지 앵커와 동일한 좌표 사용 (중앙 기준)
    const pathResult = generatePathRectilinear(
      anchors,  // 이미지와 동일한 앵커 사용
      CIRCLE_RADIUS,
      CENTER_X,
      CAP_TOP,
      CAP_BOTTOM,
      BRIDGE_DROP,
      ITEM_BLOCK_H
    );
    
    // SVG 경로 디버그
    console.log('SVG Path:', pathResult.substring(0, 100) + '...');
    
    setPathD(pathResult);
  }, [anchors, geom]);

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
    const allTags = [...(assignment.symptoms || []), ...(assignment.conditions || [])];
    return allTags.join(', ');
  };

  // anchorMap 생성
  const anchorMap = useMemo(() => new Map(anchors.map(a => [a.id, a])), [anchors]);

  // 9) 렌더
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View 
          style={{ minHeight: contentHeight }}
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
            </Defs>

            {/* 회색 베이스 라인 (Figma 디자인 기준) */}
            {!!pathD && (
              <Path
                d={pathD}
                stroke="#E5E5EA"
                strokeWidth={6}  // 짝수로 변경
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 진행 라인 (그라디언트) */}
            {!!pathD && pathLen > 0 && (
              <AnimatedPath
                ref={svgPathRef}
                d={pathD}
                stroke="url(#grad)"
                strokeWidth={6}  // 짝수로 변경
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${pathLen}, ${pathLen}`}
                // @ts-ignore
                strokeDashoffset={dashOffset}
              />
            )}
          </Svg>



          {/* 아이템들: 좌/우 교차 배치 (원+텍스트) - anchors 기준 */}
          {geom && allAssignments.map((a, idx) => {
            const { CIRCLE_RADIUS, pw } = geom;
            const anchor = anchorMap.get(a.id.toString());
            if (!anchor) return null;

            const isLeft = idx % 2 === 0;
            const xCenter = anchor.x;
            const yCenter = anchor.y;

            const xImage = xCenter - CIRCLE_RADIUS;
            const yImage = yCenter - CIRCLE_RADIUS;
            const textLeft = isLeft ? xCenter + CIRCLE_RADIUS + pw(3) : xCenter - CIRCLE_RADIUS - pw(45) - pw(3);

            // 상세 디버그: 실제 렌더링 좌표
            if (idx < 2) {
              console.log(`RENDER Item ${idx}: anchor(${Math.round(xCenter)}, ${Math.round(yCenter)}), image(${Math.round(xImage)}, ${Math.round(yImage)}), CIRCLE_R: ${CIRCLE_RADIUS}`);
            }



            return (
              <View key={a.id.toString()} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* 이미지 원(아이콘 대체) */}
                <View
                  style={[
                    styles.imageCircle,
                    { left: xImage, top: yImage },
                  ]}
                >
                  <Text style={styles.imageFallback} allowFontScaling={false}>
                    📋
                  </Text>
                  <View style={styles.hormoneBadge}>
                    <Text style={styles.hormoneBadgeText} allowFontScaling={false}>
                      +{a.hormones?.length || 0}
                    </Text>
                  </View>
                </View>

                {/* 텍스트 */}
                <View
                  style={[
                    styles.textBox,
                    { left: textLeft, top: yCenter - 28, alignItems: isLeft ? 'flex-start' : 'flex-end' },
                  ]}
                >
                  <Text style={styles.itemTitle} numberOfLines={1} allowFontScaling={false}>
                    {a.title}
                  </Text>
                  <Text style={styles.itemSub} numberOfLines={1} allowFontScaling={false}>
                    {getActionAmount(a)}{getActionPurpose(a) ? ' | ' : ''}{getActionPurpose(a)}
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
) {
  if (!anchors.length) return '';
  const pts = [...anchors].sort((a, b) => a.y - b.y);

  const s = (n: number) => Math.round(n);
  const first = pts[0];
  const topHoriY = s(first.y - Math.max(8, Math.min(topBridgeDrop, TOP_CAP - 4)));

  let d = `M ${s(centerX)},${s(first.y - TOP_CAP)}`;
  d += ` L ${s(centerX)},${topHoriY}`;
  d += ` L ${s(first.x)},${topHoriY}`;
  d += ` L ${s(first.x)},${s(first.y)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const yMid = s(a.y + Math.max(12, (b.y - a.y) * 0.45));
    d += ` L ${s(a.x)},${yMid}`;
    d += ` L ${s(b.x)},${yMid}`;
    d += ` L ${s(b.x)},${s(b.y)}`;
  }

  const last = pts[pts.length - 1];
  const yBottomBridge = s(last.y + Math.min(BOTTOM_CAP * 0.6, circleR));
  d += ` L ${s(last.x)},${yBottomBridge}`;
  d += ` L ${s(centerX)},${yBottomBridge}`;
  d += ` L ${s(centerX)},${s(last.y + BOTTOM_CAP)}`;

  return d;
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
    backgroundColor: '#F2F2F7',
    borderWidth: responsiveWidth(2.78),  // Figma 디자인: 10px 테두리 (360px 기준 2.78%)
    borderColor: '#f0f0f0',
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
    top: -8,
    right: -8,
    backgroundColor: '#A36CFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneBadgeText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.2),
    fontWeight: '600',
  },
  textBox: {
    position: 'absolute',
    width: responsiveWidth(45), // Figma 기준: 150px 정도
  },
  itemTitle: {
    fontSize: responsiveFontSize(2),
    fontWeight: '700',
    color: '#111111',
  },
  itemSub: {
    marginTop: 4,
    fontSize: responsiveFontSize(1.6),
    color: '#8E8E93',
  },
});