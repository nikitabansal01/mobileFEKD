import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import ChatHistoryScreen from './ChatHistoryScreen';
import CommunityScreen from './CommunityScreen';
import HomeScreen from './HomeScreen';
import InsightScreen from './InsightScreen';
import PersonalizeScreen from './PersonalizeScreen';
import ProfileScreen from './ProfileScreen';
import ProgressScreen from './ProgressScreen';

type TabType = 'home' | 'personalize' | 'progress' | 'community' | 'auvra' | 'insights' | 'profile';

interface MainScreenTabsProps {
  route?: {
    params?: {
      activeTab?: string;
      freshSignup?: boolean;
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

const Tab = createBottomTabNavigator();

export default function MainScreenTabs({ route }: MainScreenTabsProps) {
  const initialTab = route?.params?.activeTab || 'home';
  const chatContext = route?.params?.chatContext;
  const freshSignup = route?.params?.freshSignup || false;

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      screenOptions={{
        headerShown: false,
        // lazy: false, // Render all screens immediately - keeps them mounted
      }}
      tabBar={(props) => {
        // Hide tab bar on auvra screen
        const currentRoute = props.state.routes[props.state.index].name;
        if (currentRoute === 'auvra') {
          return null;
        }
        return <BottomNavigationBar {...props} />;
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        initialParams={{ freshSignup }}
      />
      <Tab.Screen
        name="personalize"
        component={PersonalizeScreen}
      />
      <Tab.Screen
        name="insights"
        component={InsightScreen}
      />
      <Tab.Screen
        name="progress"
        component={ProgressScreen}
      />
      <Tab.Screen
        name="community"
        component={CommunityScreen}
      />
      <Tab.Screen
        name="profile"
        component={ProfileScreen}
      />
      <Tab.Screen
        name="auvra"
        component={ChatHistoryScreen}
        initialParams={{
          chatContext: chatContext,
        }}
      />
    </Tab.Navigator>
  );
}