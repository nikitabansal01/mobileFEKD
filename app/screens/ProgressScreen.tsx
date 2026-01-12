import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import WellnessDashboard from '@/components/WellnessDashboard';
import { auth } from '@/config/firebase';

const ProgressScreen = () => {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  const handleDimensionPress = (dimension: string) => {
    navigation.navigate('ChatbotScreen', {
      conversationContext: {
        context: 'know_body',
        initialMessage: `I want to learn about my ${dimension}`,
        userResponse: `I want to learn about my ${dimension}`
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WellnessDashboard
          userId={user?.uid || ''}
          onDimensionPress={handleDimensionPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ProgressScreen;
