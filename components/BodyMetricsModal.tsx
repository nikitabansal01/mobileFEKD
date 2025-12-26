/**
 * BodyMetricsModal - Modal for entering body measurements
 * 
 * Allows user to optionally enter height, weight, and waist measurement.
 * Calculates BMI automatically.
 */
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { preferencesService, BodyMetrics } from '../services/preferencesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BodyMetricsModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    currentMetrics?: BodyMetrics;
}

const BodyMetricsModal: React.FC<BodyMetricsModalProps> = ({
    visible,
    onClose,
    onSaved,
    currentMetrics,
}) => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with current values
    useEffect(() => {
        if (visible && currentMetrics) {
            setHeight(currentMetrics.height_cm?.toString() || '');
            setWeight(currentMetrics.weight_kg?.toString() || '');
            setWaist(currentMetrics.waist_cm?.toString() || '');
        } else if (visible) {
            setHeight('');
            setWeight('');
            setWaist('');
        }
    }, [visible, currentMetrics]);

    // Calculate BMI preview
    const calculateBMI = (): { bmi: number; category: string } | null => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (!h || !w) return null;

        const heightM = h / 100;
        const bmi = w / (heightM * heightM);

        let category = 'normal';
        if (bmi < 18.5) category = 'underweight';
        else if (bmi < 25) category = 'normal';
        else if (bmi < 30) category = 'overweight';
        else category = 'obese';

        return { bmi: Math.round(bmi * 10) / 10, category };
    };

    const bmiResult = calculateBMI();

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const metrics: BodyMetrics = {};

            if (height) metrics.height_cm = parseFloat(height);
            if (weight) metrics.weight_kg = parseFloat(weight);
            if (waist) metrics.waist_cm = parseFloat(waist);

            await preferencesService.setBodyMetrics(metrics);
            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>⚖️ Body Metrics</Text>
                        <Text style={styles.subtitle}>
                            Optional info for personalized recommendations
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputContainer}>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Height</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="numeric"
                                    placeholder="165"
                                    placeholderTextColor="#CCCCCC"
                                />
                                <Text style={styles.inputUnit}>cm</Text>
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Weight</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholder="60"
                                    placeholderTextColor="#CCCCCC"
                                />
                                <Text style={styles.inputUnit}>kg</Text>
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Waist</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={waist}
                                    onChangeText={setWaist}
                                    keyboardType="numeric"
                                    placeholder="70"
                                    placeholderTextColor="#CCCCCC"
                                />
                                <Text style={styles.inputUnit}>cm</Text>
                            </View>
                        </View>
                    </View>

                    {/* BMI Preview */}
                    {bmiResult && (
                        <View style={styles.bmiPreview}>
                            <Text style={styles.bmiLabel}>Your BMI</Text>
                            <Text style={styles.bmiValue}>{bmiResult.bmi}</Text>
                            <Text style={[
                                styles.bmiCategory,
                                bmiResult.category === 'normal' && styles.bmiNormal,
                                bmiResult.category === 'underweight' && styles.bmiUnderweight,
                                (bmiResult.category === 'overweight' || bmiResult.category === 'obese') && styles.bmiOverweight,
                            ]}>
                                {bmiResult.category.charAt(0).toUpperCase() + bmiResult.category.slice(1)}
                            </Text>
                        </View>
                    )}

                    {/* Privacy Note */}
                    <Text style={styles.privacyNote}>
                        🔒 Your data is private and only used to personalize your action plan.
                    </Text>

                    {/* Error */}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <LinearGradient
                            colors={['#A29AEA', '#C17EC9', '#FDC6D1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveGradient}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveText}>Save Metrics</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        paddingBottom: verticalScale(34),
    },
    header: {
        padding: moderateScale(20),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'center',
    },
    title: {
        fontSize: moderateScale(22),
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: verticalScale(4),
    },
    subtitle: {
        fontSize: moderateScale(14),
        color: '#666666',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: moderateScale(16),
        right: moderateScale(16),
        padding: moderateScale(8),
    },
    closeText: {
        fontSize: moderateScale(20),
        color: '#999999',
    },
    inputContainer: {
        padding: moderateScale(20),
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    inputLabel: {
        width: scale(80),
        fontSize: moderateScale(16),
        fontWeight: '500',
        color: '#333333',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
    },
    input: {
        flex: 1,
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: '#333333',
        paddingVertical: verticalScale(14),
    },
    inputUnit: {
        fontSize: moderateScale(14),
        color: '#999999',
        marginLeft: scale(8),
    },
    bmiPreview: {
        alignItems: 'center',
        backgroundColor: '#F3F0FF',
        marginHorizontal: moderateScale(20),
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
    },
    bmiLabel: {
        fontSize: moderateScale(12),
        color: '#666666',
        marginBottom: verticalScale(4),
    },
    bmiValue: {
        fontSize: moderateScale(32),
        fontWeight: '700',
        color: '#A29AEA',
    },
    bmiCategory: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        marginTop: verticalScale(4),
    },
    bmiNormal: {
        color: '#4CAF50',
    },
    bmiUnderweight: {
        color: '#FF9800',
    },
    bmiOverweight: {
        color: '#F44336',
    },
    privacyNote: {
        fontSize: moderateScale(12),
        color: '#999999',
        textAlign: 'center',
        marginTop: verticalScale(12),
        paddingHorizontal: moderateScale(20),
    },
    errorText: {
        color: '#FF4444',
        fontSize: moderateScale(14),
        textAlign: 'center',
        paddingHorizontal: moderateScale(16),
        marginTop: verticalScale(8),
    },
    saveButton: {
        marginHorizontal: moderateScale(16),
        marginTop: verticalScale(16),
    },
    saveGradient: {
        paddingVertical: verticalScale(16),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: moderateScale(16),
        fontWeight: '700',
    },
});

export default BodyMetricsModal;
