import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Personalization is deliberately unavailable until the owner approves its
 * health-data definitions and a canonical v2 API contract exists. The legacy
 * reward, preference, and profile-summary services are not safe fallbacks.
 */
export default function PersonalizeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content} accessibilityRole="alert">
        <Text style={styles.title}>Personalization is being rebuilt</Text>
        <Text style={styles.body}>
          This area will return after its data model, consent rules, and v2
          service contract are approved. Your current daily plan is unaffected.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { color: '#211B22', fontFamily: 'NotoSerif600', fontSize: 27 },
  body: { color: '#625B63', fontFamily: 'Inter400', fontSize: 16, lineHeight: 24, marginTop: 12 },
});
