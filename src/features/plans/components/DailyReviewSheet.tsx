import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { DailyReviewItemInput, PlanDto } from "@/src/core/api/contracts";

import { PlanImage } from "./PlanImage";

type Outcome = DailyReviewItemInput["outcome"];

export interface DailyReviewSheetProps {
  plan: PlanDto | null;
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onImageFailure: () => void;
  onClose: () => void;
  onSubmit: (items: DailyReviewItemInput[]) => void;
}

export function DailyReviewSheet({
  plan,
  visible,
  submitting,
  error,
  onImageFailure,
  onClose,
  onSubmit,
}: DailyReviewSheetProps) {
  const initial = useMemo(
    () =>
      Object.fromEntries(
        plan?.items.map((item) => [item.item_id, "not_done" as Outcome]) ?? [],
      ) as Record<string, Outcome>,
    [plan],
  );
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>(initial);

  useEffect(() => setOutcomes(initial), [initial]);
  if (!plan) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Daily review</Text>
        <Text>Review each action from {plan.local_date}.</Text>
        {plan.items.map((item) => (
          <View key={item.item_id} style={{ gap: 8, paddingVertical: 8 }}>
            <PlanImage
              image={item.hero_image}
              style={{ width: "100%", height: 120 }}
              onLoadFailure={onImageFailure}
            />
            <Text style={{ fontWeight: "600" }}>{item.title}</Text>
            <OutcomeButtons
              value={outcomes[item.item_id]}
              onChange={(outcome) =>
                setOutcomes((current) => ({
                  ...current,
                  [item.item_id]: outcome,
                }))
              }
            />
          </View>
        ))}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() =>
            onSubmit(
              plan.items.map((item) => ({
                plan_item_id: item.item_id,
                outcome: outcomes[item.item_id] ?? "not_done",
              })),
            )
          }
        >
          <Text>{submitting ? "Saving…" : "Submit review"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

function OutcomeButtons({
  value,
  onChange,
}: {
  value: Outcome;
  onChange: (outcome: Outcome) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {(["completed", "skipped", "not_done"] as const).map((outcome) => (
        <Pressable
          key={outcome}
          accessibilityRole="button"
          onPress={() => onChange(outcome)}
        >
          <Text style={{ fontWeight: value === outcome ? "700" : "400" }}>
            {outcome.replace("_", " ")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
