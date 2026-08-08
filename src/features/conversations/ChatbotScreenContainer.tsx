import React, { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WeeklyQuestionSlider } from "./WeeklyQuestionSlider";
import {
  isWeeklyMultiSelect,
  isWeeklySlider,
  selectedOptionText,
  weeklySelectionValue,
} from "./conversationInteractions";
import { useConversationController } from "./useConversationController";
import type { ConversationRouteContext } from "./conversationTypes";

interface Props {
  route?: { params?: { conversationContext?: ConversationRouteContext } };
}

/** Thin composition root for reusable conversation views. */
export default function ChatbotScreenContainer({ route }: Props) {
  const chat = useConversationController({
    context: route?.params?.conversationContext,
  });
  const scrollRef = useRef<ScrollView>(null);
  const { view } = chat;
  const busy = view.request === "initializing" || view.request === "sending";
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{titleFor(view.flow)}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => void chat.startNewConversation()}
            accessibilityRole="button"
            accessibilityLabel="Start a new conversation"
          >
            <Text style={styles.cancel}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={chat.cancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel current request"
          >
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {view.messages.map((message) => (
          <View
            key={message.id}
            style={[styles.bubble, message.isBot ? styles.bot : styles.user]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
        {view.request === "sending" && (
          <Text style={styles.thinking}>Thinking…</Text>
        )}
        {view.error && (
          <TouchableOpacity onPress={chat.retry}>
            <Text style={styles.retry}>{view.error} Retry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {!view.isCompleted && (
        <Composer
          value={view.input}
          mode={view.mode}
          options={view.options}
          question={view.question}
          selectedOptionIds={view.selectedOptionIds}
          busy={busy}
          onChange={chat.setInput}
          onSend={chat.send}
          onSubmitWeeklySelection={chat.submitWeeklySelection}
          onToggleOption={(optionId, multiple) =>
            chat.toggleOption(optionId, multiple)
          }
          onClearOptions={chat.clearOptions}
          onMode={chat.setMode}
          recording={chat.voice.isRecording}
          transcribing={chat.voice.isTranscribing}
          onVoiceStart={chat.voice.start}
          onVoiceStop={chat.voice.stop}
        />
      )}
    </SafeAreaView>
  );
}

function Composer({
  value,
  mode,
  options,
  question,
  selectedOptionIds,
  busy,
  onChange,
  onSend,
  onSubmitWeeklySelection,
  onToggleOption,
  onClearOptions,
  onMode,
  recording,
  transcribing,
  onVoiceStart,
  onVoiceStop,
}: {
  value: string;
  mode: string;
  options: { id: string; text: string }[];
  question: import("./api").WeeklyQuestionDto | null;
  selectedOptionIds: string[];
  busy: boolean;
  onChange: (value: string) => void;
  onSend: (text?: string) => Promise<void>;
  onSubmitWeeklySelection: (
    text: string,
    response: string | string[] | number,
  ) => Promise<void>;
  onToggleOption: (optionId: string, multiple: boolean) => void;
  onClearOptions: () => void;
  onMode: (mode: "tap" | "type" | "yap" | "idle") => void;
  recording: boolean;
  transcribing: boolean;
  onVoiceStart: () => Promise<void>;
  onVoiceStop: () => Promise<void>;
}) {
  const weeklyChoice = Boolean(question) && !isWeeklySlider(question);
  const weeklyMultiSelect = isWeeklyMultiSelect(question);
  const selectedText = selectedOptionText(options, selectedOptionIds);
  const submitSelectedOptions = () => {
    const response = weeklySelectionValue(question, selectedOptionIds);
    if (response && selectedText)
      void onSubmitWeeklySelection(selectedText, response);
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.composer}
    >
      {isWeeklySlider(question) && (
        <WeeklyQuestionSlider
          question={question!}
          busy={busy}
          onSelect={(value) =>
            void onSubmitWeeklySelection(`${value}/9`, value)
          }
        />
      )}
      {mode === "tap" && options.length > 0 && !isWeeklySlider(question) && (
        <View style={styles.options}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                weeklyChoice &&
                  selectedOptionIds.includes(option.id) &&
                  styles.optionSelected,
              ]}
              disabled={busy}
              onPress={() =>
                weeklyChoice
                  ? onToggleOption(option.id, weeklyMultiSelect)
                  : void onSend(option.text)
              }
              accessibilityRole={weeklyChoice ? "checkbox" : "button"}
              accessibilityLabel={option.text}
              accessibilityState={{
                checked: weeklyChoice
                  ? selectedOptionIds.includes(option.id)
                  : undefined,
                disabled: busy,
              }}
            >
              <Text>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {weeklyChoice && selectedOptionIds.length > 0 && (
        <View style={styles.selectionActions}>
          <TouchableOpacity
            style={styles.send}
            disabled={busy}
            onPress={submitSelectedOptions}
            accessibilityRole="button"
            accessibilityLabel={`Send ${selectedOptionIds.length} selected option${selectedOptionIds.length === 1 ? "" : "s"}`}
            accessibilityState={{ disabled: busy }}
          >
            <Text style={styles.sendText}>Send selection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busy}
            onPress={onClearOptions}
            accessibilityRole="button"
            accessibilityLabel="Clear selected options"
            accessibilityState={{ disabled: busy }}
          >
            <Text style={styles.mode}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isWeeklySlider(question) && (
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={onChange}
            style={styles.input}
            placeholder="Type your response"
            editable={!busy}
            accessibilityLabel="Conversation response"
          />
          <TouchableOpacity
            style={styles.send}
            disabled={busy}
            onPress={() => onSend()}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.send}
            disabled
            onPress={() => undefined}
            accessibilityRole="button"
            accessibilityLabel="Voice input unavailable; type your response"
            accessibilityHint="Secure v2 transcription is not available yet."
            accessibilityState={{ disabled: true }}
          >
            <Text style={styles.sendText}>Voice unavailable</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        disabled={busy || isWeeklySlider(question)}
        onPress={() => onMode(mode === "type" ? "tap" : "type")}
        accessibilityRole="button"
        accessibilityLabel="Switch input mode"
        accessibilityState={{ disabled: busy || isWeeklySlider(question) }}
      >
        <Text style={styles.mode}>Switch input mode</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function titleFor(flow: string): string {
  return (
    (
      {
        weekly: "Weekly Check-in",
        care_plan: "Care Plan Check-in",
        symptom: "Symptom Check-in",
        personalise: "Want to Personalize?",
        know_body: "Know my body",
        general: "Auvra",
      } as Record<string, string>
    )[flow] || "Auvra"
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF9FC" },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 12 },
  cancel: { color: "#6B4E71" },
  managePlan: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1E9F3",
  },
  managePlanTitle: { color: "#251A29", fontWeight: "700" },
  managePlanSubtitle: { color: "#6B4E71", marginTop: 2 },
  messages: { padding: 16, gap: 10 },
  bubble: { padding: 12, borderRadius: 16, maxWidth: "84%" },
  bot: { backgroundColor: "#F1E9F3", alignSelf: "flex-start" },
  user: { backgroundColor: "#DCC7E1", alignSelf: "flex-end" },
  messageText: { color: "#251A29" },
  thinking: { color: "#6B4E71" },
  retry: { color: "#A13131" },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#D9CBDC",
    padding: 12,
    gap: 8,
  },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { backgroundColor: "#F1E9F3", padding: 10, borderRadius: 16 },
  optionSelected: { borderWidth: 2, borderColor: "#6B4E71" },
  selectionActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9CBDC",
    borderRadius: 18,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  send: { justifyContent: "center", paddingHorizontal: 14 },
  sendText: { color: "#6B4E71", fontWeight: "700" },
  mode: { textAlign: "center", color: "#6B4E71" },
});
