import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import { FONT_FAMILIES } from '../../../constants/fonts'; // Adjusted path
import { COLORS } from '../../../constants/Colors'; // Adjusted path

const BLOOD_REPORT_IMAGE = require("../../../assets/images/paywallSlide1Icon.png");

interface LabsSectionProps {
    onBackPress: () => void;
}

const LabsSection: React.FC<LabsSectionProps> = ({ onBackPress }) => {
    const navigation = useNavigation<any>();
    const isAndroid = Platform.OS === 'android';

    return (
        <LinearGradient
            colors={[
                'rgba(162, 154, 234, 0.5)',
                'rgba(193, 126, 201, 0.5)',
                'rgba(212, 130, 185, 0.5)',
                'rgba(233, 139, 172, 0.5)',
                'rgba(253, 198, 209, 0.5)'
            ]}
            locations={[0.1479, 0.3858, 0.5196, 0.6906, 0.8913]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.labsSection,
                isAndroid ? { renderToHardwareTextureAndroid: true } as any : undefined
            ]}
        >
            <View style={styles.labsHeader}>
                <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.labsTitleAligned}>Personalize</Text>
            </View>

            <View style={styles.labsContent}>
                <View style={styles.labsCard}>
                    <View style={styles.labsIconContainer}>
                        <View style={styles.labsIcon}>
                            <Image
                                source={BLOOD_REPORT_IMAGE}
                                style={styles.bloodReportIcon}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={[styles.labsTag, { top: scale(0), left: scale(0) }]}>
                            <Text style={styles.labsTagText}>DHEA</Text>
                        </View>
                        <View style={[styles.labsTag, { top: scale(64), left: scale(10) }]}>
                            <Text style={styles.labsTagText}>TSH</Text>
                        </View>
                        <View style={[styles.labsTag, { top: scale(18), left: scale(70) }]}>
                            <Text style={styles.labsTagText}>T3</Text>
                        </View>
                    </View>
                    <View style={styles.labsTextContainer}>
                        <Text style={styles.labsTitleText}>
                            Get your action plan personalized to your labs
                        </Text>
                        <Text style={styles.labsDescriptionText}>
                            Blood work help us adapt the action plan with clinical accuracy.
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.uploadButtonContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={() => navigation.navigate('PaywallScreen')}>
                    <View style={styles.uploadButtonContent}>
                        <Text style={styles.uploadButtonText}>Upload Blood Report </Text>
                        <Ionicons name="cloud-upload-outline" size={18} color={COLORS.black} />
                    </View>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    labsSection: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        paddingTop: Platform.OS === 'android' ? verticalScale(25) : verticalScale(30),
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(20),
        position: 'relative',
        overflow: 'hidden',
        minHeight: Platform.OS === 'android' ? 200 : undefined,
    },
    labsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,
        paddingTop: verticalScale(20)
    },
    labsTitleAligned: {
        fontSize: moderateScale(14, 1.5),
        fontFamily: 'NotoSerif400',
        color: COLORS.black,
        lineHeight: moderateScale(21, 1.5),
        position: 'absolute',
        left: scale(126),
        top: verticalScale(28),
    },
    backButton: {
        width: scale(36),
        height: scale(36),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        minWidth: scale(44),
        minHeight: scale(44),
    },
    labsContent: {
        paddingTop: verticalScale(8),
        zIndex: 1,
    },
    labsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(16),
    },
    labsIconContainer: {
        width: scale(110),
        height: verticalScale(77),
        position: 'relative',
    },
    labsIcon: {
        width: scale(80),
        height: scale(80),
        backgroundColor: COLORS.white,
        borderRadius: scale(97),
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'android' && {
            elevation: 2,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffset: { width: 0, height: verticalScale(1) },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        }),
    },
    bloodReportIcon: {
        width: scale(80),
        height: scale(80),
    },
    labsTag: {
        position: 'absolute',
        backgroundColor: COLORS.white,
        paddingHorizontal: scale(8),
        paddingVertical: moderateScale(3),
        borderRadius: scale(40),
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowOffset: { width: 0, height: verticalScale(3) },
        shadowOpacity: 0.45,
        shadowRadius: 3,
        ...(Platform.OS === 'android' && {
            elevation: 3,
        }),
    },
    labsTagText: {
        fontSize: moderateScale(10, 1.5),
        color: COLORS.warmPurple || '#C17EC9',
        fontFamily: FONT_FAMILIES['Inter-Regular'],
    },
    labsTextContainer: {
        flex: 1,
        gap: scale(8),
    },
    labsTitleText: {
        fontSize: moderateScale(14, 1.5),
        fontFamily: 'NotoSerif400',
        color: COLORS.black,
        lineHeight: moderateScale(21, 1.5),
    },
    labsDescriptionText: {
        fontSize: moderateScale(12, 1.5),
        color: COLORS.greyMedium || '#6F6F6F',
        fontFamily: FONT_FAMILIES['Inter-Regular'],
        lineHeight: moderateScale(15, 1.5),
    },
    uploadButtonContainer: {
        paddingHorizontal: scale(0),
        zIndex: 1,
        marginTop: verticalScale(20),
    },
    uploadButton: {
        backgroundColor: COLORS.white,
        borderRadius: scale(100),
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: Platform.OS === 'android' ? 5 : 0,
        borderWidth: 0,
    },
    uploadButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(15),
        paddingHorizontal: scale(35),
        gap: moderateScale(3),
    },
    uploadButtonText: {
        fontSize: moderateScale(14, 1.5),
        fontFamily: FONT_FAMILIES['Inter-Medium'],
        color: COLORS.black,
    },
});

export default LabsSection;
