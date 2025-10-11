import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Home, FileText, Bell, User } from 'lucide-react-native';

export interface BottomNavigationProps {
  activeTab?: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const navigation = useNavigation();
  const route = useRoute();

  // Função para determinar aba ativa
  const getCurrentTab = () => {
    if (activeTab) return activeTab;
    
    switch (route.name) {
      case 'Home':
        return 'home';
      case 'History':
        return 'reports';
      case 'Notifications':
        return 'notifications';
      case 'Profile':
        return 'profile';
      default:
        return 'home';
    }
  };

  const currentTab = getCurrentTab();

  const navigateToScreen = (screenName: string) => {
    // Só navega se não estiver na tela atual
    if (route.name !== screenName) {
      navigation.navigate(screenName as never);
    }
  };

  const TabButton = ({ 
    icon: Icon, 
    tabKey, 
    screenName 
  }: {
    icon: any;
    tabKey: string;
    screenName: string;
  }) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => navigateToScreen(screenName)}
      activeOpacity={0.7}
    >
      <Icon 
        size={24} 
        color={currentTab === tabKey ? "#2563eb" : "#9ca3af"} 
      />
      {currentTab === tabKey && (
        <View style={styles.activeTabIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.bottomNavigation}>
      <TabButton 
        icon={Home} 
        tabKey="home"
        screenName="Home"
      />
      <TabButton 
        icon={FileText} 
        tabKey="reports"
        screenName="History"
      />
      <TabButton 
        icon={Bell} 
        tabKey="notifications"
        screenName="Notifications"
      />
      <TabButton 
        icon={User} 
        tabKey="profile"
        screenName="Profile"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -12,
    height: 3,
    width: 24,
    backgroundColor: "#2563eb",
    borderRadius: 2,
  },
});