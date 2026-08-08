import type {
  ConversationViewModel,
  ConversationAction,
} from "./conversationTypes";

export const initialConversation: ConversationViewModel = {
  flow: "general",
  mode: "idle",
  request: "idle",
  messages: [],
  options: [],
  selectedOptionIds: [],
  input: "",
  threadId: null,
  revision: 0,
  checkinId: null,
  question: null,
  uiBlocks: [],
  isCompleted: false,
  error: null,
  activeModal: null,
  historyVisible: false,
};

export function conversationReducer(
  state: ConversationViewModel,
  action: ConversationAction,
): ConversationViewModel {
  switch (action.type) {
    case "initialize":
      return {
        ...initialConversation,
        flow: action.flow,
        request: "initializing",
      };
    case "hydrate":
      return {
        ...state,
        messages: action.messages,
        options: action.options || [],
        selectedOptionIds: [],
        threadId: action.threadId ?? state.threadId,
        revision: action.revision ?? state.revision,
        checkinId: action.checkinId ?? state.checkinId,
        question: action.question ?? state.question,
        uiBlocks: action.uiBlocks || [],
        mode: action.mode,
        isCompleted: Boolean(action.completed),
        request: "idle",
        error: null,
      };
    case "append":
      return { ...state, messages: [...state.messages, action.message] };
    case "setInput":
      return { ...state, input: action.input };
    case "toggleOption": {
      const alreadySelected = state.selectedOptionIds.includes(action.optionId);
      const selectedOptionIds = alreadySelected
        ? state.selectedOptionIds.filter((id) => id !== action.optionId)
        : action.multiple
          ? [...state.selectedOptionIds, action.optionId]
          : [action.optionId];
      return { ...state, selectedOptionIds };
    }
    case "clearOptions":
      return { ...state, selectedOptionIds: [] };
    case "setMode":
      return { ...state, mode: action.mode };
    case "setRequest":
      return { ...state, request: action.request, error: action.error || null };
    case "setModal":
      return { ...state, activeModal: action.modal };
    case "setHistoryVisible":
      return { ...state, historyVisible: action.visible };
    case "failed":
      return { ...state, request: "failed", error: action.error };
    case "reset":
      return initialConversation;
  }
}
