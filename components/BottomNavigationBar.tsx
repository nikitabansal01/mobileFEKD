import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import AuvraCharacterNoShadow from './AuvraCharacterNoShadow';
import { rewardService } from '../services/rewardService';

/**
 * Props for backwards compatibility
 */
interface LegacyBottomNavigationBarProps {
  activeTab?: 'home' | 'personalize' | 'auvra' | 'insights' | 'profile' | 'progress' | 'community';
  onTabPress?: (tab: string) => void;
  navigation?: any;
}

type BottomNavigationBarProps = BottomTabBarProps | LegacyBottomNavigationBarProps;

/**
 * Type guard to check if props are from React Navigation
 */
function isReactNavigationProps(props: BottomNavigationBarProps): props is BottomTabBarProps {
  return 'state' in props && 'navigation' in props && props.state !== undefined;
}

/**
 * BottomNavigationBar Component
 * 
 * A custom bottom navigation bar with 5 tabs including a centered Auvra character.
 * Provides navigation between main app screens with visual feedback.
 */
const BottomNavigationBar: React.FC<BottomNavigationBarProps> = (props) => {
  const hookNavigation = useNavigation();
  const characterSize = responsiveWidth(20);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [canFreeze, setCanFreeze] = useState(false);

  // Fetch streak risk status to show badge
  useEffect(() => {
    const fetchStreakStatus = async () => {
      try {
        const data = await rewardService.getRewardsStatus();
        if (data) {
          setStreakAtRisk(data.streak_at_risk || false);
          setCanFreeze(data.can_freeze || false);
        }
      } catch (error) {
        console.log('Error fetching streak status for nav badge:', error);
      }
    };

    fetchStreakStatus();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStreakStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      key: 'home',
      label: 'Home',
      icon: require('../assets/icons/IconHome.png'),
      showBadge: false, // Badge removed as requested
    },
    {
      key: 'personalize',
      label: 'Personalize',
      icon: require('../assets/icons/IconPersonalize.png'),
      showBadge: false, // Badge removed as requested
    },
    {
      key: 'auvra',
      label: 'Auvra',
      icon: null,
      showBadge: false,
    },
    {
      key: 'insights',
      label: 'Insights',
      icon: require('../assets/icons/IconProgress.png'),
      showBadge: false,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: require('../assets/icons/IconProfile.png'),
      showBadge: false,
    },
  ];

  // Determine which mode we're in
  let activeTab: string;
  let handleTabPress: (routeName: string) => void;

  if (isReactNavigationProps(props)) {
    // React Navigation mode
    const { state, navigation } = props;
    activeTab = state.routes[state.index].name;

    handleTabPress = (routeName: string) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes.find(r => r.name === routeName)?.key || '',
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    };
  } else {
    // Legacy mode
    const { activeTab: legacyActiveTab = 'home', onTabPress, navigation: propNavigation } = props;
    activeTab = legacyActiveTab;
    const navigation = propNavigation || hookNavigation;

    handleTabPress = (routeName: string) => {
      if (onTabPress) {
        onTabPress(routeName);
      } else if (navigation) {
        try {
          navigation.navigate(routeName);
        } catch (error) {
          console.log(`Cannot navigate to ${routeName}:`, error);
        }
      }
    };
  }

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
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    isActive && styles.activeTab,
                    isActive && tab.key === 'auvra' && styles.activeTabAuvra
                  ]}
                  onPress={() => handleTabPress(tab.key)}
                >
                  <View>
                    {tab.icon ? (
                      <Image
                        source={tab.icon}
                        style={styles.tabIcon}
                        tintColor={isActive ? '#C17EC9' : '#000000'}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.emptyIconSpace} />
                    )}
                    {/* Red alert badge removed as requested */}
                  </View>
                  <Text style={[
                    styles.tabLabel,
                    isActive && styles.activeTabLabel
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Auvra Character - positioned over the navigation */}
        <View style={styles.characterWrapper}>
          <TouchableOpacity
            style={styles.characterContainer}
            onPress={() => handleTabPress('auvra')}
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
    height: responsiveHeight(11.5),
    zIndex: 1000,
    backgroundColor: 'transparent',
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
    height: responsiveHeight(8.5),
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: responsiveWidth(5.1),
    paddingVertical: responsiveHeight(1.5),
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
    paddingHorizontal: responsiveWidth(1.6),
    paddingVertical: responsiveHeight(1),
    borderRadius: 28,
    width: responsiveWidth(15.3),
    opacity: 0.5,
  },
  activeTab: {
    backgroundColor: 'rgba(221,194,233,0.5)',
    borderRadius: 10,
    opacity: 1,
  },
  activeTabAuvra: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  tabIcon: {
    width: responsiveWidth(4.4),
    height: responsiveWidth(4.4),
    marginBottom: responsiveHeight(0.3),
  },
  tabLabel: {
    fontSize: responsiveFontSize(1.1),
    fontFamily: 'Inter400',
    color: '#000000',
    textAlign: 'center',
  },
  activeTabLabel: {
    fontFamily: 'Inter400',
    color: '#C17EC9',
  },
  characterWrapper: {
    position: 'absolute',
    bottom: responsiveHeight(4.5),
    left: '50%',
    marginLeft: -responsiveWidth(7.6),
    zIndex: 3,
  },
  characterContainer: {
    width: responsiveWidth(15.3),
    height: responsiveWidth(15.3),
    borderRadius: responsiveWidth(7.65),
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
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  alertBadgePulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    opacity: 0.4,
  },
});

export default BottomNavigationBar;