import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { 
  ArrowLeft, 
  ChevronRight,
  UserCircle,
  Edit3,
  BellRing,
  Settings,
  Shield,
  Info,
  LogOut
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../api/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../components/BottomNavigation";

interface UserData {
  name: string;
  email: string;
  firstName: string;
  cpf: string;
  phone: string;
  weight: number;
  height: number;
  diabetesType: string;
  medications: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  hasSubMenu?: boolean;
  action?: () => void;
  color?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || "Usuário",
            email: auth.currentUser.email || "",
            firstName: (data.name || "U").charAt(0).toUpperCase(),
            cpf: data.cpf || "",
            phone: data.phone || "",
            weight: data.weight || 0,
            height: data.height || 0,
            diabetesType: data.diabetesType || "",
            medications: data.medications || [],
          });
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sair da conta",
      "Deseja realmente sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.log("Erro ao fazer logout:", error);
              Alert.alert("Erro", "Não foi possível sair da conta");
            }
          }
        },
      ]
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const menuSections: MenuSection[] = [
    {
      title: "Conta",
      items: [
        {
          id: "conta",
          icon: UserCircle,
          title: "Conta",
          hasSubMenu: true,
        },
        {
          id: "edit-profile",
          icon: Edit3,
          title: "Editar Perfil",
          action: handleEditProfile,
        },
      ]
    },
    {
      title: "Notificações",
      items: [
        {
          id: "notifications",
          icon: BellRing,
          title: "Notificação",
          hasSubMenu: true,
        },
      ]
    },
    {
      title: "Configurações",
      items: [
        {
          id: "preferences",
          icon: Settings,
          title: "Preferência",
          hasSubMenu: true,
        },
        {
          id: "privacy",
          icon: Shield,
          title: "Privacidade e segurança",
          hasSubMenu: true,
        },
      ]
    },
    {
      title: "Informações",
      items: [
        {
          id: "about",
          icon: Info,
          title: "Sobre o aplicativo",
          hasSubMenu: true,
        },
      ]
    },
    {
      title: "Ações",
      items: [
        {
          id: "logout",
          icon: LogOut,
          title: "Sair da conta",
          action: handleLogout,
          color: "#ef4444",
        },
      ]
    },
  ];

  const getSubMenuItems = (itemId: string) => {
    switch (itemId) {
      case "conta":
        return [
          { title: "Gerenciar permissões", subtitle: "" },
          { title: "Política de privacidade", subtitle: "" },
        ];
      case "notifications":
        return [
          { title: "Lembretes de glicemia", subtitle: "", toggle: true, enabled: true },
          { title: "Lembretes de medicação", subtitle: "", toggle: true, enabled: true },
          { title: "Lembretes de refeições", subtitle: "", toggle: true, enabled: false },
        ];
      case "preferences":
        return [
          { title: "Deletar conta", subtitle: "", color: "#ef4444" },
          { title: "Política de privacidade", subtitle: "" },
        ];
      case "privacy":
        return [
          { title: "Gerenciar permissões", subtitle: "" },
          { title: "Política de privacidade", subtitle: "" },
          { title: "Termos de uso", subtitle: "" },
        ];
      case "about":
        return [
          { title: "Última atualização", subtitle: "15/01/2025" },
          { title: "Suporte", subtitle: "" },
          { title: "Avaliar aplicativo", subtitle: "" },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar dados do perfil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>{userData.firstName}</Text>
            <View style={styles.onlineIndicator} />
          </View>
          
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileEmail}>@{userData.name.toLowerCase().replace(/\s+/g, '')}</Text>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.menuSection}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isExpanded = expandedSections.includes(item.id);
              const subMenuItems = item.hasSubMenu ? getSubMenuItems(item.id) : [];

              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && !isExpanded && styles.lastMenuItem,
                    ]}
                    onPress={() => {
                      if (item.hasSubMenu) {
                        toggleSection(item.id);
                      } else if (item.action) {
                        item.action();
                      }
                    }}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIcon, item.color && { backgroundColor: `${item.color}15` }]}>
                        <Icon size={20} color={item.color || "#6b7280"} />
                      </View>
                      <Text style={[
                        styles.menuItemTitle,
                        item.color && { color: item.color }
                      ]}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                    
                    {item.hasSubMenu && (
                      <ChevronRight 
                        size={20} 
                        color="#9ca3af" 
                        style={[
                          styles.chevron,
                          isExpanded && styles.chevronExpanded
                        ]}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Sub Menu */}
                  {item.hasSubMenu && isExpanded && (
                    <View style={styles.subMenu}>
                      {subMenuItems.map((subItem, subIndex) => (
                        <TouchableOpacity
                          key={subIndex}
                          style={[
                            styles.subMenuItem,
                            subIndex === subMenuItems.length - 1 && styles.lastSubMenuItem,
                          ]}
                        >
                          <View style={styles.subMenuItemLeft}>
                            <Text style={[
                              styles.subMenuItemTitle,
                              'color' in subItem && subItem.color ? { color: subItem.color } : {}
                            ]}>
                              {subItem.title}
                            </Text>
                            {subItem.subtitle && (
                              <Text style={styles.subMenuItemSubtitle}>{subItem.subtitle}</Text>
                            )}
                          </View>
                          
                          {'toggle' in subItem && subItem.toggle ? (
                            <View style={[
                              styles.toggle,
                              'enabled' in subItem && subItem.enabled ? styles.toggleEnabled : {}
                            ]}>
                              <View style={[
                                styles.toggleThumb,
                                'enabled' in subItem && subItem.enabled ? styles.toggleThumbEnabled : {}
                              ]} />
                            </View>
                          ) : (
                            <ChevronRight size={16} color="#9ca3af" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Espaço extra para a navegação inferior */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
}

// STYLES CORRIGIDOS - removendo bottomNavigation, tabButton, activeTabIndicator
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profilePicture: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: "600",
    color: "#374151",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  subMenu: {
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastSubMenuItem: {
    borderBottomWidth: 0,
  },
  subMenuItemLeft: {
    flex: 1,
  },
  subMenuItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  subMenuItemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    padding: 2,
    justifyContent: "center",
  },
  toggleEnabled: {
    backgroundColor: "#2563eb",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbEnabled: {
    alignSelf: "flex-end",
  },
});