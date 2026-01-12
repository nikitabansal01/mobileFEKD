import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../constants/Colors';
import { FONT_FAMILIES } from '../../../constants/fonts';

const { width: screenWidth } = Dimensions.get('window');

// Animation component needs to handle web/native differences
const Animation = () => {
    if (Platform.OS === "web") {
        const Lottie = require("lottie-react").default;
        return (
            <Lottie
                animationData={require("../../../assets/animation/moving-glow-bg.json")}
                loop
                autoPlay
                style={{ ...styles.streakBackgroundAnimation, objectFit: 'cover' }}
            />
        );
    } else {
        const LottieView = require("lottie-react-native").default;
        return (
            <LottieView
                source={require("../../../assets/animation/moving-glow-bg.json")}
                autoPlay
                loop
                style={{ ...styles.streakBackgroundAnimation, objectFit: 'cover' }}
            />
        );
    }
};

type MilestoneState = 'completed' | 'active' | 'locked';

interface Milestone {
    id: string;
    name: string;
    day: string;
    dayNumber: number;
    state: MilestoneState;
}

interface StreakSectionProps {
    currentStreakDays: number;
    milestones: Milestone[];
}

const StreakSection: React.FC<StreakSectionProps> = ({ currentStreakDays, milestones }) => {
    const isAndroid = Platform.OS === 'android';

    return (
        <View style={styles.streakSection}>
            <Animation />
            <LinearGradient
                colors={['rgba(255, 255, 255, 0)', 'rgba(221, 194, 233, 0.6)']}
                locations={[0, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.streakGradientOverlay}
            />

            <View style={styles.streakContent}>
                <Text style={styles.streakTitle}>🎁 Milestones & Rewards 🎁</Text>

                <View style={styles.streakNumberContainer}>
                    <View style={styles.streakNumberWrapper}>
                        <View style={styles.streakNumberGradient}>
                            <MaskedView
                                maskElement={
                                    <Text style={[
                                        styles.streakNumber,
                                        {
                                            backgroundColor: "transparent",
                                            includeFontPadding: isAndroid ? false : undefined,
                                            textAlignVertical: isAndroid ? 'center' : undefined,
                                        }
                                    ]}>
                                        {currentStreakDays}
                                    </Text>
                                }
                                style={[
                                    {
                                        height: Math.round(styles.streakNumber.lineHeight || 100),
                                        ...(isAndroid && {
                                            renderToHardwareTextureAndroid: true,
                                            needsOffscreenAlphaCompositing: true
                                        } as any)
                                    }
                                ]}
                            >
                                <LinearGradient
                                    colors={[COLORS.gradPurple || '#A29AEA', COLORS.gradPink || '#FDC6D1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        flex: 1,
                                        ...(isAndroid && {
                                            renderToHardwareTextureAndroid: true
                                        } as any)
                                    }}
                                >
                                    <Text style={[
                                        styles.streakNumber,
                                        {
                                            opacity: 0,
                                            includeFontPadding: isAndroid ? false : undefined,
                                            textAlignVertical: isAndroid ? 'center' : undefined,
                                        }
                                    ]}>
                                        {currentStreakDays}
                                    </Text>
                                </LinearGradient>
                            </MaskedView>
                        </View>
                        <Text style={styles.streakLabel}>day streak</Text>
                        <View style={styles.streakTextContainer}>
                            <View style={styles.top20Badge}>
                                <Text style={styles.top20Text}>You are amongst the top 20% now!</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.milestonesContainer}>
                <View style={styles.milestonesProgress}>
                    {/* Background decorative vectors */}
                    <View style={styles.milestoneVector1} />
                    <View style={styles.milestoneVector2} />

                    {/* Progress line - gray background */}
                    <View style={styles.progressLine} />

                    {/* Active progress line - dynamic width based on streak */}
                    {(() => {
                        // Calculate progress percentage across all milestones
                        let progressPercent = 0;

                        if (currentStreakDays >= 270) {
                            progressPercent = 100;
                        } else if (currentStreakDays >= 180) {
                            progressPercent = 75 + ((currentStreakDays - 180) / (270 - 180)) * 25;
                        } else if (currentStreakDays >= 60) {
                            progressPercent = 50 + ((currentStreakDays - 60) / (180 - 60)) * 25;
                        } else if (currentStreakDays >= 30) {
                            progressPercent = 25 + ((currentStreakDays - 30) / (60 - 30)) * 25;
                        } else if (currentStreakDays >= 7) {
                            progressPercent = 0 + ((currentStreakDays - 7) / (30 - 7)) * 25;
                        } else if (currentStreakDays >= 1) {
                            progressPercent = 0;
                        }

                        progressPercent = Math.max(0, Math.min(100, progressPercent));

                        return (
                            <View style={styles.progressLineContainer}>
                                <LinearGradient
                                    colors={['#A29AEA', '#C17EC9', '#D482B9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressLineActive,
                                        { width: `${progressPercent}%` }
                                    ]}
                                />
                            </View>
                        );
                    })()}

                    {milestones.map((milestone) => {
                        const isCompleted = milestone.state === 'completed';
                        const isActive = milestone.state === 'active';
                        const dotColor = isCompleted || isActive ? COLORS.warmPurple : '#D9D9D9';
                        const textColor = isCompleted || isActive ? COLORS.warmPurple : COLORS.greyLight;
                        // Active milestone gets larger dot
                        const dotSize = isActive ? 16 : 12;

                        return (
                            <View key={milestone.id} style={styles.milestoneItem}>
                                <View style={[
                                    styles.milestoneDot,
                                    {
                                        backgroundColor: dotColor || '#C17EC9',
                                        width: scale(dotSize),
                                        height: scale(dotSize),
                                        borderRadius: scale(dotSize / 2),
                                    }
                                ]} />
                                <View style={styles.milestoneTextContainer}>
                                    <Text style={[
                                        styles.milestoneName,
                                        {
                                            color: textColor,
                                            fontFamily: isActive ? 'Inter600' : 'Inter400',
                                        }
                                    ]}>
                                        {milestone.name}
                                    </Text>
                                    <Text style={[
                                        styles.milestoneDay,
                                        { color: textColor }
                                    ]}>
                                        {milestone.day}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    streakSection: {
        backgroundColor: COLORS.white,
        flex: 1,
        overflow: "hidden",
    },
    streakBackgroundAnimation: {
        width: screenWidth,
        height: verticalScale(350),
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
    },
    streakGradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: verticalScale(350),
        zIndex: 0,
    },
    streakContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: verticalScale(40),
        zIndex: 1,
    },
    streakTitle: {
        fontSize: moderateScale(14, 1.5),
        fontFamily: 'NotoSerif500',
        color: COLORS.black,
        marginBottom: verticalScale(16),
    },
    streakNumberContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakNumberWrapper: {
        alignItems: 'center',
    },
    streakNumberGradient: {
        height: verticalScale(80),
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: moderateScale(80, 1.5),
        fontFamily: 'Inter600',
        color: COLORS.black,
        lineHeight: moderateScale(90, 1.5),
        letterSpacing: -2,
        textAlign: 'center',
        includeFontPadding: false,
    },
    streakLabel: {
        fontSize: moderateScale(14, 1.5),
        fontFamily: 'NotoSerif400',
        color: '#6F6F6F',
        marginTop: verticalScale(-5),
        marginBottom: verticalScale(12),
    },
    streakTextContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    top20Badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(4),
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: '#E8DEF8',
    },
    top20Text: {
        fontSize: moderateScale(11, 1.5),
        color: COLORS.greyMedium || '#6F6F6F',
        fontFamily: 'Inter400',
    },
    milestonesContainer: {
        width: '100%',
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(30),
        zIndex: 1,
    },
    milestonesProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        marginTop: verticalScale(10),
        paddingHorizontal: scale(10),
    },
    milestoneVector1: {
        position: 'absolute',
        top: verticalScale(-20),
        left: scale(-10),
        width: scale(100),
        height: verticalScale(60),
        borderTopWidth: 1,
        borderTopColor: 'rgba(193, 126, 201, 0.2)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(193, 126, 201, 0.2)',
        borderRadius: scale(20),
        transform: [{ rotate: '-10deg' }],
    },
    milestoneVector2: {
        position: 'absolute',
        bottom: verticalScale(-10),
        right: scale(-20),
        width: scale(120),
        height: verticalScale(40),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(193, 126, 201, 0.2)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(193, 126, 201, 0.2)',
        borderRadius: scale(30),
        transform: [{ rotate: '5deg' }],
    },
    progressLine: {
        position: 'absolute',
        top: scale(6), // Center of 12px dot
        left: scale(20), // Start from center of first dot area
        right: scale(20), // End at center of last dot area
        height: 2,
        backgroundColor: '#E0E0E0',
        zIndex: 0,
    },
    progressLineContainer: {
        position: 'absolute',
        top: scale(6),
        left: scale(20),
        right: scale(20),
        zIndex: 0,
    },
    progressLineActive: {
        height: 2,
        borderRadius: 1,
    },
    milestoneItem: {
        alignItems: 'center',
        width: scale(50), // Fixed width for alignment
        zIndex: 1,
    },
    milestoneDot: {
        marginBottom: verticalScale(8),
        borderWidth: 2,
        borderColor: COLORS.white,
        backgroundColor: '#D9D9D9',
    },
    milestoneTextContainer: {
        alignItems: 'center',
    },
    milestoneName: {
        fontSize: moderateScale(10, 1.5),
        fontFamily: 'Inter400',
        marginBottom: verticalScale(2),
        textAlign: 'center',
    },
    milestoneDay: {
        fontSize: moderateScale(9, 1.5),
        fontFamily: 'Inter400',
        textAlign: 'center',
        opacity: 0.8,
    },
});

export default StreakSection;
