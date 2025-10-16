import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuvraCharacterNoShadow from './AuvraCharacterNoShadow';

/**
 * Props for the BottomNavigationBar component
 */
interface BottomNavigationBarProps {
  /** Currently active tab */
  activeTab?: 'home' | 'personalize' | 'auvra' | 'insights' | 'profile' | 'progress' | 'community';
  /** Custom tab press handler */
  onTabPress?: (tab: string) => void;
  /** Navigation object */
  navigation?: any;
}

/**
 * BottomNavigationBar Component
 * 
 * A custom bottom navigation bar with 5 tabs including a centered Auvra character.
 * Provides navigation between main app screens with visual feedback.
 * 
 * @param props - Component props
 * @param props.activeTab - Currently active tab
 * @param props.onTabPress - Custom tab press handler
 * @returns JSX.Element
 */
const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab = 'home',
  onTabPress,
  navigation: propNavigation
}) => {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const insets = useSafeAreaInsets();
  
  // Character size configuration
  const characterSize = responsiveWidth(20);
  // Empty string size calculation (same as tabIcon fontSize)
  const emptyIconSize = responsiveFontSize(2.5);
  // Pure gap between character and text (in pixels)
  const characterTextGap = 8;

  const tabs = [
    { 
      key: 'home', 
      label: 'Home', 
      icon: require('../assets/icons/IconHome.png'),
      screen: 'HomeScreen' 
    },
    { 
      key: 'personalize', 
      label: 'Personalize', 
      icon: require('../assets/icons/IconPersonalize.png'),
      screen: 'PersonalizeScreen' 
    },
    { 
      key: 'auvra', 
      label: 'Auvra', 
      icon: null, // No icon - will use Auvra character
      screen: 'ChatHistoryScreen' 
    },
    { 
      key: 'insights', 
      label: 'Insights', 
      icon: require('../assets/icons/IconProgress.png'), // Using progress icon for insights
      screen: 'insights' // Map to insights tab in MainScreenTabs
    },
    { 
      key: 'profile', 
      label: 'Profile', 
      icon: require('../assets/icons/IconProfile.png'),
      screen: 'profile' // Map to profile tab in MainScreenTabs
    },
  ];

  /**
   * Handles tab press events
   * 
   * @param tabKey - Tab identifier
   * @param screenName - Screen name to navigate to
   */
  const handleTabPress = (tabKey: string, screenName: string) => {
    console.log(`Attempting to navigate to ${screenName}`);
    
    // If onTabPress callback is provided, use it and skip direct navigation
    if (onTabPress) {
      console.log('Using onTabPress callback for navigation');
      onTabPress(tabKey);
      return;
    }
    
    // Fallback to direct navigation only if no callback is provided
    if (screenName && navigation) {
      try {
        console.log('Navigation object:', navigation);
        // @ts-ignore - Ignore navigation type check
        navigation.navigate(screenName);
        console.log(`Successfully navigated to ${screenName}`);
      } catch (error) {
        console.log(`Cannot navigate to screen ${screenName}:`, error);
      }
    } else {
      console.log('No screen name or navigation object available');
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.25)']}
        locations={[0, 0.6, 1]}
        style={styles.gradientBackground}
      />
      
      {/* Main Navigation Bar */}
      <View style={styles.navigationBar}>
        {/* White navigation background */}
        <View style={styles.navBackground}>
          <View style={styles.tabsRow}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab,
                  activeTab === tab.key && tab.key === 'auvra' && styles.activeTabAuvra
                ]}
                onPress={() => handleTabPress(tab.key, tab.screen)}
              >
                {tab.icon ? (
                  <Image 
                    source={tab.icon}
                    style={styles.tabIcon}
                    tintColor={activeTab === tab.key ? '#C17EC9' : '#000000'}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.emptyIconSpace} />
                )}
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Auvra Character - positioned over the navigation */}
        <View style={styles.characterWrapper}>
          <TouchableOpacity 
            style={styles.characterContainer}
            onPress={() => handleTabPress('auvra', 'ChatHistoryScreen')}
            activeOpacity={0.7}
          >
            <AuvraCharacterNoShadow size={characterSize} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(11.5), // 92px total height to accommodate Auvra character
    zIndex: 1000,
    backgroundColor: 'transparent', // Transparent to allow Auvra character to show
  },
  gradientBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(12.5),
    zIndex: 1,
  },
  navigationBar: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  navBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(8.5), // Increased to 85px for better visibility
    backgroundColor: 'rgba(255, 255, 255, 1)', // More transparent for better blend
    paddingHorizontal: responsiveWidth(5.1), // 18.257px
    paddingVertical: responsiveHeight(1.5), // Increased padding
    zIndex: 2,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(1.6), // 5.809px
    paddingVertical: responsiveHeight(1), // 7.469px
    borderRadius: 28,
    width: responsiveWidth(15.3), // 55px width
    opacity: 0.5,
  },
  activeTab: {
    backgroundColor: 'rgba(221,194,233,0.5)', // Lavender background for all tabs except Auvra
    borderRadius: 10,
    opacity: 1,
  },
  activeTabAuvra: {
    backgroundColor: 'transparent', // No background for Auvra tab
    borderRadius: 0,
  },
  tabIcon: {
    width: responsiveWidth(4.4), // 16px icon
    height: responsiveWidth(4.4), // 16px icon
    marginBottom: responsiveHeight(0.3), // Increased gap between icon and label
  },
  tabLabel: {
    fontSize: responsiveFontSize(1.1), // 8px
    fontFamily: 'Inter400',
    color: '#000000',
    textAlign: 'center',
  },
  activeTabLabel: {
    fontFamily: 'Inter400', // Keep same font weight as inactive tabs
    color: '#C17EC9', // Lavender color
  },
  characterWrapper: {
    position: 'absolute',
    bottom: responsiveHeight(4.5), // Increased to avoid text overlap on web
    left: '50%',
    marginLeft: -responsiveWidth(7.6), // -27.5px to center 55px circle
    zIndex: 3,
  },
  characterContainer: {
    width: responsiveWidth(15.3), // 55px
    height: responsiveWidth(15.3), // 55px
    borderRadius: responsiveWidth(7.65), // 27.5px radius for circle
    borderWidth: 1,
    borderColor: '#f7f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyIconSpace: {
    width: responsiveWidth(4.4),
    height: responsiveWidth(4.4),
    marginBottom: responsiveHeight(0.1),
  },
});

export default BottomNavigationBar;
