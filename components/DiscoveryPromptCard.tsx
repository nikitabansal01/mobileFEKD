/**
 * DiscoveryPromptCard - 2026 Vision
 * 
 * Displays "AUVRA is curious about..." prompts for exploring profile gaps.
 * Each prompt opens a focused chat conversation.
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
import type { DiscoveryPrompt } from '../services/personalizationService';

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE PROMPT ITEM
// ═══════════════════════════════════════════════════════════════════════════════

interface PromptItemProps {
    prompt: DiscoveryPrompt;
    onExplore: (prompt: DiscoveryPrompt) => void;
}

const PromptItem: React.FC<PromptItemProps> = ({ prompt, onExplore }) => {
    const isHighPriority = prompt.priority === 'high';

    return (
        <View style={[
            styles.promptItem,
            isHighPriority && styles.promptItemHighPriority
        ]}>
            <View style={styles.promptContent}>
                <View style={styles.promptIconContainer}>
                    <Text style={styles.promptIcon}>{prompt.icon}</Text>
                </View>
                <View style={styles.promptTextContainer}>
                    <Text style={styles.promptTitle}>{prompt.title}</Text>
                    <Text style={styles.promptQuestion} numberOfLines={2}>
                        "{prompt.question}"
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => onExplore(prompt)}
                activeOpacity={0.7}
            >
                <Text style={styles.exploreButtonText}>Let's Explore</Text>
                <Text style={styles.exploreButtonArrow}>→</Text>
            </TouchableOpacity>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DiscoveryPromptCardProps {
    prompts: DiscoveryPrompt[];
    onExplore: (prompt: DiscoveryPrompt) => void;
}

export const DiscoveryPromptCard: React.FC<DiscoveryPromptCardProps> = ({
    prompts,
    onExplore,
}) => {
    if (prompts.length === 0) {
        return null;
    }

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerEmoji}>🔍</Text>
                <Text style={styles.headerTitle}>AUVRA IS CURIOUS ABOUT...</Text>
            </View>

            {/* Prompts List */}
            <View style={styles.promptsList}>
                {prompts.slice(0, 3).map((prompt) => (
                    <PromptItem
                        key={prompt.id}
                        prompt={prompt}
                        onExplore={onExplore}
                    />
                ))}
            </View>
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
        marginVertical: verticalScale(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    headerEmoji: {
        fontSize: moderateScale(18),
        marginRight: scale(8),
    },
    headerTitle: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(14),
        color: '#6F6F6F',
        letterSpacing: 1,
    },
    promptsList: {
        gap: verticalScale(12),
    },
    promptItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    promptItemHighPriority: {
        backgroundColor: '#FFFCF5',
        borderColor: '#FFE8B8',
    },
    promptContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: verticalScale(12),
    },
    promptIconContainer: {
        width: scale(40),
        height: scale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#F3F0FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale(12),
    },
    promptIcon: {
        fontSize: moderateScale(20),
    },
    promptTextContainer: {
        flex: 1,
    },
    promptTitle: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(15),
        color: '#333',
        marginBottom: verticalScale(4),
    },
    promptQuestion: {
        fontFamily: FONT_FAMILIES.regular,
        fontSize: moderateScale(13),
        color: '#6F6F6F',
        fontStyle: 'italic',
        lineHeight: moderateScale(20),
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F0FF',
        borderRadius: moderateScale(8),
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(16),
    },
    exploreButtonText: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(14),
        color: '#A29AEA',
    },
    exploreButtonArrow: {
        fontFamily: FONT_FAMILIES.semiBold,
        fontSize: moderateScale(16),
        color: '#A29AEA',
        marginLeft: scale(6),
    },
});

export default DiscoveryPromptCard;
