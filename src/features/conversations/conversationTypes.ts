import type { UIBlock } from "@/utils/uiBlocks";
import type { WeeklyQuestionDto } from "./api";

export type ConversationFlow =
  "weekly" | "care_plan" | "symptom" | "personalise" | "know_body" | "general";
export type ComposerMode = "tap" | "type" | "yap" | "idle";
export type RequestState = "idle" | "initializing" | "sending" | "failed";

export interface ConversationMessage {
  id: string;
  text: string;
  isBot: boolean;
  ui_blocks?: UIBlock[];
}
export interface ConversationOption {
  id: string;
  text: string;
}
export interface ConversationRouteContext {
  context?: string;
  initialMessage?: string;
  userResponse?: string;
}
export interface ConversationViewModel {
  flow: ConversationFlow;
  mode: ComposerMode;
  request: RequestState;
  messages: ConversationMessage[];
  options: ConversationOption[];
  selectedOptionIds: string[];
  input: string;
  threadId: string | null;
  revision: number;
  checkinId: string | null;
  question: WeeklyQuestionDto | null;
  uiBlocks: UIBlock[];
  isCompleted: boolean;
  error: string | null;
  activeModal: "plan_manager" | "symptom_manager" | null;
  historyVisible: boolean;
}

export type ConversationAction =
  | { type: "initialize"; flow: ConversationFlow }
  | {
      type: "hydrate";
      messages: ConversationMessage[];
      options?: ConversationOption[];
      threadId?: string | null;
      revision?: number;
      checkinId?: string | null;
      question?: WeeklyQuestionDto | null;
      uiBlocks?: UIBlock[];
      mode: ComposerMode;
      completed?: boolean;
    }
  | { type: "append"; message: ConversationMessage }
  | { type: "setInput"; input: string }
  | { type: "toggleOption"; optionId: string; multiple: boolean }
  | { type: "clearOptions" }
  | { type: "setMode"; mode: ComposerMode }
  | { type: "setRequest"; request: RequestState; error?: string | null }
  | { type: "setModal"; modal: "plan_manager" | "symptom_manager" | null }
  | { type: "setHistoryVisible"; visible: boolean }
  | { type: "failed"; error: string }
  | { type: "reset" };

export function flowFor(context?: ConversationRouteContext): ConversationFlow {
  switch (context?.context) {
    case "weekly_checkin":
      return "weekly";
    case "care_plan_modal":
      return "care_plan";
    case "symptom_checkin":
      return "symptom";
    case "personalise":
      return "personalise";
    case "know_body":
      return "know_body";
    default:
      return "general";
  }
}

export function normalizeMessages(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry: any, index) => ({
      id: String(entry?.id || entry?.timestamp || index),
      text: String(entry?.text || entry?.content || ""),
      isBot: entry?.isBot ?? entry?.role === "assistant",
      ui_blocks: Array.isArray(entry?.ui_blocks) ? entry.ui_blocks : [],
    }))
    .filter((message) => message.text.trim());
}
