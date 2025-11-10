// App.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppNavigator from "./src/navigation/AppNavigator";
import CustomSplashScreen from "./src/components/SplashScreen";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [ready, setReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    // Se precisar carregar algo (ex: Firebase), faça aqui
    const prepare = async () => {
      // await algumaCoisa();

      // Simular tempo de carregamento
      await new Promise((resolve) => setTimeout(resolve, 2500));

      setReady(true);
      setShowCustomSplash(false);
    };
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (showCustomSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CustomSplashScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {ready ? (
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </GestureHandlerRootView>
  );
}
