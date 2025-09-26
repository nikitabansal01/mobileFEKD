import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import ChatbotScreen from './ChatbotScreen';
import CommunityScreen from './CommunityScreen';
import HomeScreen from './HomeScreen';
import PersonalizeScreen from './PersonalizeScreen';
import ProgressScreen from './ProgressScreen';

type TabType = 'home' | 'personalize' | 'progress' | 'community' | 'auvra';

export default function MainScreenTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const handleBackToHome = () => {
    setActiveTab('home');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'personalize':
        return <PersonalizeScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'auvra':
        return <ChatbotScreen onBackToHome={handleBackToHome} />;
      default:
        return <HomeScreen />;
    }
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>
      {activeTab !== 'auvra' && (
        <BottomNavigationBar 
          activeTab={activeTab} 
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});
