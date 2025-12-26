/**
 * PreferenceModal - Reusable modal for setting user preferences
 * 
 * Used for all reward-gated preference types:
 * - Diet preferences (single select)
 * - Food allergies (multi select)
 * - Cuisine preferences (multi select)
 * - Dine out frequency (single select)
 * - Cultural background (single select)
 */
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { preferencesService, PreferenceOption, PreferenceType } from '../services/preferencesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PreferenceModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    preferenceType: PreferenceType;
    title: string;
    subtitle?: string;
    options: PreferenceOption[];
    currentValue?: string | string[];
    isMultiSelect?: boolean;
}

const PreferenceModal: React.FC<PreferenceModalProps> = ({
    visible,
    onClose,
    onSaved,
    preferenceType,
    title,
    subtitle,
    options,
    currentValue,
    isMultiSelect = false,
}) => {
    const [selectedValue, setSelectedValue] = useState<string | string[]>(
        isMultiSelect ? [] : ''
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with current value when modal opens
    useEffect(() => {
        if (visible && currentValue) {
            setSelectedValue(currentValue);
        } else if (visible) {
            setSelectedValue(isMultiSelect ? [] : '');
        }
    }, [visible, currentValue, isMultiSelect]);

    const handleOptionPress = (optionId: string) => {
        if (isMultiSelect) {
            const current = selectedValue as string[];
            if (current.includes(optionId)) {
                setSelectedValue(current.filter(id => id !== optionId));
            } else {
                setSelectedValue([...current, optionId]);
            }
        } else {
            setSelectedValue(optionId);
        }
    };

    const isSelected = (optionId: string): boolean => {
        if (isMultiSelect) {
            return (selectedValue as string[]).includes(optionId);
        }
        return selectedValue === optionId;
    };

    const handleSave = async () => {
        if (!selectedValue || (isMultiSelect && (selectedValue as string[]).length === 0)) {
            setError('Please select at least one option');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await preferencesService.setPreference(preferenceType, selectedValue);
            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save preference');
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
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionItem,
                                    isSelected(option.id) && styles.optionItemSelected,
                                ]}
                                onPress={() => handleOptionPress(option.id)}
                            >
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        isSelected(option.id) && styles.optionLabelSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {isSelected(option.id) && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

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
                                <Text style={styles.saveText}>Save Preference</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
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
        maxHeight: '80%',
        paddingBottom: verticalScale(34),
    },
    header: {
        padding: moderateScale(20),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'center',
    },
    title: {
        fontSize: moderateScale(20),
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
    optionsList: {
        maxHeight: verticalScale(400),
        paddingHorizontal: moderateScale(16),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        marginVertical: verticalScale(4),
        backgroundColor: '#F8F8F8',
        borderRadius: moderateScale(12),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionItemSelected: {
        backgroundColor: '#F3F0FF',
        borderColor: '#A29AEA',
    },
    optionIcon: {
        fontSize: moderateScale(24),
        marginRight: scale(12),
    },
    optionLabel: {
        flex: 1,
        fontSize: moderateScale(16),
        color: '#333333',
        fontWeight: '500',
    },
    optionLabelSelected: {
        color: '#A29AEA',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: moderateScale(18),
        color: '#A29AEA',
        fontWeight: '700',
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

export default PreferenceModal;
