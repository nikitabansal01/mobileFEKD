import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Progress metrics await their approved v2 projection and metric catalog. */
export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content} accessibilityRole="alert">
        <Text style={styles.title}>Progress is being rebuilt</Text>
        <Text style={styles.body}>
          We will show progress here after the approved adherence and streak
          metrics are connected to the v2 service.
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
