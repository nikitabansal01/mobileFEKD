/**
 * InsightsScreen - Symptom Patterns Analytics
 * 
 * Requires the symptom_patterns reward (14-day streak) to be claimed.
 * Shows category breakdown, weekly trends, and AI insights.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { insightsService, SymptomPatternsResponse } from '../../services/insightsService';
import { rewardService, RewardsStatusResponse } from '../../services/rewardService';
// StreakAtRiskBanner removed - streak alerts handled via popup in HomeScreen

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
    food: '#4CAF50',
    movement: '#2196F3',
    mindfulness: '#9C27B0',
    unknown: '#9E9E9E',
};

const CATEGORY_ICONS: Record<string, string> = {
    food: '🥗',
    movement: '🏃‍♀️',
    mindfulness: '🧘‍♀️',
    unknown: '❓',
};

export default function InsightsScreen() {
    const navigation = useNavigation();
    const [data, setData] = useState<SymptomPatternsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rewardsData, setRewardsData] = useState<RewardsStatusResponse | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [result, rewards] = await Promise.all([
                insightsService.getSymptomPatterns(),
                rewardService.getRewardsStatus().catch(() => null),
            ]);
            setData(result);
            setRewardsData(rewards);
        } catch (err) {
            if (err instanceof Error && err.message === 'REWARD_REQUIRED') {
                setError('Unlock this feature by claiming the "Symptom Patterns" reward (14-day streak)');
            } else {
                setError('Failed to load insights');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A29AEA" />
                    <Text style={styles.loadingText}>Loading your patterns...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Symptom Patterns</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>🔒</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>✨ Your Patterns</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Insights */}
                {data?.insights && data.insights.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💡 Insights</Text>
                        {data.insights.map((insight, index) => (
                            <View key={index} style={styles.insightCard}>
                                <Text style={styles.insightText}>{insight}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>
                    {data?.category_breakdown.map((cat) => (
                        <View key={cat.category} style={styles.categoryCard}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryIcon}>
                                    {CATEGORY_ICONS[cat.category] || CATEGORY_ICONS.unknown}
                                </Text>
                                <Text style={styles.categoryName}>
                                    {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                </Text>
                                <Text style={styles.completionRate}>{cat.completion_rate}%</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${cat.completion_rate}%`,
                                            backgroundColor: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.unknown,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.categoryStats}>
                                <Text style={styles.statText}>
                                    ✅ {cat.completed}/{cat.total}
                                </Text>
                                <Text style={styles.statText}>❤️ {cat.liked} liked</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Weekly Trends */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📈 Weekly Trends</Text>
                    <View style={styles.trendsContainer}>
                        {data?.weekly_trends.map((week, index) => (
                            <View key={index} style={styles.weekColumn}>
                                <View style={styles.weekBars}>
                                    <View
                                        style={[
                                            styles.weekBar,
                                            { height: Math.max(10, week.total_completed * 15), backgroundColor: '#A29AEA' },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.weekLabel}>
                                    W{index + 1}
                                </Text>
                                <Text style={styles.weekValue}>{week.total_completed}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Categories */}
                {data?.top_liked_categories && data.top_liked_categories.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>❤️ Your Favorites</Text>
                        <View style={styles.favoritesRow}>
                            {data.top_liked_categories.map((cat, index) => (
                                <View key={cat} style={styles.favoriteChip}>
                                    <Text style={styles.favoriteText}>
                                        {CATEGORY_ICONS[cat] || '⭐'} {cat}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: verticalScale(16),
        fontSize: moderateScale(14),
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: moderateScale(32),
    },
    errorIcon: {
        fontSize: moderateScale(48),
        marginBottom: verticalScale(16),
    },
    errorText: {
        fontSize: moderateScale(16),
        color: '#666',
        textAlign: 'center',
        lineHeight: moderateScale(24),
    },
    backButton: {
        marginTop: verticalScale(24),
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(12),
        backgroundColor: '#A29AEA',
        borderRadius: moderateScale(12),
    },
    backButtonText: {
        color: '#FFF',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: moderateScale(16),
    },
    section: {
        marginBottom: verticalScale(24),
    },
    sectionTitle: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: verticalScale(12),
    },
    insightCard: {
        backgroundColor: '#F3F0FF',
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        marginBottom: verticalScale(8),
    },
    insightText: {
        fontSize: moderateScale(14),
        color: '#333',
        lineHeight: moderateScale(20),
    },
    categoryCard: {
        backgroundColor: '#FFF',
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    categoryIcon: {
        fontSize: moderateScale(24),
        marginRight: scale(8),
    },
    categoryName: {
        flex: 1,
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#333',
    },
    completionRate: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        color: '#A29AEA',
    },
    progressBarContainer: {
        height: verticalScale(8),
        backgroundColor: '#E8E8E8',
        borderRadius: moderateScale(4),
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: moderateScale(4),
    },
    categoryStats: {
        flexDirection: 'row',
        marginTop: verticalScale(8),
        gap: scale(16),
    },
    statText: {
        fontSize: moderateScale(12),
        color: '#666',
    },
    trendsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFF',
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
    weekColumn: {
        alignItems: 'center',
    },
    weekBars: {
        height: verticalScale(80),
        justifyContent: 'flex-end',
    },
    weekBar: {
        width: scale(24),
        borderRadius: moderateScale(4),
        minHeight: verticalScale(10),
    },
    weekLabel: {
        fontSize: moderateScale(12),
        color: '#999',
        marginTop: verticalScale(4),
    },
    weekValue: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#333',
    },
    favoritesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(8),
    },
    favoriteChip: {
        backgroundColor: '#FFF0F5',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(8),
        borderRadius: moderateScale(20),
        borderWidth: 1,
        borderColor: '#FFB6C1',
    },
    favoriteText: {
        fontSize: moderateScale(14),
        color: '#333',
    },
});
