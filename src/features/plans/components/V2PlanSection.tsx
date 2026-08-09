import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from "react-native-responsive-dimensions";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import type {
  PlanDto,
  PlanItemDto,
  PlanItemVariantDto,
  ProgressSummaryResponse,
} from "@/src/core/api/contracts";

import { BRAND, BRAND_GRADIENT, TEXT } from "@/constants/Colors";
import { FONT_INTER, FONT_SERIF } from "@/constants/fonts";
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

const VARIANT_LABELS: Record<string, string> = {
  low_energy: "Low energy",
  time_limited: "Short on time",
  no_equipment: "No equipment",
};

const CATEGORY_ACCENTS: Record<string, string> = {
  food: "#C17EC9",
  movement: "#8B5CF6",
  mindfulness: "#E98BAC",
  eat: "#C17EC9",
  move: "#8B5CF6",
  pause: "#E98BAC",
};

function variantLabel(variantType: string): string {
  return VARIANT_LABELS[variantType] ?? variantType.replace(/_/g, " ");
}

function categoryAccent(category: string): string {
  return CATEGORY_ACCENTS[category] ?? BRAND.gradPurple;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
  const completed = progress?.completed_today ?? 0;
  const eligible = progress?.eligible_today ?? plan.items.length;
  const streak = progress?.streak_days ?? 0;
  const points = progress?.reward_points ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={BRAND_GRADIENT.colors as unknown as readonly [string, string, ...string[]]}
          locations={[0, 0.32, 0.5, 0.73, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>
              {greeting()}!
            </Text>
            <Text style={styles.heroTitle}>Today's Action Plan</Text>
            <Text style={styles.heroDate}>{plan.local_date}</Text>

            {progress ? (
              <View style={styles.streakRow}>
                <View style={styles.streakPill}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakText}>{streak} day streak</Text>
                </View>
                <View style={styles.streakPill}>
                  <Text style={styles.streakEmoji}>⭐</Text>
                  <Text style={styles.streakText}>{points} points</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${eligible > 0 ? Math.min(100, (completed / eligible) * 100) : 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {completed} of {eligible} done today
            </Text>
          </View>
        </LinearGradient>

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

        <Pressable
          accessibilityRole="button"
          onPress={onReview}
          style={({ pressed }) => [
            styles.reviewButton,
            pressed && styles.reviewButtonPressed,
          ]}
        >
          <LinearGradient
            colors={BRAND_GRADIENT.colors as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reviewButtonGradient}
          >
            <Text style={styles.reviewButtonText}>Complete daily review</Text>
          </LinearGradient>
        </Pressable>

        {reviewError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {reviewError}
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </View>
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
  const accent = categoryAccent(item.category);
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <PlanImage
        image={item.hero_image}
        style={styles.cardImage}
        onLoadFailure={onImageFailure}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPurpose}>{item.purpose}</Text>
        <View style={styles.cardActions}>
          <Pressable
            disabled={busy}
            onPress={() => onEvent(item, "completed")}
            style={({ pressed }) => [
              styles.actionButton,
              styles.doneButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => onEvent(item, "skipped")}
            style={({ pressed }) => [
              styles.actionButton,
              styles.skipButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      {item.variants.length > 0 ? (
        <View style={styles.variantsSection}>
          <Text style={styles.variantsTitle}>Try a different version</Text>
          <View style={styles.variantsRow}>
            {item.variants.map((variant) => (
              <Pressable
                key={variant.variant_id}
                disabled={busy}
                onPress={() => onReplace(item, variant)}
                style={({ pressed }) => [
                  styles.variantCard,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <PlanImage
                  image={variant.image}
                  style={styles.variantImage}
                  onLoadFailure={onImageFailure}
                  contentFit="cover"
                />
                <Text style={styles.variantLabel}>
                  {variantLabel(variant.variant_type)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F6FB",
  },
  scrollContent: {
    paddingBottom: responsiveHeight(14),
  },
  heroGradient: {
    paddingTop: responsiveHeight(7),
    paddingBottom: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(5),
    borderBottomLeftRadius: scale(28),
    borderBottomRightRadius: scale(28),
  },
  heroContent: {
    gap: responsiveHeight(0.8),
  },
  greeting: {
    fontFamily: FONT_INTER.medium,
    fontSize: responsiveFontSize(1.9),
    color: "rgba(255,255,255,0.92)",
  },
  heroTitle: {
    fontFamily: FONT_SERIF.semiBold ?? FONT_SERIF.medium,
    fontSize: responsiveFontSize(3.4),
    color: "#FFFFFF",
  },
  heroDate: {
    fontFamily: FONT_INTER.regular,
    fontSize: responsiveFontSize(1.8),
    color: "rgba(255,255,255,0.85)",
  },
  streakRow: {
    flexDirection: "row",
    gap: responsiveWidth(2.5),
    marginTop: responsiveHeight(0.6),
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(1.2),
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: scale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(5),
  },
  streakEmoji: {
    fontSize: responsiveFontSize(1.9),
  },
  streakText: {
    fontFamily: FONT_INTER.medium,
    fontSize: responsiveFontSize(1.7),
    color: "#FFFFFF",
  },
  progressTrack: {
    marginTop: responsiveHeight(1.6),
    height: verticalScale(8),
    borderRadius: scale(6),
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: scale(6),
    backgroundColor: "#FFFFFF",
  },
  progressLabel: {
    marginTop: responsiveHeight(0.5),
    fontFamily: FONT_INTER.regular,
    fontSize: responsiveFontSize(1.6),
    color: "rgba(255,255,255,0.9)",
  },
  card: {
    marginTop: responsiveHeight(2),
    marginHorizontal: responsiveWidth(4),
    borderRadius: scale(20),
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  cardAccent: {
    height: verticalScale(6),
  },
  cardImage: {
    width: "100%",
    height: responsiveHeight(24),
  },
  cardBody: {
    padding: scale(16),
    gap: responsiveHeight(0.7),
  },
  cardCategory: {
    fontFamily: FONT_INTER.medium,
    fontSize: responsiveFontSize(1.5),
    color: TEXT.grey,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontFamily: FONT_SERIF.semiBold ?? FONT_SERIF.medium,
    fontSize: responsiveFontSize(2.3),
    color: TEXT.primary,
  },
  cardPurpose: {
    fontFamily: FONT_INTER.regular,
    fontSize: responsiveFontSize(1.8),
    color: TEXT.grey,
    lineHeight: responsiveHeight(2.6),
  },
  cardActions: {
    flexDirection: "row",
    gap: responsiveWidth(3),
    marginTop: responsiveHeight(1),
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(26),
    paddingVertical: verticalScale(11),
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  doneButton: {
    backgroundColor: "#8B5CF6",
  },
  doneButtonText: {
    fontFamily: FONT_INTER.semiBold,
    fontSize: responsiveFontSize(1.9),
    color: "#FFFFFF",
  },
  skipButton: {
    backgroundColor: "#F3EFFA",
  },
  skipButtonText: {
    fontFamily: FONT_INTER.semiBold,
    fontSize: responsiveFontSize(1.9),
    color: TEXT.secondary,
  },
  variantsSection: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
  variantsTitle: {
    fontFamily: FONT_INTER.medium,
    fontSize: responsiveFontSize(1.8),
    color: TEXT.secondary,
    marginBottom: responsiveHeight(1),
  },
  variantsRow: {
    flexDirection: "row",
    gap: responsiveWidth(2.5),
  },
  variantCard: {
    flex: 1,
    borderRadius: scale(14),
    backgroundColor: "#F8F6FB",
    padding: scale(6),
    alignItems: "center",
    gap: responsiveHeight(0.4),
  },
  variantImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: scale(10),
  },
  variantLabel: {
    fontFamily: FONT_INTER.medium,
    fontSize: responsiveFontSize(1.6),
    color: TEXT.secondary,
    textAlign: "center",
  },
  reviewButton: {
    marginTop: responsiveHeight(3),
    marginHorizontal: responsiveWidth(4),
    borderRadius: scale(28),
    overflow: "hidden",
  },
  reviewButtonPressed: {
    opacity: 0.8,
  },
  reviewButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(14),
  },
  reviewButtonText: {
    fontFamily: FONT_INTER.semiBold,
    fontSize: responsiveFontSize(2),
    color: "#FFFFFF",
  },
  errorText: {
    marginTop: responsiveHeight(1.5),
    marginHorizontal: responsiveWidth(6),
    fontFamily: FONT_INTER.regular,
    fontSize: responsiveFontSize(1.7),
    color: TEXT.danger,
    textAlign: "center",
  },
});
