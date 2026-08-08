import { randomUUID } from 'expo-crypto';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useCurrentObservations,
  useObservationCatalog,
  useRecordObservation,
  type CatalogEntry,
} from './api';
import { styles } from './personalizeStyles';

function PreferenceCard({
  entry,
  unlocked,
  selected,
}: {
  entry: CatalogEntry;
  unlocked: boolean;
  selected: string[];
}) {
  const record = useRecordObservation('preference');

  const toggle = (choice: string) => {
    if (!unlocked) return;
    const next = entry.multi_select
      ? selected.includes(choice)
        ? selected.filter((value) => value !== choice)
        : [...selected, choice]
      : [choice];
    record.mutate({
      client_observation_id: randomUUID(),
      observation_type: 'preference',
      code: entry.code,
      observed_at: new Date().toISOString(),
      value: { codes: next },
    });
  };

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <Text style={styles.cardLabel}>{entry.label}</Text>
      {!unlocked ? (
        <Text style={styles.cardLockedNote}>
          Keep your streak going to unlock this.
        </Text>
      ) : (
        <View style={styles.choiceRow}>
          {entry.choices.map((choice) => {
            const isSelected = selected.includes(choice);
            return (
              <Pressable
                key={choice}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => toggle(choice)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && styles.chipLabelSelected,
                  ]}
                >
                  {choice.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function PersonalizeScreen() {
  const catalog = useObservationCatalog();
  const current = useCurrentObservations('preference');

  const loading = catalog.isPending || current.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Personalize</Text>
        <Text style={styles.body}>
          Preferences unlock as your streak grows, and shape the plans you get
          next.
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loading} accessibilityLabel="Loading preferences" />
        ) : (
          <View style={styles.section}>
            {catalog.data?.entries
              .filter((entry) => entry.observation_type === 'preference')
              .map((entry) => {
                const value = current.data?.entries.find(
                  (observation) => observation.code === entry.code,
                );
                const unlocked =
                  current.data?.unlocked_codes.includes(entry.code) ?? false;
                return (
                  <PreferenceCard
                    key={entry.code}
                    entry={entry}
                    unlocked={unlocked}
                    selected={value?.value.codes ?? []}
                  />
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
