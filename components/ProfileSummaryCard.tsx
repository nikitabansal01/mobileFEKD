/**
 * ProfileSummaryCard - 2026 Vision
 * 
 * Displays "AUVRA knows you as..." with visual trait chips
 * and a profile depth meter.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES } from '../constants/fonts';
import type { TraitChip as TraitChipType } from '../services/personalizationService';

const { width: screenWidth } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TraitChipProps {
    trait: TraitChipType;
    onPress?: () => void;
}

const TraitChip: React.FC<TraitChipProps> = ({ trait, onPress }) => {
    const isInferred = trait.source === 'inferred';

    return (
        <TouchableOpacity
            style={[
                styles.chip,
                isInferred ? styles.chipInferred : styles.chipExplicit
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.chipIcon}>{trait.icon}</Text>
            <Text style={styles.chipLabel} numberOfLines={1}>
                {trait.label}
            </Text>
            {isInferred && trait.confidence === 'low' && (
                <Text style={styles.chipBadge}>?</Text>
            )}
        </TouchableOpacity>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE DEPTH METER
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileDepthMeterProps {
    density: number; // 0-100
}

const ProfileDepthMeter: React.FC<ProfileDepthMeterProps> = ({ density }) => {
    const clampedDensity = Math.min(100, Math.max(0, density));

    return (
        <View style={styles.meterContainer}>
            <Text style={styles.meterLabel}>Profile Depth</Text>
            <View style={styles.meterTrack}>
                <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.meterFill, { width: `${clampedDensity}%` }]}
                />
            </View>
            <Text style={styles.meterValue}>{Math.round(clampedDensity)}%</Text>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileSummaryCardProps {
    traits: TraitChipType[];
    profileDensity: number;
    onStartChat: () => void;
    onTraitPress?: (trait: TraitChipType) => void;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
    traits,
    profileDensity,
    onStartChat,
    onTraitPress,
}) => {
    const hasTraits = traits.length > 0;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerEmoji}>✨</Text>
                <Text style={styles.headerTitle}>YOUR WELLNESS PROFILE</Text>
                <Text style={styles.headerEmoji}>✨</Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
                {hasTraits ? 'AUVRA knows you as:' : "Let's get to know you better!"}
            </Text>

            {/* Trait Chips */}
            {hasTraits ? (
                <View style={styles.chipsContainer}>
                    {traits.slice(0, 6).map((trait) => (
                        <TraitChip
                            key={trait.id}
                            trait={trait}
                            onPress={() => onTraitPress?.(trait)}
                        />
                    ))}
                    {traits.length > 6 && (
                        <View style={[styles.chip, styles.chipMore]}>
                            <Text style={styles.chipLabel}>+{traits.length - 6} more</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Start a conversation and I'll learn what makes you unique 💜
                    </Text>
                </View>
            )}

            {/* Profile Depth Meter */}
            <ProfileDepthMeter density={profileDensity} />

            {/* CTA Button */}
            <TouchableOpacity
                style={styles.ctaButton}
                onPress={onStartChat}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#A29AEA', '#C17EC9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                >
                    <Text style={styles.ctaEmoji}>💜</Text>
                    <Text style={styles.ctaText}>Help me understand you better</Text>
                    <Text style={styles.ctaArrow}>→</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        marginHorizontal: scale(16),
        marginVertical: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(12),
    },
    headerEmoji: {
        fontSize: moderateScale(16),
    },
    headerTitle: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(14),
        color: '#6F6F6F',
        letterSpacing: 1.5,
        marginHorizontal: scale(8),
    },
    subtitle: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: moderateScale(16),
        color: '#333',
        textAlign: 'center',
        marginBottom: verticalScale(16),
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: scale(8),
        marginBottom: verticalScale(20),
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(8),
        borderRadius: moderateScale(20),
        borderWidth: 1,
    },
    chipInferred: {
        backgroundColor: '#F3F0FF',
        borderColor: '#D4CCF9',
    },
    chipExplicit: {
        backgroundColor: '#E0F6FF',
        borderColor: '#B8E6FF',
    },
    chipMore: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    chipIcon: {
        fontSize: moderateScale(14),
        marginRight: scale(6),
    },
    chipLabel: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: moderateScale(13),
        color: '#333',
        maxWidth: scale(100),
    },
    chipBadge: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: moderateScale(10),
        color: '#A29AEA',
        marginLeft: scale(4),
    },
    emptyContainer: {
        paddingVertical: verticalScale(20),
    },
    emptyText: {
        fontFamily: FONT_FAMILIES.regular,
        fontSize: moderateScale(14),
        color: '#6F6F6F',
        textAlign: 'center',
        lineHeight: moderateScale(22),
    },
    meterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    meterLabel: {
        fontFamily: FONT_FAMILIES.medium,
        fontSize: moderateScale(12),
        color: '#6F6F6F',
        marginRight: scale(12),
    },
    meterTrack: {
        flex: 1,
        height: verticalScale(8),
        backgroundColor: '#F0F0F0',
        borderRadius: moderateScale(4),
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: moderateScale(4),
    },
    meterValue: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(12),
        color: '#A29AEA',
        marginLeft: scale(12),
        minWidth: scale(40),
        textAlign: 'right',
    },
    ctaButton: {
        borderRadius: moderateScale(12),
        overflow: 'hidden',
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(14),
        paddingHorizontal: scale(20),
    },
    ctaEmoji: {
        fontSize: moderateScale(16),
        marginRight: scale(8),
    },
    ctaText: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(15),
        color: '#FFFFFF',
    },
    ctaArrow: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(18),
        color: '#FFFFFF',
        marginLeft: scale(8),
    },
});

export default ProfileSummaryCard;
