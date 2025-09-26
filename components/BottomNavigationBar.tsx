import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import AuvraCharacterNoShadow from './AuvraCharacterNoShadow';

/**
 * Props for the BottomNavigationBar component
 */
interface BottomNavigationBarProps {
  /** Currently active tab */
  activeTab?: 'home' | 'personalize' | 'auvra' | 'progress' | 'community';
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
  
  // Character size configuration
  const characterSize = responsiveWidth(18);
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
      icon: require('../assets/icons/IconCalendar.png'),
      screen: 'PersonalizeScreen' 
    },
    { 
      key: 'auvra', 
      label: 'Auvra', 
      icon: null, // No icon
      screen: 'ChatbotScreen' 
    },
    { 
      key: 'progress', 
      label: 'Progress', 
      icon: require('../assets/icons/IconProgress.png'),
      screen: 'ProgressScreen' 
    },
    { 
      key: 'community', 
      label: 'Community', 
      icon: require('../assets/icons/IconCommunity.png'),
      screen: 'CommunityScreen' 
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
      
      {/* Navigation bar */}
      <View style={styles.navigationBar}>
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => handleTabPress(tab.key, tab.screen)}
            >
              {tab.icon ? (
                <Image 
                  source={tab.icon}
                  style={styles.tabIcon}
                  tintColor={activeTab === tab.key ? '#bb4471' : '#000000'}
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
        
        {/* Center Auvra Character - without white circle */}
        <TouchableOpacity 
          style={[
            styles.characterContainer,
            { 
              top: -(characterSize / 2 + characterTextGap - emptyIconSize),
              marginLeft: -(60 / 2) // Center the 60px wide container
            }
          ]}
          onPress={() => handleTabPress('auvra', 'ChatbotScreen')}
          activeOpacity={0.7}
        >
          <AuvraCharacterNoShadow size={characterSize} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(14), // Increased bar height (90px → 105px)
  },
  gradientOverlay: {
    position: 'absolute',
    top: -responsiveHeight(3), // -27px
    left: 0,
    right: 0,
    height: responsiveHeight(4), // 44px
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveHeight(8), // Increased navigation area height (72px → 82.5px)
    backgroundColor: '#ffffff',
    paddingHorizontal: responsiveWidth(5), // 18.257px
    paddingVertical: responsiveHeight(1.5), // Increased padding
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(1), // Increased button horizontal padding
    paddingVertical: responsiveHeight(0.5), // Increased button vertical padding
    borderRadius: 28,
    width: responsiveWidth(15), // Increased button width (55px → 66px)
    opacity: 0.5,
  },
  activeTab: {
    backgroundColor: '#ffe9f1',
    borderRadius: 10,
    opacity: 1,
  },
  tabIcon: {
    width: responsiveWidth(6), // Icon size
    height: responsiveWidth(6), // Icon size
    marginBottom: responsiveHeight(0.2), // 1px
  },
  emptyIconSpace: {
    width: responsiveWidth(6), // Icon size
    height: responsiveWidth(6), // Icon size
    marginBottom: responsiveHeight(0.2), // 1px
  },
  tabLabel: {
    fontSize: responsiveFontSize(1.13), // 8px
    fontFamily: 'Inter400',
    color: '#000000',
    textAlign: 'center',
  },
  activeTabLabel: {
    fontFamily: 'Inter600',
    color: '#bb4471',
  },
  characterContainer: {
    position: 'absolute',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, // Fixed reasonable touch area
    height: 60,
    zIndex: 1, // Ensure it's above other elements but doesn't block them
  },
});

export default BottomNavigationBar;
