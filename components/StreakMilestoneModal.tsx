import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  Dimensions, 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreakMilestoneModalProps {
  visible: boolean;
  milestone: number;
  onClose: () => void;
}

/**
 * StreakMilestoneModal - Celebrate streak achievements
 * 
 * Based on Duolingo's research:
 * - Users who reach 10-day streak have much lower drop-off
 * - Celebration creates emotional connection to streak
 * - Makes users feel accomplished (Core Drive 2)
 * 
 * Key Milestones: 7, 14, 30, 50, 100, 200, 365, 500, 1000
 */
const StreakMilestoneModal: React.FC<StreakMilestoneModalProps> = ({
  visible,
  milestone,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Main celebration animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();

      // Sparkle animations
      sparkleAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 5 }
          ),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      sparkleAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const getMilestoneData = () => {
    if (milestone >= 1000) {
      return {
        emoji: '👑',
        title: 'LEGENDARY!',
        subtitle: `${milestone} DAYS`,
        message: "You're in the top 0.01% of all users!",
        color: '#9B59B6',
        bgColor: '#F5EEF8',
      };
    }
    if (milestone >= 365) {
      return {
        emoji: '🏅',
        title: 'ONE YEAR!',
        subtitle: `${milestone} DAYS`,
        message: "A full year of dedication! Incredible!",
        color: '#F1C40F',
        bgColor: '#FEF9E7',
      };
    }
    if (milestone >= 100) {
      return {
        emoji: '💎',
        title: 'TRIPLE DIGITS!',
        subtitle: `${milestone} DAYS`,
        message: "100+ days! You're unstoppable!",
        color: '#3498DB',
        bgColor: '#EBF5FB',
      };
    }
    if (milestone >= 50) {
      return {
        emoji: '🏆',
        title: 'HALFWAY TO 100!',
        subtitle: `${milestone} DAYS`,
        message: "50 days of consistent health habits!",
        color: '#E67E22',
        bgColor: '#FEF5E7',
      };
    }
    if (milestone >= 30) {
      return {
        emoji: '⭐',
        title: '30 DAY LEGEND!',
        subtitle: `${milestone} DAYS`,
        message: "A whole month of dedication!",
        color: '#27AE60',
        bgColor: '#E9F7EF',
      };
    }
    if (milestone >= 14) {
      return {
        emoji: '🌟',
        title: 'TWO WEEKS!',
        subtitle: `${milestone} DAYS`,
        message: "You're building a real habit!",
        color: '#16A085',
        bgColor: '#E8F8F5',
      };
    }
    // 7 days
    return {
      emoji: '🔥',
      title: 'FIRST WEEK!',
      subtitle: `${milestone} DAYS`,
      message: "One week down, many more to go!",
      color: '#E74C3C',
      bgColor: '#FDEDEC',
    };
  };

  const data = getMilestoneData();

  const sparklePositions = [
    { top: '10%', left: '10%' },
    { top: '10%', right: '10%' },
    { top: '30%', left: '5%' },
    { top: '30%', right: '5%' },
    { top: '60%', left: '8%' },
    { top: '60%', right: '8%' },
    { top: '80%', left: '15%' },
    { top: '80%', right: '15%' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Sparkles */}
        {sparkleAnims.map((anim, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.sparkle,
              sparklePositions[index] as any,
              {
                opacity: anim,
                transform: [
                  { scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.2],
                  })},
                ],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}

        <Animated.View
          style={[
            styles.container,
            { backgroundColor: data.bgColor },
            {
              transform: [
                { scale: scaleAnim },
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Main Emoji */}
          <Text style={styles.mainEmoji}>{data.emoji}</Text>

          {/* Title */}
          <Text style={[styles.title, { color: data.color }]}>
            {data.title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{data.subtitle}</Text>

          {/* Message */}
          <Text style={styles.message}>{data.message}</Text>

          {/* Streak Icon */}
          <View style={[styles.streakBadge, { backgroundColor: data.color }]}>
            <Text style={styles.streakBadgeText}>
              🔥 {milestone} Day Streak! 🔥
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: data.color }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Keep Going! 💪</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 24,
    padding: responsiveWidth(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  sparkle: {
    position: 'absolute',
    fontSize: responsiveFontSize(3),
    zIndex: 10,
  },
  mainEmoji: {
    fontSize: responsiveFontSize(8),
    marginBottom: responsiveHeight(2),
  },
  title: {
    fontSize: responsiveFontSize(3.5),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveFontSize(4),
    fontWeight: '800',
    color: '#2C3E50',
    marginTop: responsiveHeight(1),
  },
  message: {
    fontSize: responsiveFontSize(1.8),
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: responsiveHeight(1.5),
    marginHorizontal: responsiveWidth(4),
  },
  streakBadge: {
    borderRadius: 20,
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2.5),
  },
  streakBadgeText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(1.6),
    fontWeight: 'bold',
  },
  closeButton: {
    borderRadius: 16,
    paddingVertical: responsiveHeight(1.8),
    paddingHorizontal: responsiveWidth(10),
    marginTop: responsiveHeight(2.5),
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(2),
    fontWeight: 'bold',
  },
});

export default StreakMilestoneModal;
