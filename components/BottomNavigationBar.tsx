import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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
  const characterTextGap = 8;

  const tabs = [
    { 
      key: 'home', 
      label: 'Home', 
      icon: require('../assets/icons/IconHome.png'),
      screen: 'HomeScreen' 
    },
    { 
      key: 'calendar', 
      label: 'Calendar', 
      icon: require('../assets/icons/IconCalendar.png'),
      screen: 'CalendarScreen' 
    },
    { 
      key: 'auvra', 
      label: 'Auvra', 
      icon: null, // 아이콘 없음
      screen: 'AuvraScreen' 
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
    height: responsiveHeight(14), // 바 전체 높이 증가 (90px → 105px)
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
    height: responsiveHeight(8), // 네비게이션 영역 높이 증가 (72px → 82.5px)
    backgroundColor: '#ffffff',
    paddingHorizontal: responsiveWidth(5), // 18.257px
    paddingVertical: responsiveHeight(1.5), // 패딩 증가
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
    paddingHorizontal: responsiveWidth(1), // 버튼 내부 가로 패딩 증가
    paddingVertical: responsiveHeight(0.5), // 버튼 내부 세로 패딩 증가
    borderRadius: 28,
    width: responsiveWidth(15), // 버튼 너비 증가 (55px → 66px)
    opacity: 0.5,
  },
  activeTab: {
    backgroundColor: '#ffe9f1',
    borderRadius: 10,
    opacity: 1,
  },
  tabIcon: {
    width: responsiveWidth(6), // 아이콘 크기
    height: responsiveWidth(6), // 아이콘 크기
    marginBottom: responsiveHeight(0.2), // 1px
  },
  emptyIconSpace: {
    width: responsiveWidth(6), // 아이콘 크기
    height: responsiveWidth(6), // 아이콘 크기
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
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNavigationBar;
