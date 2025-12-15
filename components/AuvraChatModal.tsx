/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUVRA CHAT MODAL - Intelligent Proactive Chat Component
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * A floating chat modal that proactively engages users with AI-powered greetings.
 * 
 * Features:
 * - AI-powered dynamic greetings via chatService
 * - Streaming text responses with typing effect
 * - Dynamic choice buttons from backend
 * - Smart follow-up questions
 * - Haptic feedback
 * - Error handling with retry
 * - Session continuity
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import ChatService, { ConversationContext } from '@/services/chatService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ChoiceOption {
  id: string;
  text: string;
}

interface AuvraChatModalProps {
  /** Called when user closes the modal */
  onClose: () => void;
  /** Called when user selects a response - passes to ChatbotScreen */
  onResponse: (response: 'positive' | 'negative' | string) => void;
  /** Optional: Navigate to full chat screen */
  onExpandChat?: () => void;
  /** User's name for personalization */
  userName?: string;
  /** Context for the conversation */
  context?: ConversationContext;
  /** Show the modal */
  visible?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TypingIndicator: React.FC = () => {
  const [dotIndex, setDotIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.typingDot,
              dotIndex > i && styles.typingDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHOICE BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ChoiceButtonProps {
  option: ChoiceOption;
  onPress: () => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ option, onPress, disabled }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.responseButton, disabled && styles.responseButtonDisabled]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.responseText}>{option.text}</Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AuvraChatModal: React.FC<AuvraChatModalProps> = ({
  onClose,
  onResponse,
  onExpandChat,
  userName,
  context = 'care_plan_modal',
  visible = true,
}) => {
  // State
  const [greeting, setGreeting] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [choices, setChoices] = useState<ChoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME-BASED GREETING HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const getTimeBasedGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Hey there';
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT CHOICES BASED ON CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  const getDefaultChoices = useCallback((): ChoiceOption[] => {
    switch (context) {
      case 'care_plan_modal':
        return [
          { id: 'positive', text: '👍 It works for me' },
          { id: 'negative', text: '👎 I want to change it' },
        ];
      case 'symptom_checkin':
        return [
          { id: 'feeling-good', text: '😊 Feeling good!' },
          { id: 'some-symptoms', text: '🤔 Some symptoms' },
          { id: 'need-help', text: '💜 Need support' },
        ];
      case 'personalise':
        return [
          { id: 'tell-more', text: '✨ Tell me more' },
          { id: 'start-now', text: '🚀 Let\'s start!' },
        ];
      case 'know_body':
        return [
          { id: 'learn-cycle', text: '🌸 About my cycle' },
          { id: 'ask-question', text: '❓ Ask a question' },
        ];
      default:
        return [
          { id: 'positive', text: '👍 It works for me' },
          { id: 'negative', text: '👎 I want to change it' },
        ];
    }
  }, [context]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH GREETING FROM BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchGreeting = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get AI-powered greeting from backend
      const response = await ChatService.getGreeting(context);
      
      if (response?.greeting) {
        // Personalize with username if available
        let personalizedGreeting = response.greeting;
        if (userName) {
          personalizedGreeting = personalizedGreeting.replace(
            /^(Hey|Hi|Hello|Good morning|Good afternoon|Good evening)(!|,)/i,
            `$1 ${userName}$2`
          );
        }
        setGreeting(personalizedGreeting);
        
        // If backend provides choices, use them
        if (response.triggers && response.triggers.length > 0) {
          const backendChoices = response.triggers.map((t, idx) => ({
            id: `trigger-${idx}`,
            text: t.title,
          }));
          setChoices(backendChoices);
        } else {
          setChoices(getDefaultChoices());
        }
      } else {
        // Fallback to smart local greeting
        const timeGreeting = getTimeBasedGreeting();
        const name = userName ? ` ${userName}` : '';
        
        let fallbackGreeting = '';
        switch (context) {
          case 'care_plan_modal':
            fallbackGreeting = `${timeGreeting}${name}! 💜 How does your action plan look today?`;
            break;
          case 'symptom_checkin':
            fallbackGreeting = `${timeGreeting}${name}! How are you feeling right now?`;
            break;
          case 'personalise':
            fallbackGreeting = `${timeGreeting}${name}! Let's make Auvra work better for you ✨`;
            break;
          case 'know_body':
            fallbackGreeting = `${timeGreeting}${name}! What would you like to learn about your body?`;
            break;
          default:
            fallbackGreeting = `${timeGreeting}${name}! 💜 How can I help you today?`;
        }
        
        setGreeting(fallbackGreeting);
        setChoices(getDefaultChoices());
      }
    } catch (err) {
      console.error('Error fetching greeting:', err);
      // Use fallback on error
      const timeGreeting = getTimeBasedGreeting();
      const name = userName ? ` ${userName}` : '';
      setGreeting(`${timeGreeting}${name}! 💜 How does your action plan look today?`);
      setChoices(getDefaultChoices());
    } finally {
      setIsLoading(false);
    }
  }, [context, userName, getDefaultChoices, getTimeBasedGreeting]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING ANIMATION EFFECT
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!greeting || isLoading) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < greeting.length) {
        setDisplayedText(greeting.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 25); // Fast typing for modal
    
    return () => clearInterval(typingInterval);
  }, [greeting, isLoading]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (visible) {
      fetchGreeting();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE USER RESPONSE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleResponse = async (choice: ChoiceOption) => {
    if (hasResponded) return;
    
    setHasResponded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Map choice ID to response type for backward compatibility
    const responseType = choice.id === 'positive' || choice.id.includes('good') || choice.id.includes('works')
      ? 'positive'
      : choice.id === 'negative' || choice.id.includes('change') || choice.id.includes('help')
      ? 'negative'
      : choice.id;
    
    // Show follow-up message while processing
    setFollowUpMessage('Got it! Let me help you with that... 💜');
    
    // Try to get AI response for follow-up
    try {
      const response = await ChatService.sendMessage(
        choice.text,
        context,
        'tap'
      );
      
      if (response?.content) {
        setFollowUpMessage(response.content);
        
        // Wait a moment then trigger navigation
        setTimeout(() => {
          onResponse(responseType);
        }, 1500);
      } else {
        // Immediate navigation on failure
        onResponse(responseType);
      }
    } catch (err) {
      console.error('Error sending response:', err);
      // Still trigger response even on error
      onResponse(responseType);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE CLOSE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE RETRY
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setHasResponded(false);
    setFollowUpMessage(null);
    fetchGreeting();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      {/* Expand to full chat button */}
      {onExpandChat && (
        <TouchableOpacity 
          style={styles.expandButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExpandChat();
          }}
        >
          <Text style={styles.expandButtonText}>↗</Text>
        </TouchableOpacity>
      )}
      
      {/* Main chat bubble */}
      <View style={styles.chatBubble}>
        <LinearGradient
          colors={['rgba(162, 154, 234, 0.3)', 'rgba(233, 139, 172, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBubble}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#A29AEA" />
              <Text style={styles.loadingText}>Auvra is thinking...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : followUpMessage ? (
            <Text style={styles.mainMessage}>{followUpMessage}</Text>
          ) : (
            <>
              <Text style={styles.mainMessage}>
                {displayedText}
                {isTyping && <Text style={styles.cursor}>|</Text>}
              </Text>
              {isTyping && <TypingIndicator />}
            </>
          )}
        </LinearGradient>
      </View>

      {/* Response options - show after typing finishes */}
      {!isLoading && !error && !isTyping && !hasResponded && (
        <View style={styles.responseContainer}>
          {choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              option={choice}
              onPress={() => handleResponse(choice)}
              disabled={hasResponded}
            />
          ))}
        </View>
      )}

      {/* Show processing indicator after response */}
      {hasResponded && !followUpMessage && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color="#A29AEA" />
        </View>
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: responsiveHeight(12),
    left: responsiveWidth(4),
    right: responsiveWidth(4),
    zIndex: 1000,
    backgroundColor: '#FFEDF7',
    borderRadius: 20,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(8),
    right: scale(8),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: moderateScale(18),
    color: '#666666',
    fontWeight: '600',
  },
  expandButton: {
    position: 'absolute',
    top: verticalScale(8),
    right: scale(44),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(162, 154, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  expandButtonText: {
    fontSize: moderateScale(14),
    color: '#A29AEA',
    fontWeight: '600',
  },
  chatBubble: {
    marginBottom: verticalScale(12),
  },
  gradientBubble: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: 16,
    borderTopLeftRadius: 4,
    minHeight: verticalScale(50),
  },
  mainMessage: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins400',
    color: '#2D2D2D',
    lineHeight: verticalScale(22),
  },
  cursor: {
    color: '#A29AEA',
    fontWeight: '300',
  },
  responseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: scale(8),
  },
  responseButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(162, 154, 234, 0.3)',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: 12,
    maxWidth: responsiveWidth(45),
  },
  responseButtonDisabled: {
    opacity: 0.5,
  },
  responseText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins500',
    color: '#4A4A4A',
  },
  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    gap: scale(10),
  },
  loadingText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#6F6F6F',
  },
  // Error state
  errorContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  errorText: {
    fontSize: moderateScale(13),
    fontFamily: 'Poppins400',
    color: '#E57373',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  retryButton: {
    backgroundColor: '#A29AEA',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: 8,
  },
  retryText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins500',
    color: '#FFFFFF',
  },
  // Typing indicator
  typingContainer: {
    marginTop: verticalScale(6),
  },
  typingDots: {
    flexDirection: 'row',
    gap: scale(4),
  },
  typingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'rgba(162, 154, 234, 0.3)',
  },
  typingDotActive: {
    backgroundColor: '#A29AEA',
  },
  // Processing state
  processingContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
});

export default AuvraChatModal;
