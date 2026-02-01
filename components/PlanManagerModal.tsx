import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import homeService, { ActionPlanItem, ActionPlanResponse } from '@/services/homeService';
import { rewardService, RewardsStatusResponse } from '@/services/rewardService';
import { BRAND, COLORS } from '@/constants/Colors';

export type ReplaceCategory =
  | 'dont_like'
  | 'no_time'
  | 'not_feeling_it'
  | 'allergic'
  | 'no_ingredients'
  | 'already_done'
  | 'too_hard'
  | 'want_different'
  | 'other';

type Props = {
  visible: boolean;
  onClose: () => void;
  actionPlan: ActionPlanResponse | null;
  rewardsStatus: RewardsStatusResponse | null;
  onRequestRefreshPlan: () => Promise<void>;
  onActionPlanChange: (next: ActionPlanResponse) => void;
  onRewardsStatusChange: (next: RewardsStatusResponse) => void;
};

// Enhanced replace reasons with icons, colors, and better UX
const REPLACE_REASONS: Array<{ 
  label: string; 
  category: ReplaceCategory; 
  icon: string; 
  description: string;
  color: string;
  bgColor: string;
}> = [
  { label: "Don't like it", category: 'dont_like', icon: '👎', description: "Not my taste", color: '#EF4444', bgColor: '#FEF2F2' },
  { label: "No time", category: 'no_time', icon: '⏰', description: "Too busy", color: '#F59E0B', bgColor: '#FFFBEB' },
  { label: "Not feeling it", category: 'not_feeling_it', icon: '😔', description: "Low energy", color: '#6366F1', bgColor: '#EEF2FF' },
  { label: "Allergy/sensitivity", category: 'allergic', icon: '⚠️', description: "Can't have this", color: '#DC2626', bgColor: '#FEF2F2' },
  { label: "Missing ingredients", category: 'no_ingredients', icon: '🛒', description: "Need to shop", color: '#10B981', bgColor: '#ECFDF5' },
  { label: "Already did similar", category: 'already_done', icon: '✓', description: "Did recently", color: '#8B5CF6', bgColor: '#F5F3FF' },
  { label: "Too difficult", category: 'too_hard', icon: '😅', description: "Too complex", color: '#EC4899', bgColor: '#FDF2F8' },
  { label: "I want...", category: 'want_different', icon: '✨', description: "Something specific", color: '#0EA5E9', bgColor: '#F0F9FF' },
];

// Quick suggestion chips based on category
const QUICK_SUGGESTIONS: Record<string, string[]> = {
  food: ['🥗 Lighter option', '🍳 Quick & easy', '🥤 Smoothie', '🍲 Comfort food', '🥙 High protein'],
  movement: ['🚶 Walking', '💃 Dance', '🧘 Yoga', '🏃 Cardio', '💪 Strength'],
  mental: ['🧘 Breathing', '📝 Journaling', '🎵 Music', '☀️ Outdoors', '😴 Rest'],
};

// Skip reasons with premium styling
export type SkipReason = 'no_time' | 'not_feeling_it' | 'not_relevant' | 'already_done' | 'other';

const SKIP_REASONS: Array<{
  label: string;
  reason: SkipReason;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}> = [
  { label: 'No time today', reason: 'no_time', icon: '⏰', description: "I'm too busy", color: '#F59E0B', bgColor: '#FFFBEB' },
  { label: 'Not feeling it', reason: 'not_feeling_it', icon: '😔', description: 'Low energy right now', color: '#6366F1', bgColor: '#EEF2FF' },
  { label: 'Not relevant', reason: 'not_relevant', icon: '🤔', description: "Doesn't fit my needs", color: '#8B5CF6', bgColor: '#F5F3FF' },
  { label: 'Already did today', reason: 'already_done', icon: '✅', description: 'Did something similar', color: '#10B981', bgColor: '#ECFDF5' },
  { label: 'Other reason', reason: 'other', icon: '💬', description: 'Let me explain', color: '#0EA5E9', bgColor: '#F0F9FF' },
];

