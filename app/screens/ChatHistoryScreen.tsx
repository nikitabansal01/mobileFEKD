import Images from '@/assets/images';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale } from 'react-native-size-matters';

type RootStackParamList = {
  ChatbotScreen: {
    conversationContext?: {
      initialMessage: string;
      userResponse: string;
      context: string;
    };
  };
  MainScreenTabs: undefined;
};

interface ChatHistoryScreenProps {
  onBackToHome?: () => void;
  activeTab?: 'home' | 'personalize' | 'auvra' | 'insights' | 'profile' | 'progress' | 'community';
  onTabPress?: (tab: string) => void;
  chatContext?: {
    chatId: string;
    conversationContext?: {
      initialMessage: string;
      userResponse: string;
      context: string;
    };
  };
}

const ChatHistoryScreen: React.FC<ChatHistoryScreenProps> = ({ onBackToHome, activeTab = 'auvra', onTabPress, chatContext }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Chat data with engaging previews
  const chatHistory = [
    {
      id: '1',
      title: 'Care Plan check-in',
      preview: "💜 Let's see how your wellness plan is going!\nReady to check in?",
      timestamp: 'Today',
      avatar: Images.ChatThumbnail,
    },
    {
      id: '2',
      title: 'Symptom checkin',
      preview: "Track your symptoms and see patterns 📊\nI'll help you understand what's happening",
      timestamp: 'Last week',
      avatar: Images.ChatThumbnail,
    },
    {
      id: '3',
      title: 'Want to Personalise?',
      preview: "✨ Make Auvra work better for you!\n25+ personalisation factors available",
      timestamp: 'Last week',
      avatar: Images.ChatThumbnail,
    },
    {
      id: '4',
      title: 'Know my body',
      preview: "🌸 Learn about your cycle, hormones & more\nKnowledge is power!",
      timestamp: 'Last week',
      avatar: Images.ChatThumbnail,
    },
  ];

  const handleChatPress = (chat: any) => {
    // Navigate to ChatbotScreen with different contexts for each chat
    let context = '';
    
    switch (chat.id) {
      case '1': // Care Plan check-in
        context = 'care_plan_modal';
        break;
      case '2': // Symptom checkin
        context = 'symptom_checkin';
        break;
      case '3': // Want to Personalise?
        context = 'personalise';
        break;
      case '4': // Know my body
        context = 'know_body';
        break;
      default:
        context = chat.id;
    }
    
    console.log('ChatHistoryScreen - Navigating to ChatbotScreen with context:', context);
    console.log('ChatHistoryScreen - Chat:', chat);
    
    // Use the actual user response if available (from HomeScreen modal), otherwise use default
    const userResponse = chatContext?.conversationContext?.userResponse || 'Continue conversation';
    
    navigation.navigate('ChatbotScreen', {
      conversationContext: {
        initialMessage: chat.title,
        userResponse: userResponse,
        context: context,
      },
    });
  };

  const handleBackPress = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      navigation.goBack();
    }
  };

  // Auto-navigate to specific chat if chatContext is provided
  React.useEffect(() => {
    console.log('ChatHistoryScreen - chatContext received:', chatContext);
    if (chatContext?.conversationContext) {
      // Find the specific chat and navigate to it
      const targetChat = chatHistory.find(chat => chat.id === chatContext.chatId);
      console.log('ChatHistoryScreen - targetChat found:', targetChat);
      if (targetChat) {
        console.log('ChatHistoryScreen - Navigating to chat:', targetChat.title);
        handleChatPress(targetChat);
      }
    }
  }, [chatContext]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats with Auvra</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Chat List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chatHistory.map((chat, index) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() => handleChatPress(chat)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFF3FB', '#FCC4DA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.chatGradient}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarBorder}>
                  <Image
                    source={chat.avatar}
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Chat Content */}
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>{chat.title}</Text>
                  <View style={styles.chevronContainer}>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </View>
                <Text style={styles.chatPreview}>{chat.preview}</Text>
                <Text style={styles.chatTimestamp}>{chat.timestamp}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Bottom Navigation Bar */}
      <BottomNavigationBar 
        activeTab={activeTab} 
        onTabPress={onTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6),
    paddingBottom: responsiveHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: responsiveWidth(2),
  },
  backButtonText: {
    fontSize: responsiveFontSize(2.5),
    color: '#000000',
  },
  headerTitle: {
    fontSize: moderateScale(14, 1.2),
    fontFamily: 'Inter500',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: responsiveWidth(10),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(7),
    paddingVertical: responsiveHeight(2),
    paddingBottom: responsiveHeight(12), // Add space for bottom navigation
  },
  chatItem: {
    marginBottom: responsiveHeight(1.5),
    borderRadius: responsiveWidth(4),
    overflow: 'hidden',
  },
  chatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(2.5),
    minHeight: responsiveHeight(13.5),
  },
  avatarContainer: {
    marginRight: responsiveWidth(4),
  },
  avatarBorder: {
    width: responsiveWidth(12.5),
    height: responsiveWidth(12.5),
    borderRadius: responsiveWidth(6.25),
    borderWidth: 5,
    borderColor: '#FCDDEC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: responsiveWidth(8),
    height: responsiveWidth(8),
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveHeight(0.8),
  },
  chatTitle: {
    fontSize: moderateScale(12, 1.1),
    fontFamily: 'Poppins600',
    color: '#000000',
    flex: 1,
  },
  chevronContainer: {
    marginLeft: responsiveWidth(2),
  },
  chevron: {
    fontSize: responsiveFontSize(2),
    color: '#000000',
    opacity: 0.6,
  },
  chatPreview: {
    fontSize: moderateScale(10, 1),
    fontFamily: 'Inter400',
    color: 'rgba(0, 0, 0, 0.7)',
    opacity: 0.6,
    lineHeight: moderateScale(14, 1.2),
    marginBottom: responsiveHeight(0.5),
  },
  chatTimestamp: {
    fontSize: moderateScale(10, 1),
    fontFamily: 'Inter400',
    color: 'rgba(0, 0, 0, 0.7)',
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
});

export default ChatHistoryScreen;
