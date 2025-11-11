import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { 
  ArrowLeft, 
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Weight,
  Ruler,
  Activity,
  Droplet,
  Pill,
  Calendar,
  AlertCircle,
  Heart,
  Eye
} from "lucide-react-native";
import { auth, db } from "../../api/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

interface UserInfo {
  name: string;
  email: string;
  weight: number;
  height: number;
  diabetesType: string;
  medications: string[];
  diabetesDuration: string;
  hasChronicComplications: boolean;
  chronicComplications: string[];
  isHypertensive: boolean;
  isFollowedUp: boolean;
}

export default function MyInfoScreen() {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMedications, setExpandedMedications] = useState(false);
  const [expandedComplications, setExpandedComplications] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const formatDiabetesType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'type1': 'Tipo 1',
      'type2': 'Tipo 2',
      'gestational': 'Gestacional',
      'prediabetes': 'Pré-diabetes',
      'other': 'Outro',
    };
    return typeMap[type] || type;
  };

  const formatDuration = (duration: string) => {
    const durationMap: { [key: string]: string } = {
      '1': 'Menos de 1 ano',
      '1-5': '1 a 5 anos',
      '5-10': '5 a 10 anos',
      '10+': 'Mais de 10 anos',
    };
    return durationMap[duration] || duration;
  };

  const loadUserInfo = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserInfo({
            name: data.name || "Não informado",
            email: auth.currentUser.email || "Não informado",
            weight: data.weight || 0,
            height: data.height || 0,
            diabetesType: formatDiabetesType(data.diabetesType) || "Não informado", // FORMATADO
            medications: data.medications || [],
            diabetesDuration: formatDuration(data.diabetesDuration) || "Não informado", // FORMATADO
            hasChronicComplications: data.hasChronicComplications || false,
            chronicComplications: data.chronicComplications || [],
            isHypertensive: data.isHypertensive || false,
            isFollowedUp: data.isFollowedUp || false,
          });
        }
      }
    } catch (error) {
      console.log("Erro ao carregar informações:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIMC = () => {
    if (!userInfo || userInfo.weight === 0 || userInfo.height === 0) {
      return "Não calculado";
    }
    const heightInMeters = userInfo.height / 100;
    const imc = userInfo.weight / (heightInMeters * heightInMeters);
    return imc.toFixed(1);
  };

  const getIMCCategory = () => {
    const imc = parseFloat(calculateIMC());
    if (isNaN(imc)) return "";
    
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Peso normal";
    if (imc < 30) return "Sobrepeso";
    if (imc < 35) return "Obesidade grau I";
    if (imc < 40) return "Obesidade grau II";
    return "Obesidade grau III";
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando informações...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar informações</Text>
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
        <Text style={styles.headerTitle}>Minhas Informações</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{userInfo.name}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userInfo.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dados Físicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Físicos</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Weight size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{userInfo.weight} kg</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ruler size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Altura</Text>
                <Text style={styles.infoValue}>{userInfo.height} cm</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Activity size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>IMC</Text>
                <Text style={styles.infoValue}>
                  {calculateIMC()}
                  {getIMCCategory() && (
                    <Text style={styles.imcCategory}> • {getIMCCategory()}</Text>
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informações sobre Diabetes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações sobre Diabetes</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Droplet size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tipo de Diabetes</Text>
                <Text style={styles.infoValue}>{userInfo.diabetesType}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duração da Diabetes</Text>
                <Text style={styles.infoValue}>{userInfo.diabetesDuration}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Heart size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hipertenso</Text>
                <Text style={styles.infoValue}>
                  {userInfo.isHypertensive ? "Sim" : "Não"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Eye size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Acompanhado por profissional</Text>
                <Text style={styles.infoValue}>
                  {userInfo.isFollowedUp ? "Sim" : "Não"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medicamentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos em Uso</Text>
          
          <TouchableOpacity 
            style={styles.expandableCard}
            onPress={() => setExpandedMedications(!expandedMedications)}
          >
            <View style={styles.expandableHeader}>
              <View style={styles.expandableLeft}>
                <View style={styles.infoIconContainer}>
                  <Pill size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.expandableTitle}>
                  {userInfo.medications.length} medicamento(s)
                </Text>
              </View>
              {expandedMedications ? (
                <ChevronUp size={20} color="#6b7280" />
              ) : (
                <ChevronDown size={20} color="#6b7280" />
              )}
            </View>

            {expandedMedications && (
              <View style={styles.expandableContent}>
                {userInfo.medications.length > 0 ? (
                  userInfo.medications.map((medication, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.listItemText}>{medication}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Nenhum medicamento cadastrado</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Complicações Crônicas */}
        {userInfo.hasChronicComplications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complicações Crônicas</Text>
            
            <TouchableOpacity 
              style={styles.expandableCard}
              onPress={() => setExpandedComplications(!expandedComplications)}
            >
              <View style={styles.expandableHeader}>
                <View style={styles.expandableLeft}>
                  <View style={styles.infoIconContainer}>
                    <AlertCircle size={20} color="#f59e0b" />
                  </View>
                  <Text style={styles.expandableTitle}>
                    {userInfo.chronicComplications.length} complicação(ões)
                  </Text>
                </View>
                {expandedComplications ? (
                  <ChevronUp size={20} color="#6b7280" />
                ) : (
                  <ChevronDown size={20} color="#6b7280" />
                )}
              </View>

              {expandedComplications && (
                <View style={styles.expandableContent}>
                  {userInfo.chronicComplications.length > 0 ? (
                    userInfo.chronicComplications.map((complication, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.listItemText}>{complication}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Nenhuma complicação cadastrada</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  imcCategory: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginLeft: 68,
  },
  expandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  expandableLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563eb",
    marginTop: 7,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
});