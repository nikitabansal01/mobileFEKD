import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import ChatHistoryScreen from './ChatHistoryScreen';
import CommunityScreen from './CommunityScreen';
import HomeScreen from './HomeScreen';
import InsightScreen from './InsightScreen';
import PersonalizeScreen from './PersonalizeScreen';
import ProfileScreen from './ProfileScreen';

type TabType = 'home' | 'personalize' | 'progress' | 'community' | 'auvra' | 'insights' | 'profile';

interface MainScreenTabsProps {
  route?: {
    params?: {
      activeTab?: string;
      chatContext?: {
        chatId: string;
        conversationContext?: {
          initialMessage: string;
          userResponse: string;
          context: string;
        };
      };
    };
  };
}

export default function MainScreenTabs({ route }: MainScreenTabsProps) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Handle route params for navigation from HomeScreen
  React.useEffect(() => {
    console.log('MainScreenTabs - route params received:', route?.params);
    if (route?.params?.activeTab) {
      console.log('MainScreenTabs - Setting activeTab to:', route.params.activeTab);
      setActiveTab(route.params.activeTab as TabType);
    }
    if (route?.params?.chatContext) {
      console.log('MainScreenTabs - chatContext received:', route.params.chatContext);
    }
  }, [route?.params?.activeTab, route?.params?.chatContext]);

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
      case 'insights': // Map insights to insight screen
        return <InsightScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'profile':
        return <ProfileScreen navigation={navigation} />;
      case 'auvra':
        return <ChatHistoryScreen 
          onBackToHome={handleBackToHome} 
          activeTab={activeTab}
          onTabPress={handleTabPress}
          chatContext={route?.params?.chatContext}
        />;
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