// Animated card component
function AnimatedReasonCard({ 
  reason, 
  isSelected, 
  onPress, 
  disabled,
  index 
}: { 
  reason: typeof REPLACE_REASONS[0];
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ 
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
      width: '48%',
    }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          replaceStyles.reasonCard,
          isSelected && { 
            borderColor: reason.color,
            backgroundColor: reason.bgColor,
            shadowColor: reason.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        <View style={[
          replaceStyles.iconBubble,
          isSelected && { backgroundColor: reason.color + '20' }
        ]}>
          <Text style={replaceStyles.reasonIcon}>{reason.icon}</Text>
        </View>
        <View style={replaceStyles.reasonTextWrap}>
          <Text style={[
            replaceStyles.reasonLabel,
            isSelected && { color: reason.color, fontWeight: '700' },
          ]}>
            {reason.label}
          </Text>
          <Text style={[
            replaceStyles.reasonDesc,
            isSelected && { color: reason.color + 'CC' },
          ]}>
            {reason.description}
          </Text>
        </View>
        {isSelected && (
          <View style={[replaceStyles.checkmark, { backgroundColor: reason.color }]}>
            <Text style={replaceStyles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Replace reason modal component
function ReplaceReasonModal({
  visible,
  item,
  onClose,
  onSubmit,
  busy,
}: {
  visible: boolean;
  item: ActionPlanItem | null;
  onClose: () => void;
  onSubmit: (category: ReplaceCategory, customReason: string, preferenceHint: string) => void;
  busy: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ReplaceCategory | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [preferenceHint, setPreferenceHint] = useState('');
  const [step, setStep] = useState<'reason' | 'preference'>('reason');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const resetState = () => {
    setSelectedCategory(null);
    setCustomReason('');
    setPreferenceHint('');
    setStep('reason');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetState();
      onClose();
    });
  };

  const handleCategorySelect = (category: ReplaceCategory) => {
    setSelectedCategory(category);
    if (category === 'want_different') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => setStep('preference'), 150);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferenceHint(prev => prev ? `${prev}, ${suggestion}` : suggestion);
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(selectedCategory, customReason, preferenceHint);
    resetState();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'preference') {
      setStep('reason');
      setSelectedCategory(null);
    }
  };

  const quickSuggestions = item ? QUICK_SUGGESTIONS[item.category] || QUICK_SUGGESTIONS.mental : [];

  if (!visible || !item) return null;

  const selectedReason = REPLACE_REASONS.find(r => r.category === selectedCategory);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View style={[replaceStyles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={replaceStyles.keyboardView}
        >
          <Pressable style={replaceStyles.dismissArea} onPress={handleClose} />
          
          <Animated.View 
            style={[
              replaceStyles.container,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Gradient Header */}
            <LinearGradient
              colors={selectedReason ? [selectedReason.color, selectedReason.color + 'CC'] : [BRAND.gradPurple, '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={replaceStyles.header}
            >
              {step === 'preference' && (
                <TouchableOpacity onPress={handleBack} style={replaceStyles.backBtn}>
                  <Text style={replaceStyles.backText}>← Back</Text>
                </TouchableOpacity>
              )}
              <View style={replaceStyles.headerContent}>
                <Text style={replaceStyles.title}>
                  {step === 'reason' ? '🔄 Why replace this?' : '✨ What would you prefer?'}
                </Text>
                <Text style={replaceStyles.subtitle}>
                  {step === 'reason' 
                    ? 'Help us find something perfect for you'
                    : 'Be specific - AI learns your preferences!'
                  }
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={replaceStyles.closeBtn}>
                <View style={replaceStyles.closeBtnCircle}>
                  <Text style={replaceStyles.closeText}>✕</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Item being replaced */}
            <View style={replaceStyles.itemPreview}>
              <View style={replaceStyles.itemIconWrap}>
                <Text style={replaceStyles.itemIcon}>
                  {item.category === 'food' ? '🍽️' : item.category === 'movement' ? '🏃' : '🧠'}
                </Text>
              </View>
              <View style={replaceStyles.itemTextWrap}>
                <Text style={replaceStyles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={replaceStyles.itemMeta}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)} • {item.target_hormone}
                </Text>
              </View>
            </View>

            <ScrollView 
              style={replaceStyles.scrollArea}
              contentContainerStyle={replaceStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {step === 'reason' ? (
                <>
                  {/* Reason Options Grid */}
                  <View style={replaceStyles.reasonGrid}>
                    {REPLACE_REASONS.map((reason, index) => (
                      <AnimatedReasonCard
                        key={reason.category}
                        reason={reason}
                        isSelected={selectedCategory === reason.category}
                        onPress={() => handleCategorySelect(reason.category)}
                        disabled={busy}
                        index={index}
                      />
                    ))}
                  </View>

                  {/* Custom reason text input */}
                  <View style={replaceStyles.customSection}>
                    <Text style={replaceStyles.customLabel}>
                      💬 Tell us more <Text style={replaceStyles.optional}>(optional)</Text>
                    </Text>
                    <TextInput
                      style={replaceStyles.customInput}
                      placeholder="E.g., I'd prefer something with chicken instead..."
                      placeholderTextColor="#9CA3AF"
                      value={customReason}
                      onChangeText={setCustomReason}
                      multiline
                      maxLength={200}
                      editable={!busy}
                    />
                    <Text style={replaceStyles.charCount}>
                      {customReason.length}/200
                    </Text>
                  </View>
                </>
              ) : (
                /* Preference step for "want something specific" */
                <View style={replaceStyles.preferenceSection}>
                  {/* Quick Suggestions */}
                  <Text style={replaceStyles.quickLabel}>⚡ Quick picks</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={replaceStyles.quickScroll}
                    contentContainerStyle={replaceStyles.quickScrollContent}
                  >
                    {quickSuggestions.map((suggestion, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          replaceStyles.quickChip,
                          preferenceHint.includes(suggestion) && replaceStyles.quickChipSelected
                        ]}
                        onPress={() => handleQuickSuggestion(suggestion)}
                      >
                        <Text style={[
                          replaceStyles.quickChipText,
                          preferenceHint.includes(suggestion) && replaceStyles.quickChipTextSelected
                        ]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={replaceStyles.preferenceLabel}>
                    🎯 Or describe what you want
                  </Text>
                  <TextInput
                    style={replaceStyles.preferenceInput}
                    placeholder={
                      item.category === 'food' 
                        ? "Something with avocado, or a quick smoothie..." 
                        : item.category === 'movement'
                        ? "Dance workout, or something gentle like yoga..."
                        : "Quick breathing exercise, or calming music..."
                    }
                    placeholderTextColor="#9CA3AF"
                    value={preferenceHint}
                    onChangeText={setPreferenceHint}
                    multiline
                    maxLength={150}
                    autoFocus
                    editable={!busy}
                  />
                  <Text style={replaceStyles.charCount}>
                    {preferenceHint.length}/150
                  </Text>

                  <View style={replaceStyles.aiNote}>
                    <Text style={replaceStyles.aiNoteIcon}>🤖</Text>
                    <Text style={replaceStyles.aiNoteText}>
                      The more specific you are, the better I can personalize your plan!
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <View style={replaceStyles.footer}>
              <TouchableOpacity
                style={[
                  replaceStyles.submitBtn,
                  (!selectedCategory || busy) && replaceStyles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedCategory || busy}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(!selectedCategory || busy) 
                    ? ['#D1D5DB', '#9CA3AF'] 
                    : [BRAND.gradPurple, '#8B5CF6']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={replaceStyles.submitBtnGradient}
                >
                  {busy ? (
                    <View style={replaceStyles.loadingRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={replaceStyles.submitBtnText}>Finding something perfect...</Text>
                    </View>
                  ) : (
                    <Text style={replaceStyles.submitBtnText}>
                      Replace with something better ✨
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={replaceStyles.footerNote}>
                Uses 1 of your daily refresh tokens
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// SKIP REASON MODAL - Premium animated modal for skipping actions
// ============================================================================
function SkipReasonModal({
  visible,
  item,
  onClose,
  onSubmit,
  busy,
}: {
  visible: boolean;
  item: ActionPlanItem | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  busy: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState<SkipReason | null>(null);
  const [customReason, setCustomReason] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
      setSelectedReason(null);
      setCustomReason('');
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSelectReason = (reason: SkipReason) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReason(reason);
  };

  const handleSubmit = () => {
    if (!selectedReason) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const reasonText = selectedReason === 'other' && customReason.trim()
      ? customReason.trim()
      : SKIP_REASONS.find(r => r.reason === selectedReason)?.label || selectedReason;
    
    onSubmit(reasonText);
  };

  const selectedReasonData = SKIP_REASONS.find(r => r.reason === selectedReason);
  const headerColors: [string, string] = selectedReasonData 
    ? [selectedReasonData.color, selectedReasonData.color + 'CC']
    : ['#6B7280', '#4B5563'];

  if (!visible || !item) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[replaceStyles.overlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={replaceStyles.keyboardView}
        >
          <TouchableOpacity 
            style={replaceStyles.dismissArea} 
            onPress={handleClose} 
            activeOpacity={1} 
          />
          <Animated.View
            style={[
              replaceStyles.container,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={headerColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={replaceStyles.header}
            >
              <View style={replaceStyles.headerContent}>
                <Text style={replaceStyles.title}>Skip "{item?.title}"?</Text>
                <Text style={replaceStyles.subtitle}>
                  Help us improve future plans 📝
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={replaceStyles.closeBtn}>
                <BlurView intensity={20} style={replaceStyles.closeBtnCircle}>
                  <Text style={replaceStyles.closeText}>✕</Text>
                </BlurView>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
              style={replaceStyles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={replaceStyles.scrollContent}
            >
              <Text style={replaceStyles.quickLabel}>
                Why are you skipping? 🤔
              </Text>

              <View style={replaceStyles.reasonGrid}>
                {SKIP_REASONS.map((reason, index) => {
                  const isSelected = selectedReason === reason.reason;
                  return (
                    <Pressable
                      key={reason.reason}
                      onPress={() => handleSelectReason(reason.reason)}
                      disabled={busy}
                      style={[
                        replaceStyles.reasonCard,
                        { width: '48%' },
                        isSelected && { 
                          borderColor: reason.color,
                          backgroundColor: reason.bgColor,
                          shadowColor: reason.color,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 6,
                        },
                      ]}
                    >
                      <View style={[
                        replaceStyles.iconBubble,
                        isSelected && { backgroundColor: reason.color + '20' }
                      ]}>
                        <Text style={replaceStyles.reasonIcon}>{reason.icon}</Text>
                      </View>
                      <View style={replaceStyles.reasonTextWrap}>
                        <Text style={[
                          replaceStyles.reasonLabel,
                          isSelected && { color: reason.color, fontWeight: '700' },
                        ]}>
                          {reason.label}
                        </Text>
                        <Text style={[
                          replaceStyles.reasonDesc,
                          isSelected && { color: reason.color + 'CC' },
                        ]}>
                          {reason.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[replaceStyles.checkmark, { backgroundColor: reason.color }]}>
                          <Text style={replaceStyles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom reason input for "Other" */}
              {selectedReason === 'other' && (
                <View style={replaceStyles.customSection}>
                  <Text style={replaceStyles.customLabel}>
                    💬 Tell us more
                  </Text>
                  <TextInput
                    style={replaceStyles.customInput}
                    placeholder="Why are you skipping this?"
                    placeholderTextColor="#9CA3AF"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    maxLength={200}
                    autoFocus
                    editable={!busy}
                  />
                  <Text style={replaceStyles.charCount}>
                    {customReason.length}/200
                  </Text>
                </View>
              )}

              {/* Helpful note */}
              <View style={replaceStyles.aiNote}>
                <Text style={replaceStyles.aiNoteIcon}>💡</Text>
                <Text style={replaceStyles.aiNoteText}>
                  Your feedback helps us personalize future plans for you!
                </Text>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={replaceStyles.footer}>
              <TouchableOpacity
                style={[
                  replaceStyles.submitBtn,
                  (!selectedReason || busy) && replaceStyles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || busy}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(!selectedReason || busy) 
                    ? ['#D1D5DB', '#9CA3AF'] 
                    : [selectedReasonData?.color || '#6B7280', (selectedReasonData?.color || '#6B7280') + 'CC']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={replaceStyles.submitBtnGradient}
                >
                  {busy ? (
                    <View style={replaceStyles.loadingRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={replaceStyles.submitBtnText}>Recording...</Text>
                    </View>
                  ) : (
                    <Text style={replaceStyles.submitBtnText}>
                      Skip this action 👋
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={replaceStyles.footerNote}>
                You can always come back to it later
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const replaceStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
  },
  headerContent: {
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: moderateScale(16),
    top: moderateScale(18),
    zIndex: 10,
  },
  backText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: moderateScale(16),
    top: moderateScale(16),
  },
  closeBtnCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: moderateScale(14),
    color: '#fff',
    fontWeight: '600',
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: moderateScale(12),
  },
  itemIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    fontSize: moderateScale(20),
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  itemMeta: {
    fontSize: moderateScale(11),
    color: '#6B7280',
    marginTop: moderateScale(2),
  },
  scrollArea: {
    maxHeight: moderateScale(380),
  },
  scrollContent: {
    padding: moderateScale(16),
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  reasonCard: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  iconBubble: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  reasonIcon: {
    fontSize: moderateScale(18),
  },
  reasonTextWrap: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
  },
  reasonDesc: {
    fontSize: moderateScale(10),
    color: '#9CA3AF',
    marginTop: moderateScale(2),
  },
  reasonLabelSelected: {
    color: BRAND.gradPurple,
  },
  checkmark: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  customSection: {
    marginTop: moderateScale(20),
  },
  customLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: moderateScale(10),
  },
  optional: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  customInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    color: '#111827',
    minHeight: moderateScale(70),
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  charCount: {
    fontSize: moderateScale(10),
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: moderateScale(6),
  },
  preferenceSection: {
    paddingVertical: moderateScale(4),
  },
  quickLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: moderateScale(10),
  },
  quickScroll: {
    marginBottom: moderateScale(20),
    marginHorizontal: -moderateScale(16),
  },
  quickScrollContent: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(8),
  },
  quickChip: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  quickChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: BRAND.gradPurple,
  },
  quickChipText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
  },
  quickChipTextSelected: {
    color: BRAND.gradPurple,
  },
  preferenceLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: moderateScale(10),
  },
  preferenceInput: {
    borderWidth: 2,
    borderColor: BRAND.gradPurple,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    fontSize: moderateScale(14),
    color: '#111827',
    minHeight: moderateScale(90),
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    marginTop: moderateScale(16),
    gap: moderateScale(8),
  },
  aiNoteIcon: {
    fontSize: moderateScale(16),
  },
  aiNoteText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: '#166534',
    lineHeight: moderateScale(16),
  },
  footer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(24),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  submitBtn: {
    width: '100%',
    borderRadius: moderateScale(14),
    overflow: 'hidden',
  },
  submitBtnDisabled: {},
  submitBtnGradient: {
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  submitBtnText: {
    color: '#fff',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  footerNote: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(11),
    color: '#9CA3AF',
  },
});

export default function PlanManagerModal({
  visible,
  onClose,
  actionPlan,
  rewardsStatus,
  onRequestRefreshPlan,
  onActionPlanChange,
  onRewardsStatusChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [itemToReplace, setItemToReplace] = useState<ActionPlanItem | null>(null);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [itemToSkip, setItemToSkip] = useState<ActionPlanItem | null>(null);

  const refreshStatus = rewardsStatus?.refresh_status;
  const freezeCount = rewardsStatus?.freeze_count ?? 0;

  const streakAtRisk = rewardsStatus?.streak_at_risk ?? false;
  const freezesNeeded = rewardsStatus?.freezes_needed ?? 1;
  const missedDays = rewardsStatus?.missed_days_count ?? 0;

  const actions = useMemo(() => actionPlan?.actions ?? [], [actionPlan?.actions]);

  const markCompletedLocal = useCallback(
    (itemId: number) => {
      if (!actionPlan) return;
      const wasCompleted = actionPlan.actions.find((a) => a.id === itemId)?.is_completed;
      const nextCompleted = wasCompleted ? actionPlan.completed_actions : actionPlan.completed_actions + 1;
      const next: ActionPlanResponse = {
        ...actionPlan,
        actions: actionPlan.actions.map((a) => (a.id === itemId ? { ...a, is_completed: true } : a)),
        completed_actions: nextCompleted,
      };
      onActionPlanChange(next);
    },
    [actionPlan, onActionPlanChange]
  );

  const updateOneItem = useCallback(
    (itemId: number, replacement: ActionPlanItem) => {
      if (!actionPlan) return;
      const next: ActionPlanResponse = {
        ...actionPlan,
        actions: actionPlan.actions.map((a) => (a.id === itemId ? replacement : a)),
      };
      onActionPlanChange(next);
    },
    [actionPlan, onActionPlanChange]
  );

  const handleReplace = useCallback(
    (item: ActionPlanItem) => {
      if (busy) return;
      if (!refreshStatus?.can_refresh) {
        Alert.alert(
          'No refresh tokens',
          `You\'ve reached your daily refresh limit (${refreshStatus?.limit ?? 0}/day). Try again tomorrow.`
        );
        return;
      }
      // Open the custom replace modal
      setItemToReplace(item);
      setReplaceModalVisible(true);
    },
    [busy, refreshStatus]
  );

  // Handle replace submission from the modal
  const handleReplaceSubmit = useCallback(
    async (category: ReplaceCategory, customReason: string, preferenceHint: string) => {
      if (!itemToReplace) return;

      try {
        setBusy(true);
        setReplaceModalVisible(false);

        // Build feedback string for AI - includes custom reason & preference
        let feedbackText = category;
        if (customReason.trim()) {
          feedbackText += ` | ${customReason.trim()}`;
        }
        if (preferenceHint.trim()) {
          feedbackText += ` | PREFERENCE: ${preferenceHint.trim()}`;
        }

        const result = await homeService.replaceAction(
          itemToReplace.id,
          feedbackText,
          category as 'dont_like' | 'no_time' | 'not_feeling_it' | 'allergic' | 'no_ingredients' | 'already_done' | 'too_hard' | 'want_different' | 'other'
        );

        if (!result?.success || !result.replacement_action) {
          const errorMsg = result?.message || result?.error || 'Could not replace action. Please try again.';
          Alert.alert('Could not replace', errorMsg);
          return;
        }

        updateOneItem(itemToReplace.id, result.replacement_action);

        // Refresh token counts / streak status from server (source of truth)
        const nextStatus = await rewardService.getRewardsStatus();
        onRewardsStatusChange(nextStatus);

        Alert.alert('Replaced! ✨', 'Done! Here\'s something better for today.');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to replace action.');
      } finally {
        setBusy(false);
        setItemToReplace(null);
      }
    },
    [itemToReplace, onRewardsStatusChange, updateOneItem]
  );

  const handleRefreshAll = useCallback(async () => {
    if (busy) return;
    if (!refreshStatus?.can_refresh) {
      Alert.alert(
        'No refresh tokens',
        `You\'ve reached your daily refresh limit (${refreshStatus?.limit ?? 0}/day). Try again tomorrow.`
      );
      return;
    }

    Alert.alert(
      "Refresh today\'s plan?",
      `This will replace incomplete items and uses 1 refresh token. You have ${refreshStatus.remaining} left today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm refresh',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              const result = await homeService.refreshAllIncomplete();
              if (!result?.success) {
                if (result?.error === 'rate_limit') {
                  Alert.alert('No refresh tokens', 'You have reached your daily limit.');
                  return;
                }
                Alert.alert('Refresh failed', result?.message || 'Please try again.');
                return;
              }

              await onRequestRefreshPlan();

              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);

              Alert.alert('Refreshed', result.message || "Updated today\'s plan.");
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to refresh plan.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [busy, refreshStatus, onRequestRefreshPlan, onRewardsStatusChange]);

  const handleFreeze = useCallback(async () => {
    if (busy) return;

    if (freezeCount <= 0) {
      Alert.alert('No freeze tokens', "You don\'t have any freeze tokens available right now.");
      return;
    }

    const modeLabel = missedDays > 0 ? 'protect missed days' : 'freeze today';

    Alert.alert(
      'Use freeze token?',
      missedDays > 0
        ? `You missed ${missedDays} day(s). This will use ${Math.min(freezesNeeded, freezeCount)} freeze token(s) to protect your streak. Continue?`
        : 'This will use 1 freeze token to protect your streak for today. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Confirm (${modeLabel})`,
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              const result = missedDays > 0 ? await rewardService.useFreezeReactive() : await rewardService.useFreezeProactive();
              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);
              Alert.alert('Freeze applied', result.message || 'Your streak is protected.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to use freeze token.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [busy, freezeCount, freezesNeeded, missedDays, onRewardsStatusChange]);

  const handleComplete = useCallback(
    async (item: ActionPlanItem) => {
      if (busy) return;

      Alert.alert('Mark complete?', 'This will mark the action as completed for today.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: async () => {
            try {
              setBusy(true);
              const ok = await homeService.completeAssignment(item.id);
              if (!ok) {
                Alert.alert('Could not complete', 'Please try again.');
                return;
              }

              // Optional: also record completion as feedback for analytics.
              await homeService.submitActionFeedback(item.id, 'completed', undefined, 'home');

              markCompletedLocal(item.id);

              const nextStatus = await rewardService.getRewardsStatus();
              onRewardsStatusChange(nextStatus);

              Alert.alert('Completed', 'Nice — marked as done.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to mark as completed.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
    },
    [busy, markCompletedLocal, onRewardsStatusChange]
  );

  const handleSkip = useCallback(
    (item: ActionPlanItem) => {
      if (busy) return;
      // Open the custom skip modal
      setItemToSkip(item);
      setSkipModalVisible(true);
    },
    [busy]
  );

  // Handle skip submission from the modal
  const handleSkipSubmit = useCallback(
    async (reason: string) => {
      if (!itemToSkip) return;

      try {
        setBusy(true);
        await homeService.submitActionFeedback(itemToSkip.id, 'skipped', reason, 'home');

        const nextStatus = await rewardService.getRewardsStatus();
        onRewardsStatusChange(nextStatus);

        setSkipModalVisible(false);
        setItemToSkip(null);
        
        Alert.alert('Skipped ✓', "Got it — we'll use this to improve your future plans.");
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to skip action.');
      } finally {
        setBusy(false);
      }
    },
    [itemToSkip, onRewardsStatusChange]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Manage today’s plan</Text>
              <Text style={styles.subTitle}>
                Refreshes: {refreshStatus ? `${refreshStatus.remaining}/${refreshStatus.limit}` : '—'} • Freezes: {freezeCount}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          {(streakAtRisk || missedDays > 0) && (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Streak at risk</Text>
              <Text style={styles.bannerText}>
                {missedDays > 0
                  ? `You missed ${missedDays} day(s). You can protect your streak with a freeze.`
                  : 'You can protect your streak with a freeze if you won’t complete today.'}
              </Text>
              <TouchableOpacity style={[styles.bannerBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={handleFreeze}>
                <Text style={styles.bannerBtnText}>{freezeCount > 0 ? 'Use freeze token 🧊' : 'No freeze tokens'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.primaryAction, busy && { opacity: 0.6 }]} disabled={busy} onPress={handleRefreshAll}>
              <Text style={styles.primaryActionText}>Refresh plan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {actions.length === 0 ? (
              <Text style={styles.emptyText}>No plan items found for today.</Text>
            ) : (
              actions.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>{item.time_slot} • {item.category} • {item.target_hormone}</Text>
                  </View>

                  <View style={styles.cardButtons}>
                    <TouchableOpacity style={[styles.secondaryBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => handleReplace(item)}>
                      <Text style={styles.secondaryBtnText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      onPress={() => handleComplete(item)}
                    >
                      <Text style={styles.secondaryBtnText}>Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}
                      disabled={busy}
                      onPress={() => handleSkip(item)}
                    >
                      <Text style={styles.secondaryBtnText}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Custom Replace Reason Modal */}
      <ReplaceReasonModal
        visible={replaceModalVisible}
        item={itemToReplace}
        onClose={() => {
          setReplaceModalVisible(false);
          setItemToReplace(null);
        }}
        onSubmit={handleReplaceSubmit}
        busy={busy}
      />

      {/* Custom Skip Reason Modal */}
      <SkipReasonModal
        visible={skipModalVisible}
        item={itemToSkip}
        onClose={() => {
          setSkipModalVisible(false);
          setItemToSkip(null);
        }}
        onSubmit={handleSkipSubmit}
        busy={busy}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    maxHeight: '90%',
    paddingBottom: moderateScale(18),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111',
  },
  subTitle: {
    marginTop: moderateScale(3),
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  closeBtn: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  closeText: {
    color: BRAND.gradPurple,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  banner: {
    margin: moderateScale(14),
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  bannerText: {
    marginTop: moderateScale(6),
    fontSize: moderateScale(12),
    color: '#334155',
    lineHeight: moderateScale(16),
  },
  bannerBtn: {
    marginTop: moderateScale(10),
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(10),
    backgroundColor: BRAND.gradPurple,
  },
  bannerBtnText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  actionsRow: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(10),
  },
  primaryAction: {
    backgroundColor: COLORS.gradPurple,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
  list: {
    padding: moderateScale(16),
    paddingTop: moderateScale(6),
    gap: moderateScale(10),
  },
  emptyText: {
    color: '#6B7280',
    fontSize: moderateScale(13),
    textAlign: 'center',
    paddingVertical: moderateScale(28),
  },
  card: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: '#fff',
  },
  cardTop: {
    gap: moderateScale(4),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#111',
  },
  cardMeta: {
    fontSize: moderateScale(11),
    color: '#6B7280',
  },
  cardButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(10),
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
});
