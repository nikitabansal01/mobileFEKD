import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { DailyReviewSheet } from "@/src/features/plans/components/DailyReviewSheet";
import { V2PlanSection } from "@/src/features/plans/components/V2PlanSection";

import { useV2HomeController } from "./useV2HomeController";

/** Home route: serving plans and engagement facts come exclusively from v2. */
export default function HomeScreenContainer() {
  const home = useV2HomeController();
  if (home.state === "loading" || home.state === "generating") {
    return <LoadingState jobState={home.job?.state ?? null} />;
  }
  if (home.state === "error" || !home.plan) {
    return (
      <RetryState
        message={home.error ?? "No published plan is available."}
        onRetry={home.load}
        onGenerate={home.generate}
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <V2PlanSection
        plan={home.plan}
        progress={home.progress}
        busyItemId={home.busyItemId}
        onEvent={home.event}
        onReplace={home.replace}
        onReview={home.openReview}
        onImageFailure={home.imageFailure}
        reviewError={home.reviewError}
        error={home.error}
      />
      <DailyReviewSheet
        plan={home.plan}
        visible={home.reviewVisible}
        submitting={home.reviewSubmitting}
        error={home.reviewError}
        onImageFailure={home.imageFailure}
        onClose={home.closeReview}
        onSubmit={home.review}
      />
    </View>
  );
}

function LoadingState({ jobState }: { jobState: string | null }) {
  return (
    <View style={center}>
      <ActivityIndicator size="large" />
      <Text>
        {jobState
          ? `Plan ${jobState.replace("_", " ")}…`
          : "Loading your plan…"}
      </Text>
    </View>
  );
}

function RetryState({
  message,
  onRetry,
  onGenerate,
}: {
  message: string;
  onRetry: () => void;
  onGenerate: () => void;
}) {
  return (
    <View style={center}>
      <Text accessibilityRole="alert">{message}</Text>
      <Pressable onPress={onRetry}>
        <Text>Retry</Text>
      </Pressable>
      <Pressable onPress={onGenerate}>
        <Text>Generate plan</Text>
      </Pressable>
    </View>
  );
}

const center = {
  flex: 1,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  gap: 16,
};
