import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AuvraCharacterNoShadow from './AuvraCharacterNoShadow';

interface BottomNavigationBarProps {
  activeTab?: 'home' | 'calendar' | 'auvra' | 'progress' | 'community';
  onTabPress?: (tab: string) => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab = 'home',
  onTabPress
}) => {
  const navigation = useNavigation();
  
  // 캐릭터 크기 설정
  const characterSize = responsiveWidth(18);
  // 빈 문자열의 크기 계산 (tabIcon의 fontSize와 동일)
  const emptyIconSize = responsiveFontSize(2.5);
  // 캐릭터와 글씨 간의 순수한 간격 (픽셀 단위)
  const characterTextGap = 5;

  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠', screen: 'HomeScreen' },
    { key: 'calendar', label: 'Calendar', icon: '📅', screen: 'CalendarScreen' },
    { key: 'auvra', label: 'Auvra', icon: '', screen: 'AuvraScreen' }, // 아이콘 제거
    { key: 'progress', label: 'Progress', icon: '📊', screen: 'ProgressScreen' },
    { key: 'community', label: 'Community', icon: '👥', screen: 'CommunityScreen' },
  ];

  const handleTabPress = (tabKey: string, screenName: string) => {
    // 커스텀 onTabPress 콜백이 있으면 호출
    onTabPress?.(tabKey);
    
    // 네비게이션 처리
    if (screenName && navigation) {
      try {
        // @ts-ignore - navigation 타입 체크 무시
        navigation.navigate(screenName);
      } catch (error) {
        console.log(`화면 ${screenName}으로 이동할 수 없습니다.`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 그라데이션 오버레이 */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.1)']}
        style={styles.gradientOverlay}
      />
      
      {/* 네비게이션 바 */}
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
              <Text style={[
                styles.tabIcon,
                activeTab === tab.key && styles.activeTabIcon
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 중앙 Auvra Character - 흰색 원 없이 */}
        <View style={[
          styles.characterContainer,
          { top: -(characterSize / 2 + characterTextGap - emptyIconSize) }
        ]}>
          <AuvraCharacterNoShadow size={characterSize} />
        </View>
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
    height: responsiveHeight(12), // 90px
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
    height: responsiveHeight(9), // 72px
    backgroundColor: '#ffffff',
    paddingHorizontal: responsiveWidth(5), // 18.257px
    paddingVertical: responsiveHeight(1), // 8.299px
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
    paddingHorizontal: responsiveWidth(1.5), // 5.809px
    paddingVertical: responsiveHeight(1), // 7.469px
    borderRadius: 28,
    width: responsiveWidth(15), // 55px
    opacity: 0.5,
  },
  activeTab: {
    backgroundColor: '#ffe9f1',
    borderRadius: 10,
    opacity: 1,
  },
  tabIcon: {
    fontSize: responsiveFontSize(2.5), // 20.816px
    marginBottom: responsiveHeight(0.2), // 1px
  },
  activeTabIcon: {
    color: '#bb4471',
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
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNavigationBar;
