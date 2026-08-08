import { randomUUID } from "expo-crypto";
import { useCallback, useRef } from "react";

import {
  answerWeekly,
  completeWeekly,
  createMessage,
  getConversation,
  getConversationJob,
  getWeeklyDue,
  type ConversationDetailDto,
} from "./api";
import { userMessage } from "./conversationMappers";
import { isTerminalJobState } from "@/src/features/jobs/jobState";
import { hydrateWeekly } from "./useConversationInitialization";
import type {
  ConversationAction,
  ConversationViewModel,
} from "./conversationTypes";

type Dispatch = React.Dispatch<ConversationAction>;
type WeeklyResponse = string | string[] | number | boolean;
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 2_000));
const messagesFrom = (detail: ConversationDetailDto) =>
  detail.messages.map((message) => ({
    id: message.message_id,
    text: message.content,
    isBot: message.role !== "user",
  }));

async function waitForResponse(jobId: string) {
  for (;;) {
    const job = await getConversationJob(jobId);
    if (isTerminalJobState(job.state)) return job;
    await wait();
  }
}

export function useConversationSending(
  view: ConversationViewModel,
  dispatch: Dispatch,
) {
  const keys = useRef(new Map<string, string>());
  const keyFor = useCallback(
    (operation: string) =>
      keys.current.get(operation) ??
      (() => {
        const key = randomUUID();
        keys.current.set(operation, key);
        return key;
      })(),
    [],
  );
  return useCallback(
    async (text?: string, weeklyResponse?: WeeklyResponse) => {
      const message = (text || view.input).trim();
      if (!message || view.request === "sending" || view.isCompleted) return;
      dispatch({ type: "append", message: userMessage(message) });
      dispatch({ type: "setInput", input: "" });
      dispatch({ type: "setRequest", request: "sending" });
      try {
        if (view.flow === "weekly" && view.checkinId && view.question) {
          const operation = `weekly:${view.checkinId}:${view.question.question_id}:${view.checkinId}`;
          const answer = await answerWeekly(
            view.checkinId,
            view.question.question_id,
            view.revision,
            weeklyResponse ?? message,
            keyFor(operation),
          );
          const due = await getWeeklyDue();
          const checkin = due.checkin;
          if (!checkin) throw new Error("Weekly check-in disappeared.");
          if (checkin.answers.length === checkin.questions.length) {
            hydrateWeekly(
              await completeWeekly(
                view.checkinId,
                answer.revision,
                keyFor(`${operation}:complete`),
              ),
              dispatch,
            );
          } else hydrateWeekly(checkin, dispatch);
          return;
        }
        if (!view.threadId) throw new Error("Conversation is not ready.");
        const operation = `message:${view.threadId}:${view.messages.length}:${message}`;
        const accepted = await createMessage(
          view.threadId,
          view.revision,
          message,
          keyFor(`${operation}:client`),
          keyFor(operation),
        );
        const job = await waitForResponse(accepted.response_job_id);
        if (job.state !== "ready") throw new Error(`Response ${job.state}`);
        const detail = await getConversation(view.threadId);
        dispatch({
          type: "hydrate",
          messages: messagesFrom(detail),
          threadId: detail.conversation_id,
          revision: detail.revision,
          mode: "type",
        });
      } catch {
        dispatch({
          type: "failed",
          error: "Message not sent. Tap Retry to try again.",
        });
      }
    },
    [dispatch, keyFor, view],
  );
}
