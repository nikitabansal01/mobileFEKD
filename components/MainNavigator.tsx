import React from 'react';
import { StyleSheet, View } from 'react-native';
import BottomNavigationBar from './BottomNavigationBar';

interface MainNavigatorProps {
  children: React.ReactNode;
  activeTab?: 'home' | 'personalize' | 'auvra' | 'progress' | 'community';
  showBottomNav?: boolean;
}

const MainNavigator: React.FC<MainNavigatorProps> = ({ 
  children, 
  activeTab = 'home', 
  showBottomNav = true 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showBottomNav && (
        <BottomNavigationBar activeTab={activeTab} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});

export default MainNavigator;
