import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
const BLOOD_REPORT_IMAGE = require("../../assets/images/Blood Report.png");
const GOAL_SHEET_ICON = require("../../assets/images/goalSheetIcon.png");

import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { ClipPath, Defs, Ellipse, Path, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import AuvraCharacter from '../../components/AuvraCharacter';
import { FONT_FAMILIES } from '../../constants/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Colors matching the design
const COLORS = {
    white: '#FFFFFF',
    black: '#000000',
    grey: '#6F6F6F',
    lightGrey: '#949494',
    warmPurple: '#C17EC9',
    darkGrey: '#404040',
    neutral700: '#6F6F6F',
};

export default function PaywallScreen() {
    const navigation = useNavigation();
    const [currentPage, setCurrentPage] = useState(0);
    const [showPaymentPlan, setShowPaymentPlan] = useState(false);

    // Disable back gesture when using horizontal scrolling
    useFocusEffect(
        React.useCallback(() => {
            navigation.setOptions({
                gestureEnabled: false,
            });

            return () => {
                navigation.setOptions({
                    gestureEnabled: true,
                });
            };
        }, [navigation])
    );

    const handleClose = () => {
        navigation.goBack();
    };

    const handleInvestInHealth = () => {
        setShowPaymentPlan(true);
    };

    const handleBackToPaywall = () => {
        setShowPaymentPlan(false);
    };

    const features = [
        {
            id: 1,
            title: 'Unlock the ability to upload labs',
            description: 'Labs helps us adapt the action plan with high-confidence clinical accuracy.',
            icon: '🩸',
            testLabels: ['Testosterone', 'TSH', 'HbA1c', 'LH, FSH', 'Insulin', 'DHEA', 'T3'],
        },
        {
            id: 2,
            title: 'Access to Blood test kits \n at a discounted price',
            description: 'No labs? No worries! blood test for 25% off',
            icon: '🩸',
        },
        {
            id: 3,
            title: 'Fast track to significant \n results in just 3 months!',
            description: 'High accuracy action plan = faster results',
            icon: '📊',
        },
    ];

    const renderFeatureCard = (feature: any, index: number) => (
        <View key={feature.id} style={styles.featureCard}>
            <View style={styles.cardContent}>
                {/* Icon/Graphic Section */}
                <View style={styles.iconContainer}>
                    {feature.id === 1 ? (
                        // Lab upload feature with test labels
                        <View style={styles.labIconContainer}>
                            <View style={styles.centralIcon}>
                                <LinearGradient
                                    colors={[
                                        'rgba(162, 154, 234, 0.75)',
                                        'rgba(193, 126, 201, 0.75)',
                                        'rgba(212, 130, 185, 0.75)',
                                        'rgba(233, 139, 172, 0.75)',
                                        'rgba(253, 198, 209, 0.75)'
                                    ]}
                                    // locations={[0.0862, 0.4037, 0.5823, 0.8105, 1.0784]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.centralIconGradient}
                                >
                                    <Image
                                        source={BLOOD_REPORT_IMAGE}
                                        style={styles.bloodReportIcon}
                                        resizeMode="contain"
                                    />
                                </LinearGradient>
                            </View>
                            {feature.testLabels.map((label: string, labelIndex: number) => {
                                // Exact positions from Figma design
                                const figmaPositions = [
                                    { top: scale(29), left: scale(1.75) },      // Testosterone
                                    { top: scale(61), left: scale(157.75) },    // TSH
                                    { top: scale(0), left: scale(139.75) },    // HbA1c
                                    { top: scale(35), left: scale(120.75) },   // LH, FSH
                                    { top: scale(61), left: scale(51.75) },   // Insulin
                                    { top: scale(0), left: scale(44.75) },    // DHEA
                                    { top: scale(60.75), left: scale(7.75) }   // T3
                                ];

                                return (
                                    <View
                                        key={labelIndex}
                                        style={[
                                            styles.testLabel,
                                            figmaPositions[labelIndex] || { top: scale(20), left: scale(30) }
                                        ]}
                                    >
                                        <Text style={styles.testLabelText}>{label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : feature.id === 2 ? (
                        // Blood test kit feature
                        <View style={styles.bloodTestContainer}>
                            <View style={styles.bloodTestIcon}>
                                <LinearGradient
                                    colors={[
                                        'rgba(162, 154, 234, 0.75)',
                                        'rgba(193, 126, 201, 0.75)',
                                        'rgba(212, 130, 185, 0.75)',
                                        'rgba(233, 139, 172, 0.75)',
                                        'rgba(253, 198, 209, 0.75)'
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.bloodTestIconGradient}
                                >
                                    <Image
                                        source={GOAL_SHEET_ICON}
                                        style={styles.bloodReportIcon}
                                        resizeMode="contain"
                                    />
                                </LinearGradient>

                            </View>

                        </View>
                    ) : (
                        // Progress chart feature
                        <View style={styles.progressIcon}>
                            <LinearGradient
                                colors={[
                                    'rgba(162, 154, 234, 0.75)',
                                    'rgba(193, 126, 201, 0.75)',
                                    'rgba(212, 130, 185, 0.75)',
                                    'rgba(233, 139, 172, 0.75)',
                                    'rgba(253, 198, 209, 0.75)'
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.progressIconGradient}
                            >
                                <View style={styles.progressBars}>
                                    {[13, 17, 21, 26, 30].map((height, barIndex) => (
                                        <View
                                            key={barIndex}
                                            style={[styles.progressBar, { height: scale(height) }]}
                                        />
                                    ))}
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                </View>

                {/* Text Content */}
                <View style={styles.textContent}>
                    <Text style={styles.cardTitle}>{feature.title}</Text>
                    <Text style={styles.cardDescription}>{feature.description}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Status Bar */}
            {/* <View style={styles.statusBar}>
        <Text style={styles.timeText}>9:41</Text>
        <View style={styles.statusIcons}>
          <View style={styles.signalIcon} />
          <View style={styles.wifiIcon} />
          <View style={styles.batteryIcon} />
        </View>
      </View> */}

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Curved Background with Gradient */}
                <View style={styles.headerBackgroundContainer}>
                    <Svg width={screenWidth} height={verticalScale(180)} style={styles.headerSvg}>
                        <Defs>
                            <ClipPath id="headerClip">
                                <Path
                                    d={`M0,0 L${screenWidth},0 L${screenWidth},${verticalScale(180)} Q${screenWidth / 2},${verticalScale(150)} 0,${verticalScale(180)} Z`}
                                    fill="white"
                                />
                            </ClipPath>
                        </Defs>
                        <SvgLinearGradient
                            id="headerGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            {/* <Stop offset="8.79%" stopColor="rgb(214, 210, 246)" /> */}
                            <Stop offset="20.58%" stopColor="#e9c9ee" />
                            <Stop offset="45.96%" stopColor="#E5B4D5" />
                            <Stop offset="59.06%" stopColor="#F2B9CD" />
                            <Stop offset="79.13%" stopColor="#FEDDE3" />
                        </SvgLinearGradient>
                        <Path
                            d={`M0,0 L${screenWidth},0 L${screenWidth},${verticalScale(302)} Q${screenWidth / 2},${verticalScale(240)} 0,${verticalScale(302)} Z`}
                            fill="url(#headerGradient)"
                            clipPath="url(#headerClip)"
                        />
                    </Svg>
                </View>

                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={scale(25)} color={COLORS.grey} />
                </TouchableOpacity>
                {/* Header Section */}
                <View style={[styles.headerSection, showPaymentPlan ? styles.headerSectionPayment : styles.headerSectionPaywall]}>
                    {/* Auvra Character */}
                    <View style={[styles.characterContainer, showPaymentPlan ? styles.characterContainerPayment : styles.characterContainerPaywall]}>
                        <View style={styles.characterGlow}>
                            <Svg height={scale(200)} width={scale(200)} style={styles.haloSvg}>
                                <Defs>
                                    <RadialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
                                        <Stop offset="0%" stopColor="#FFF" stopOpacity="1" />
                                        <Stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                                    </RadialGradient>
                                </Defs>
                                <Ellipse
                                    cx="50%"
                                    cy="50%"
                                    rx="50%"
                                    ry="50%"
                                    fill="url(#haloGrad)"
                                    opacity="0.9"
                                />
                            </Svg>
                            <View style={[styles.characterWrapper, { position: 'absolute' }]}>
                                <AuvraCharacter size={scale(120)} />
                            </View>
                            {/* <AuvraCharacter size={scale(120)} /> */}
                        </View>
                    </View>

                    {/* Header Text */}
                    <View style={styles.headerText}>
                        {!showPaymentPlan ? (
                            <>
                                <View style={styles.maskedViewContainer}>
                                    <View style={styles.gradientTextContainer}>
                                        <MaskedView
                                            style={styles.maskedViewInner}
                                            maskElement={
                                                <Text style={[styles.headerTitleMask, { backgroundColor: 'transparent' }]}>
                                                    Clinical Accuracy. Faster results.
                                                </Text>
                                            }
                                        >
                                            <LinearGradient
                                                colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.gradientFill}
                                            />
                                        </MaskedView>
                                    </View>
                                </View>
                                <Text style={styles.headerSubtitle}>Try Auvra Pro today!</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.maskedViewContainer}>
                                    <View style={styles.gradientTextContainer}>
                                        <MaskedView
                                            style={styles.maskedViewInner}
                                            maskElement={
                                                <Text style={[styles.headerTitleMask, { backgroundColor: 'transparent' }]}>
                                                    Invest in your health
                                                </Text>
                                            }
                                        >
                                            <LinearGradient
                                                colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.gradientFill}
                                            />
                                        </MaskedView>
                                    </View>
                                </View>
                                {/* <Text style={styles.headerSubtitle}>Select the plan that works for you</Text> */}
                            </>
                        )}
                    </View>
                </View>

                {/* Content Section */}
                {!showPaymentPlan ? (
                    <>
                        {/* Feature Cards */}
                        <View style={styles.featuresScrollView}>
                            <FlatList
                                data={features}
                                keyExtractor={(item, index) => `feature-${index}`}
                                renderItem={({ item, index }) => (
                                    <View style={styles.featureSlide}>
                                        {renderFeatureCard(item, index)}
                                    </View>
                                )}
                                horizontal
                                pagingEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={screenWidth * 0.8}
                                snapToAlignment="start"
                                decelerationRate="fast"
                                onMomentumScrollEnd={(event) => {
                                    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / (screenWidth * 0.8));
                                    setCurrentPage(pageIndex);
                                }}
                                scrollEventThrottle={16}
                                contentContainerStyle={styles.flatListContent}
                            />
                        </View>

                        {/* Page Indicators */}
                        <View style={styles.pageIndicators}>
                            {features.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.pageDot,
                                        index === currentPage ? styles.activeDot : styles.inactiveDot,
                                    ]}
                                />
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Payment Plan Comparison */}
                        <View style={styles.comparisonContainer}>
                            <View style={styles.comparisonTable}>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonLabel}></Text>
                                    <View style={[styles.proRow, styles.proRowFirst]}>
                                        <LinearGradient
                                            colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                                            locations={[0.1498, 0.6395, 0.915, 1.0, 1.0]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.proLabelContainer}
                                        >
                                            <Text style={styles.proLabel}>PRO</Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.colName}>ChatGPT</Text>
                                    <Text style={styles.colName}>OBGYN</Text>
                                </View>
                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonLabel}>Cost</Text>
                                    <View style={styles.proRow}>
                                        <Text style={styles.proPrice}>$6</Text>
                                        <Text style={styles.proPeriod}>a week</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.chatgptPrice}>$20</Text>
                                        <Text style={styles.chatgptPeriod}>a month</Text>
                                    </View>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.obgynPrice}>$500+</Text>
                                        <Text style={styles.obgynPeriod}>a visit</Text>
                                    </View>
                                </View>

                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonLabel}>Accuracy</Text>
                                    <View style={styles.proRow}>
                                        <Text style={styles.proValue}>High</Text>
                                    </View>
                                    <Text style={styles.chatgptValue}>Medium</Text>
                                    <Text style={styles.obgynValue}>High</Text>
                                </View>

                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonLabel}>Fun</Text>
                                    <View style={styles.proRow}>
                                        <Ionicons name="checkmark" size={scale(16)} color={COLORS.white} />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="close" size={scale(16)} color="#949494" />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="close" size={scale(16)} color="#949494" />
                                    </View>
                                </View>

                                <View style={styles.comparisonRow}>
                                    <Text style={styles.comparisonLabel}>Available 24/7</Text>
                                    <View style={styles.proRow}>
                                        <Ionicons name="checkmark" size={scale(16)} color={COLORS.white} />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="checkmark" size={scale(16)} color="#949494" />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="close" size={scale(16)} color="#949494" />
                                    </View>
                                </View>

                                <View style={styles.comparisonRow}>
                                    <Text style={styles.personalizedLabel}>Personalized</Text>
                                    <View style={[styles.proRow, styles.proRowLast]}>
                                        <Ionicons name="checkmark" size={scale(16)} color={COLORS.white} />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="close" size={scale(16)} color="#949494" />
                                    </View>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="checkmark" size={scale(16)} color="#949494" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Offer Card */}
                        <View style={styles.offerCard}>
                            <Text style={styles.offerSubtext}>Give Auvra a fair chance to see results</Text>
                            <View style={styles.offerMainTextContainer}>
                                <Text style={styles.offerMainText}>Try Auvra Pro for 3 months at</Text>
                                <MaskedView
                                    style={styles.offerHighlightContainer}
                                    maskElement={
                                        <Text style={[styles.offerHighlightText, { backgroundColor: 'transparent' }]}>
                                            just $20/month
                                        </Text>
                                    }
                                >
                                    <LinearGradient
                                        colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.offerHighlightGradient}
                                    />
                                </MaskedView>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <LinearGradient
                    colors={[
                        "#A29AEA",   // lavender
                        "#C17EC9",   // purple-pink
                        "#D482B9",
                        "#E98BAC",
                        "#FDC6D1",
                    ]}
                    locations={[0, 0.3, 0.55, 0.75, 1]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBase}
                />
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,1)",  // strong white at top
                        "rgba(255,255,255,0.9)",// softer white
                        "rgba(255,255,255,0.7)",// subtle haze
                        "rgba(255,255,255,0)"   // fully transparent
                    ]}
                    locations={[0, 0.2, 0.4, 1]}
                    style={styles.gradientFade}
                />

                {/* CTA Button */}
                <TouchableOpacity style={styles.ctaButton} onPress={!showPaymentPlan ? handleInvestInHealth : () => console.log('Process payment')}>
                    <View style={styles.ctaButtonContent}>
                        <Text style={styles.ctaButtonText}>
                            {!showPaymentPlan ? 'I will invest in my health!' : 'Yes! Let’s go'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: verticalScale(120), // Add padding to prevent content from being hidden behind fixed bottom section
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
        paddingBottom: verticalScale(10),
        zIndex: 10,
    },
    timeText: {
        fontSize: moderateScale(15),
        fontWeight: '600',
        color: COLORS.black,
        fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
    },
    signalIcon: {
        width: scale(17),
        height: scale(11),
        backgroundColor: COLORS.black,
        borderRadius: scale(2),
    },
    wifiIcon: {
        width: scale(15),
        height: scale(11),
        backgroundColor: COLORS.black,
        borderRadius: scale(2),
    },
    batteryIcon: {
        width: scale(24),
        height: scale(11),
        backgroundColor: COLORS.black,
        borderRadius: scale(2),
    },
    headerBackgroundContainer: {
        position: 'relative',
        height: verticalScale(180),
        zIndex: 0,
    },
    headerSvg: {
        width: '100%',
        height: verticalScale(180),
    },
    closeButton: {
        position: 'absolute',
        top: verticalScale(50),
        right: scale(15),
        zIndex: 10,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: verticalScale(20),
        paddingHorizontal: scale(40),
        zIndex: 1,
        position: 'relative',
        marginTop: verticalScale(-150), // Move up to overlap with background
    },
    headerSectionPaywall: {
        // paddingBottom: verticalScale(),
    },
    headerSectionPayment: {
        paddingBottom: verticalScale(20),
        paddingTop: verticalScale(20),
        // marginTop: verticalScale(-20),
    },
    characterContainer: {
        alignItems: 'center',
    },
    characterContainerPaywall: {
        marginBottom: verticalScale(10),
    },
    characterContainerPayment: {
        marginBottom: verticalScale(0),
    },
    characterGlow: {
        shadowColor: '#FFFFFF',
        // shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: scale(40),
        elevation: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: scale(200),
        height: scale(200),
    },

    haloSvg: {
        // position: 'absolute',
        zIndex: 0,
    },
    characterWrapper: {
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'red',
    },
    headerText: {
        alignItems: 'center',
    },
    maskedViewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom: verticalScale(1),
    },
    gradientTextContainer: {
        width: scale(300),
        height: verticalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    maskedViewInner: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    gradientFill: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    headerTitleMask: {
        fontSize: moderateScale(16, 1.5),
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'NotoSerif600',
        lineHeight: moderateScale(24, 1.5),
        color: 'black',
    },
    headerSubtitle: {
        fontSize: moderateScale(16, 1.5),
        color: COLORS.black,
        textAlign: 'center',
        fontFamily: 'NotoSerif600',
        lineHeight: moderateScale(24, 1.5),
    },
    featuresScrollView: {
        height: verticalScale(280),
        zIndex: 1,
        position: 'relative',
    },
    flatListContent: {
        paddingLeft: scale(20),
    },
    featureSlide: {
        width: screenWidth * 0.85,
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(20),
        justifyContent: 'center',
    },
    featureCard: {
        backgroundColor: COLORS.white,
        borderRadius: scale(10),
        paddingVertical: scale(30),
        paddingHorizontal: scale(15),
        // marginHorizontal: scale(0.4),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        height: verticalScale(200),
        marginVertical: verticalScale(10),
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    labIconContainer: {
        position: 'relative',
        width: scale(181),
        height: scale(75),
    },
    centralIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -scale(37.5) }, { translateY: -scale(37.5) }],
        width: scale(75),
        height: scale(75),
        borderRadius: scale(37.5),
        borderWidth: scale(0.127),
        borderColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
        overflow: 'hidden',
    },
    centralIconGradient: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: scale(37.5),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    centralIconText: {
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        color: '#BB4471',
        fontFamily: FONT_FAMILIES['Inter-Medium'],
    },
    bloodReportIcon: {
        width: scale(45),
        height: scale(45),
    },
    // goalSheetIcon: {
    //     // position: 'absolute',
    //     // // bottom: scale(20),
    //     // // right: scale(5),
    //     // left: '50%',
    //     // top: '0%',
    //     // transform: [{ translateX: -scale(24.5) }],
    //     width: scale(50),
    //     height: scale(50),
    //     // zIndex: 10,
    // },
    testLabel: {
        position: 'absolute',
        backgroundColor: COLORS.white,
        paddingHorizontal: scale(6),
        paddingVertical: scale(2.25),
        borderRadius: scale(20),
        shadowColor: COLORS.warmPurple,
        shadowOffset: { width: scale(0.5), height: scale(0.5) },
        shadowOpacity: 0.6,
        shadowRadius: scale(5),
        elevation: 1,
    },
    testLabelText: {
        fontSize: moderateScale(9, 1.5),
        lineHeight: moderateScale(12, 1.5),
        color: COLORS.warmPurple,
        fontFamily: FONT_FAMILIES['Inter-Regular'],
    },
    bloodTestContainer: {
        position: 'relative',
        // width: scale(120),
        // height: scale(120),
        alignItems: 'center',
        justifyContent: 'center',
    },
    bloodTestIcon: {
        width: scale(77),
        height: scale(77),
        borderRadius: scale(38.5),
        // borderWidth: scale(0.1),
        // borderColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    bloodTestIconGradient: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: scale(38.5),
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    progressIcon: {
        width: scale(77),
        height: scale(77),
        borderRadius: scale(38.5),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    progressIconGradient: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: scale(38.5),
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: scale(5),
    },
    progressBar: {
        width: scale(4),
        backgroundColor: COLORS.white,
        borderRadius: scale(24),
    },
    textContent: {
        alignItems: 'center',
        gap: verticalScale(6),
        marginTop: verticalScale(20),
    },
    cardTitle: {
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(16, 1.5),
        fontWeight: '600',
        color: COLORS.neutral700,
        textAlign: 'center',
        fontFamily: 'NotoSerif600',
    },
    cardDescription: {
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(16, 1.5),
        color: COLORS.grey,
        textAlign: 'center',
        fontFamily: FONT_FAMILIES['Inter-Regular'],
        // lineHeight: scale(15),
    },
    pageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: scale(8),
        // paddingVertical: verticalScale(5),
        marginTop: verticalScale(-25),
        zIndex: 1,
        position: 'relative',
    },
    pageDot: {
        width: scale(8),
        height: scale(8),
        borderRadius: scale(4),
    },
    activeDot: {
        backgroundColor: COLORS.warmPurple,
    },
    inactiveDot: {
        backgroundColor: COLORS.warmPurple,
        opacity: 0.3,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: verticalScale(20),
        paddingTop: verticalScale(20),
        zIndex: 1,
    },
    gradientBase: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientFade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    ctaButton: {
        marginHorizontal: scale(20),
        borderRadius: scale(100),
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaButtonContent: {
        backgroundColor: COLORS.white,
        paddingVertical: verticalScale(14),
        paddingHorizontal: scale(35),
        borderRadius: scale(53),
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        fontWeight: '500',
        color: COLORS.black,
        fontFamily: FONT_FAMILIES['Inter-Medium'],
    },

    // Payment Plan Comparison Styles
    comparisonContainer: {
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(20),
    },
    comparisonTable: {
        backgroundColor: 'transparent',
        // paddingHorizontal: scale(2),
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(10),
    },
    comparisonLabel: {
        width: scale(100),
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        color: COLORS.neutral700,
        fontFamily: 'Inter-Regular',
    },
    personalizedLabel: {
        width: scale(100),
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        color: COLORS.warmPurple,
        fontFamily: 'Inter-Regular',
    },
    proRow: {
        width: scale(65),
        alignItems: 'center',
        backgroundColor: '#DDC2E9',
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(10),
        marginVertical: -1, // Negative margin to eliminate gaps while keeping padding
        // paddingHorizontal: scale(),
    },
    proRowFirst: {
        borderTopLeftRadius: scale(10),
        borderTopRightRadius: scale(10),
    },
    proRowLast: {
        borderBottomLeftRadius: scale(10),
        borderBottomRightRadius: scale(10),
    },
    proLabelContainer: {
        paddingVertical: scale(5),
        paddingHorizontal: scale(10),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: scale(7),
    },
    proLabel: {
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Inter-Medium',
    },
    colName: {
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(18, 1.5),
        fontWeight: 'bold',
        color: COLORS.neutral700,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
        width: scale(65),
    },
    priceContainer: {
        width: scale(60),
        alignItems: 'center',
    },
    iconContainer: {
        width: scale(60),
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatgptPeriod: {
        fontSize: moderateScale(10, 1.5),
        lineHeight: moderateScale(12, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    obgynPeriod: {
        fontSize: moderateScale(10, 1.5),
        lineHeight: moderateScale(12, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    proPrice: {
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Inter-Bold',
    },
    proPeriod: {
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Inter-Bold',
    },
    proValue: {
        textAlign: 'center',
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Inter-Bold',
    },
    chatgptPrice: {
        width: scale(60),
        textAlign: 'center',
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Regular',
    },
    chatgptValue: {
        width: scale(60),
        textAlign: 'center',
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Regular',
    },
    obgynPrice: {
        width: scale(60),
        textAlign: 'center',
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Regular',
    },
    obgynValue: {
        width: scale(60),
        textAlign: 'center',
        fontSize: moderateScale(12, 1.5),
        lineHeight: moderateScale(14, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Regular',
    },

    // Offer Card Styles
    offerCard: {
        backgroundColor: COLORS.white,
        borderRadius: scale(10),
        padding: scale(16),
        marginHorizontal: scale(20),
        marginVertical: verticalScale(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
        alignItems: 'center',
    },
    offerSubtext: {
        fontSize: moderateScale(14, 1.5),
        lineHeight: moderateScale(16, 1.5),
        color: '#949494',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginBottom: verticalScale(10),
    },
    offerMainTextContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerMainText: {
        fontSize: moderateScale(15, 1.5),
        lineHeight: moderateScale(24, 1.5),
        fontFamily: 'NotoSerif600',
        textAlign: 'center',
        // lineHeight: scale(24),
        color: COLORS.black,
    },
    offerHighlightContainer: {
        height: verticalScale(24),
        width: scale(120),
    },
    offerHighlightText: {
        fontSize: moderateScale(15, 1.5),
        lineHeight: moderateScale(24, 1.5),
        fontFamily: 'NotoSerif600',
        // lineHeight: scale(24),
    },
    offerHighlightGradient: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
