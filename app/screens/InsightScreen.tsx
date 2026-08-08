import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Insights remain owner-pending. Do not infer health patterns from the retired
 * v1 analytics service or reward gates while definitions are unapproved.
 */
export default function InsightScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content} accessibilityRole="alert">
        <Text style={styles.title}>Insights are being rebuilt</Text>
        <Text style={styles.body}>
          Insights will return once their measures, clinical wording, and v2
          data source are approved. We are not showing legacy estimates here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFAFC' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { color: '#211B22', fontFamily: 'NotoSerif600', fontSize: 27 },
  body: { color: '#625B63', fontFamily: 'Inter400', fontSize: 16, lineHeight: 24, marginTop: 12 },
});
