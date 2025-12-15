import Avatar from "@/components/customComponent/AvatarChatbot";
import Header from "@/components/customComponent/ChatbotHeader";
import FooterCTA from "@/components/customComponent/FooterChatbotCTA";
import ChatService, { ConversationContext as ChatContext, InputMode } from "@/services/chatService";
import HomeService from "@/services/homeService";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES, useAppFonts } from '../../constants/fonts';


// Responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// Font scaling system using react-native-size-matters
// Using moderateScale with factor 1.5 for aggressive scaling
const FONT_SIZES = {
  // From Figma: Keyboard numbers (18.35px)
  keyboardNumber: moderateScale(18.35, 1.5),
  
  // From Figma: Header text (14px Noto Serif)
  header: moderateScale(14, 1.5),
  
  // From Figma: Message text (14px Inter Regular) - using moderateScale for better scaling
  message: moderateScale(14,1.5),
  
  // From Figma: Button text (12px Inter Regular)
  button: moderateScale(12, 1.5),
  
  // From Figma: Time display (12px Inter Regular)
  time: moderateScale(12, 1.5),
  
  // From Figma: Status bar time (15.22px SF Pro Semibold)
  statusBar: moderateScale(15.22, 1.5),
  
  // Additional sizes for UI elements
  title: moderateScale(18, 1.5),
  subtitle: moderateScale(16, 1.5),
  caption: moderateScale(10, 1.5),
  large: moderateScale(20, 1.5),
  small: moderateScale(12, 1.5),
  extraSmall: moderateScale(10, 1.5),
};

// Line height scaling using react-native-size-matters
const LINE_HEIGHTS = {
  tight: moderateScale(16, 1.5),
  normal: moderateScale(18, 1.5),
  relaxed: moderateScale(20, 1.5),
};

// Constants
const COLORS = {
  surface: "#FEF7FF",
  onSurface: "#1D1B20",
  surfaceDivider: "#E6E0E9",
  outlineVariant: "#D7D5DE",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#4F378A",
  greyMedium: "#6F6F6F",
  greyLight: "#949494",
  white: "#FFFFFF",
  gradPurple: "#A78BFA",
  gradPink: "#F0A3C2",
  warmPurple: "#C17EC9",
};

// Types
type Mode = "idle" | "tap" | "yap" | "type";

type MessageStatus = 'sending' | 'sent' | 'delivered';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp?: Date; // When message was sent
  status?: MessageStatus; // For user messages
};

type ChoiceOption = {
  id: string;
  text: string;
};

