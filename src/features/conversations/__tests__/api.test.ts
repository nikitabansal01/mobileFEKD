import { apiClient } from "@/src/core/api/runtimeClient";
import { transportCall } from "@/src/test/transportSpy";

import {
  answerWeekly,
  createMessage,
  getConversation,
  listConversations,
  recordSymptom,
  symptomObservationValidationError,
} from "../api";

jest.mock("@/src/core/api/runtimeClient", () =>
  jest.requireActual("@/src/test/transportSpy").runtimeClientMock(),
);

const request = apiClient.request as unknown as jest.Mock;

describe("v2 conversation adapters", () => {
  beforeEach(() => request.mockResolvedValue({}));

  it("keeps duplicate message retries on one client id and idempotency key", async () => {
    await createMessage("thread-1", 4, "Hello", "client-1", "message-1");
    await createMessage("thread-1", 4, "Hello", "client-1", "message-1");

    expect(transportCall(request, 0)).toEqual([
      "/me/conversations/thread-1/messages",
      {
        method: "POST",
        body: { client_message_id: "client-1", content: "Hello" },
        headers: { "If-Match": '"4"' },
        idempotencyKey: "message-1",
      },
    ]);
    expect(transportCall(request, 1)).toEqual(transportCall(request, 0));
  });

  it("uses ordered keyset cursors and canonical symptom validation payloads", async () => {
    await getConversation("thread-1", "older-page");
    await listConversations("older-list");
    await recordSymptom(
      {
        observed_at: "2026-08-08T00:00:00Z",
        symptom_code: "cramps",
        severity: 7,
      },
      "symptom-1",
    );

    expect(transportCall(request, 0)).toEqual([
      "/me/conversations/thread-1?message_limit=50&message_cursor=older-page",
      { method: "GET" },
    ]);
    expect(transportCall(request, 1)).toEqual([
      "/me/conversations?limit=30&cursor=older-list",
      { method: "GET" },
    ]);
    expect(transportCall(request, 2)).toEqual([
      "/me/symptom-observations",
      {
        method: "POST",
        body: expect.objectContaining({ symptom_code: "cramps" }),
        idempotencyKey: "symptom-1",
      },
    ]);
  });

  it("guards weekly definition answers with the check-in revision", async () => {
    await answerWeekly("checkin-1", "question-1", 3, ["sleep"], "weekly-1");

    expect(transportCall(request, 0)).toEqual([
      "/me/weekly-checkins/checkin-1/responses/question-1",
      {
        method: "PUT",
        body: { answer: { value: ["sleep"] } },
        headers: { "If-Match": '"3"' },
        idempotencyKey: "weekly-1",
      },
    ]);
  });

  it("validates only canonical symptom transport bounds without medical interpretation", () => {
    expect(
      symptomObservationValidationError({
        observed_at: "bad",
        symptom_code: "cramps",
      }),
    ).toBe("Choose a valid observation time.");
    expect(
      symptomObservationValidationError({
        observed_at: "2026-08-08T00:00:00Z",
        symptom_code: "cramps",
        severity: 11,
      }),
    ).toBe("Severity must be a whole number from 0 to 10.");
    expect(
      symptomObservationValidationError({
        observed_at: "2026-08-08T00:00:00Z",
        symptom_code: "cramps",
        severity: 7,
      }),
    ).toBeNull();
  });
});
