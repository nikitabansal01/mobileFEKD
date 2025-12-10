/**
 * AuvraChat - Full-featured AI Chat Component
 * 
 * This component provides a full chat interface with the AUVRA AI assistant.
 * Features:
 * - Multi-turn conversations
 * - Real-time responses
 * - Citation display
 * - Tool/action confirmations
 * - Feedback collection
 * - Suggestions
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { chatService, ChatMessageResponse, ChatHistoryItem, ToolCall, Citation } from '@/services/chatService';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  citations?: Citation[];
  toolCalls?: ToolCall[];
  suggestions?: string[];
  isLoading?: boolean;
  createdAt: Date;
}

interface AuvraChatProps {
  isVisible: boolean;
  onClose: () => void;
  initialMessage?: string;
  context?: {
    screen?: string;
    currentAssignmentId?: number;
    [key: string]: any;
  };
}

// ============================================================================
// Component
// ============================================================================

const AuvraChat: React.FC<AuvraChatProps> = ({
  isVisible,
  onClose,
  initialMessage,
  context,
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ========================================================================
  // Effects
  // ========================================================================

  // Initialize chat on mount
  useEffect(() => {
    if (isVisible) {
      initializeChat();
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0 && sessionId) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // ========================================================================
  // Chat Functions
  // ========================================================================

  const initializeChat = async () => {
    try {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! 👋 I'm Auvra, your health companion. How can I help you today?",
        suggestions: [
          "What's my schedule for today?",
          "How's my progress this week?",
          "Tell me about my cycle phase",
        ],
        createdAt: new Date(),
      }]);

      // Create or get session
      const session = await chatService.createSession();
      setSessionId(session.sessionId);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      setError('Failed to connect. Please try again.');
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setInputText('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading indicator
    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      isLoading: true,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await chatService.sendMessage({
        message: content.trim(),
        sessionId: sessionId || undefined,
        context,
      });

      // Update session ID if new
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Replace loading message with actual response
      const assistantMessage: Message = {
        id: response.messageId,
        role: 'assistant',
        content: response.response,
        intent: response.intent,
        citations: response.citations,
        toolCalls: response.toolCalls,
        suggestions: response.suggestions,
        createdAt: new Date(response.createdAt),
      };

      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(assistantMessage));

    } catch (err: any) {
      console.error('Send message failed:', err);
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleFeedback = async (messageId: string, rating: -1 | 0 | 1) => {
    try {
      await chatService.submitFeedback({
        messageId,
        rating,
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleConfirmAction = async (messageId: string, toolCall: ToolCall, confirmed: boolean) => {
    try {
      const result = await chatService.confirmAction(messageId, toolCall.toolName, confirmed);
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: `confirm_${Date.now()}`,
        role: 'assistant',
        content: result.message,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    } catch (err) {
      console.error('Failed to confirm action:', err);
    }
  };

  // ========================================================================
  // Render Functions
  // ========================================================================

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    if (message.isLoading) {
      return (
        <View key={message.id} style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#683AF4" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id} style={styles.messageContainer}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}>
          {!isUser && (
            <LinearGradient
              colors={['rgba(104, 58, 244, 0.15)', 'rgba(228, 176, 236, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assistantGradient}
            >
              <Text style={styles.messageText}>{message.content}</Text>
            </LinearGradient>
          )}
          {isUser && (
            <Text style={[styles.messageText, styles.userText]}>{message.content}</Text>
          )}
        </View>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <View style={styles.citationsContainer}>
            <Text style={styles.citationsTitle}>📚 Sources:</Text>
            {message.citations.slice(0, 2).map((citation, idx) => (
              <Text key={idx} style={styles.citationText}>
                • {citation.title} {citation.pmid && `(PMID: ${citation.pmid})`}
              </Text>
            ))}
          </View>
        )}

        {/* Tool Calls requiring confirmation */}
        {message.toolCalls?.filter(tc => tc.requiresConfirmation).map((toolCall, idx) => (
          <View key={idx} style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>{toolCall.confirmationMessage}</Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmYes]}
                onPress={() => handleConfirmAction(message.id, toolCall, true)}
              >
                <Text style={styles.confirmButtonText}>✓ Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmNo]}
                onPress={() => handleConfirmAction(message.id, toolCall, false)}
              >
                <Text style={styles.confirmButtonText}>✗ No</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {message.suggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Feedback buttons for assistant messages */}
        {!isUser && message.id !== 'welcome' && !message.isLoading && (
          <View style={styles.feedbackContainer}>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(message.id, 1)}
            >
              <Text style={styles.feedbackEmoji}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => handleFeedback(message.id, -1)}
            >
              <Text style={styles.feedbackEmoji}>👎</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ========================================================================
  // Main Render
  // ========================================================================

  if (!isVisible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🌸</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Auvra</Text>
              <Text style={styles.headerSubtitle}>Your Health Companion</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Auvra anything..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(70),
    backgroundColor: '#FFEDF7',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(3),
  },
  avatarContainer: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: 'rgba(104, 58, 244, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: moderateScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Poppins600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins400',
    color: '#888',
  },
  closeButton: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
    borderRadius: responsiveWidth(4),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: moderateScale(22),
    color: '#666',
    fontWeight: 'bold',
    marginTop: -2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: responsiveWidth(4),
  },
  messagesContent: {
    paddingVertical: responsiveHeight(2),
  },
  messageContainer: {
    marginBottom: responsiveHeight(2),
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#683AF4',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  assistantGradient: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
  },
  messageText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins400',
    color: '#333',
    lineHeight: responsiveHeight(2.8),
  },
  userText: {
    color: '#FFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(2),
    gap: responsiveWidth(2),
  },
  loadingText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#888',
  },
  citationsContainer: {
    marginTop: responsiveHeight(0.5),
    paddingLeft: responsiveWidth(2),
  },
  citationsTitle: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins500',
    color: '#666',
  },
  citationText: {
    fontSize: moderateScale(10),
    fontFamily: 'Poppins400',
    color: '#888',
    marginLeft: responsiveWidth(2),
  },
  confirmationContainer: {
    marginTop: responsiveHeight(1),
    padding: responsiveWidth(3),
    backgroundColor: 'rgba(104, 58, 244, 0.05)',
    borderRadius: 10,
  },
  confirmationText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#333',
    marginBottom: responsiveHeight(1),
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: responsiveWidth(2),
  },
  confirmButton: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1),
    borderRadius: 8,
  },
  confirmYes: {
    backgroundColor: '#4CAF50',
  },
  confirmNo: {
    backgroundColor: '#F44336',
  },
  confirmButtonText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins500',
    color: '#FFF',
  },
  suggestionsContainer: {
    marginTop: responsiveHeight(1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveWidth(2),
  },
  suggestionButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#683AF4',
  },
  suggestionText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins400',
    color: '#683AF4',
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginTop: responsiveHeight(0.5),
    gap: responsiveWidth(2),
  },
  feedbackButton: {
    padding: responsiveWidth(1),
  },
  feedbackEmoji: {
    fontSize: moderateScale(14),
    opacity: 0.5,
  },
  errorContainer: {
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1),
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins400',
    color: '#D32F2F',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFF',
  },
  textInput: {
    flex: 1,
    minHeight: responsiveHeight(5),
    maxHeight: responsiveHeight(15),
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.2),
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    fontSize: moderateScale(14),
    fontFamily: 'Poppins400',
    color: '#333',
  },
  sendButton: {
    width: responsiveWidth(10),
    height: responsiveWidth(10),
    borderRadius: responsiveWidth(5),
    backgroundColor: '#683AF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveWidth(2),
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    fontSize: moderateScale(18),
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default AuvraChat;
