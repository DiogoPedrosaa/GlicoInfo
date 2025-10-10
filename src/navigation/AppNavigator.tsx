// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../api/firebase/config";

// telas
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import RegisterGlicemiaScreen from "../screens/RegisterGlicemiaScreen";
import RegisterMedicationScreen from "../screens/RegisterMedicationScreen";
import RegisterMealScreen from "../screens/RegisterMealScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HistoryScreen from "../screens/HistoryScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  RegisterGlicemia: undefined;
  RegisterMedication: undefined;
  RegisterMeal: undefined;
  Profile: undefined;
  EditProfile: undefined;
  History: undefined;
  Notifications: undefined;
};

const Auth = createNativeStackNavigator<AuthStackParamList>();
const App = createNativeStackNavigator<MainStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  // Mostrar splash screen durante o carregamento inicial
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  // Mostrar indicador de carregamento após splash
  if (checking) return null;

  return user ? (
    <App.Navigator>
      <App.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="RegisterGlicemia"
        component={RegisterGlicemiaScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="RegisterMedication"
        component={RegisterMedicationScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="RegisterMeal"
        component={RegisterMealScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <App.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
    </App.Navigator>
  ) : (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={LoginScreen} />
      <Auth.Screen name="Register" component={RegisterScreen} />
    </Auth.Navigator>
  );
}
