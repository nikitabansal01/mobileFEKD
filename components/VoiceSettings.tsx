/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VOICE SETTINGS SCREEN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Settings for TTS voice selection and preferences.
 * Features:
 * - 6 voice options with preview
 * - Speech speed control
 * - Auto-read toggle
 * - Voice personality selection
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  personality: string;
  icon: string;
  preview: string;
}

interface VoiceSettingsProps {
  currentVoice?: string;
  currentSpeed?: number;
  autoRead?: boolean;
  onVoiceChange?: (voiceId: string) => void;
  onSpeedChange?: (speed: number) => void;
  onAutoReadChange?: (enabled: boolean) => void;
  onPreviewVoice?: (voiceId: string, text: string) => void;
  onClose?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'nova',
    name: 'Nova',
    description: 'Warm & Caring',
    personality: 'Gentle, empathetic friend',
    icon: '💜',
    preview: "Hi, I'm Nova. I'm here to support you on your wellness journey.",
  },
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Balanced & Clear',
    personality: 'Professional yet approachable',
    icon: '✨',
    preview: "Hello! I'm Alloy. Let me help you understand your body better.",
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Calm & Soothing',
    personality: 'Relaxing, meditative presence',
    icon: '🌊',
    preview: "I'm Echo. Take a deep breath, and let's explore together.",
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'Expressive & Warm',
    personality: 'Storyteller, engaging narrator',
    icon: '📖',
    preview: "Hey there! I'm Fable. Ready to discover something amazing today?",
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep & Grounded',
    personality: 'Confident, reassuring guide',
    icon: '🖤',
    preview: "I'm Onyx. Whatever you're facing, we'll figure it out together.",
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Bright & Uplifting',
    personality: 'Cheerful, positive energy',
    icon: '🌟',
    preview: "Hi! I'm Shimmer! Let's make today a great day for your health!",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface VoiceCardProps {
  voice: VoiceOption;
  selected: boolean;
  loading?: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  selected,
  loading = false,
  onSelect,
  onPreview,
}) => {
  return (
    <TouchableOpacity
      style={[styles.voiceCard, selected && styles.voiceCardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.voiceHeader}>
        <Text style={styles.voiceIcon}>{voice.icon}</Text>
        <View style={styles.voiceInfo}>
          <Text style={[styles.voiceName, selected && styles.voiceNameSelected]}>
            {voice.name}
          </Text>
          <Text style={styles.voiceDescription}>{voice.description}</Text>
        </View>
        {selected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.voicePersonality}>{voice.personality}</Text>
      
      <TouchableOpacity
        style={[styles.previewButton, loading && styles.previewButtonDisabled]}
        onPress={onPreview}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#A29AEA" />
        ) : (
          <>
            <Text style={styles.previewIcon}>🔊</Text>
            <Text style={styles.previewText}>Preview</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPEED CONTROL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SpeedControlProps {
  value: number;
  onChange: (value: number) => void;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ value, onChange }) => {
  const getSpeedLabel = () => {
    if (value <= 0.8) return 'Slow';
    if (value <= 1.0) return 'Normal';
    if (value <= 1.2) return 'Fast';
    return 'Very Fast';
  };

  const speedOptions = [
    { value: 0.7, label: '0.7x' },
    { value: 0.85, label: '0.85x' },
    { value: 1.0, label: '1x' },
    { value: 1.15, label: '1.15x' },
    { value: 1.3, label: '1.3x' },
  ];

  return (
    <View style={styles.speedContainer}>
      <View style={styles.speedHeader}>
        <Text style={styles.speedTitle}>Speech Speed</Text>
        <Text style={styles.speedValue}>{getSpeedLabel()}</Text>
      </View>
      <View style={styles.speedSlider}>
        <Text style={styles.speedLabel}>🐢</Text>
        <View style={styles.speedOptionsRow}>
          {speedOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.speedOption,
                Math.abs(value - option.value) < 0.1 && styles.speedOptionSelected
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[
                styles.speedOptionText,
                Math.abs(value - option.value) < 0.1 && styles.speedOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.speedLabel}>🐇</Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  currentVoice = 'nova',
  currentSpeed = 1.0,
  autoRead = true,
  onVoiceChange,
  onSpeedChange,
  onAutoReadChange,
  onPreviewVoice,
  onClose,
}) => {
  const [selectedVoice, setSelectedVoice] = useState(currentVoice);
  const [speed, setSpeed] = useState(currentSpeed);
  const [autoReadEnabled, setAutoReadEnabled] = useState(autoRead);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceChange?.(voiceId);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  };

  const handleAutoReadToggle = (enabled: boolean) => {
    setAutoReadEnabled(enabled);
    onAutoReadChange?.(enabled);
  };

  const handlePreview = useCallback(async (voice: VoiceOption) => {
    // If parent provided a preview handler, use it
    if (onPreviewVoice) {
      onPreviewVoice(voice.id, voice.preview);
      return;
    }
    
    // Otherwise, show a message that preview requires parent implementation
    // In real app, this would call the TTS API
    setPreviewLoading(voice.id);
    
    try {
      // Simulate API call - in production, this would call:
      // POST /api/v1/chat/voice-response with { text, voice, speed }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        `${voice.icon} ${voice.name}`,
        `"${voice.preview}"\n\nTo hear the voice, implement the onPreviewVoice prop with TTS API integration.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to preview voice');
    } finally {
      setPreviewLoading(null);
    }
  }, [onPreviewVoice, speed]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#A29AEA', '#C17EC9'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎙️ Voice Settings</Text>
          <Text style={styles.headerSubtitle}>Customize how Auvra speaks to you</Text>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Voice</Text>
          <Text style={styles.sectionSubtitle}>
            Each voice has a unique personality
          </Text>
          
          {VOICE_OPTIONS.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              selected={selectedVoice === voice.id}
              loading={previewLoading === voice.id}
              onSelect={() => handleVoiceSelect(voice.id)}
              onPreview={() => handlePreview(voice)}
            />
          ))}
        </View>

        {/* Speed Control */}
        <View style={styles.section}>
          <SpeedControl value={speed} onChange={handleSpeedChange} />
        </View>

        {/* Auto-Read Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Auto-Read Responses</Text>
              <Text style={styles.toggleDescription}>
                Automatically read Auvra's messages aloud
              </Text>
            </View>
            <Switch
              value={autoReadEnabled}
              onValueChange={handleAutoReadToggle}
              trackColor={{ false: '#E0E0E0', true: '#A29AEA' }}
              thumbColor={autoReadEnabled ? '#FFFFFF' : '#F5F5F5'}
            />
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Nova is perfect for comforting conversations
            </Text>
            <Text style={styles.tipText}>
              • Use slower speeds when learning new information
            </Text>
            <Text style={styles.tipText}>
              • Shimmer is great for motivational moments
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: verticalScale(30) }} />
      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(20),
    paddingTop: verticalScale(50),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(22, 0.5),
    fontFamily: 'Poppins600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: verticalScale(4),
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    fontFamily: 'Poppins600',
  },
  content: {
    flex: 1,
    padding: scale(16),
  },
  section: {
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
    marginBottom: verticalScale(4),
  },
  sectionSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
    marginBottom: verticalScale(15),
  },
  // Voice Card
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceCardSelected: {
    borderColor: '#A29AEA',
    backgroundColor: '#FAFAFF',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  voiceIcon: {
    fontSize: moderateScale(28),
    marginRight: scale(12),
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
  },
  voiceNameSelected: {
    color: '#A29AEA',
  },
  voiceDescription: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
  },
  selectedBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#A29AEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontFamily: 'Poppins600',
  },
  voicePersonality: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: verticalScale(10),
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: verticalScale(8),
    gap: scale(6),
    minHeight: verticalScale(36),
  },
  previewButtonDisabled: {
    opacity: 0.6,
  },
  previewIcon: {
    fontSize: moderateScale(14),
  },
  previewText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins500',
    color: '#6F6F6F',
  },
  // Speed Control
  speedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(16),
  },
  speedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  speedTitle: {
    fontSize: moderateScale(15),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
  },
  speedValue: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins500',
    color: '#A29AEA',
  },
  speedSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  slider: {
    flex: 1,
    height: verticalScale(40),
  },
  speedLabel: {
    fontSize: moderateScale(18),
  },
  speedOptionsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(6),
  },
  speedOption: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  speedOptionSelected: {
    backgroundColor: '#A29AEA',
  },
  speedOptionText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins500',
    color: '#6F6F6F',
  },
  speedOptionTextSelected: {
    color: '#FFFFFF',
  },
  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(16),
  },
  toggleTitle: {
    fontSize: moderateScale(15),
    fontFamily: 'Poppins600',
    color: '#2D2D2D',
  },
  toggleDescription: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
    marginTop: verticalScale(2),
    maxWidth: responsiveWidth(60),
  },
  // Tips
  tipsSection: {
    marginTop: verticalScale(10),
  },
  tipsTitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins600',
    color: '#6F6F6F',
    marginBottom: verticalScale(10),
  },
  tipCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: scale(14),
  },
  tipText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#5D4037',
    marginBottom: verticalScale(6),
    lineHeight: verticalScale(20),
  },
});

export default VoiceSettings;
