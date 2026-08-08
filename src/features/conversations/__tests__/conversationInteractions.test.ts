import {
  isWeeklyMultiSelect,
  selectedOptionText,
  sliderButtonLabel,
  weeklySelectionValue,
} from "../conversationInteractions";

const options = [
  { id: "sleep", text: "Sleep" },
  { id: "stress", text: "Stress" },
];

describe("weekly conversation controls", () => {
  it("preserves every selected id for a multi-select answer", () => {
    const question = { answer_type: "multi_select", answer_schema: {} } as any;
    expect(isWeeklyMultiSelect(question)).toBe(true);
    expect(weeklySelectionValue(question, ["sleep", "stress"])).toEqual([
      "sleep",
      "stress",
    ]);
    expect(selectedOptionText(options, ["sleep", "stress"])).toBe(
      "Sleep, Stress",
    );
  });

  it("keeps a tap-choice response scalar and never submits an empty selection", () => {
    const question = { answer_type: "choice", answer_schema: {} } as any;
    expect(weeklySelectionValue(question, ["sleep", "stress"])).toBe("sleep");
    expect(weeklySelectionValue(question, [])).toBeNull();
  });

  it("uses server rating labels in the accessible slider name", () => {
    const question = {
      answer_type: "scale",
      answer_schema: { labels: { "7": "High" } },
    } as any;
    expect(sliderButtonLabel(question, 7)).toBe("7 of 9, High");
  });
});
