// URL 폴리필을 가장 먼저 import
import 'react-native-url-polyfill/auto';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import { useFonts } from "expo-font";
import React, { createContext } from 'react';
import { StatusBar, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";

// Screens
import ActionCompletedScreen from './app/screens/ActionCompletedScreen';
import ActionDetailScreen from './app/screens/ActionDetailScreen';
import HomeScreen from './app/screens/HomeScreen';
import IntroScreen from './app/screens/IntroScreen';
import LoadingScreen from './app/screens/LoadingScreen';
import LoginScreen from './app/screens/LoginScreen';
import OnboardingScreen from './app/screens/OnboardingScreen';
import QuestionScreen from './app/screens/QuestionScreen';
import ResearchingScreen from './app/screens/ResearchingScreen';
import ResultLoadingScreen from './app/screens/ResultLoadingScreen';
import ResultScreen from './app/screens/ResultScreen';

// Context - FirstLog를 직접 정의
interface FirstLogContextType {
  firstTimeLog: boolean;
  setFirstTimeLog: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FirstLog = createContext<FirstLogContextType | undefined>(undefined);

const Stack = createStackNavigator();

export default function App() {
  // 전역 폰트 스케일링 비활성화
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.allowFontScaling = false;

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.allowFontScaling = false;

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

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <FirstLog.Provider value={{ firstTimeLog: true, setFirstTimeLog: () => {} }}>
          <StatusBar barStyle={"dark-content"} backgroundColor={"#FFF"} />
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="OnboardingScreen"
              screenOptions={{ 
                headerShown: false,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
              <Stack.Screen name="IntroScreen" component={IntroScreen} />
              <Stack.Screen name="QuestionScreen" component={QuestionScreen} />
              <Stack.Screen name="ResultScreen" component={ResultScreen} />
              <Stack.Screen name="ResearchingScreen" component={ResearchingScreen} />
              <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
              <Stack.Screen name="ResultLoadingScreen" component={ResultLoadingScreen} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="HomeScreen" component={HomeScreen} />
              <Stack.Screen name="ActionDetailScreen" component={ActionDetailScreen} />
              <Stack.Screen name="ActionCompletedScreen" component={ActionCompletedScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </FirstLog.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

// Expo registerRootComponent 등록
registerRootComponent(App);
