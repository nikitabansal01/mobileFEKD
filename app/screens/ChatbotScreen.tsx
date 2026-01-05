import Avatar from "@/components/customComponent/AvatarChatbot";
import Header from "@/components/customComponent/ChatbotHeader";
import FooterCTA from "@/components/customComponent/FooterChatbotCTA";
import PrimaryButton from "@/components/PrimaryButton";
import PlanManagerModal from "@/components/PlanManagerModal";
import SymptomManagerModal from "@/components/SymptomManagerModal";
import carePlanCheckinService, { TapOption as CarePlanTapOption } from "@/services/carePlanCheckinService";
import homeService, { ActionPlanResponse, AssignmentsResponse } from "@/services/homeService";
import { rewardService, RewardsStatusResponse } from "@/services/rewardService";
import chatService from "@/services/chatService";
import symptomCheckinService, { TapOption as SymptomTapOption } from "@/services/symptomCheckinService";
import symptomTrackingService, { SymptomOverviewResponse } from "@/services/symptomTrackingService";
import weeklyCheckinService, { QuestionResponse, TapOption } from "@/services/weeklyCheckinService";
import type { UIBlock, UIBlockAction, UIEventRequest } from "@/utils/uiBlocks";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES, useAppFonts } from '../../constants/fonts';
import { BRAND, BRAND_GRADIENT, COLORS } from '../../constants/Colors';


// Responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';

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

// Types
type Mode = "idle" | "tap" | "yap" | "type";

type Message = {
  id: string;
  text: string;
  isBot: boolean;
};

// Stable, lightweight hash to keep message IDs deterministic across refreshes
const hashText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
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
        colors={[BRAND.gradPurple, BRAND.gradPink]} 
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

function BotMessage({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.botMessageContainer}>
      <View style={styles.botMessageBubble}>
        <GradientText style={styles.botMessageText}>{text}</GradientText>
      </View>
    </View>
  );
}