// Components
function GradientText({ children, style }: { children: string; style?: any }) {
  return (
    <MaskedView 
      maskElement={
        <Text style={[
          style, 
          { 
            backgroundColor: "transparent",
            includeFontPadding: isAndroid ? false : undefined,
            textAlignVertical: isAndroid ? 'center' : undefined,
          }
        ]}>
          {children}
        </Text>
      }
      style={[
        { 
          ...(isAndroid && { 
            renderToHardwareTextureAndroid: true,
            needsOffscreenAlphaCompositing: true 
          } as any)
        }
      ]}
    >
      <LinearGradient 
        colors={[COLORS.gradPurple, COLORS.gradPink]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
        style={{ 
          flex: 1,
          ...(isAndroid && { 
            renderToHardwareTextureAndroid: true 
          } as any)
        }}
      >
        <Text style={[
          style, 
          { 
            opacity: 0,
            includeFontPadding: isAndroid ? false : undefined,
            textAlignVertical: isAndroid ? 'center' : undefined,
          }
        ]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

// Animated typing indicator component with pulsing dots
function TypingIndicator() {
  const [dotIndex, setDotIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <LinearGradient
          colors={[COLORS.gradPurple, COLORS.gradPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.typingGradient}
        >
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, dotIndex >= 1 && styles.typingDotActive]} />
            <View style={[styles.typingDot, dotIndex >= 2 && styles.typingDotActive]} />
            <View style={[styles.typingDot, dotIndex >= 3 && styles.typingDotActive]} />
          </View>
          <Text style={styles.typingText}>Auvra is thinking...</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Helper function to format timestamps
function formatMessageTime(date?: Date): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  // Same day - show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  // Different day - show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// AUVRA avatar for bot messages
function AuvraAvatar() {
  return (
    <View style={styles.auvraAvatarContainer}>
      <LinearGradient
        colors={[COLORS.gradPurple, COLORS.gradPink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.auvraAvatarGradient}
      >
        <Text style={styles.auvraAvatarText}>A</Text>
      </LinearGradient>
    </View>
  );
}

// Helper function to format bot message text with proper line breaks and styling
function formatBotText(text: string): React.ReactNode[] {
  // Clean up the text first
  let cleanText = text
    .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
    .replace(/\*\*/g, '') // Remove markdown bold markers for now
    .trim();
  
  // Split by double newlines for paragraphs
  const paragraphs = cleanText.split(/\n\n+/);
  
  return paragraphs.map((paragraph, index) => {
    // Handle bullet points
    if (paragraph.startsWith('• ') || paragraph.startsWith('- ')) {
      const items = paragraph.split(/\n/).filter(item => item.trim());
      return (
        <View key={index} style={{ marginVertical: 4 }}>
          {items.map((item, itemIndex) => (
            <Text key={itemIndex} style={{ marginBottom: 2 }}>
              {item.trim()}
            </Text>
          ))}
        </View>
      );
    }
    
    // Regular paragraph
    return paragraph + (index < paragraphs.length - 1 ? '\n\n' : '');
  });
}

function BotMessage({ text, timestamp, showAvatar = true }: { text: string; timestamp?: Date; showAvatar?: boolean }) {
  return (
    <View style={styles.botMessageRow}>
      {showAvatar && <AuvraAvatar />}
      <View style={[styles.botMessageContainer, !showAvatar && styles.botMessageNoAvatar]}>
        <View style={styles.botMessageBubble}>
          <GradientText style={styles.botMessageText}>{text}</GradientText>
        </View>
        {timestamp && (
          <Text style={styles.messageTimestamp}>{formatMessageTime(timestamp)}</Text>
        )}
      </View>
    </View>
  );
}

function UserMessage({ text, timestamp, status = 'sent' }: { text: string; timestamp?: Date; status?: 'sending' | 'sent' | 'delivered' }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color={COLORS.greyLight} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color={COLORS.gradPurple} />;
      case 'sent':
      default:
        return <Ionicons name="checkmark" size={12} color={COLORS.greyLight} />;
    }
  };

  return (
    <View style={styles.userMessageContainer}>
      <View style={styles.userMessageBubble}>
        <Text style={styles.userMessageText}>{text}</Text>
      </View>
      <View style={styles.messageStatusRow}>
        {timestamp && (
          <Text style={[styles.messageTimestamp, styles.messageTimestampRight]}>{formatMessageTime(timestamp)}</Text>
        )}
        <View style={styles.messageStatusIcon}>
          {getStatusIcon()}
        </View>
      </View>
    </View>
  );
}

function ChoiceButton({
  option,
  isSelected,
  onPress
}: {
  option: ChoiceOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.choiceButton,
        isSelected && styles.choiceButtonSelected
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {isSelected ? (
        <LinearGradient
          colors={[COLORS.gradPurple, COLORS.gradPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.choiceButtonGradient}
        >
          <View style={styles.choiceButtonTextContainer}>
            <Text style={styles.choiceButtonText}>{option.text}</Text>
          </View>
        </LinearGradient>
      ) : (
        <Text style={styles.choiceButtonTextUnselected}>{option.text}</Text>
      )}
    </TouchableOpacity>
  );
}

// Navigation type
type RootStackParamList = {
  HomeScreen: undefined;
  ChatbotScreen: {
    conversationContext?: {
      initialMessage: string;
      userResponse: string;
      context: string;
    };
  };
};

// Props interface
interface ChatbotProps {
  onBackToHome?: () => void;
  conversationContext?: {
    initialMessage: string;
    userResponse: string;
    context: string;
  };
}

// Main Component
export default function Chatbot({ onBackToHome, route }: ChatbotProps & { route?: { params?: { conversationContext?: any } } } = {}) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const fontsLoaded = useAppFonts();
  const [mode, setMode] = useState<Mode>("idle");
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [userName, setUserName] = useState<string>(""); // User's name for personalization
  
  // Fetch user name on mount
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const cycleInfo = await HomeService.getCyclePhase();
        if (cycleInfo?.cycle_info?.user_name) {
          setUserName(cycleInfo.cycle_info.user_name);
        }
      } catch (error) {
        console.log("Could not fetch user name:", error);
      }
    };
    fetchUserName();
  }, []);
  
  // Map conversation context from route to ChatContext type
  const getConversationContext = (): ChatContext => {
    const contextFromRoute = route?.params?.conversationContext;
    switch (contextFromRoute?.context) {
      case "care_plan_modal": return "care_plan_modal";
      case "symptom_checkin": return "symptom_checkin";
      case "personalise": return "personalise";
      case "know_body": return "know_body";
      default: return "care_plan_modal";
    }
  };
  
  // Get time-based greeting prefix
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Hey there";
  };
  
  // Handle conversation context from different chats
  useEffect(() => {
    const contextFromRoute = route?.params?.conversationContext;
    const timeGreeting = getTimeBasedGreeting();
    
    // Helper to create personalized greeting
    const getGreeting = (template: string) => {
      if (userName) {
        return template.replace("Hey!", `Hey ${userName}!`).replace("Great!", `Great, ${userName}!`).replace("I love", `${userName}, I love`);
      }
      return template;
    };
    
    if (contextFromRoute?.context === "care_plan_modal") {
      // Care Plan check-in modal content
      const initialMessages: Message[] = [];
      const now = new Date();
      
      // Only add user response if it's a meaningful response (not "Continue conversation")
      const hasUserResponse = contextFromRoute.userResponse && 
                              contextFromRoute.userResponse !== 'Continue conversation';
      
      if (hasUserResponse) {
        // User already responded from home modal
        initialMessages.push({
          id: "1", 
          text: "How does your care plan look today?", 
          isBot: true,
          timestamp: now
        });
        initialMessages.push({
          id: "2", 
          text: contextFromRoute.userResponse, 
          isBot: false,
          timestamp: now,
          status: 'delivered' as MessageStatus
        });
        
        // Personalized follow-up based on response
        let followUpQuestion = userName 
          ? `That's wonderful, ${userName}! 💜 What's been working well for you?`
          : "That's wonderful! 💜 What's been working well for you?";
        if (contextFromRoute.userResponse === "👎 I want to change it") {
          followUpQuestion = userName
            ? `I hear you, ${userName}! 💜 What would you like to adjust in your plan?`
            : "I hear you! 💜 What would you like to adjust in your plan?";
        }
        
        initialMessages.push({
          id: "3",
          text: followUpQuestion,
          isBot: true,
          timestamp: now
        });
      } else {
        // Fresh start - engaging personalized greeting with time awareness
        const greeting = userName 
          ? `${timeGreeting}, ${userName}! 💜 How's your day going? Ready to check in on your care plan?`
          : `${timeGreeting}! 💜 How's your day going? Ready to check in on your care plan?`;
        initialMessages.push({
          id: "1",
          text: greeting,
          isBot: true,
          timestamp: now
        });
      }
      
      setMessages(initialMessages);
      setMode("idle");
      setShowSlider(false);
      setShowSelectedValue(false);
    } else if (contextFromRoute?.context === "symptom_checkin") {
      // Symptom check-in - engaging opening with time awareness
      const greeting = userName
        ? `${timeGreeting}, ${userName}! Let's check in on how you're feeling 💜`
        : `${timeGreeting}! Let's check in on how you're feeling 💜`;
      setMessages([
        { id: "1", text: greeting, isBot: true, timestamp: new Date() },
      ]);
      setShowSlider(true);
      setShowSelectedValue(false);
    } else if (contextFromRoute?.context === "personalise") {
      // Personalisation - warm welcome with time awareness
      const greeting = userName
        ? `${timeGreeting}, ${userName}! Let's make your experience more personal 💜`
        : `${timeGreeting}! Let's make your experience more personal 💜`;
      setMessages([
        { id: "1", text: greeting, isBot: true, timestamp: new Date() },
        { id: "2", text: "The more I know about you, the better I can help. What would you like to tell me about?", isBot: true, timestamp: new Date() },
      ]);
      setShowSlider(false);
      setShowSelectedValue(false);
    } else if (contextFromRoute?.context === "know_body") {
      // Know body - educational opener
      const greeting = userName
        ? `${userName}, I love that you want to understand your body better! 💜`
        : "I love that you want to understand your body better! 💜";
      setMessages([
        { id: "1", text: greeting, isBot: true, timestamp: new Date() },
        { id: "2", text: "What are you curious about? Your cycle, hormones, or something specific?", isBot: true, timestamp: new Date() },
      ]);
      setShowSlider(false);
      setShowSelectedValue(false);
    } else {
      // Default: Symptom check-in content with time awareness
      const greeting = userName
        ? `${timeGreeting}, ${userName}! How has your bloating been this week?`
        : `${timeGreeting}! How has your bloating been this week?`;
      setMessages([
        { id: "1", text: greeting, isBot: true, timestamp: new Date() },
      ]);
      setShowSlider(true);
      setShowSelectedValue(false);
    }
  }, [route?.params?.conversationContext, userName]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderHoverValue, setSliderHoverValue] = useState<number | null>(null);
  const [showSlider, setShowSlider] = useState(true);
  const [showSelectedValue, setShowSelectedValue] = useState(false);
  const [serverChoiceOptions, setServerChoiceOptions] = useState<ChoiceOption[] | null>(null);
  const [serverSliderLabels, setServerSliderLabels] = useState<string[] | null>(null);

  const effectiveSliderLabels = serverSliderLabels && serverSliderLabels.length > 0
    ? serverSliderLabels
    : ["None 😊", "Mild", "Moderate", "Strong", "Intense"];

  // Get choice options based on context
  const getChoiceOptions = (): ChoiceOption[] => {
    if (serverChoiceOptions && serverChoiceOptions.length > 0) {
      return serverChoiceOptions;
    }

    const contextFromRoute = route?.params?.conversationContext;
    
    switch (contextFromRoute?.context) {
      case "care_plan_modal":
        return [
          { id: "completed", text: "I did something! 🎉" },
          { id: "skip-actions", text: "Need to skip today" },
          { id: "want-to-change", text: "Adjust my plan" },
          { id: "feeling-good", text: "Feeling great! 💜" },
        ];
      case "symptom_checkin":
        return [
          { id: "ate-out-more", text: "🍕 Ate out more" },
          { id: "more-stress", text: "😓 More stress" },
          { id: "less-sleep", text: "😴 Less sleep" },
          { id: "ate-more-carbs", text: "🍞 More carbs" },
          { id: "ate-more-dairy", text: "🥛 More dairy" },
          { id: "skipped-meals", text: "⏭️ Skipped meals" },
          { id: "more-caffeine", text: "☕ More caffeine" },
          { id: "nothing-special", text: "Nothing unusual ✨" },
        ];
      case "personalise":
        return [
          { id: "diet-prefs", text: "🥗 My diet preferences" },
          { id: "exercise-habits", text: "💪 Exercise habits" },
          { id: "sleep-patterns", text: "😴 Sleep patterns" },
          { id: "stress-triggers", text: "😓 Stress triggers" },
          { id: "all-good", text: "All set for now! 💜" },
        ];
      case "know_body":
        return [
          { id: "learn-phases", text: "🌸 Menstrual phases" },
          { id: "hormone-info", text: "⚗️ Hormone changes" },
          { id: "symptom-reasons", text: "🤔 Why do I feel this?" },
          { id: "ask-question", text: "Ask something else" },
        ];
      default:
        return [
          { id: "ate-out-more", text: "🍕 Ate out more" },
          { id: "more-stress", text: "😓 More stress" },
          { id: "less-sleep", text: "😴 Less sleep" },
          { id: "ate-more-carbs", text: "🍞 More carbs" },
          { id: "nothing-special", text: "Nothing unusual ✨" },
        ];
    }
  };

  const choiceOptions = getChoiceOptions();

  // Get header title based on context
  const getHeaderTitle = (): string => {
    const contextFromRoute = route?.params?.conversationContext;
    
    switch (contextFromRoute?.context) {
      case "care_plan_modal":
        return "Care Plan Check-in";
      case "symptom_checkin":
        return "Symptom Check-in";
      case "personalise":
        return "Want to Personalise?";
      case "know_body":
        return "Know my body";
      default:
        return "Weekly Check-in";
    }
  };

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // ScrollView refs for auto-scrolling
  const typeScrollRef = useRef<ScrollView>(null);
  const tapScrollRef = useRef<ScrollView>(null);
  const idleScrollRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Function to scroll to bottom of the current mode's ScrollView
  const scrollToBottom = () => {
    setTimeout(() => {
      switch (mode) {
        case "type":
          typeScrollRef.current?.scrollToEnd({ animated: true });
          break;
        case "tap":
          tapScrollRef.current?.scrollToEnd({ animated: true });
          break;
        case "idle":
          idleScrollRef.current?.scrollToEnd({ animated: true });
          break;
      }
    }, 100); // Small delay to ensure the new message is rendered
  };

  // Auto-scroll to bottom when switching modes (to show latest messages)
  useEffect(() => {
    scrollToBottom();

    // Focus TextInput when switching to type mode on Android
    if (mode === 'type' && Platform.OS === 'android') {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    }
  }, [mode]);

  // Handle keyboard events for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        // Ensure the input is visible when keyboard shows
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      });

      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        // Reset any adjustments when keyboard hides
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      });

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || value.trim();
    if (messageText) {
      // Haptic feedback on send
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const messageId = Date.now().toString();
      const botMessageId = Date.now().toString() + "_bot";
      
      // Add user message with 'sending' status
      const newMessage: Message = {
        id: messageId,
        text: messageText,
        isBot: false,
        timestamp: new Date(),
        status: 'sending',
      };
      setMessages(prev => [...prev, newMessage]);
      console.log("Sent:", messageText);
      if (!text) setValue("");
      scrollToBottom();

      // Show loading state
      setIsLoading(true);

      try {
        // Determine input mode
        let inputMode: InputMode = 'type';
        if (mode === 'tap') inputMode = 'tap';
        else if (mode === 'yap') inputMode = 'yap';

        // Add empty bot message that will fill with streaming content
        const botResponse: Message = {
          id: botMessageId,
          text: '',
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        scrollToBottom();

        // Call the STREAMING chat API
        await ChatService.sendMessageStreaming(
          messageText,
          getConversationContext(),
          inputMode,
          undefined, // metadata
          // onToken: Update bot message with accumulating content
          (content: string) => {
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId ? { ...msg, text: content } : msg
            ));
            scrollToBottom();
            setIsLoading(false); // Hide loading after first token
          },
          // onComplete: Handle final response with choices/slider
          (response) => {
            // Update message status to 'delivered' on success
            setMessages(prev => prev.map(msg => 
              msg.id === messageId ? { ...msg, status: 'delivered' as MessageStatus } : msg
            ));

            // Final content already updated by tokens, just handle metadata
            console.log('✅ Streaming complete:', response);

            // Haptic feedback on completion
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // If backend returns dynamic choices
            if (Array.isArray(response.choices) && response.choices.length > 0) {
              setServerChoiceOptions(
                response.choices.map((c, idx) => ({ id: `server-choice-${idx}`, text: c }))
              );
            } else {
              setServerChoiceOptions(null);
            }

            // If backend requests a slider
            if (response.slider_config && Array.isArray(response.slider_config.labels)) {
              setServerSliderLabels(response.slider_config.labels);
              setShowSlider(true);
              setShowSelectedValue(false);
              setSliderValue(0);
            }

            setIsLoading(false);
          },
          // onError: Handle errors
          (error: string) => {
            console.error('❌ Streaming error:', error);
            
            // Update to sent but not delivered
            setMessages(prev => prev.map(msg => 
              msg.id === messageId ? { ...msg, status: 'sent' as MessageStatus } : msg
            ));

            // Update bot message with error
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, text: "I'm having trouble right now. Please try again in a moment. 💜" } 
                : msg
            ));

            setIsLoading(false);
            scrollToBottom();
          }
        );
      } catch (error) {
        console.error('❌ Error sending message:', error);
        // Update message status to 'sent' (but not delivered due to error)
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'sent' as MessageStatus } : msg
        ));
        // Haptic feedback for error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Show error response with retry option
        const errorResponse: Message = {
          id: Date.now().toString() + "_bot",
          text: "Oops! I couldn't connect. Let's try that again 💜",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
        // Set retry choices
        setServerChoiceOptions([
          { id: 'retry', text: 'Try again 🔄' },
          { id: 'refresh', text: 'Start fresh' }
        ]);
        scrollToBottom();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleOption = (optionId: string) => {
    Haptics.selectionAsync(); // Light feedback for selection
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const sendSelectedOptions = () => {
    if (selectedOptions.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const selectedTexts = selectedOptions.map(id =>
        choiceOptions.find(option => option.id === id)?.text
      ).filter(Boolean);

      const messageText = selectedTexts.join(", ");
      handleSend(messageText);
      setSelectedOptions([]); // Clear selections after sending
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setRecordingComplete(false);
    // Start timer
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    // Store interval ID for cleanup
    (window as any).recordingInterval = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingComplete(true);
    // Clear timer
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
    }
  };

  const sendRecording = () => {
    const duration = formatTime(recordingTime);
    const voiceMessage = `Voice message (${duration})`;
    handleSend(voiceMessage);
    setRecordingComplete(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderSelection = async (value: number) => {
    // Haptic feedback for slider selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSliderValue(value);
    setShowSlider(false);
    setShowSelectedValue(true);

    // Send slider value to backend (creates session if needed)
    setIsLoading(true);
    try {
      const response = await ChatService.sendSliderValue(value, {
        symptom_type: 'bloating',
        source: 'weekly_checkin',
      });

      if (response && typeof response.content === 'string' && response.content.trim().length > 0) {
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const botResponse: Message = {
          id: Date.now().toString() + "_bot",
          text: response.content,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);

        if (Array.isArray((response as any).choices) && (response as any).choices.length > 0) {
          const choices: string[] = (response as any).choices;
          setServerChoiceOptions(
            choices.map((c, idx) => ({ id: `server-choice-${idx}`, text: c }))
          );
        } else {
          setServerChoiceOptions(null);
        }
      }
    } catch (e) {
      console.error('❌ Error sending slider value:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }

    // Show selected value for 1 second, then show conversation in idle mode
    setTimeout(() => {
      setShowSelectedValue(false);
      // Scroll to bottom when conversation appears
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }, 1000);
  };

  // Soft tints for 1..9, left (green) to right (pink)
  const getSliderTint = (value: number) => {
    const tints: Record<number, string> = {
      1: "#EAF7DD", // soft green
      2: "#EAF7DD",
      3: "#EAF7DD", // light yellow-green
      4: "#FFFCDB",
      5: "#FFFCDB", // soft warm yellow
      6: "#FFFCDB",
      7: "#FFEFF6", // soft pink
      8: "#FFEFF6",
      9: "#FFEFF6",
    };
    return tints[value] || COLORS.white;
  };

  const getBloatingLabel = (value: number) => {
    if (value === 1) return "None at all 😊";
    if (value <= 3) return "Just a little";
    if (value <= 5) return "Noticeable";
    if (value <= 7) return "Pretty strong";
    return "Very intense";
  };

  // Quick reply button component for inline choices
  const QuickReplyButton = ({ text, onPress }: { text: string; onPress: () => void }) => (
    <TouchableOpacity
      style={styles.quickReplyButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.quickReplyText}>{text}</Text>
    </TouchableOpacity>
  );

  // Render quick reply choices below messages
  const renderQuickReplies = () => {
    const currentChoices = serverChoiceOptions || choiceOptions;
    if (currentChoices.length === 0 || isLoading) return null;
    
    return (
      <View style={styles.quickRepliesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRepliesScroll}
        >
          {currentChoices.slice(0, 4).map((choice) => (
            <QuickReplyButton
              key={choice.id}
              text={choice.text}
              onPress={() => handleSend(choice.text)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderIdleMode = () => {
    const contextFromRoute = route?.params?.conversationContext;
    const isCarePlanModal = contextFromRoute?.context === "care_plan_modal";
    
    console.log('renderIdleMode - contextFromRoute:', contextFromRoute);
    console.log('renderIdleMode - isCarePlanModal:', isCarePlanModal);
    
    // Force Care Plan modal to work - early return
    if (isCarePlanModal) {
      return (
        <View style={styles.idleModeContainer}>
          <ScrollView
            ref={idleScrollRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Avatar showMessage={false} />
            <View style={{marginTop: verticalScale(20)}}>
            <View style={styles.messagesWrapper}>
              {/* Show all messages from the messages array */}
              {messages.map((message, index) => (
                <View key={message.id}>
                  {message.isBot ? (
                    <BotMessage text={message.text} timestamp={message.timestamp} />
                  ) : (
                    <UserMessage text={message.text} timestamp={message.timestamp} status={message.status} />
                  )}
                </View>
              ))}
              {/* Loading indicator when waiting for API response */}
              {isLoading && <TypingIndicator />}
            </View>
            </View>
            
            {/* Quick reply choices */}
            {!isLoading && messages.length > 0 && renderQuickReplies()}
          </ScrollView>

          {/* Input area for idle mode */}
          <View style={styles.idleInputContainer}>
            <TouchableOpacity 
              style={styles.idleInputButton}
              onPress={() => setMode("type")}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.greyMedium} />
              <Text style={styles.idleInputPlaceholder}>Type a message...</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.idleMicButton}
              onPress={() => setMode("idle")}
            >
              <Image
                source={require("./../../assets/images/yap-icon.png")}
                style={{ width: scale(20), height: scale(20) }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Recording status display */}
          {(isRecording || recordingComplete) && (
            <View style={styles.recordingStatusContainer}>
              {isRecording ? (
                <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
              ) : recordingComplete ? (
                <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
              ) : null}
            </View>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.idleModeContainer}>
        {showSlider ? (
          // Default bloating slider for other contexts
          <View style={styles.sliderPageContainer}>
            <View style={styles.sliderTopSpacer} />
            <Avatar showMessage={true} />

            <View style={styles.sliderContainer}>
              <View style={styles.sliderNumbers}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPressIn={() => setSliderHoverValue(num)}
                    onPress={() => handleSliderSelection(num)}
                    activeOpacity={0.8}
                    style={[
                      styles.sliderNumber,
                      { backgroundColor: getSliderTint(num) },
                      sliderHoverValue === num && styles.sliderNumberSelected,
                    ]}
                  >
                    <Text style={styles.sliderNumberText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.sliderLabels}>
                {effectiveSliderLabels.slice(0, 5).map((lbl) => (
                  <Text key={lbl} style={styles.sliderLabel}>{lbl}</Text>
                ))}
              </View>
            </View>

            <View style={styles.sliderBottomSpacer} />
          </View>
        ) : showSelectedValue ? (
          <View style={styles.sliderPageContainer}>
            <View style={styles.sliderTopSpacer} />
            <Avatar showMessage={true} />

            <View style={styles.selectedValueContainer}>
              <Text style={styles.selectedValueNumber}>{sliderValue}</Text>
              <Text style={styles.selectedValueLabel}>{getBloatingLabel(sliderValue)} bloating</Text>
            </View>
            {/* Keep slider visible during the 1s animation, with the selected cell highlighted */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderNumbers}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <View
                    key={num}
                    style={[
                      styles.sliderNumber,
                      { backgroundColor: getSliderTint(num) },
                      sliderValue === num && styles.sliderNumberSelected,
                    ]}
                  >
                    <Text style={styles.sliderNumberText}>{num}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.sliderLabels}>
                {effectiveSliderLabels.slice(0, 5).map((lbl) => (
                  <Text key={lbl} style={styles.sliderLabel}>{lbl}</Text>
                ))}
              </View>
            </View>

            <View style={styles.sliderBottomSpacer} />
          </View>
        ) : (
          <>
            <ScrollView
              ref={idleScrollRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Avatar showMessage={true} />
              <View style={styles.messagesWrapper}>
                {/* Always show slider value as first message if available - only for non-care-plan contexts */}
                {sliderValue > 0 && !isCarePlanModal && (
                  <UserMessage text={`${sliderValue} = ${getBloatingLabel(sliderValue)} bloating`} />
                )}
                {/* Show initial bot response if no messages yet - only for non-care-plan contexts */}
                {messages.length === 0 && sliderValue > 0 && !isCarePlanModal && (
                  <BotMessage text="Were there any big changes in your week? related to food, lifestyle, stress, etc" />
                )}
                {/* Show all messages from the messages array */}
                {messages.map((message, index) => (
                  <View key={message.id}>
                    {message.isBot ? (
                      <BotMessage text={message.text} timestamp={message.timestamp} />
                    ) : (
                      <UserMessage text={message.text} timestamp={message.timestamp} status={message.status} />
                    )}
                  </View>
                ))}
                
                {/* Quick reply choices */}
                {!isLoading && (messages.length > 0 || sliderValue > 0) && renderQuickReplies()}
              </View>
            </ScrollView>

            {/* Input area for idle mode */}
            <View style={styles.idleInputContainer}>
              <TouchableOpacity 
                style={styles.idleInputButton}
                onPress={() => setMode("type")}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.greyMedium} />
                <Text style={styles.idleInputPlaceholder}>Type a message...</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.idleMicButton}
                onPress={() => setMode("idle")}
              >
                <Image
                  source={require("./../../assets/images/yap-icon.png")}
                  style={{ width: scale(20), height: scale(20) }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Recording status display */}
            {(isRecording || recordingComplete) && (
              <View style={styles.recordingStatusContainer}>
                {isRecording ? (
                  <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
                ) : recordingComplete ? (
                  <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
                ) : null}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderTypeMode = () => (
    <>
      <ScrollView
        ref={typeScrollRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Avatar showMessage={false} />
        <View style={{marginTop: verticalScale(20)}}>
        <View style={styles.messagesWrapper}>
          {messages.map((message, index) => (
            <View key={message.id}>
              {message.isBot ? (
                <BotMessage text={message.text} timestamp={message.timestamp} />
              ) : (
                <UserMessage text={message.text} timestamp={message.timestamp} status={message.status} />
              )}
              {index === 0 && !showSlider && sliderValue > 0 && (
                <UserMessage text={`${sliderValue} = ${getBloatingLabel(sliderValue)} bloating`} status="delivered" />
              )}
            </View>
          ))}
          {/* Loading indicator when waiting for API response */}
          {isLoading && <TypingIndicator />}
        </View>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputField}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="I'm here to listen..."
            placeholderTextColor={COLORS.greyLight}
            value={value}
            onChangeText={setValue}
            multiline
            returnKeyType="default"
            textBreakStrategy="simple"
          />
        </View>
        {value.trim() === "" ? (
          <>
            <TouchableOpacity style={styles.whiteButton} onPress={() => setMode("idle")}>
              <Image
                source={require("./../../assets/images/yap-icon.png")}
                style={{ width: scale(24), height: scale(24) }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.whiteButton} onPress={() => setMode("tap")}>
              <Ionicons name="checkmark-circle-outline" style={{fontSize: moderateScale(24, 1.5)}} color={COLORS.onPrimaryContainer} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <LinearGradient
              colors={[COLORS.gradPurple, COLORS.gradPink]}
              style={styles.buttonGradient}
            >
              <Ionicons name="send" style={{fontSize: moderateScale(24, 1.5)}} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderTapMode = () => (
    <>
      <ScrollView
        ref={tapScrollRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Avatar showMessage={false} />
        <View style={{marginTop: verticalScale(20)}}>
        <View style={styles.messagesWrapper}>
          {messages.map((message, index) => (
            <View key={message.id}>
              {message.isBot ? (
                <BotMessage text={message.text} timestamp={message.timestamp} />
              ) : (
                <UserMessage text={message.text} timestamp={message.timestamp} status={message.status} />
              )}
              {index === 0 && !showSlider && sliderValue > 0 && (
                <UserMessage text={`${sliderValue} = ${getBloatingLabel(sliderValue)} bloating`} status="delivered" />
              )}
            </View>
          ))}
          {/* Loading indicator when waiting for API response */}
          {isLoading && <TypingIndicator />}
        </View>
        </View>
        <View style={styles.choiceOptionsContainer}>
          <View style={styles.choiceOptionsGrid}>
            {choiceOptions.map((option) => (
              <ChoiceButton
                key={option.id}
                option={option}
                isSelected={selectedOptions.includes(option.id)}
                onPress={() => toggleOption(option.id)}
              />
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={styles.CTAWrapper}>
        <View style={styles.CTAGroup1}>
          <View style={styles.btn55Container}>
            <TouchableOpacity style={styles.whiteButton} onPress={() => setMode("type")}>
              <Ionicons name="chatbubble-ellipses-outline" style={{fontSize: 24}} color={COLORS.onPrimaryContainer} />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>type</Text>
          </View>
          <View style={styles.btn55Container}>
            <TouchableOpacity style={styles.whiteButton} onPress={() => setMode("idle")}>
              <Image
                source={require("./../../assets/images/yap-icon.png")}
                style={{ width: scale(24), height: scale(24) }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>yap</Text>
          </View>
        </View>
<View>
          <View style={styles.btn55Container}>
            <TouchableOpacity
              style={[
                styles.sendButtonLg,
                selectedOptions.length === 0 && styles.sendButtonDisabled
              ]}
              onPress={sendSelectedOptions}
              disabled={selectedOptions.length === 0}
            >
              <LinearGradient
                colors={selectedOptions.length > 0 ? [COLORS.gradPurple, COLORS.gradPink] : ['#E3B2C5', '#E3B2C5']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.btnLabel}>
              {selectedOptions.length > 0 ? `send (${selectedOptions.length})` : 'send'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );


  const navigateToIndex = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      // Fallback to navigation.goBack() if onBackToHome is not provided
      navigation.goBack();
    }
  };

  const renderContent = () => (
    <View style={[styles.root, mode === "idle" && styles.rootIdle]}>
      <Header 
        onClose={navigateToIndex} 
        title={getHeaderTitle()} 
      />

      {mode === "idle" && renderIdleMode()}
      {mode === "type" && renderTypeMode()}
      {mode === "tap" && renderTapMode()}

      {/* Background Gradients */}
      <LinearGradient
        colors={[
          "#A29AEA",   // lavender
          "#C17EC9",   // purple-pink
          "#D482B9",
          "#E98BAC",
          "#FDC6D1",
          // "#ffffff"  // soft pink
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

      {mode === "idle" && (
        <FooterCTA 
          setMode={setMode} 
          disabled={showSlider || showSelectedValue}
          isRecording={isRecording}
          recordingComplete={recordingComplete}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSendRecording={sendRecording}
        />
      )}
</View>
  );

  if (!fontsLoaded) {
    return null; // or a loading component
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark"/>
      {mode === "type" ? (
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        renderContent()
      )}
    </SafeAreaView>
  );
  // return (
  //   <SafeAreaView style={styles.container} edges={["top"]}>
  //   <StatusBar style="dark" />
  //   <KeyboardAvoidingView
  //     style={styles.kav}
  //     behavior={Platform.OS === "ios" ? "padding" : undefined}
  //     keyboardVerticalOffset={0}
  //   >
  //     {renderContent()}
  //   </KeyboardAvoidingView>
  // </SafeAreaView>
  // );
}

// Styles
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    // ...(isAndroid && {
    //   minHeight: screenHeight,
    // }),
  },
  kav: {
    flex: 1,
  },
  root: {
    flex: 1,
    paddingHorizontal: scale(15),
    width: '100%',
    maxWidth: screenWidth,
  },
  rootIdle: {
    overflow: 'hidden', // Prevent any scrolling in idle mode
    // height: screenHeight, // Fixed height to prevent vertical scroll
  },

  // Background gradients
  gradientBase: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(124),
    zIndex: -1,
  },
  gradientFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(124),
    zIndex: -1,
  },

  // Chat interface
  messagesContainer: {
    flex: 1,
    marginTop: verticalScale(-50),
    width: '100%',
  },
  scrollContent: {
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(20),
    flexGrow: 1,
    ...(isAndroid && {
      paddingBottom: verticalScale(40),
    }),
  },
  messagesWrapper: {
    // paddingTop: verticalScale(20),
  },

  // AUVRA Avatar styles
  auvraAvatarContainer: {
    marginRight: scale(8),
    marginTop: verticalScale(2),
  },
  auvraAvatarGradient: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  auvraAvatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['NotoSerif-Medium'],
    fontWeight: '600',
  },
  
  // Message bubbles
  botMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(15),
    zIndex: 1,
    width: '100%',
  },
  botMessageContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
  },
  botMessageNoAvatar: {
    marginLeft: scale(36), // Account for missing avatar space
  },
  // Typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: verticalScale(15),
    zIndex: 1,
    width: '100%',
  },
  typingBubble: {
    borderRadius: scale(10),
    overflow: 'hidden',
    maxWidth: '70%',
  },
  typingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(8),
  },
  typingDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: scale(3),
  },
  typingDotActive: {
    backgroundColor: COLORS.white,
    transform: [{ scale: 1.2 }],
  },
  typingText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(15),
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
  },
  loadingText: {
    marginLeft: scale(10),
    fontSize: FONT_SIZES.small,
    color: COLORS.greyMedium,
    fontStyle: 'italic',
  },
  messageTimestamp: {
    fontSize: FONT_SIZES.extraSmall,
    color: COLORS.greyLight,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    marginTop: verticalScale(4),
    marginLeft: scale(4),
  },
  messageTimestampRight: {
    textAlign: 'right',
    marginRight: scale(4),
    marginLeft: 0,
  },
  messageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scale(4),
  },
  messageStatusIcon: {
    marginTop: verticalScale(4),
  },
  botMessageBubble: {
    maxWidth: '80%',
    backgroundColor: COLORS.white,
    borderRadius: scale(10),
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    flexShrink: 1,
    ...(isAndroid && {
      elevation: 1,
      shadowColor: COLORS.outlineVariant,
      shadowOffset: { width: 0, height: verticalScale(1) },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    }),
  },
  botMessageText: {
    fontSize: FONT_SIZES.message,
    lineHeight: LINE_HEIGHTS.normal,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
    flex: 1,
    flexWrap: 'wrap',
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: verticalScale(15),
    // paddingRight: scale(15),
    zIndex: 1,
    width: '100%',
  },
  userMessageBubble: {
    maxWidth: '80%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderTopRightRadius: 0,
    borderColor: COLORS.outlineVariant,
    borderRadius: scale(10),
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    flexShrink: 1,
    ...(isAndroid && {
      elevation: 1,
      shadowColor: COLORS.outlineVariant,
      shadowOffset: { width: 0, height: verticalScale(1) },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    }),
  },
  userMessageText: {
    fontSize: FONT_SIZES.message,
    lineHeight: LINE_HEIGHTS.normal,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.onSurface,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
    flex: 1,
    flexWrap: 'wrap',
  },
  recordingStatusContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
  },
  recordingStatusText: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyMedium,
    textAlign: 'center',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    // paddingVertical: verticalScale(15),
    // paddingHorizontal: scale(15),
    marginBottom: verticalScale(20),
    marginTop: verticalScale(10),
    width: '100%',
  },
  // inputField: {
  //   flex: 1,
  //   backgroundColor: COLORS.white,
  //   borderRadius: scale(10),
  //   paddingHorizontal: scale(20),
  //   paddingVertical: verticalScale(15),
  //   marginRight: scale(10),
  //   height: verticalScale(50),
  //   // maxHeight: verticalScale(150),
  //   width: scale(200),
  //   borderWidth: 1,
  //   borderColor: COLORS.outlineVariant,
  //   ...(isAndroid && {
  //     elevation: 1,
  //     shadowColor: COLORS.outlineVariant,
  //     shadowOffset: { width: 0, height: verticalScale(1) },
  //     shadowOpacity: 0.1,
  //     shadowRadius: 1,
  //   }),
  // },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: scale(10),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    marginRight: scale(10),
    // height: verticalScale(50),  // ✅ fixed height
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  textInput: {
    fontSize: FONT_SIZES.small,        // e.g. 14
    lineHeight: FONT_SIZES.message,// e.g. 18 → taller than font
    color: COLORS.onSurface,
    flex: 1,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined, // Better for multiline 
    paddingVertical: 0,
  },
  // textInput: {
  //   fontSize: FONT_SIZES.message,
  //   // lineHeight: 12,
  //   color: COLORS.onSurface,
  //   flex: 1,   
  //   height: '100%',
  //   // minHeight: verticalScale(20),
  //   // maxHeight: verticalScale(120), // Allow multiline expansion
  //   includeFontPadding: isAndroid ? false : undefined,
  //   textAlignVertical: isAndroid ? 'top' : undefined, // Better for multiline
  //   flexWrap: 'wrap',
  //   textAlign: 'left',
  // },

  // Buttons
  whiteButton: {
    width: scale(50),
    height: scale(50),
    backgroundColor: COLORS.white,
    borderRadius: scale(50),
    marginRight: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(44), // Minimum touch target
    minHeight: scale(44),
    ...(isAndroid && {
      elevation: 2,
      shadowColor: COLORS.outlineVariant,
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  sendButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(30),
    minWidth: scale(44),
    minHeight: scale(44),
    
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonLg: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(27.5),
    // marginRight: scale(10),
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(27.5),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Choice options
  choiceOptionsContainer: {
    // paddingHorizontal: scale(15),
    // paddingVertical: verticalScale(20),
    width: '100%',
  },
  choiceOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: scale(5),
    paddingBottom: verticalScale(10),
    width: '100%',
  },
  choiceButton: {
    width: 'auto',
    marginBottom: verticalScale(5),
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 44, // Consistent height for both states
    ...(isAndroid && {
      elevation: 1,
      shadowColor: COLORS.outlineVariant,
      shadowOffset: { width: 0, height: verticalScale(1) },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    }),
  },
  choiceButtonSelected: {
    // Additional styles for selected state if needed
  },
  choiceButtonGradient: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    flex: 1,
    width: '100%',
  },
  choiceButtonTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  choiceButtonText: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    fontWeight: '400',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: LINE_HEIGHTS.normal,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  choiceButtonTextUnselected: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    fontWeight: '400',
    color: COLORS.onSurface,
    textAlign: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FDF4F8',
    borderRadius: 20,
    minHeight: 44,
    lineHeight: LINE_HEIGHTS.normal,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  // CTA wrapper
  CTAWrapper: {
    flexDirection: 'row',
    // paddingVertical: verticalScale(15),
    // paddingHorizontal: scale(15),
    marginBottom: verticalScale(20),
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  CTAGroup1: {
    flexDirection: 'row',
  },
  btn55Container: {
    alignItems: "center",
  },
  btnLabel: {
    marginTop: verticalScale(9),
    color: COLORS.onSurface,
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },

  // Yap mode styles
  yapContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  statusContainer: {
    // marginVertical: 20,
  },
  statusText: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyMedium,
    textAlign: 'center',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  timerContainer: {
    // marginVertical: 40,
  },
  timerText: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.onSurface,
    textAlign: 'center',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  yapSendButtonContainer: {
    alignItems: 'center',
    marginTop: verticalScale(10),
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(15),
    marginBottom: verticalScale(25),
    width: '100%',
  },
  yapSendButton: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: isAndroid ? 8 : 0,
    minWidth: 80,
    minHeight: 80,
  },
  yapSendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  yapSendButtonLabel: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.onSurface,
    textAlign: 'center',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },

  // Idle mode container
  idleModeContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden', // Prevent scrolling
    maxHeight: screenHeight - 100, // Account for header and footer
  },
  sliderPageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden', // Prevent scrolling
    maxHeight: screenHeight - 150, // Account for header and footer
  },
  sliderTopSpacer: {
    flex: 1,
    minHeight: verticalScale(50),
  },
  sliderBottomSpacer: {
    flex: 1,
    minHeight: verticalScale(50),
  },

  // Slider styles
  sliderContainer: {
    // paddingHorizontal: scale(20), // Changed to horizontal padding for better balance
    // paddingVertical: verticalScale(30),
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    // Removed overflow: 'hidden' to prevent cropping
  },
  sliderNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from space-between to space-evenly
    marginBottom: scale(15),
    width: '100%',
    maxWidth: '100%',
    paddingLeft: scale(15),
    // paddingHorizontal: scale(15), // Increased padding to prevent edge cropping
    flexWrap: 'nowrap',
    // Removed overflow: 'hidden' to prevent cropping
  },
  sliderNumber: {
    width: scale(30), // Slightly smaller to ensure all 9 numbers fit
    height: scale(30), // Slightly smaller to ensure all 9 numbers fit
    borderRadius: scale(8),
    marginHorizontal: scale(1), // Use horizontal margin instead of just right
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scale(28), // Reduced minimum size to fit better
    minHeight: scale(28),
    // Removed flex: 1 to prevent stretching
    ...(isAndroid && {
      elevation: 1,
      shadowColor: COLORS.outlineVariant,
      shadowOffset: { width: 0, height: verticalScale(1) },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    }),
  },
  sliderNumberSelected: {
    borderColor: COLORS.onPrimaryContainer,
    borderWidth: scale(2),
  },
  sliderNumberText: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.onSurface,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed to match sliderNumbers
    // paddingHorizontal: scale(15), // Match the sliderNumbers padding
    paddingLeft: scale(15),
    width: '100%',
    maxWidth: '100%',
    flexWrap: 'nowrap',
    // Removed overflow: 'hidden' to prevent cropping
  },
  sliderLabel: {
    fontSize: FONT_SIZES.caption,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyLight,
    textAlign: 'center',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
    // Removed flex: 1 to prevent stretching issues
    minWidth: scale(40), // Ensure labels have enough space
  },
  selectedValueContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
  },
  selectedValueNumber: {
    fontSize: FONT_SIZES.large,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.warmPurple,
    fontWeight: 'bold',
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  selectedValueLabel: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.warmPurple,
    marginTop: moderateScale(5),
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  
  // Quick Reply Styles
  quickRepliesContainer: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
    paddingLeft: scale(36), // Align with messages (after avatar)
  },
  quickRepliesScroll: {
    paddingRight: scale(15),
    gap: scale(8),
    flexDirection: 'row',
  },
  quickReplyButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gradPurple,
    borderRadius: scale(20),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    marginRight: scale(8),
  },
  quickReplyText: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['Inter-Medium'],
    color: COLORS.onPrimaryContainer,
  },
  
  // Idle Input Styles
  idleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDivider,
  },
  idleInputButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(12),
    marginRight: scale(10),
  },
  idleInputPlaceholder: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyLight,
    marginLeft: scale(10),
  },
  idleMicButton: {
    backgroundColor: COLORS.white,
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
