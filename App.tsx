// Import URL polyfill first
import 'react-native-url-polyfill/auto';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import { useFonts } from "expo-font";
import React, { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";
import { auth } from './config/firebase';

// Web-only: Import global CSS to fix scrollbar and body overflow
if (Platform.OS === 'web') {
  require('./global.web.css');
}

// Screens
import ActionCompletedScreen from './app/screens/ActionCompletedScreen';
import ActionDetailScreen from './app/screens/ActionDetailScreen';
import ChatbotScreen from './app/screens/ChatbotScreen';
import InsightsScreen from './app/screens/InsightsScreen';
import IntroScreen from './app/screens/IntroScreen';
import LoadingScreen from './app/screens/LoadingScreen';
import LoginScreen from './app/screens/LoginScreen';
import MainScreenTabs from './app/screens/MainScreenTabs';
import OnboardingScreen from './app/screens/OnboardingScreen';
import PaywallScreen from './app/screens/PaywallScreen';
import QuestionScreen from './app/screens/QuestionScreen';
import ResearchingScreen from './app/screens/ResearchingScreen';
import ResultLoadingScreen from './app/screens/ResultLoadingScreen';
import ResultScreen from './app/screens/ResultScreen';
import SignupLoadingScreen from './app/screens/SignupLoadingScreen';
import SplashScreen from './app/screens/SplashScreen';

// Context - Define FirstLog directly
interface FirstLogContextType {
  firstTimeLog: boolean;
  setFirstTimeLog: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FirstLog = createContext<FirstLogContextType | undefined>(undefined);

const Stack = createStackNavigator();

export default function App() {
  // Disable global font scaling
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.allowFontScaling = false;

  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.allowFontScaling = false;

  const [loaded] = useFonts({
    Rubik400: require("./assets/fonts/Rubik-Regular.ttf"),
    Rubik500: require("./assets/fonts/Rubik-Medium.ttf"),
    RubikItalic400: require("./assets/fonts/Rubik-Italic.ttf"),
    RubikItalic500: require("./assets/fonts/Rubik-MediumItalic.ttf"),
    Rubik600: require("./assets/fonts/Rubik-SemiBold.ttf"),
    Poppins500: require("./assets/fonts/Poppins-Medium.ttf"),
    Poppins600: require("./assets/fonts/Poppins-SemiBold.ttf"),
    Poppins400: require("./assets/fonts/Poppins-Regular.ttf"),
    Inter400: require("./assets/fonts/Inter_18pt-Regular.ttf"),
    Inter500: require("./assets/fonts/Inter_18pt-Medium.ttf"),
    Inter600: require("./assets/fonts/Inter_18pt-SemiBold.ttf"),
    Inter300: require("./assets/fonts/Inter_18pt-Light.ttf"),
    NotoSerif100: require("./assets/fonts/NotoSerif-Thin.ttf"),
    NotoSerif300: require("./assets/fonts/NotoSerif-Light.ttf"),
    NotoSerif400: require("./assets/fonts/NotoSerif-Regular.ttf"),
    NotoSerif500: require("./assets/fonts/NotoSerif-Medium.ttf"),
    NotoSerif600: require("./assets/fonts/NotoSerif-SemiBold.ttf"),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth state on app start
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  if (!loaded || !authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#bb4471" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <FirstLog.Provider value={{ firstTimeLog: true, setFirstTimeLog: () => { } }}>
          <StatusBar barStyle={"dark-content"} backgroundColor={"#FFF"} />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="SplashScreen"
              screenOptions={{
                headerShown: false,
                gestureEnabled: Platform.OS === 'ios' || Platform.OS === 'web', // Enable gestures on web
                cardStyle: { flex: 1 }, // Critical for web scroll - gives bounded height
              }}
            >
              <Stack.Screen name="SplashScreen" component={SplashScreen} />
              <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
              <Stack.Screen name="IntroScreen" component={IntroScreen} />
              <Stack.Screen name="QuestionScreen" component={QuestionScreen} />
              <Stack.Screen name="ResultScreen" component={ResultScreen} />
              <Stack.Screen name="ResearchingScreen" component={ResearchingScreen} />
              <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
              <Stack.Screen name="ResultLoadingScreen" component={ResultLoadingScreen} />
              <Stack.Screen name="SignupLoadingScreen" component={SignupLoadingScreen} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="MainScreenTabs" component={MainScreenTabs} />
              <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
              <Stack.Screen name="ActionDetailScreen" component={ActionDetailScreen} />
              <Stack.Screen name="ActionCompletedScreen" component={ActionCompletedScreen} />
              <Stack.Screen name="InsightsScreen" component={InsightsScreen} />
              <Stack.Screen name="PaywallScreen" component={PaywallScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </FirstLog.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

// Register Expo root component
registerRootComponent(App);
