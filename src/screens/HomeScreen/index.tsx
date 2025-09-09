// src/screens/HomeScreen/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { 
  Home, 
  FileText, 
  Bell, 
  User, 
  Droplet, 
  Pill, 
  Utensils,
  LogOut,
  Heart
} from "lucide-react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../api/firebase/config";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

interface UserData {
  name: string;
  firstName: string;
  diabetesType: string;
  diabetesDuration: string;
  medications: string[];
  weight: number;
  height: number;
  gender: string;
  isHypertensive: boolean;
  hasChronicComplications: boolean;
  chronicComplications: string[];
  chronicComplicationsDescription: string;
  isFollowedUp: boolean;
}

interface GlicemiaData {
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  timestamp: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [glicemiaData, setGlicemiaData] = useState<GlicemiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGlicemia, setLoadingGlicemia] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Função para calcular informações da glicemia baseado no valor
  const getGlicemiaInfo = (valor: number) => {
    // Calcula a posição da barra de forma proporcional
    let posicaoPercentual;
    
    if (valor < 70) {
      // Entre 0 e 70 = 0% a 33% da barra
      posicaoPercentual = Math.min((valor / 70) * 33, 33);
    } else if (valor <= 140) {
      // Entre 70 e 140 = 33% a 66% da barra
      posicaoPercentual = 33 + ((valor - 70) / 70) * 33;
    } else {
      // Acima de 140 = 66% a 100% da barra
      posicaoPercentual = 66 + Math.min(((valor - 140) / 160) * 34, 34);
    }

    if (valor < 70) {
      return {
        valor: valor,
        status: "Baixo",
        cor: "#ef4444", // Vermelho
        posicaoBarra: `${posicaoPercentual}%`
      };
    } else if (valor <= 140) {
      return {
        valor: valor,
        status: "Normal",
        cor: "#2563eb", // Azul
        posicaoBarra: `${posicaoPercentual}%`
      };
    } else {
      return {
        valor: valor,
        status: "Alto",
        cor: "#dc2626", // Vermelho mais escuro
        posicaoBarra: `${posicaoPercentual}%`
      };
    }
  };

  useEffect(() => {
    loadUserData();
    loadLastGlicemia();
  }, []);

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || "Usuário",
            firstName: (data.name || "U").charAt(0).toUpperCase(),
            diabetesType: data.diabetesType || "",
            diabetesDuration: data.diabetesDuration || "",
            medications: data.medications || [],
            weight: data.weight || 0,
            height: data.height || 0,
            gender: data.gender || "",
            isHypertensive: data.isHypertensive || false,
            hasChronicComplications: data.hasChronicComplications || false,
            chronicComplications: data.chronicComplications || [],
            chronicComplicationsDescription: data.chronicComplicationsDescription || "",
            isFollowedUp: data.isFollowedUp || false,
          });
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastGlicemia = async () => {
    try {
      if (auth.currentUser) {
        // Buscar a última glicemia do usuário ordenada por timestamp
        const glicemiaQuery = query(
          collection(db, "glicemia"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        
        const glicemiaSnapshot = await getDocs(glicemiaQuery);
        
        if (!glicemiaSnapshot.empty) {
          const doc = glicemiaSnapshot.docs[0];
          const data = doc.data();
          
          setGlicemiaData({
            valor: data.valor || 0,
            data: data.data || "",
            hora: data.hora || "",
            descricao: data.descricao || "",
            timestamp: data.timestamp || 0,
          });
        }
      }
    } catch (error) {
      console.log("Erro ao carregar última glicemia:", error);
    } finally {
      setLoadingGlicemia(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const generateMedicationSchedule = (medications: string[]) => {
    // Gera horários mockados baseados nos medicamentos reais do usuário
    const schedules = [
      { time: "08:00", description: "Jejum" },
      { time: "12:00", description: "Após almoço" },
      { time: "18:00", description: "Antes do jantar" },
      { time: "22:00", description: "Antes de dormir" }
    ];

    return medications.map((medication, index) => ({
      id: index + 1,
      nome: medication,
      dosagem: index === 0 ? "500mg" : index === 1 ? "10 unidades" : "30mg",
      descricao: schedules[index % schedules.length].description,
      horario: schedules[index % schedules.length].time,
      cor: index === 0 ? "#2563eb" : "#6b7280",
      tomado: false
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Erro ao fazer logout:", error);
    }
  };

  const TabButton = ({ icon: Icon, label, tabKey, onPress }: any) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => {
        setActiveTab(tabKey);
        onPress && onPress();
      }}
    >
      <Icon 
        size={24} 
        color={activeTab === tabKey ? "#2563eb" : "#9ca3af"} 
      />
      {activeTab === tabKey && (
        <View style={styles.activeTabIndicator} />
      )}
    </TouchableOpacity>
  );

  const handleNavigateToRegisterGlicemia = () => {
    navigation.navigate('RegisterGlicemia' as never);
  };

  const handleNavigateToRegisterMedication = () => {
    navigation.navigate('RegisterMedication' as never);
  };

  const handleNavigateToRegisterMeal = () => {
    navigation.navigate('RegisterMeal' as never);
  };

  // Função para recarregar dados quando voltar da tela de registro
  const handleFocusScreen = () => {
    loadLastGlicemia(); // Recarrega a última glicemia
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', handleFocusScreen);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando seus dados...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar dados do usuário</Text>
      </View>
    );
  }

  const proximosMedicamentos = generateMedicationSchedule(userData.medications);

  // Determinar que informações mostrar no card de glicemia
  let glicemiaInfo;
  let hasGlicemiaData = false;

  if (glicemiaData && glicemiaData.valor > 0) {
    glicemiaInfo = getGlicemiaInfo(glicemiaData.valor);
    hasGlicemiaData = true;
  } else {
    // Valores padrão quando não há dados
    glicemiaInfo = {
      valor: 0,
      status: "Sem dados",
      cor: "#9ca3af",
      posicaoBarra: "0%"
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Heart size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.appName}>GlicoInfo</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {userData.name.split(' ')[0]}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color="#6b7280" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitial}>{userData.firstName}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Glicemia Atual */}
        <View style={styles.glicemiaCard}>
          <View style={styles.glicemiaHeader}>
            <Text style={styles.glicemiaTitle}>Última Glicemia Registrada</Text>
            <View style={[styles.statusDot, { backgroundColor: glicemiaInfo.cor }]} />
          </View>
          
          {loadingGlicemia ? (
            <View style={styles.glicemiaLoading}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : hasGlicemiaData ? (
            <>
              <View style={styles.glicemiaValue}>
                <Text style={styles.glicemiaNumber}>{glicemiaInfo.valor}</Text>
                <Text style={styles.glicemiaUnit}>mg/dL</Text>
              </View>
              
              <Text style={[styles.glicemiaStatus, { color: glicemiaInfo.cor }]}>
                {glicemiaInfo.status}
              </Text>
              
              {/* Barra de Status */}
              <View style={styles.statusBar}>
                <View style={styles.statusBarTrack}>
                  <View style={[
                    styles.statusBarFill, 
                    { 
                      backgroundColor: glicemiaInfo.cor, 
                      width: glicemiaInfo.posicaoBarra as any
                    }
                  ]} />
                </View>
                <View style={styles.statusLabels}>
                  <Text style={styles.statusLabel}>Baixo</Text>
                  <Text style={styles.statusLabel}>Normal</Text>
                  <Text style={styles.statusLabel}>Alto</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noGlicemiaData}>
              <Text style={styles.noDataTitle}>Nenhuma glicemia registrada</Text>
              <Text style={styles.noDataText}>
                Registre sua glicemia utilizando os atalhos rápidos
              </Text>
            </View>
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNavigateToRegisterGlicemia}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#dbeafe" }]}>
                <Droplet size={24} color="#2563eb" />
              </View>
              <Text style={styles.actionText}>Registrar{"\n"}Glicemia</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNavigateToRegisterMedication}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#d1fae5" }]}>
                <Pill size={24} color="#10b981" />
              </View>
              <Text style={styles.actionText}>Registrar{"\n"}Medicação</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNavigateToRegisterMeal}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#fef3c7" }]}>
                <Utensils size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionText}>Registrar{"\n"}Refeição</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Próximos Medicamentos */}
        {proximosMedicamentos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Medicamentos</Text>
            <View style={styles.medicamentosContainer}>
              {proximosMedicamentos.map((medicamento) => (
                <View key={medicamento.id} style={styles.medicamentoItem}>
                  <View style={styles.medicamentoLeft}>
                    <View style={[styles.medicamentoDot, { backgroundColor: medicamento.cor }]} />
                    <View style={styles.medicamentoInfo}>
                      <Text style={styles.medicamentoNome}>{medicamento.nome}</Text>
                      <Text style={styles.medicamentoDescricao}>
                        {medicamento.dosagem} - {medicamento.descricao}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.medicamentoHorario}>{medicamento.horario}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Alertas de Saúde */}
        {userData.hasChronicComplications && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ Atenção às Complicações</Text>
            <Text style={styles.alertText}>
              Você possui complicações crônicas registradas. Mantenha o acompanhamento médico em dia.
            </Text>
          </View>
        )}

        {/* Espaço extra para a navegação inferior */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navegação Inferior */}
      <View style={styles.bottomNavigation}>
        <TabButton 
          icon={Home} 
          label="Início" 
          tabKey="home"
        />
        <TabButton 
          icon={FileText} 
          label="Relatórios" 
          tabKey="reports"
        />
        <TabButton 
          icon={Bell} 
          label="Notificações" 
          tabKey="notifications"
        />
        <TabButton 
          icon={User} 
          label="Perfil" 
          tabKey="profile"
          onPress={handleLogout}
        />
      </View>
    </SafeAreaView>
  );
}

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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    marginRight: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  glicemiaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  glicemiaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  glicemiaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  glicemiaLoading: {
    alignItems: "center",
    paddingVertical: 32,
  },
  glicemiaValue: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  glicemiaNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1f2937",
  },
  glicemiaUnit: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
  },
  glicemiaStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  noGlicemiaData: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  statusBar: {
    marginBottom: 8,
  },
  statusBarTrack: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    marginBottom: 8,
  },
  statusBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  statusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  alertCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  medicamentosContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medicamentoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  medicamentoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  medicamentoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  medicamentoInfo: {
    flex: 1,
  },
  medicamentoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  medicamentoDescricao: {
    fontSize: 14,
    color: "#6b7280",
  },
  medicamentoHorario: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
  },
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
