import { useCallback, useEffect, useReducer } from "react";

import {
  conversationReducer,
  initialConversation,
} from "./conversationReducer";
import { useConversationInitialization } from "./useConversationInitialization";
import { useConversationSending } from "./useConversationSending";
import { useConversationVoice } from "./useConversationVoice";
import type { ConversationRouteContext } from "./conversationTypes";

interface Options {
  context?: ConversationRouteContext;
}

/** Owns one cancellable conversation state machine and its retained UI integrations. */
export function useConversationController({ context }: Options) {
  const [view, dispatch] = useReducer(conversationReducer, initialConversation);
  const { cancelRequests, initialize } = useConversationInitialization(
    context,
    dispatch,
  );
  const voice = useConversationVoice({
    onError: (error) => dispatch({ type: "failed", error }),
  });
  const cancelVoice = voice.cancel;
  const cancel = useCallback(() => {
    cancelRequests();
    void cancelVoice();
    dispatch({ type: "setRequest", request: "idle" });
    dispatch({ type: "clearOptions" });
  }, [cancelRequests, cancelVoice]);
  const send = useConversationSending(view, dispatch);
  const startNewConversation = useCallback(async () => {
    dispatch({ type: "setModal", modal: null });
    dispatch({ type: "setHistoryVisible", visible: false });
    dispatch({ type: "reset" });
    await initialize();
  }, [initialize]);
  useEffect(() => {
    void initialize();
    return cancel;
  }, [cancel, initialize]);
  return {
    view,
    send,
    submitWeeklySelection: (
      text: string,
      response: string | string[] | number,
    ) => send(text, response),
    retry: initialize,
    cancel,
    voice,
    runBlockAction: () =>
      dispatch({
        type: "failed",
        error: "This action is not available in the current v2 conversation.",
      }),
    activeModal: view.activeModal,
    closeModal: () => dispatch({ type: "setModal", modal: null }),
    startNewConversation,
    setInput: (input: string) => dispatch({ type: "setInput", input }),
    toggleOption: (optionId: string, multiple: boolean) =>
      dispatch({ type: "toggleOption", optionId, multiple }),
    clearOptions: () => dispatch({ type: "clearOptions" }),
    setMode: (mode: "tap" | "type" | "yap" | "idle") =>
      dispatch({ type: "setMode", mode }),
    openModal: () =>
      dispatch({
        type: "failed",
        error: "This panel is not available in the current v2 conversation.",
      }),
  };
}
