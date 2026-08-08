import { randomUUID } from "expo-crypto";
import { useCallback, useRef } from "react";

import {
  createConversation,
  createWeekly,
  getWeeklyDue,
  type ConversationDto,
  type WeeklyCheckinDto,
} from "./api";
import { botMessage } from "./conversationMappers";
import {
  flowFor,
  type ConversationAction,
  type ConversationFlow,
  type ConversationRouteContext,
} from "./conversationTypes";

type Dispatch = React.Dispatch<ConversationAction>;
const threadTypeFor = (
  flow: ConversationFlow,
): ConversationDto["thread_type"] =>
  flow === "care_plan"
    ? "care_plan"
    : flow === "symptom"
      ? "symptom_checkin"
      : "general";

export function hydrateWeekly(checkin: WeeklyCheckinDto, dispatch: Dispatch) {
  const answered = new Set(checkin.answers.map((answer) => answer.question_id));
  const question =
    checkin.questions.find((item) => !answered.has(item.question_id)) ?? null;
  dispatch({
    type: "hydrate",
    messages: question
      ? [botMessage(question.prompt)]
      : [botMessage("Your weekly check-in is complete.")],
    checkinId: checkin.checkin_id,
    threadId: checkin.conversation_id,
    revision: checkin.revision,
    question,
    mode:
      question?.answer_type === "choice" ||
      question?.answer_type === "multi_select"
        ? "tap"
        : "type",
    completed: Boolean(checkin.completed_at),
  });
}

export function useConversationInitialization(
  context: ConversationRouteContext | undefined,
  dispatch: Dispatch,
) {
  const abortRef = useRef<AbortController | null>(null);
  const flow = flowFor(context);
  const cancelRequests = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);
  const initialize = useCallback(async () => {
    cancelRequests();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "initialize", flow });
    try {
      if (flow === "weekly") {
        const due = await getWeeklyDue(controller.signal);
        hydrateWeekly(
          due.checkin ?? (await createWeekly(randomUUID())),
          dispatch,
        );
        return;
      }
      const conversation = await createConversation(
        threadTypeFor(flow),
        randomUUID(),
      );
      dispatch({
        type: "hydrate",
        messages: [],
        threadId: conversation.conversation_id,
        revision: conversation.revision,
        mode: "type",
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        dispatch({
          type: "failed",
          error: "Could not start this conversation. Retry when ready.",
        });
    }
  }, [cancelRequests, dispatch, flow]);
  return { flow, cancelRequests, initialize };
}
