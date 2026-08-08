import { v2Client } from "@/src/core/api/runtimeClient";
import type { JobDto, UUID } from "@/src/core/api/contracts";
import type { components } from "@/src/core/api/v2.generated";

export type ThreadType =
  components["schemas"]["ConversationCreateRequest"]["thread_type"];
export type ConversationMessageDto =
  components["schemas"]["ConversationMessageResponse"];
export type ConversationDto = components["schemas"]["ConversationResponse"];
export type ConversationDetailDto =
  components["schemas"]["ConversationDetailResponse"];
export type ConversationPageDto =
  components["schemas"]["ConversationPageResponse"];
export type WeeklyQuestionDto =
  components["schemas"]["WeeklyCheckinQuestionResponse"];
export type WeeklyCheckinDto = components["schemas"]["WeeklyCheckinResponse"];
export type WeeklyDueDto = components["schemas"]["WeeklyCheckinDueResponse"];
const revisionHeaders = (revision: number) => ({ "If-Match": `"${revision}"` });
export const createConversation = (
  thread_type: ThreadType,
  idempotencyKey: string,
) =>
  v2Client.request("post", "/api/v2/me/conversations", {
    body: { thread_type },
    idempotencyKey,
  });
export const getConversation = (
  id: UUID,
  cursor?: string,
  signal?: AbortSignal,
) =>
  v2Client.request("get", "/api/v2/me/conversations/{conversation_id}", {
    path: { conversation_id: id },
    query: { message_limit: 50, message_cursor: cursor },
    signal,
  });
export const listConversations = (cursor?: string, signal?: AbortSignal) =>
  v2Client.request("get", "/api/v2/me/conversations", {
    query: { limit: 30, cursor },
    signal,
  });
export const createMessage = (
  id: UUID,
  revision: number,
  content: string,
  client_message_id: UUID,
  idempotencyKey: string,
) =>
  v2Client.request("post", "/api/v2/me/conversations/{conversation_id}/messages", {
    path: { conversation_id: id },
    body: { client_message_id, content },
    headers: revisionHeaders(revision),
    idempotencyKey,
  });
export const getWeeklyDue = (signal?: AbortSignal) =>
  v2Client.request("get", "/api/v2/me/weekly-checkins/due", { signal });
export const createWeekly = (idempotencyKey: string) =>
  v2Client.request("post", "/api/v2/me/weekly-checkins", {
    idempotencyKey,
  });
export const answerWeekly = (
  checkinId: UUID,
  questionId: UUID,
  revision: number,
  value: unknown,
  idempotencyKey: string,
) =>
  v2Client.request(
    "put",
    "/api/v2/me/weekly-checkins/{checkin_id}/responses/{question_id}",
    {
      path: { checkin_id: checkinId, question_id: questionId },
      body: { answer: { value } },
      headers: revisionHeaders(revision),
      idempotencyKey,
    },
  );
export const completeWeekly = (
  checkinId: UUID,
  revision: number,
  idempotencyKey: string,
) =>
  v2Client.request(
    "post",
    "/api/v2/me/weekly-checkins/{checkin_id}/complete",
    {
      path: { checkin_id: checkinId },
      headers: revisionHeaders(revision),
      idempotencyKey,
    },
  );
export const recordSymptom = (
  body: {
    observed_at: string;
    symptom_code: string;
    severity?: number;
    note?: string;
  },
  idempotencyKey: string,
) =>
  v2Client.request("post", "/api/v2/me/symptom-observations", {
    body,
    idempotencyKey,
  });

/** Mirrors transport bounds only; it never interprets symptoms or gives advice. */
export function symptomObservationValidationError(body: {
  observed_at: string;
  symptom_code: string;
  severity?: number;
  note?: string;
}): string | null {
  if (!body.symptom_code.trim() || body.symptom_code.length > 64)
    return "Choose a valid symptom.";
  if (
    body.severity !== undefined &&
    (!Number.isInteger(body.severity) ||
      body.severity < 0 ||
      body.severity > 10)
  )
    return "Severity must be a whole number from 0 to 10.";
  if (body.note && body.note.length > 4000) return "Your note is too long.";
  return Number.isNaN(Date.parse(body.observed_at))
    ? "Choose a valid observation time."
    : null;
}
export const getConversationJob = (jobId: UUID, signal?: AbortSignal) =>
  v2Client.request("get", "/api/v2/jobs/{job_id}", {
    path: { job_id: jobId },
    signal,
  });
