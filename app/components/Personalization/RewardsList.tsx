import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../constants/Colors'; // Adjusted path
import { FONT_FAMILIES } from '../../../constants/fonts'; // Adjusted path

interface RewardItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    backgroundColor: string;
    streak?: string;
    requiredStreakDays: number;
    state: 'in_progress' | 'available' | 'claimed';
    hasButton?: boolean;
    buttonText?: string;
    buttonStyle?: string;
}

interface RewardsListProps {
    seedRewards: RewardItem[];
    growRewards: RewardItem[];
    riseRewards: RewardItem[];
    onRewardAction: (rewardId: string) => void;
    currentStreakDays: number;
}

// Progress Gradient Component
function ProgressGradient({ progress }: { progress: number }) {
    const fullColors = ['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1'];
    const fullLocations = [0, 0.3, 0.6, 0.8, 1];

    const progressDecimal = progress / 100;
    const visibleColors: string[] = [];
    const visibleLocations: number[] = [];

    for (let i = 0; i < fullColors.length; i++) {
        if (fullLocations[i] <= progressDecimal) {
            visibleColors.push(fullColors[i]);
            visibleLocations.push(fullLocations[i] / progressDecimal);
        }
    }

    if (visibleColors.length < 2) {
        visibleColors.push(fullColors[1]);
        visibleLocations.push(1);
    }

    const validLocations = visibleLocations.map(loc => Math.min(Math.max(loc, 0), 1));
    const isAndroid = Platform.OS === 'android';

    return (
        <LinearGradient
            colors={visibleColors as [string, string, ...string[]]}
            locations={validLocations as [number, number, ...number[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
                styles.progressFill,
                {
                    width: `${progress}%`,
                    ...(isAndroid && { renderToHardwareTextureAndroid: true })
                }
            ]}
        />
    );
}

const RewardsList: React.FC<RewardsListProps> = ({
    seedRewards,
    growRewards,
    riseRewards,
    onRewardAction,
    currentStreakDays
}) => {
    const isAndroid = Platform.OS === 'android';

    const renderRewardItem = (item: RewardItem) => {
        const isInProgress = item.state === 'in_progress';
        const isClaimed = item.state === 'claimed';
        const isAvailable = item.state === 'available';

        return (
            <View key={item.id} style={styles.rewardItem}>
                <View style={[
                    styles.rewardIconContainer,
                    { backgroundColor: item.backgroundColor }
                ]}>
                    <Text style={styles.rewardIcon}>{item.icon}</Text>
                </View>
                <View style={styles.rewardContent}>
                    <View style={styles.rewardHeader}>
                        <Text style={styles.rewardTitle}>{item.title}</Text>
                        {isClaimed && (
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.warmPurple} />
                        )}
                    </View>
                    {item.description && item.description.trim() && isInProgress && (
                        <Text style={styles.rewardDescription}>
                            {item.description}
                        </Text>
                    )}
                    {(isAvailable || isClaimed) && item.hasButton && (
                        <LinearGradient
                            colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                            locations={[0, 0.4, 0.6, 0.9, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.personalizeButtonGradient,
                                isAndroid ? { renderToHardwareTextureAndroid: true } as any : undefined
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.personalizeButton}
                                onPress={() => onRewardAction(item.id)}
                                activeOpacity={0.7}
                            >
                                <MaskedView
                                    maskElement={
                                        <Text style={[
                                            styles.personalizeButtonText,
                                            {
                                                backgroundColor: "transparent",
                                                includeFontPadding: isAndroid ? false : undefined,
                                                textAlignVertical: isAndroid ? 'center' : undefined,
                                            }
                                        ]}>
                                            {item.buttonText}
                                        </Text>
                                    }
                                    style={[
                                        {
                                            height: Math.round(styles.personalizeButtonText.lineHeight || 22),
                                            ...(isAndroid && {
                                                renderToHardwareTextureAndroid: true,
                                                needsOffscreenAlphaCompositing: true
                                            } as any)
                                        }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
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
                                            styles.personalizeButtonText,
                                            {
                                                opacity: 0,
                                                includeFontPadding: isAndroid ? false : undefined,
                                                textAlignVertical: isAndroid ? 'center' : undefined,
                                            }
                                        ]}>
                                            {item.buttonText}
                                        </Text>
                                    </LinearGradient>
                                </MaskedView>
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                    {item.streak && !isAvailable && !isClaimed && (
                        <View style={styles.rewardFooter}>
                            <View style={styles.progressBar}>
                                <ProgressGradient progress={
                                    isInProgress
                                        ? Math.min((currentStreakDays / item.requiredStreakDays) * 100, 100)
                                        : 70
                                } />
                            </View>
                            <Text style={[styles.streakText, isInProgress && styles.streakTextInProgress]}>{item.streak}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderDivider = (text: string) => (
        <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{text}</Text>
            <View style={styles.dividerLine} />
        </View>
    );

    return (
        <View style={styles.rewardsContainer}>
            {seedRewards.length > 0 && (
                <>
                    {renderDivider("Seed Rewards")}
                    <View style={styles.rewardsList}>
                        {seedRewards.map(renderRewardItem)}
                    </View>
                </>
            )}

            {growRewards.length > 0 && (
                <>
                    {renderDivider("Grow Rewards")}
                    <View style={styles.rewardsList}>
                        {growRewards.map(renderRewardItem)}
                    </View>
                </>
            )}

            {riseRewards.length > 0 && (
                <>
                    {renderDivider("Rise Rewards")}
                    <View style={styles.rewardsList}>
                        {riseRewards.map(renderRewardItem)}
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    rewardsContainer: {
        paddingHorizontal: scale(20), // Consistent horizontal padding
        paddingBottom: verticalScale(40),
    },
    rewardsList: {
        gap: verticalScale(12),
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.white,
        padding: scale(12),
        borderRadius: scale(16),
        gap: scale(12),
        borderWidth: 1,
        borderColor: '#F0F0F0',
        ...(Platform.OS === 'android' && {
            elevation: 1,
        }),
    },
    rewardIconContainer: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    rewardIcon: {
        fontSize: moderateScale(20),
    },
    rewardContent: {
        flex: 1,
        gap: verticalScale(4),
    },
    rewardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rewardTitle: {
        fontSize: moderateScale(13, 1.5),
        fontFamily: 'Inter600',
        color: COLORS.black,
        flex: 1,
    },
    rewardDescription: {
        fontSize: moderateScale(11, 1.5),
        fontFamily: 'Inter400',
        color: '#6F6F6F',
        lineHeight: moderateScale(16, 1.5),
    },
    rewardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: verticalScale(8),
        gap: scale(12),
    },
    progressBar: {
        flex: 1,
        height: verticalScale(4),
        backgroundColor: '#F0F0F0',
        borderRadius: scale(2),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: scale(2),
    },
    streakText: {
        fontSize: moderateScale(10, 1.5),
        fontFamily: 'Inter500',
        color: '#949494',
        minWidth: scale(70),
        textAlign: 'right',
    },
    streakTextInProgress: {
        color: COLORS.warmPurple,
        fontFamily: 'Inter600',
    },
    personalizeButtonGradient: {
        borderRadius: scale(12),
        padding: 1, // Border width effect
        marginTop: verticalScale(8),
        alignSelf: 'flex-start',
    },
    personalizeButton: {
        backgroundColor: COLORS.white,
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(6),
        borderRadius: scale(11), // 1px less than gradient
        alignItems: 'center',
        justifyContent: 'center',
    },
    personalizeButtonText: {
        fontSize: moderateScale(11, 1.5),
        fontFamily: 'Inter600',
        letterSpacing: 0,
        lineHeight: moderateScale(16, 1.5),
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(12),
        marginVertical: verticalScale(16),
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    dividerText: {
        fontSize: moderateScale(11, 1.5),
        fontFamily: 'Inter500',
        color: '#949494',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default RewardsList;
