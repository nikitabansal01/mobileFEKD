import Avatar from "@/components/customComponent/AvatarChatbot";
import Header from "@/components/customComponent/ChatbotHeader";
import FooterCTA from "@/components/customComponent/FooterChatbotCTA";
import PrimaryButton from "@/components/PrimaryButton";
import weeklyCheckinService, { QuestionResponse, TapOption } from "@/services/weeklyCheckinService";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

type Message = {
  id: string;
  text: string;
  isBot: boolean;
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

function TypewriterText({ text, style, onComplete }: { text: string; style?: any; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Reset if text changes
    setDisplayedText("");
    setIsComplete(false);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, 15); // Speed of typing (faster for fluidity)
    
    return () => clearInterval(timer);
  }, [text]);

  return <GradientText style={style}>{displayedText}</GradientText>;
}

function BotMessage({ text, animate = false }: { text: string; animate?: boolean }) {
  return (
    <View style={styles.botMessageContainer}>
      <View style={styles.botMessageBubble}>
        {animate ? (
          <TypewriterText style={styles.botMessageText} text={text} />
        ) : (
          <GradientText style={styles.botMessageText}>{text}</GradientText>
        )}
      </View>
    </View>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <View style={styles.userMessageContainer}>
      <View style={styles.userMessageBubble}>
        <Text style={styles.userMessageText}>{text}</Text>
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
  return (
    <TouchableOpacity
      style={[
        styles.choiceButton,
        isSelected && styles.choiceButtonSelected
      ]}
      onPress={onPress}
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
  
  // Weekly Check-in state
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [dynamicTapOptions, setDynamicTapOptions] = useState<TapOption[]>([]);
  
  // Show continue button after check-in completion
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  
  // Handle conversation context from different chats
  useEffect(() => {
    const contextFromRoute = route?.params?.conversationContext;
    
    if (contextFromRoute?.context === "care_plan_modal") {
      // Care Plan check-in modal content - show the question and user response if available
      const messages = [
        { id: "1", text: "How does your care plan look today?", isBot: true },
      ];
      
      // Add user response if available (from HomeScreen modal)
      if (contextFromRoute.userResponse) {
        messages.push({
          id: "2", 
          text: contextFromRoute.userResponse, 
          isBot: false
        });
        
        // Add follow-up question based on user response
        let followUpQuestion = "How does your care plan look today?";
        
        if (contextFromRoute.userResponse === "👍 It works for me") {
          followUpQuestion = "That's great! What's working well for you today?";
        } else if (contextFromRoute.userResponse === "👎 I want to change it") {
          followUpQuestion = "I understand. What would you like to change about your plan?";
        }
        
        messages.push({
          id: "3",
          text: followUpQuestion,
          isBot: true
        });
      }
      
      setMessages(messages);
      // Set mode to idle so user can use yap button
      setMode("idle");
      // Disable slider and selected value for care plan modal
      setShowSlider(false);
      setShowSelectedValue(false);
    } else if (contextFromRoute?.context === "weekly_checkin") {
      // Weekly check-in flow - start or resume from API
      initializeWeeklyCheckin();
    } else {
      // Default: Initialize weekly check-in from API
      initializeWeeklyCheckin();
    }
  }, [route?.params?.conversationContext]);
  
  // Initialize weekly check-in from API
  const initializeWeeklyCheckin = async () => {
    setIsLoadingCheckin(true);
    try {
      const result = await weeklyCheckinService.startCheckin();
      
      if (result) {
        setCheckinId(result.checkin_id);
        setCurrentQuestion(result.question);
        setDynamicTapOptions(result.question.tap_options || []);
        
        // Set messages from history if available, otherwise use current message
        if (result.question.history && result.question.history.length > 0) {
          setMessages(result.question.history);
        } else if (result.question.messages && result.question.messages.length > 0) {
          // Use messages array for multi-bubble display
          const bubbleMessages: Message[] = result.question.messages.map((text: string, index: number) => ({
            id: `${Date.now()}_${index}`,
            text: text,
            isBot: true,
          }));
          setMessages(bubbleMessages);
        } else {
          setMessages([
            { id: "1", text: result.question.message, isBot: true },
          ]);
        }
        
        // Set mode based on question type
        if (result.question.question_type === "slider") {
          setShowSlider(true);
          setMode("idle");
        } else if (result.question.question_type === "tap_choice" || result.question.question_type === "multi_select") {
          setShowSlider(false);
          setMode("tap");
        } else {
          setShowSlider(false);
          setMode("idle");
        }
        
        setShowSelectedValue(false);
      } else {
        // Fallback if API fails
        setMessages([
          { id: "1", text: "Let's do a quick check-in. How are you feeling this week?", isBot: true },
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize weekly check-in:', error);
      setMessages([
        { id: "1", text: "Let's do a quick check-in. How are you feeling this week?", isBot: true },
      ]);
    }
    setIsLoadingCheckin(false);
  };
  
  // Submit response and get next question
  const submitCheckinResponse = async (response: any, displayText: string) => {
    if (!checkinId || !currentQuestion) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: displayText,
      isBot: false,
    };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();
    
    setIsLoadingCheckin(true);
    try {
      const result = await weeklyCheckinService.submitResponse(
        checkinId,
        currentQuestion.question_key || '',
        response,
        displayText
      );
      
      if (result) {
        setCurrentQuestion(result.question);
        setDynamicTapOptions(result.question.tap_options || []);
        
        // Update messages from history if available
        if (result.question.history && result.question.history.length > 0) {
          setMessages(result.question.history);
        } else if (result.question.messages && result.question.messages.length > 0) {
          // Use messages array for multi-bubble display
          const botMessages: Message[] = result.question.messages.map((text: string, index: number) => ({
            id: `${Date.now()}_${index}_bot`,
            text: text,
            isBot: true,
          }));
          setMessages(prev => [...prev, ...botMessages]);
        } else {
          // Fallback: Add bot response manually
          const botMessage: Message = {
            id: Date.now().toString() + "_bot",
            text: result.question.message,
            isBot: true,
          };
          setMessages(prev => [...prev, botMessage]);
        }
        scrollToBottom();
        
        // Update mode based on next question type
        if (result.question.is_complete) {
          // Check-in complete - show continue button instead of auto-navigation
          setMode("idle");
          setShowSlider(false);
          setShowContinueButton(true);
        } else if (result.question.question_type === "slider") {
          setShowSlider(true);
          setSliderValue(0);
          setMode("idle");
        } else if (result.question.question_type === "tap_choice" || result.question.question_type === "multi_select") {
          setShowSlider(false);
          setSelectedOptions([]);
          setMode("tap");
        } else {
          setShowSlider(false);
          setMode("idle");
        }
      }
    } catch (error) {
      console.error('Failed to submit check-in response:', error);
    }
    setIsLoadingCheckin(false);
  };
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderHoverValue, setSliderHoverValue] = useState<number | null>(null);
  const [showSlider, setShowSlider] = useState(false);  // Start false - only show when question type is slider
  const [showSelectedValue, setShowSelectedValue] = useState(false);

  // Get choice options based on context
  const getChoiceOptions = (): ChoiceOption[] => {
    const contextFromRoute = route?.params?.conversationContext;
    
    // Use dynamic tap options from API for weekly check-in
    if (contextFromRoute?.context === "weekly_checkin" && dynamicTapOptions.length > 0) {
      return dynamicTapOptions;
    }
    
    switch (contextFromRoute?.context) {
      case "care_plan_modal":
        return [
          { id: "want-to-change", text: "👎 I want to change it" },
          { id: "skip-actions", text: "⏩ I want to skip some actions for today" },
          { id: "alternate-suggestions", text: "🔁 I want alternate suggestions" },
        ];
      case "weekly_checkin":
        // Fallback options if API didn't return any
        return [
          { id: "acne", text: "Acne" },
          { id: "bloating", text: "Bloating" },
          { id: "mood_swings", text: "Mood swings" },
          { id: "fatigue", text: "Fatigue" },
          { id: "cramps", text: "Cramps" },
          { id: "headaches", text: "Headaches" },
        ];
      case "symptom_checkin":
        return [
          { id: "ate-out-more", text: "Ate out more" },
          { id: "ate-more-carbs", text: "Ate more carbs" },
          { id: "ate-more-dairy", text: "Ate more dairy" },
          { id: "skipped-meals", text: "Skipped meals" },
          { id: "untimely-eating", text: "Untimely eating" },
          { id: "less-sleep", text: "Less sleep" },
          { id: "more-stress", text: "More stress/workload" },
          { id: "more-caffeine", text: "More caffeine" },
          { id: "more-alcohol", text: "More alcohol" },
        ];
      case "personalise":
        return [
          { id: "add-factors", text: "Add personalisation factors" },
          { id: "update-preferences", text: "Update my preferences" },
          { id: "customise-plan", text: "Customise my action plan" },
        ];
      case "know_body":
        return [
          { id: "learn-phases", text: "Learn about menstrual phases" },
          { id: "hormone-info", text: "Understand hormone changes" },
          { id: "body-symptoms", text: "Track body symptoms" },
        ];
      default:
        return [
          { id: "ate-out-more", text: "Ate out more" },
          { id: "ate-more-carbs", text: "Ate more carbs" },
          { id: "ate-more-dairy", text: "Ate more dairy" },
          { id: "skipped-meals", text: "Skipped meals" },
          { id: "untimely-eating", text: "Untimely eating" },
          { id: "less-sleep", text: "Less sleep" },
          { id: "more-stress", text: "More stress/workload" },
          { id: "more-caffeine", text: "More caffeine" },
          { id: "more-alcohol", text: "More alcohol" },
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
      case "weekly_checkin":
        return "Weekly Check-in";
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

  const handleSend = (text?: string) => {
    const messageText = text || value.trim();
    if (messageText) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isBot: false,
      };
      setMessages(prev => [...prev, newMessage]);
      console.log("Sent:", messageText);
      if (!text) setValue("");

      // Add bot response after a short delay
      setTimeout(() => {
        const contextFromRoute = route?.params?.conversationContext;
        let botResponse: Message;
        
        if (contextFromRoute?.context === "care_plan_modal") {
          // Care Plan modal - ask a follow-up question based on user response
          const userResponse = contextFromRoute.userResponse;
          let followUpQuestion = "How does your care plan look today?";
          
          if (userResponse === "👍 It works for me") {
            followUpQuestion = "That's great! What's working well for you today?";
          } else if (userResponse === "👎 I want to change it") {
            followUpQuestion = "I understand. What would you like to change about your plan?";
          }
          
          botResponse = {
            id: Date.now().toString() + "_bot",
            text: followUpQuestion,
            isBot: true,
          };
        } else if (contextFromRoute?.context === "symptom_checkin") {
          // Symptom checkin - ask the question again
          botResponse = {
            id: Date.now().toString() + "_bot",
            text: "See any progress with your symptoms? Track progress, wins, difficulties...",
            isBot: true,
          };
        } else if (contextFromRoute?.context === "personalise") {
          // Personalise - ask the question again
          botResponse = {
            id: Date.now().toString() + "_bot",
            text: "Want to Personalise? Add 25+ personalisation factors to improve your action plan",
            isBot: true,
          };
        } else if (contextFromRoute?.context === "know_body") {
          // Know my body - ask the question again
          botResponse = {
            id: Date.now().toString() + "_bot",
            text: "Know my body. Know more about menstrual phase, hormones and how it changes",
            isBot: true,
          };
        } else {
          // Default response
          botResponse = {
            id: Date.now().toString() + "_bot",
            text: "Were there any big changes in your week? related to food, lifestyle, stress, etc",
            isBot: true,
          };
        }
        
        setMessages(prev => [...prev, botResponse]);
        scrollToBottom();
      }, 500);

      // Scroll to bottom after adding new message
      scrollToBottom();
    }
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const sendSelectedOptions = () => {
    if (selectedOptions.length > 0) {
      const selectedTexts = selectedOptions.map(id =>
        choiceOptions.find(option => option.id === id)?.text
      ).filter(Boolean);

      const messageText = selectedTexts.join(", ");
      
      // Use API for weekly check-in
      const contextFromRoute = route?.params?.conversationContext;
      if (contextFromRoute?.context === "weekly_checkin" && checkinId && currentQuestion) {
        // For multi_select, send array; for tap_choice, send single value
        const response = currentQuestion.question_type === "multi_select" 
          ? selectedOptions 
          : selectedOptions[0];
        submitCheckinResponse(response, messageText);
      } else {
        handleSend(messageText);
      }
      
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
    // Simulate transcription by putting text in input and switching to type mode
    const voiceMessage = `[Transcribed] I'm feeling a bit overwhelmed this week...`; 
    // In a real app, this would come from STT API
    
    setValue(voiceMessage);
    setMode("type");
    setRecordingComplete(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeverityLabel = (value: number) => {
    // Use API-provided slider labels if available
    if (currentQuestion?.slider_labels) {
      const labels = currentQuestion.slider_labels;
      // Check for exact match first
      if (labels[String(value)]) return labels[String(value)];
      // Otherwise find closest label
      if (value <= 2) return labels["1"] || labels["2"] || "None";
      if (value <= 4) return labels["3"] || labels["4"] || "Mild";
      if (value <= 6) return labels["5"] || labels["6"] || "Moderate";
      if (value <= 8) return labels["7"] || labels["8"] || "Strong";
      return labels["9"] || "Extreme";
    }
    
    // Default labels
    if (value === 1) return "None";
    if (value <= 3) return "Mild";
    if (value <= 5) return "Moderate";
    if (value <= 7) return "Strong";
    return "Extreme";
  };

  const handleSliderSelection = (value: number) => {
    // Prevent selection during loading or without valid check-in state
    const contextFromRoute = route?.params?.conversationContext;
    if (contextFromRoute?.context === "weekly_checkin") {
      if (isLoadingCheckin || !checkinId || !currentQuestion) {
        console.log('Slider selection blocked - loading or no check-in state:', { isLoadingCheckin, checkinId, currentQuestion });
        return;  // Block selection until API is ready
      }
    }
    
    setSliderValue(value);
    setShowSlider(false);
    setShowSelectedValue(true);

    // Use API for weekly check-in slider questions
    if (contextFromRoute?.context === "weekly_checkin" && checkinId && currentQuestion) {
      submitCheckinResponse(value, `${getSeverityLabel(value)} (${value}/9)`);
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
                    <BotMessage text={message.text} animate={index === messages.length - 1} animate={index === messages.length - 1} />
                  ) : (
                    <UserMessage text={message.text} />
                  )}
                </View>
              ))}
            </View>
            </View>
          </ScrollView>

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
        {isLoadingCheckin && !showSlider && !showSelectedValue && messages.length === 0 ? (
          // Show loading state while initializing weekly check-in
          <View style={styles.sliderPageContainer}>
            <View style={styles.sliderTopSpacer} />
            <Avatar showMessage={true} />
            <View style={styles.selectedValueContainer}>
              <Text style={styles.selectedValueLabel}>Loading check-in...</Text>
            </View>
            <View style={styles.sliderBottomSpacer} />
          </View>
        ) : (
          <>
            <ScrollView
              ref={idleScrollRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                showContinueButton && { paddingBottom: verticalScale(100) }
              ]}
            >
              <Avatar showMessage={false} />
              <View style={styles.messagesWrapper}>
                {/* Show all messages from the messages array */}
                {messages.map((message, index) => (
                  <View key={message.id}>
                    {message.isBot ? (
                      <BotMessage text={message.text} />
                    ) : (
                      <UserMessage text={message.text} />
                    )}
                  </View>
                ))}
              </View>
              
              {/* Render Slider INLINE if active */}
              {showSlider && (
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
                    <Text style={styles.sliderLabel}>{currentQuestion?.slider_labels?.["1"] || "None"}</Text>
                    <Text style={styles.sliderLabel}>{currentQuestion?.slider_labels?.["3"] || "Mild"}</Text>
                    <Text style={styles.sliderLabel}>{currentQuestion?.slider_labels?.["5"] || "Moderate"}</Text>
                    <Text style={styles.sliderLabel}>{currentQuestion?.slider_labels?.["7"] || "Strong"}</Text>
                    <Text style={styles.sliderLabel}>{currentQuestion?.slider_labels?.["9"] || "Extreme"}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

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
                <BotMessage text={message.text} animate={index === messages.length - 1} />
              ) : (
                <UserMessage text={message.text} />
              )}
            </View>
          ))}
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
                <BotMessage text={message.text} animate={index === messages.length - 1} />
              ) : (
                <UserMessage text={message.text} />
              )}
            </View>
          ))}
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

      {mode === "idle" && !showContinueButton && (
        <FooterCTA 
          setMode={(newMode) => {
            // If showing slider and user clicks tap, stay in idle (slider view)
            if (showSlider && newMode === "tap") {
              setMode("idle");
            } else {
              setMode(newMode);
            }
          }} 
          disabled={showSlider}
          isRecording={isRecording}
          recordingComplete={recordingComplete}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSendRecording={sendRecording}
        />
      )}
      
      {/* Continue button after check-in completion */}
      {showContinueButton && (
        <View style={styles.continueButtonContainer}>
          <PrimaryButton
            title="Continue to Home"
            onPress={() => {
              setShowContinueButton(false);
              navigation.navigate('MainScreenTabs', {
                screen: 'HomeScreen',
                params: { shouldRefresh: true }
              });
            }}
          />
        </View>
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

  // Message bubbles
  botMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: verticalScale(15),
    zIndex: 1,
    width: '100%',
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
    fontFamily: 'Inter400',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: LINE_HEIGHTS.normal,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  choiceButtonTextUnselected: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    fontFamily: 'Inter400',
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
    fontFamily: 'Inter600',
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
  continueButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(30),
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(10) : 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
