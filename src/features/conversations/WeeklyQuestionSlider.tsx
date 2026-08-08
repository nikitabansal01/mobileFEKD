import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { WeeklyQuestionDto } from "./api";

import {
  sliderButtonLabel,
  weeklySliderLabel,
} from "./conversationInteractions";

interface Props {
  question: WeeklyQuestionDto;
  busy: boolean;
  onSelect: (value: number) => void;
}

/** A server-defined weekly rating control. Selection is persisted immediately. */
export function WeeklyQuestionSlider({ question, busy, onSelect }: Props) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Text style={styles.title}>Choose a rating from 1 to 9</Text>
      <View
        style={styles.values}
        accessibilityRole="adjustable"
        accessibilityLabel="Weekly rating"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.value, tintFor(value)]}
            disabled={busy}
            onPress={() => onSelect(value)}
            accessibilityRole="button"
            accessibilityLabel={sliderButtonLabel(question, value)}
            accessibilityState={{ disabled: busy }}
          >
            <Text style={styles.valueText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.labels}>
        {[1, 3, 5, 7, 9].map((value) => (
          <Text key={value} style={styles.label}>
            {weeklySliderLabel(question, value)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function tintFor(value: number) {
  if (value <= 3) return styles.low;
  if (value <= 6) return styles.medium;
  return styles.high;
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingTop: 8 },
  title: { color: "#251A29", fontWeight: "700" },
  values: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  value: {
    minWidth: 28,
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 7,
  },
  low: { backgroundColor: "#EAF7DD" },
  medium: { backgroundColor: "#FFFCDB" },
  high: { backgroundColor: "#FFEFF6" },
  valueText: { color: "#251A29", fontWeight: "700" },
  labels: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#6B4E71", fontSize: 11, flex: 1, textAlign: "center" },
});
