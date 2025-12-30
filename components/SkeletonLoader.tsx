/**
 * SkeletonLoader - Animated placeholder for loading states
 * 
 * Creates a shimmering placeholder effect while content loads.
 * Use for action cards, reward cards, or any loading state.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { BACKGROUND } from '../constants/Colors';

interface SkeletonLoaderProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = moderateScale(20),
    borderRadius = moderateScale(8),
    style,
}) => {
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        shimmerAnimation.start();

        return () => shimmerAnimation.stop();
    }, []);

    const backgroundColor = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [BACKGROUND.skeleton, BACKGROUND.skeletonShimmer],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor,
                },
                style,
            ]}
        />
    );
};

// Pre-built skeleton layouts for common use cases
export const ActionCardSkeleton: React.FC = () => (
    <View style={styles.cardContainer}>
        <SkeletonLoader width={moderateScale(50)} height={moderateScale(50)} borderRadius={moderateScale(25)} />
        <View style={styles.cardContent}>
            <SkeletonLoader width="80%" height={moderateScale(16)} />
            <SkeletonLoader width="60%" height={moderateScale(14)} style={{ marginTop: moderateScale(8) }} />
        </View>
    </View>
);

export const RewardCardSkeleton: React.FC = () => (
    <View style={styles.rewardCard}>
        <SkeletonLoader width={moderateScale(40)} height={moderateScale(40)} borderRadius={moderateScale(20)} />
        <SkeletonLoader width="70%" height={moderateScale(18)} style={{ marginTop: moderateScale(12) }} />
        <SkeletonLoader width="90%" height={moderateScale(14)} style={{ marginTop: moderateScale(8) }} />
        <SkeletonLoader width={moderateScale(100)} height={moderateScale(32)} borderRadius={moderateScale(16)} style={{ marginTop: moderateScale(16) }} />
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        backgroundColor: BACKGROUND.white,
        borderRadius: moderateScale(12),
        marginBottom: moderateScale(8),
    },
    cardContent: {
        flex: 1,
        marginLeft: moderateScale(12),
    },
    rewardCard: {
        padding: moderateScale(16),
        backgroundColor: BACKGROUND.white,
        borderRadius: moderateScale(16),
        marginBottom: moderateScale(12),
        alignItems: 'center',
    },
});

export default SkeletonLoader;