function BotThinkingMessage() {
  const [dots, setDots] = useState<'.' | '..' | '...'>('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === '.' ? '..' : prev === '..' ? '...' : '.'));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return <BotMessage text={`Thinking${dots}`} />;
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
  MainScreenTabs: {
    screen?: string;
    params?: Record<string, any>;
  } | undefined;
  PaywallScreen: undefined;
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
  const [uiBlocks, setUiBlocks] = useState<UIBlock[]>([]);

  // Generic chat session (used for personalise / know_body / general)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  const isCarePlanContext = route?.params?.conversationContext?.context === 'care_plan_modal';
  const isSymptomContext = route?.params?.conversationContext?.context === 'symptom_checkin';
  
  // Weekly Check-in state
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [dynamicTapOptions, setDynamicTapOptions] = useState<TapOption[]>([]);

  // Care Plan (daily) check-in state
  const [carePlanThreadId, setCarePlanThreadId] = useState<string | null>(null);
  const [carePlanTapOptions, setCarePlanTapOptions] = useState<CarePlanTapOption[]>([]);

  // Care Plan Plan Manager state
  const [planManagerVisible, setPlanManagerVisible] = useState(false);
  const [carePlanActionPlan, setCarePlanActionPlan] = useState<ActionPlanResponse | null>(null);
  const [carePlanRewardsStatus, setCarePlanRewardsStatus] = useState<RewardsStatusResponse | null>(null);

  // Symptom Manager state
  const [symptomManagerVisible, setSymptomManagerVisible] = useState(false);
  const [symptomOverview, setSymptomOverview] = useState<SymptomOverviewResponse | null>(null);

  // Symptom (daily) check-in state
  const [symptomThreadId, setSymptomThreadId] = useState<string | null>(null);
  const [symptomTapOptions, setSymptomTapOptions] = useState<SymptomTapOption[]>([]);
  
  // Show continue button after check-in completion
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  
  // Handle conversation context from different chats
  useEffect(() => {
    const contextFromRoute = route?.params?.conversationContext;

    // Prevent UI blocks from leaking between contexts.
    setUiBlocks([]);
    setChatSessionId(null);
    
    if (contextFromRoute?.context === "care_plan_modal") {
      // Care Plan check-in (daily thread) - start or resume from API
      initializeCarePlanCheckin(contextFromRoute?.userResponse);
      // Also preload plan + token counts for Plan Manager UI
      refreshCarePlanPlanManagerData();
    } else if (contextFromRoute?.context === "symptom_checkin") {
      // Symptom check-in (daily thread)
      initializeSymptomCheckin();
      refreshSymptomOverview();
    } else if (contextFromRoute?.context === "weekly_checkin") {
      // Weekly check-in flow - start or resume from API
      initializeWeeklyCheckin();
    } else if (contextFromRoute?.context === "personalise") {
      initializePersonaliseChat(contextFromRoute);
    } else {
      // Default: Initialize weekly check-in from API
      initializeWeeklyCheckin();
    }
  }, [route?.params?.conversationContext]);

  const initializePersonaliseChat = async (contextFromRoute?: any) => {
    setIsLoadingCheckin(true);
    setChatSessionId(null);
    try {
      const seedMessage =
        (contextFromRoute?.userResponse && contextFromRoute.userResponse !== 'Continue conversation'
          ? contextFromRoute.userResponse
          : contextFromRoute?.initialMessage) ||
        'I want to personalise';

      const result = await chatService.sendMessage({
        message: seedMessage,
        conversation_context: 'personalise',
        input_mode: 'tap',
        session_id: null,
      });

      if (result) {
        setChatSessionId(result.session_id);
        setMessages([
          {
            id: `chat_${result.session_id}_bot_0`,
            text: result.content || 'Let\'s personalise your plan.',
            isBot: true,
          },
        ]);
        setUiBlocks(result.ui_blocks || []);
        setMode('idle');
        setShowSlider(false);
        setShowSelectedValue(false);
        scrollToBottom();
        return;
      }

      setMessages([
        {
          id: 'personalise_fallback_1',
          text: 'Want to personalise? I can help you update the factors you\'ve unlocked so far.',
          isBot: true,
        },
      ]);
      setUiBlocks([]);
      setMode('idle');
      setShowSlider(false);
      setShowSelectedValue(false);
    } catch (error) {
      console.error('Failed to initialize personalise chat:', error);
      setMessages([
        {
          id: 'personalise_error_1',
          text: 'Want to personalise? I can help you update the factors you\'ve unlocked so far.',
          isBot: true,
        },
      ]);
      setUiBlocks([]);
      setMode('idle');
      setShowSlider(false);
      setShowSelectedValue(false);
    } finally {
      setIsLoadingCheckin(false);
    }
  };

  const submitChatMessage = async (conversationContext: string, messageText: string) => {
    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    setIsLoadingCheckin(true);
    try {
      const result = await chatService.sendMessage({
        message: messageText,
        conversation_context: conversationContext,
        input_mode: 'type',
        session_id: chatSessionId,
      });

      if (result) {
        if (!chatSessionId) setChatSessionId(result.session_id);
        setUiBlocks(result.ui_blocks || []);

        const botMessage: Message = {
          id: Date.now().toString() + '_bot',
          text: result.content || '',
          isBot: true,
        };
        setMessages((prev) => [...prev, botMessage]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
    setIsLoadingCheckin(false);
  };

  const refreshSymptomOverview = async () => {
    if (!isSymptomContext) return;
    try {
      const data = await symptomTrackingService.getOverview(14);
      setSymptomOverview(data);
    } catch (e) {
      // Soft-fail; symptom check-in chat should still work.
      console.warn('Failed to load symptom overview:', e);
    }
  };

  const buildActionPlanFromAssignments = (assignmentsData: AssignmentsResponse): ActionPlanResponse | null => {
    if (!assignmentsData?.plan_id) return null;

    const allActions = [
      ...(assignmentsData.assignments?.morning || []),
      ...(assignmentsData.assignments?.afternoon || []),
      ...(assignmentsData.assignments?.evening || []),
    ];

    return {
      plan_id: assignmentsData.plan_id,
      user_id: '',
      date: assignmentsData.date || '',
      phase: assignmentsData.cycle_phase || '',
      phase_day: 0,
      actions: allActions.map((action, index) => ({
        id: action.id || index,
        slot: index + 1,
        time_slot: action.time_slot || 'morning',
        category: action.category || '',
        title: action.title || '',
        specific_action: action.specific_action || '',
        purpose: action.purpose || '',
        target_hormone: action.hormones?.[0] || '',
        hormone_persona_intro: action.hormone_persona_intro || '',
        hero_image_url: action.hero_image_url || '',
        research_studies: action.research_studies || [],
        is_completed: action.is_completed || false,
        is_replaced: false,
        variants: action.variants || [],
      })),
      total_actions: assignmentsData.total_assignments || allActions.length,
      completed_actions: assignmentsData.completed_assignments || 0,
      show_feedback_prompt_after_seconds: assignmentsData.show_feedback_prompt_after_seconds || 30,
    };
  };

  const refreshCarePlanPlanManagerData = async () => {
    if (!isCarePlanContext) return;

    try {
      const [assignmentsResult, rewardsResult] = await Promise.allSettled([
        homeService.getTodayAssignments(),
        rewardService.getRewardsStatus(),
      ]);

      if (assignmentsResult.status === 'fulfilled' && assignmentsResult.value) {
        const plan = buildActionPlanFromAssignments(assignmentsResult.value);
        setCarePlanActionPlan(plan);
      }

      if (rewardsResult.status === 'fulfilled' && rewardsResult.value) {
        setCarePlanRewardsStatus(rewardsResult.value);
      }
    } catch (e) {
      console.warn('Failed to preload plan manager data:', e);
    }
  };

  const refreshCarePlanPlanOnly = async () => {
    if (!isCarePlanContext) return;
    const assignmentsData = await homeService.getTodayAssignments();
    if (assignmentsData) {
      setCarePlanActionPlan(buildActionPlanFromAssignments(assignmentsData));
    }
  };

  const detectFreezeIntent = (text: string) => {
    const t = text.trim().toLowerCase();
    if (!t) return false;
    return (
      /\bfreeze\b/.test(t) &&
      (/(streak|today|my streak|use a freeze|protect)/.test(t) || t.length <= 40)
    );
  };

  const handleCarePlanFreezeIntent = (threadId: string, messageText: string) => {
    (async () => {
      let currentStatus = carePlanRewardsStatus;

      if (!currentStatus) {
        try {
          setIsLoadingCheckin(true);
          currentStatus = await rewardService.getRewardsStatus();
          setCarePlanRewardsStatus(currentStatus);
        } catch {
          // If we can't load status, fall back to sending as a chat message.
          submitCarePlanMessage(threadId, messageText);
          return;
        } finally {
          setIsLoadingCheckin(false);
        }
      }

      const freezeCount = currentStatus?.freeze_count ?? 0;
      const missedDays = currentStatus?.missed_days_count ?? 0;
      const freezesNeeded = currentStatus?.freezes_needed ?? 1;

      Alert.alert(
        'Protect your streak?',
        freezeCount <= 0
          ? "You don't have any freeze tokens available right now. Want to send this as a message instead?"
          : missedDays > 0
            ? `You missed ${missedDays} day(s). This will use ${Math.min(freezeCount, freezesNeeded)} freeze token(s).`
            : 'This will use 1 freeze token to protect today.',
        [
          {
            text: 'Send as message',
            style: 'cancel',
            onPress: () => submitCarePlanMessage(threadId, messageText),
          },
          {
            text: freezeCount > 0 ? 'Use freeze' : 'OK',
            style: 'destructive',
            onPress: async () => {
              if (freezeCount <= 0) return;
              setIsLoadingCheckin(true);
              try {
                // Show the user's intent in chat
                setMessages((prev) => [
                  ...prev,
                  { id: Date.now().toString(), text: messageText, isBot: false },
                ]);
                scrollToBottom();

                const result = missedDays > 0 ? await rewardService.useFreezeReactive() : await rewardService.useFreezeProactive();
                const nextStatus = await rewardService.getRewardsStatus();
                setCarePlanRewardsStatus(nextStatus);

                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString() + '_bot',
                    text: result.message || 'Done — your streak is protected.',
                    isBot: true,
                  },
                ]);
                scrollToBottom();
              } catch (e: any) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString() + '_bot',
                    text: e?.message || 'Sorry — I could not apply a freeze right now.',
                    isBot: true,
                  },
                ]);
                scrollToBottom();
              } finally {
                setIsLoadingCheckin(false);
              }
            },
          },
        ]
      );
    })();
  };

  const initializeSymptomCheckin = async () => {
    setIsLoadingCheckin(true);
    try {
      const result = await symptomCheckinService.startToday();
      if (result) {
        setSymptomThreadId(result.thread_id);
        setSymptomTapOptions(result.tap_options || []);
        setUiBlocks(result.ui_blocks || []);

        const historyMessages = result.history || [];
        setMessages(historyMessages);

        setMode("idle");
        setShowSlider(false);
        setShowSelectedValue(false);
      } else {
        setMessages([{ id: "symptom_fallback_1", text: "See any progress with your symptoms today? Track progress, wins, and difficulties.", isBot: true }]);
        setUiBlocks([]);
        setMode("idle");
        setShowSlider(false);
        setShowSelectedValue(false);
      }
    } catch (error) {
      console.error("Failed to initialize symptom check-in:", error);
      setMessages([{ id: "symptom_error_1", text: "See any progress with your symptoms today? Track progress, wins, and difficulties.", isBot: true }]);
      setUiBlocks([]);
      setMode("idle");
      setShowSlider(false);
      setShowSelectedValue(false);
    }
    setIsLoadingCheckin(false);
  };

  const submitSymptomMessage = async (threadId: string, messageText: string) => {
    if (!threadId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    setIsLoadingCheckin(true);
    try {
      const result = await symptomCheckinService.sendMessage(threadId, messageText);
      if (result) {
        setSymptomTapOptions(result.tap_options || []);
        setUiBlocks(result.ui_blocks || []);
        if (result.history && result.history.length > 0) {
          setMessages(result.history);
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send symptom message:", error);
    }
    setIsLoadingCheckin(false);
  };

  // Initialize care plan check-in from API (daily thread)
  const initializeCarePlanCheckin = async (initialUserMessage?: string) => {
    setIsLoadingCheckin(true);
    try {
      const result = await carePlanCheckinService.startToday();

      if (result) {
        setCarePlanThreadId(result.thread_id);
        setCarePlanTapOptions(result.tap_options || []);
        setUiBlocks(result.ui_blocks || []);

        const historyMessages = result.history || [];
        setMessages(historyMessages);

        setMode("idle");
        setShowSlider(false);
        setShowSelectedValue(false);

        // Optional: seed the thread with a modal-provided quick response.
        if (initialUserMessage && initialUserMessage !== "Continue conversation") {
          await submitCarePlanMessage(result.thread_id, initialUserMessage);
        }
      } else {
        setMessages([{ id: "care_plan_fallback_1", text: "Quick care plan check-in — how are today’s actions going?", isBot: true }]);
        setUiBlocks([]);
        setMode("idle");
        setShowSlider(false);
        setShowSelectedValue(false);
      }
    } catch (error) {
      console.error("Failed to initialize care plan check-in:", error);
      setMessages([{ id: "care_plan_error_1", text: "Quick care plan check-in — how are today’s actions going?", isBot: true }]);
      setUiBlocks([]);
      setMode("idle");
      setShowSlider(false);
      setShowSelectedValue(false);
    }
    setIsLoadingCheckin(false);
  };

  const submitCarePlanMessage = async (threadId: string, messageText: string) => {
    if (!threadId) return;

    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    setIsLoadingCheckin(true);
    try {
      const result = await carePlanCheckinService.sendMessage(threadId, messageText);
      if (result) {
        setCarePlanTapOptions(result.tap_options || []);
        setUiBlocks(result.ui_blocks || []);
        if (result.history && result.history.length > 0) {
          setMessages(result.history);
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send care plan message:", error);
    }
    setIsLoadingCheckin(false);
  };
  
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
          const historyMessages = result.question.history;
          setMessages(historyMessages);
        } else if (result.question.messages && result.question.messages.length > 0) {
          // Use messages array for multi-bubble display
          const bubbleMessages: Message[] = result.question.messages.map((text: string, index: number) => ({
            id: `msg_${result.checkin_id}_${result.question.question_key || 'q'}_${index}_${hashText(text)}`,
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
            id: `msg_${checkinId || 'checkin'}_${result.question.question_key || 'q'}_${index}_${hashText(text)}`,
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStartingRecordingRef = useRef(false);
  const [sliderHoverValue, setSliderHoverValue] = useState<number | null>(null);
  const [showSlider, setShowSlider] = useState(false);  // Start false - only show when question type is slider
  const [showSelectedValue, setShowSelectedValue] = useState(false);

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, []);

  // Get choice options based on context
  const getChoiceOptions = (): ChoiceOption[] => {
    const contextFromRoute = route?.params?.conversationContext;
    
    // Use dynamic tap options from API for weekly check-in
    if (contextFromRoute?.context === "weekly_checkin" && dynamicTapOptions.length > 0) {
      return dynamicTapOptions;
    }
    
    switch (contextFromRoute?.context) {
      case "care_plan_modal":
        if (carePlanTapOptions.length > 0) return carePlanTapOptions;
        return [
          { id: "want-to-change", text: "👎 I want to change it" },
          { id: "alternate-suggestions", text: "🔁 I want alternate suggestions" },
          { id: "manage_plan", text: "🧩 Manage plan" },
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
        // If the backend is driving an inline UI block (e.g., severity 1–9),
        // don't show unrelated fallback tap options.
        if (uiBlocks && uiBlocks.length > 0) return [];

        // Prefer API-provided tap options. If none are provided, avoid generic fallbacks
        // because they often mismatch the current question/state.
        if (symptomTapOptions.length > 0) return symptomTapOptions;
        return [];
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
      const contextFromRoute = route?.params?.conversationContext;

      if (contextFromRoute?.context === "care_plan_modal") {
        if (!carePlanThreadId) {
          console.warn("Care plan thread not initialized yet");
          return;
        }

        if (detectFreezeIntent(messageText)) {
          if (!text) setValue("");
          handleCarePlanFreezeIntent(carePlanThreadId, messageText);
          return;
        }

        if (!text) setValue("");
        submitCarePlanMessage(carePlanThreadId, messageText);
        return;
      }

      if (contextFromRoute?.context === "symptom_checkin") {
        if (!symptomThreadId) {
          console.warn("Symptom thread not initialized yet");
          return;
        }
        if (!text) setValue("");
        submitSymptomMessage(symptomThreadId, messageText);
        return;
      }

      // Generic chat contexts (AI-driven)
      if (
        contextFromRoute?.context === 'personalise' ||
        contextFromRoute?.context === 'know_body' ||
        contextFromRoute?.context === 'general'
      ) {
        if (!text) setValue('');
        submitChatMessage(contextFromRoute.context, messageText);
        return;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isBot: false,
      };
      setMessages(prev => [...prev, newMessage]);
      console.log("Sent:", messageText);
      if (!text) setValue("");

      // Legacy local fallback: keep existing behaviour for other contexts.
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

      // Symptom check-in: treat some tap options as UI actions (open modal)
      if (contextFromRoute?.context === "symptom_checkin") {
        const lowered = (messageText || "").toLowerCase();
        const wantsManager =
          lowered.includes("track a symptom") ||
          lowered.includes("show my patterns") ||
          lowered.includes("manage symptoms");

        if (wantsManager) {
          refreshSymptomOverview();
          setSymptomManagerVisible(true);
          setSelectedOptions([]);
          return;
        }
      }

      // Care plan check-in: treat manage plan tap option as UI action (open modal)
      if (contextFromRoute?.context === "care_plan_modal") {
        const lowered = (messageText || "").toLowerCase();
        const wantsPlanManager = lowered.includes("manage plan");
        if (wantsPlanManager) {
          refreshCarePlanPlanManagerData();
          setPlanManagerVisible(true);
          setSelectedOptions([]);
          return;
        }
      }

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

  const handleChoicePress = (option: ChoiceOption) => {
    const contextFromRoute = route?.params?.conversationContext;

    // Weekly check-in keeps multi-select behavior.
    if (contextFromRoute?.context === "weekly_checkin") {
      toggleOption(option.id);
      return;
    }

    // Symptom check-in: some taps are UI actions.
    if (contextFromRoute?.context === "symptom_checkin") {
      // Symptom selection should go through the structured UI event path so the
      // backend can return the colorful 1–9 severity UI block.
      if (option.id?.startsWith("choose_symptom::")) {
        if (!symptomThreadId) {
          console.warn("Symptom thread not initialized yet");
          return;
        }

        // Show the user's selection immediately (backend will echo it back in history).
        if ((option.text || "").trim()) {
          setMessages((prev) => [...prev, { id: Date.now().toString(), text: option.text, isBot: false }]);
          scrollToBottom();
        }

        const event: UIEventRequest = {
          thread_id: symptomThreadId,
          block_id: "tap_options",
          event_type: "action",
          action_id: option.id,
          metadata: {
            display_text: option.text,
          },
        };

        setIsLoadingCheckin(true);
        void (async () => {
          try {
            const result = await symptomCheckinService.sendEvent(event);
            applySymptomApiResult(result);
          } finally {
            setIsLoadingCheckin(false);
          }
        })();
        return;
      }

      const lowered = (option.text || "").toLowerCase();
      const wantsManager =
        lowered.includes("track a symptom") ||
        lowered.includes("show my patterns") ||
        lowered.includes("manage symptoms");
      if (wantsManager) {
        refreshSymptomOverview();
        setSymptomManagerVisible(true);
        setSelectedOptions([]);
        return;
      }
    }

    // Care plan check-in: manage plan is a UI action.
    if (contextFromRoute?.context === "care_plan_modal") {
      const lowered = (option.text || "").toLowerCase();
      const wantsPlanManager = lowered.includes("manage plan");
      if (wantsPlanManager) {
        refreshCarePlanPlanManagerData();
        setPlanManagerVisible(true);
        setSelectedOptions([]);
        return;
      }
    }

    // Default: tap-to-send.
    setSelectedOptions([]);
    handleSend(option.text);
  };

  const startRecording = async () => {
    // Rating gate: until 1–9 is selected, lock Yap/Type/Tap.
    if (showSlider) return;
    if (isRecording || isStartingRecordingRef.current) return;

    try {
      isStartingRecordingRef.current = true;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn("Microphone permission not granted");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      // Reset state
      setRecordingUri(null);
      setRecordingTime(0);
      setRecordingComplete(false);

      // Start timer
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const recording = new Audio.Recording();
      recordingRef.current = recording;
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording", e);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      recordingRef.current = null;
      setIsRecording(false);
    } finally {
      isStartingRecordingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      const recording = recordingRef.current;
      if (!recording) {
        setRecordingComplete(false);
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        setRecordingComplete(false);
        return;
      }

      setRecordingUri(uri);
      setRecordingComplete(true);
    } catch (e) {
      console.error("Failed to stop recording", e);
      recordingRef.current = null;
      setRecordingComplete(false);
    }
  };

  const sendRecording = async () => {
    if (showSlider) return;
    if (!recordingUri || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const contextFromRoute = route?.params?.conversationContext;
      const isCarePlanModal = contextFromRoute?.context === "care_plan_modal";
      const isSymptomCheckin = contextFromRoute?.context === "symptom_checkin";
      const result = isCarePlanModal
        ? await carePlanCheckinService.transcribeAudio(recordingUri)
        : isSymptomCheckin
          ? await symptomCheckinService.transcribeAudio(recordingUri)
        : await weeklyCheckinService.transcribeAudio(recordingUri);
      const transcript = (result?.text || "").trim();

      // No streaming: drop transcript into the input instantly (still editable).
      setMode("type");
      setValue(transcript);
    } catch (e) {
      console.error("Transcription failed", e);
      setMode("type");
    } finally {
      setIsTranscribing(false);
      setRecordingComplete(false);
      setRecordingTime(0);
      setRecordingUri(null);
    }
  };

  const handleTextChange = (text: string) => {
    setValue(text);
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

  const applyCarePlanApiResult = (result: any) => {
    if (!result) return;
    if (result.tap_options) setCarePlanTapOptions(result.tap_options || []);
    if (result.history && result.history.length > 0) setMessages(result.history);
    setUiBlocks(result.ui_blocks || []);
    scrollToBottom();
  };

  const applySymptomApiResult = (result: any) => {
    if (!result) return;
    if (result.tap_options) setSymptomTapOptions(result.tap_options || []);
    if (result.history && result.history.length > 0) setMessages(result.history);
    setUiBlocks(result.ui_blocks || []);
    scrollToBottom();
  };

  const handleUiBlockAction = async (block: UIBlock, action: UIBlockAction) => {
    const contextFromRoute = route?.params?.conversationContext;

    if (action.action_type === 'open_modal') {
      const modal = action.payload?.modal;
      if (modal === 'PlanManagerModal') {
        refreshCarePlanPlanManagerData();
        setPlanManagerVisible(true);
        return;
      }
      if (modal === 'SymptomManagerModal') {
        refreshSymptomOverview();
        setSymptomManagerVisible(true);
        return;
      }
      if (modal === 'PaywallScreen') {
        navigation.navigate('PaywallScreen');
        return;
      }
      return;
    }

    if (action.action_type === 'send_text') {
      const text = (action.payload?.text || action.title || '').toString();
      if (!text.trim()) return;

      if (contextFromRoute?.context === 'care_plan_modal' && carePlanThreadId) {
        await submitCarePlanMessage(carePlanThreadId, text);
        return;
      }
      if (contextFromRoute?.context === 'symptom_checkin' && symptomThreadId) {
        await submitSymptomMessage(symptomThreadId, text);
        return;
      }
      handleSend(text);
      return;
    }

    // Default: submit structured event to backend (if supported)
    // Also show the user's selection immediately (backend will echo it back in history).
    if (action.action_type === 'submit_event') {
      const displayText = (action.title || '').toString().trim();
      if (displayText) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), text: displayText, isBot: false }]);
        scrollToBottom();
      }
    }

    if (contextFromRoute?.context === 'care_plan_modal' && carePlanThreadId) {
      const event: UIEventRequest = {
        thread_id: carePlanThreadId,
        block_id: block.id,
        event_type: 'action',
        action_id: action.id,
        metadata: {
          ...(action.payload || {}),
          display_text: (action.title || '').toString(),
        },
      };
      setIsLoadingCheckin(true);
      try {
        const result = await carePlanCheckinService.sendEvent(event);
        applyCarePlanApiResult(result);
      } finally {
        setIsLoadingCheckin(false);
      }
      return;
    }

    if (contextFromRoute?.context === 'symptom_checkin' && symptomThreadId) {
      const event: UIEventRequest = {
        thread_id: symptomThreadId,
        block_id: block.id,
        event_type: 'action',
        action_id: action.id,
        metadata: {
          ...(action.payload || {}),
          display_text: (action.title || '').toString(),
        },
      };
      setIsLoadingCheckin(true);
      try {
        const result = await symptomCheckinService.sendEvent(event);
        applySymptomApiResult(result);
      } finally {
        setIsLoadingCheckin(false);
      }
      return;
    }
  };

  const renderUiBlocksInline = () => {
    if (!uiBlocks || uiBlocks.length === 0) return null;

    const submitSliderEvent = async (block: UIBlock, value: number) => {
      const contextFromRoute = route?.params?.conversationContext;

      // Only symptom_checkin currently supports slider_submit events.
      if (contextFromRoute?.context !== 'symptom_checkin' || !symptomThreadId) return;

      const event: UIEventRequest = {
        thread_id: symptomThreadId,
        block_id: block.id,
        event_type: 'slider_submit',
        value,
        metadata: {
          ...(block.payload || {}),
        },
      };

      const symptomType = (block.payload as any)?.symptom_type;
      const displayText = symptomType ? `${symptomType} ${value}/9` : `${value}/9`;

      // Show the user's selection immediately (backend will echo it back in history).
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: displayText, isBot: false }]);
      scrollToBottom();

      event.metadata = {
        ...(event.metadata || {}),
        display_text: displayText,
      };

      setIsLoadingCheckin(true);
      try {
        const result = await symptomCheckinService.sendEvent(event);
        applySymptomApiResult(result);
      } finally {
        setIsLoadingCheckin(false);
      }
    };

    return (
      <View style={styles.uiBlocksContainer}>
        {uiBlocks.map((block) => (
          <View key={block.id} style={styles.uiBlockCard}>
            {!!block.title && <Text style={styles.uiBlockTitle}>{block.title}</Text>}
            {!!block.subtitle && <Text style={styles.uiBlockSubtitle}>{block.subtitle}</Text>}

            {block.type === 'slider_1_9' ? (
              <View style={styles.uiBlockSliderRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <TouchableOpacity
                    key={`${block.id}_${n}`}
                    activeOpacity={0.85}
                    disabled={isLoadingCheckin}
                    onPress={() => submitSliderEvent(block, n)}
                    style={[styles.uiBlockSliderChip, { backgroundColor: getSliderTint(n) }, isLoadingCheckin && { opacity: 0.6 }]}
                  >
                    <Text style={styles.uiBlockSliderChipText}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              !!block.actions?.length && (
                <View style={styles.uiBlockActionsRow}>
                  {block.actions.map((action) => {
                    const isPrimary = action.style === 'primary' || !action.style;
                    return (
                      <TouchableOpacity
                        key={action.id}
                        activeOpacity={0.85}
                        onPress={() => handleUiBlockAction(block, action)}
                        style={[styles.uiBlockActionBtn, !isPrimary && styles.uiBlockActionBtnSecondary]}
                      >
                        {isPrimary ? (
                          <LinearGradient
                            colors={[COLORS.gradPurple, COLORS.gradPink]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.uiBlockActionBtnGradient}
                          >
                            <Text style={styles.uiBlockActionTextPrimary}>{action.title}</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.uiBlockActionTextSecondary}>{action.title}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </View>
        ))}
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
                    <BotMessage text={message.text} />
                  ) : (
                    <UserMessage text={message.text} />
                  )}
                </View>
              ))}

              {isLoadingCheckin && messages.length > 0 ? <BotThinkingMessage /> : null}

              {renderUiBlocksInline()}
            </View>
            </View>
          </ScrollView>

          {/* Recording status display */}
          {(isRecording || recordingComplete || isTranscribing) && (
            <View style={styles.recordingStatusContainer}>
              {isTranscribing ? (
                <Text style={styles.recordingStatusText}>Transcribing…</Text>
              ) : (
                <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
              )}
            </View>
          )}
        </View>
      );
    }

    if (contextFromRoute?.context === "symptom_checkin") {
      return (
        <View style={styles.idleModeContainer}>
          <ScrollView
            ref={idleScrollRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Avatar showMessage={false} />
            <View style={{ marginTop: verticalScale(20) }}>
              <View style={styles.messagesWrapper}>
                {messages.map((message) => (
                  <View key={message.id}>
                    {message.isBot ? <BotMessage text={message.text} /> : <UserMessage text={message.text} />}
                  </View>
                ))}

                {isLoadingCheckin && messages.length > 0 ? <BotThinkingMessage /> : null}

                {renderUiBlocksInline()}
              </View>
            </View>
          </ScrollView>

          {(isRecording || recordingComplete || isTranscribing) && (
            <View style={styles.recordingStatusContainer}>
              {isTranscribing ? (
                <Text style={styles.recordingStatusText}>Transcribing…</Text>
              ) : (
                <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
              )}
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
                {messages.map((message) => (
                  <View key={message.id}>
                    {message.isBot ? (
                      <BotMessage text={message.text} />
                    ) : (
                      <UserMessage text={message.text} />
                    )}
                  </View>
                ))}

                {isLoadingCheckin && messages.length > 0 && contextFromRoute?.context !== "weekly_checkin" ? (
                  <BotThinkingMessage />
                ) : null}
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
            {(isRecording || recordingComplete || isTranscribing) && (
              <View style={styles.recordingStatusContainer}>
                {isTranscribing ? (
                  <Text style={styles.recordingStatusText}>Transcribing…</Text>
                ) : (
                  <Text style={styles.recordingStatusText}>{formatTime(recordingTime)}</Text>
                )}
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
                <BotMessage text={message.text} />
              ) : (
                <UserMessage text={message.text} />
              )}
            </View>
          ))}

          {isLoadingCheckin && messages.length > 0 && route?.params?.conversationContext?.context !== "weekly_checkin" ? (
            <BotThinkingMessage />
          ) : null}

          {renderUiBlocksInline()}
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
            onChangeText={handleTextChange}
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
                <BotMessage text={message.text} />
              ) : (
                <UserMessage text={message.text} />
              )}
            </View>
          ))}

          {isLoadingCheckin && messages.length > 0 && route?.params?.conversationContext?.context !== "weekly_checkin" ? (
            <BotThinkingMessage />
          ) : null}

          {renderUiBlocksInline()}
        </View>
        </View>
        <View style={styles.choiceOptionsContainer}>
          <View style={styles.choiceOptionsGrid}>
            {choiceOptions.map((option) => (
              <ChoiceButton
                key={option.id}
                option={option}
                isSelected={route?.params?.conversationContext?.context === "weekly_checkin" && selectedOptions.includes(option.id)}
                onPress={() => handleChoicePress(option)}
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
        {route?.params?.conversationContext?.context === "weekly_checkin" ? (
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
                  colors={selectedOptions.length > 0 ? [COLORS.gradPurple, COLORS.gradPink] : [COLORS.disabledGradient, COLORS.disabledGradient]}
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
        ) : null}
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
        colors={[...BRAND_GRADIENT.colors]}
        locations={[...BRAND_GRADIENT.locations]}
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
            // Rating gate: until the user selects 1–9, they cannot Tap/Yap/Type.
            if (showSlider) {
              setMode("idle");
              return;
            }

            setMode(newMode);
          }} 
          disabled={showSlider || isTranscribing}
          isRecording={isRecording}
          recordingComplete={recordingComplete}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSendRecording={sendRecording}
        />
      )}

      <PlanManagerModal
        visible={planManagerVisible}
        onClose={() => setPlanManagerVisible(false)}
        actionPlan={carePlanActionPlan}
        rewardsStatus={carePlanRewardsStatus}
        onRequestRefreshPlan={refreshCarePlanPlanOnly}
        onActionPlanChange={(next) => setCarePlanActionPlan(next)}
        onRewardsStatusChange={(next) => setCarePlanRewardsStatus(next)}
      />

      <SymptomManagerModal
        visible={symptomManagerVisible}
        onClose={() => setSymptomManagerVisible(false)}
        overview={symptomOverview}
        onOverviewChange={(next) => setSymptomOverview(next)}
        onRequestRefreshOverview={refreshSymptomOverview}
      />
      
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

  managePlanBar: {
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(10),
  },
  managePlanButton: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  managePlanTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: COLORS.onSurface,
  },
  managePlanMeta: {
    marginTop: verticalScale(4),
    fontSize: FONT_SIZES.extraSmall,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyLight,
  },

  // Dynamic UI blocks (Gemini-like)
  uiBlocksContainer: {
    marginTop: verticalScale(12),
    gap: verticalScale(10),
  },
  uiBlockCard: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    ...(isAndroid
      ? ({ elevation: 1 } as any)
      : {
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }),
  },
  uiBlockTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: COLORS.onSurface,
  },
  uiBlockSubtitle: {
    marginTop: verticalScale(4),
    fontSize: FONT_SIZES.extraSmall,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    color: COLORS.greyLight,
  },
  uiBlockActionsRow: {
    marginTop: verticalScale(10),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  uiBlockActionBtn: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  uiBlockActionBtnGradient: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: scale(12),
  },
  uiBlockActionBtnSecondary: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  uiBlockActionTextPrimary: {
    fontSize: FONT_SIZES.button,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: COLORS.white,
  },
  uiBlockActionTextSecondary: {
    fontSize: FONT_SIZES.button,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: COLORS.onSurface,
  },

  uiBlockSliderRow: {
    marginTop: verticalScale(10),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  uiBlockSliderChip: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uiBlockSliderChipText: {
    fontSize: FONT_SIZES.small,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
    color: COLORS.onSurface,
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
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: LINE_HEIGHTS.normal,
    includeFontPadding: isAndroid ? false : undefined,
    textAlignVertical: isAndroid ? 'center' : undefined,
  },
  choiceButtonTextUnselected: {
    fontSize: FONT_SIZES.message,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
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
    color: COLORS.warmPurple,
    fontFamily: FONT_FAMILIES['Inter-SemiBold'],
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
