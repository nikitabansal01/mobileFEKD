import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import type {
  PlanDto,
  PlanItemDto,
  PlanItemVariantDto,
  ProgressSummaryResponse,
} from "@/src/core/api/contracts";

import { PlanImage } from "./PlanImage";

export interface V2PlanSectionProps {
  plan: PlanDto;
  progress: ProgressSummaryResponse | null;
  busyItemId: string | null;
  onEvent: (item: PlanItemDto, eventType: "completed" | "skipped") => void;
  onReplace: (item: PlanItemDto, variant: PlanItemVariantDto) => void;
  onReview: () => void;
  onImageFailure: () => void;
  reviewError: string | null;
  error: string | null;
}

export function V2PlanSection({
  plan,
  progress,
  busyItemId,
  onEvent,
  onReplace,
  onReview,
  onImageFailure,
  reviewError,
  error,
}: V2PlanSectionProps) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>
          Today&apos;s Action Plan
        </Text>
        <Text>
          {plan.local_date} · revision {plan.revision}
        </Text>
        {progress ? (
          <Text>
            Streak {progress.streak_days} · {progress.reward_points} points
          </Text>
        ) : null}
      </View>
      {plan.items.map((item) => (
        <PlanCard
          key={item.item_id}
          item={item}
          busy={busyItemId === item.item_id}
          onEvent={onEvent}
          onReplace={onReplace}
          onImageFailure={onImageFailure}
        />
      ))}
      <Pressable accessibilityRole="button" onPress={onReview}>
        <Text>Complete daily review</Text>
      </Pressable>
      {reviewError ? (
        <Text accessibilityRole="alert">{reviewError}</Text>
      ) : null}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </ScrollView>
  );
}

function PlanCard({
  item,
  busy,
  onEvent,
  onReplace,
  onImageFailure,
}: {
  item: PlanItemDto;
  busy: boolean;
  onEvent: V2PlanSectionProps["onEvent"];
  onReplace: V2PlanSectionProps["onReplace"];
  onImageFailure: V2PlanSectionProps["onImageFailure"];
}) {
  return (
    <View style={{ gap: 10, paddingBottom: 20 }}>
      <PlanImage
        image={item.hero_image}
        style={{ width: "100%", height: 180 }}
        onLoadFailure={onImageFailure}
      />
      <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.title}</Text>
      <Text>{item.purpose}</Text>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Pressable disabled={busy} onPress={() => onEvent(item, "completed")}>
          <Text>Done</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => onEvent(item, "skipped")}>
          <Text>Skip</Text>
        </Pressable>
      </View>
      <Text>Try a different version</Text>
      {item.variants.map((variant) => (
        <Pressable
          key={variant.variant_id}
          disabled={busy}
          onPress={() => onReplace(item, variant)}
        >
          <PlanImage
            image={variant.image}
            style={{ width: 96, height: 72 }}
            onLoadFailure={onImageFailure}
          />
          <Text>{variant.variant_type}</Text>
        </Pressable>
      ))}
    </View>
  );
}
