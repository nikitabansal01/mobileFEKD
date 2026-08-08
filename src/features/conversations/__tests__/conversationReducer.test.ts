import {
  conversationReducer,
  initialConversation,
} from "../conversationReducer";

describe("conversation interaction state", () => {
  it("opens and closes the retained plan and symptom panels", () => {
    const plan = conversationReducer(initialConversation, {
      type: "setModal",
      modal: "plan_manager",
    });
    const symptom = conversationReducer(plan, {
      type: "setModal",
      modal: "symptom_manager",
    });
    expect(symptom.activeModal).toBe("symptom_manager");
    expect(
      conversationReducer(symptom, { type: "setModal", modal: null })
        .activeModal,
    ).toBeNull();
  });

  it("keeps history selection separate from the current conversation UI", () => {
    const open = conversationReducer(initialConversation, {
      type: "setHistoryVisible",
      visible: true,
    });
    const selected = conversationReducer(open, {
      type: "hydrate",
      messages: [{ id: "m1", text: "Previous answer", isBot: true }],
      threadId: "thread-1",
      mode: "tap",
    });
    expect(selected.historyVisible).toBe(true);
    expect(selected.threadId).toBe("thread-1");
    expect(selected.messages[0]?.text).toBe("Previous answer");
  });

  it("keeps multi-select choices separate until the user submits or cancels them", () => {
    const selected = conversationReducer(initialConversation, {
      type: "toggleOption",
      optionId: "sleep",
      multiple: true,
    });
    const multi = conversationReducer(selected, {
      type: "toggleOption",
      optionId: "stress",
      multiple: true,
    });
    expect(multi.selectedOptionIds).toEqual(["sleep", "stress"]);
    expect(
      conversationReducer(multi, { type: "clearOptions" }).selectedOptionIds,
    ).toEqual([]);
  });
});
