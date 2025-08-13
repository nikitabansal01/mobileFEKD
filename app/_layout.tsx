import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { createContext, useState } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";

interface FirstLogContextType {
  firstTimeLog: boolean;
  setFirstTimeLog: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FirstLog = createContext<FirstLogContextType | undefined>(undefined);

export default function RootLayout() {
  const [firstTimeLog, setFirstTimeLog] = useState(true);

  const [loaded] = useFonts({
    Rubik400: require("../assets/fonts/Rubik-Regular.ttf"),
    Rubik500: require("../assets/fonts/Rubik-Medium.ttf"),
    RubikItalic400: require("../assets/fonts/Rubik-Italic.ttf"),
    RubikItalic500: require("../assets/fonts/Rubik-MediumItalic.ttf"),
    Rubik600: require("../assets/fonts/Rubik-SemiBold.ttf"),
    Poppins500: require("../assets/fonts/Poppins-Medium.ttf"),
    Poppins600: require("../assets/fonts/Poppins-SemiBold.ttf"),
    Poppins400: require("../assets/fonts/Poppins-Regular.ttf"),
    Inter400: require("../assets/fonts/Inter_18pt-Regular.ttf"),
    Inter500: require("../assets/fonts/Inter_18pt-Medium.ttf"),
    Inter600: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    Inter300: require("../assets/fonts/Inter_18pt-Light.ttf"),
    NotoSerif100: require("../assets/fonts/NotoSerif-Thin.ttf"),
    NotoSerif300: require("../assets/fonts/NotoSerif-Light.ttf"),
    NotoSerif400: require("../assets/fonts/NotoSerif-Regular.ttf"),
    NotoSerif500: require("../assets/fonts/NotoSerif-Medium.ttf"),
    NotoSerif600: require("../assets/fonts/NotoSerif-SemiBold.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <FirstLog.Provider value={{ firstTimeLog, setFirstTimeLog }}>
          <StatusBar barStyle={"dark-content"} backgroundColor={"#FFF"} />
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
            <Stack.Screen name="index" />
          </Stack>
        </FirstLog.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
