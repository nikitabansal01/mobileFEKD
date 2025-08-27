import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import BottomNavigationBar from './BottomNavigationBar';

const BottomNavigationBarExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'auvra' | 'progress' | 'community'>('home');

  const handleTabPress = (tab: string) => {
    setActiveTab(tab as any);
    console.log('탭 변경:', tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <Text style={styles.title}>하단 네비게이션 바 테스트</Text>
        <Text style={styles.subtitle}>현재 활성 탭: {activeTab}</Text>
        
        {/* 샘플 컨텐츠 */}
        <View style={styles.sampleContent}>
          <Text style={styles.contentText}>
            여기에 실제 앱의 메인 컨텐츠가 들어갑니다.
          </Text>
          <Text style={styles.contentText}>
            하단 네비게이션 바가 고정되어 있습니다.
          </Text>
        </View>
      </View>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(5),
    paddingBottom: responsiveHeight(15), // 네비게이션 바 높이만큼 여백
  },
  title: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Inter600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },
  subtitle: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter400',
    color: '#6f6f6f',
    textAlign: 'center',
    marginBottom: responsiveHeight(5),
  },
  sampleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Inter400',
    color: '#000000',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },
});

export default BottomNavigationBarExample;


