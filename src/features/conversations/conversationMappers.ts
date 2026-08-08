import type {
  ConversationOption,
  ConversationMessage,
} from "./conversationTypes";

export const botMessage = (text: string): ConversationMessage => ({
  id: `bot-${Date.now()}`,
  text,
  isBot: true,
});

export const userMessage = (text: string): ConversationMessage => ({
  id: `user-${Date.now()}`,
  text,
  isBot: false,
});

export function choiceOptions(value: unknown): ConversationOption[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any, index) => ({
    id: String(item.id || `choice-${index}`),
    text: String(item.text || item),
  }));
}
