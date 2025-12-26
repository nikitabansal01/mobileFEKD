/**
 * CravingsModal - Modal for entering common cravings
 * 
 * Allows user to enter their common cravings so the action plan
 * can suggest healthy alternatives.
 */
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { preferencesService } from '../services/preferencesService';

interface CravingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    currentCravings?: string[];
}

const COMMON_CRAVINGS = [
    { id: 'chocolate', label: 'Chocolate 🍫', icon: '🍫' },
    { id: 'sweets', label: 'Sweets/Candy 🍬', icon: '🍬' },
    { id: 'salty', label: 'Salty snacks 🥨', icon: '🥨' },
    { id: 'ice_cream', label: 'Ice cream 🍦', icon: '🍦' },
    { id: 'pizza', label: 'Pizza 🍕', icon: '🍕' },
    { id: 'chips', label: 'Chips/Crisps 🍟', icon: '🍟' },
    { id: 'bread', label: 'Bread/Carbs 🍞', icon: '🍞' },
    { id: 'coffee', label: 'Coffee ☕', icon: '☕' },
    { id: 'cheese', label: 'Cheese 🧀', icon: '🧀' },
    { id: 'fried', label: 'Fried food 🍗', icon: '🍗' },
];

const CravingsModal: React.FC<CravingsModalProps> = ({
    visible,
    onClose,
    onSaved,
    currentCravings,
}) => {
    const [selectedCravings, setSelectedCravings] = useState<string[]>([]);
    const [customCraving, setCustomCraving] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible && currentCravings) {
            setSelectedCravings(currentCravings);
        } else if (visible) {
            setSelectedCravings([]);
        }
        setCustomCraving('');
    }, [visible, currentCravings]);

    const toggleCraving = (cravingId: string) => {
        if (selectedCravings.includes(cravingId)) {
            setSelectedCravings(selectedCravings.filter(c => c !== cravingId));
        } else {
            setSelectedCravings([...selectedCravings, cravingId]);
        }
    };

    const addCustomCraving = () => {
        if (customCraving.trim() && !selectedCravings.includes(customCraving.trim())) {
            setSelectedCravings([...selectedCravings, customCraving.trim()]);
            setCustomCraving('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            await preferencesService.setPreference('cravings', selectedCravings);
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
                        <Text style={styles.title}>🥮 Your Cravings</Text>
                        <Text style={styles.subtitle}>
                            Tell us what you crave and we'll suggest healthy alternatives
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Common Cravings */}
                    <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Common Cravings</Text>
                        <View style={styles.cravingsGrid}>
                            {COMMON_CRAVINGS.map((craving) => (
                                <TouchableOpacity
                                    key={craving.id}
                                    style={[
                                        styles.cravingChip,
                                        selectedCravings.includes(craving.id) && styles.cravingChipSelected,
                                    ]}
                                    onPress={() => toggleCraving(craving.id)}
                                >
                                    <Text style={styles.cravingText}>{craving.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Input */}
                        <Text style={styles.sectionTitle}>Add Your Own</Text>
                        <View style={styles.customInputRow}>
                            <TextInput
                                style={styles.customInput}
                                value={customCraving}
                                onChangeText={setCustomCraving}
                                placeholder="e.g., pasta"
                                placeholderTextColor="#CCCCCC"
                                onSubmitEditing={addCustomCraving}
                            />
                            <TouchableOpacity style={styles.addButton} onPress={addCustomCraving}>
                                <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Custom Cravings Display */}
                        {selectedCravings.filter(c => !COMMON_CRAVINGS.find(cc => cc.id === c)).length > 0 && (
                            <View style={styles.customCravingsRow}>
                                {selectedCravings
                                    .filter(c => !COMMON_CRAVINGS.find(cc => cc.id === c))
                                    .map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={styles.customChip}
                                            onPress={() => toggleCraving(c)}
                                        >
                                            <Text style={styles.customChipText}>{c} ✕</Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Selected Count */}
                    <Text style={styles.selectedCount}>
                        {selectedCravings.length} craving{selectedCravings.length !== 1 ? 's' : ''} selected
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
                                <Text style={styles.saveText}>Save Cravings</Text>
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
        maxHeight: '85%',
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
    optionsList: {
        paddingHorizontal: moderateScale(16),
        maxHeight: verticalScale(350),
    },
    sectionTitle: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#666666',
        marginTop: verticalScale(16),
        marginBottom: verticalScale(8),
    },
    cravingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(8),
    },
    cravingChip: {
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(10),
        backgroundColor: '#F8F8F8',
        borderRadius: moderateScale(20),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cravingChipSelected: {
        backgroundColor: '#F3F0FF',
        borderColor: '#A29AEA',
    },
    cravingText: {
        fontSize: moderateScale(14),
        color: '#333333',
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(8),
        marginTop: verticalScale(8),
    },
    customInput: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        fontSize: moderateScale(16),
        color: '#333333',
    },
    addButton: {
        backgroundColor: '#A29AEA',
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(24),
        fontWeight: '600',
    },
    customCravingsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(8),
        marginTop: verticalScale(12),
    },
    customChip: {
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
        backgroundColor: '#E8E8E8',
        borderRadius: moderateScale(16),
    },
    customChipText: {
        fontSize: moderateScale(13),
        color: '#666666',
    },
    selectedCount: {
        textAlign: 'center',
        fontSize: moderateScale(14),
        color: '#A29AEA',
        fontWeight: '600',
        marginTop: verticalScale(12),
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

export default CravingsModal;
