import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from "react-native";
import { 
  ArrowLeft,
  Droplet, 
  Pill, 
  Utensils,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Calendar,
  Clock,
} from "lucide-react-native";
import { auth, db } from "../../api/firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import BottomNavigation from "../../components/BottomNavigation";

interface GlicemiaRecord {
  id: string;
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  situacao: string;
  situacaoName: string;
  timestamp: number;
}

interface MedicationRecord {
  id: string;
  medicationName: string;
  genericName: string;
  dose: string;
  concentration: string;
  pharmaceuticalForm: string;
  descricao: string;
  data: string;
  hora: string;
  timestamp: number;
}

interface FoodItem {
  id: string;
  foodName: string;
  quantity: number;
  carbs: number;
  portionDesc: string;
  classification: string;
  classificationLabel: string;
}

interface MealRecord {
  id: string;
  mealType: string;
  mealTypeName: string;
  description: string;
  totalCarbs: number;
  totalItems: number;
  items: FoodItem[];
  data: string;
  hora: string;
  timestamp: number;
}

interface GlicemiaStats {
  media: number;
  maior: number;
  menor: number;
  total: number;
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState("hoje");
  const [activeTab, setActiveTab] = useState("glicemia");
  const [loading, setLoading] = useState(true);
  
  // NOVOS ESTADOS PARA MODAIS
  const [showGlicemiaModal, setShowGlicemiaModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedGlicemia, setSelectedGlicemia] = useState<GlicemiaRecord | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRecord | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealRecord | null>(null);
  
  const [glicemiaRecords, setGlicemiaRecords] = useState<GlicemiaRecord[]>([]);
  const [medicationRecords, setMedicationRecords] = useState<MedicationRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [glicemiaStats, setGlicemiaStats] = useState<GlicemiaStats>({
    media: 0,
    maior: 0,
    menor: 0,
    total: 0
  });

  const filters = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
  ];

  const tabs = [
    { key: "glicemia", label: "Glicemia", icon: Droplet },
    { key: "medicacao", label: "Medicação", icon: Pill },
    { key: "refeicoes", label: "Refeições", icon: Utensils },
  ];

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  // Log quando a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('\n📱 === HISTORY SCREEN FOCADA ===');
      console.log('🔍 Navigation object:', navigation ? 'EXISTS' : 'NULL');
      console.log('📋 Navigation methods:', navigation ? Object.keys(navigation) : 'N/A');
      
      if (navigation) {
        console.log('✅ Navigation.navigate exists:', typeof navigation.navigate);
        console.log('✅ Navigation state:', navigation.getState ? navigation.getState() : 'No getState');
      }
      
      return () => {
        console.log('📱 History screen perdeu foco');
      };
    }, [navigation])
  );

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (activeFilter) {
      case "hoje":
        return {
          start: today.getTime(),
          end: today.getTime() + (24 * 60 * 60 * 1000) - 1
        };
      case "semana":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart.getTime(),
          end: now.getTime()
        };
      case "mes":
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          start: monthStart.getTime(),
          end: now.getTime()
        };
      default:
        return {
          start: today.getTime(),
          end: today.getTime() + (24 * 60 * 60 * 1000) - 1
        };
    }
  };

  const loadData = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      const dateRange = getDateRange();
      
      await Promise.all([
        loadGlicemiaRecords(dateRange),
        loadMedicationRecords(dateRange),
        loadMealRecords(dateRange)
      ]);
      
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlicemiaRecords = async (dateRange: { start: number; end: number }) => {
    try {
      const q = query(
        collection(db, "glicemia"),
        where("userId", "==", auth.currentUser!.uid),
        where("timestamp", ">=", dateRange.start),
        where("timestamp", "<=", dateRange.end),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      const records: GlicemiaRecord[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          valor: data.valor || 0,
          data: data.data || "",
          hora: data.hora || "",
          descricao: data.descricao || "",
          situacao: data.situacao || "",
          situacaoName: data.situacaoName || "",
          timestamp: data.timestamp || 0,
        });
      });
      
      setGlicemiaRecords(records);
      calculateGlicemiaStats(records);
      
    } catch (error) {
      console.log("Erro ao carregar registros de glicemia:", error);
    }
  };

  const loadMedicationRecords = async (dateRange: { start: number; end: number }) => {
    try {
      const q = query(
        collection(db, "medicationRecords"),
        where("userId", "==", auth.currentUser!.uid),
        where("timestamp", ">=", dateRange.start),
        where("timestamp", "<=", dateRange.end),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      const records: MedicationRecord[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          medicationName: data.medicationName || "",
          genericName: data.genericName || "",
          dose: data.dose || "",
          concentration: data.concentration || "",
          pharmaceuticalForm: data.pharmaceuticalForm || "",
          descricao: data.descricao || "",
          data: data.data || "",
          hora: data.hora || "",
          timestamp: data.timestamp || 0,
        });
      });
      
      setMedicationRecords(records);
      
    } catch (error) {
      console.log("Erro ao carregar registros de medicação:", error);
    }
  };

  const loadMealRecords = async (dateRange: { start: number; end: number }) => {
    try {
      const q = query(
        collection(db, "mealRecords"),
        where("userId", "==", auth.currentUser!.uid),
        where("timestamp", ">=", dateRange.start),
        where("timestamp", "<=", dateRange.end),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      const records: MealRecord[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          mealType: data.mealType || "",
          mealTypeName: data.mealTypeName || data.mealType || "",
          description: data.descricao || "",
          totalCarbs: data.totalCarbs || 0,
          totalItems: data.totalItems || 0,
          items: data.items || [],
          data: data.data || "",
          hora: data.hora || "",
          timestamp: data.timestamp || 0,
        });
      });
      
      setMealRecords(records);
      
    } catch (error) {
      console.log("Erro ao carregar registros de refeições:", error);
    }
  };

  const calculateGlicemiaStats = (records: GlicemiaRecord[]) => {
    if (records.length === 0) {
      setGlicemiaStats({ media: 0, maior: 0, menor: 0, total: 0 });
      return;
    }

    const valores = records.map(record => record.valor);
    const soma = valores.reduce((acc, val) => acc + val, 0);
    const media = Math.round(soma / valores.length);
    const maior = Math.max(...valores);
    const menor = Math.min(...valores);

    setGlicemiaStats({
      media,
      maior,
      menor,
      total: records.length
    });
  };

  const getGlicemiaStatusMessage = () => {
    if (glicemiaStats.total === 0) {
      return {
        message: "Nenhum registro encontrado para este período",
        color: "#6b7280",
        icon: Minus
      };
    }

    const media = glicemiaStats.media;
    
    if (media >= 70 && media <= 140) {
      return {
        message: "Ótimo controle! Seus níveis estão dentro da faixa ideal. Continue assim!",
        color: "#10b981",
        icon: TrendingUp
      };
    } else if (media < 70) {
      return {
        message: "Atenção! Média baixa detectada. Consulte seu médico sobre possível hipoglicemia.",
        color: "#ef4444",
        icon: TrendingDown
      };
    } else {
      return {
        message: "Cuidado! Média elevada. Revise sua alimentação e medicação com seu médico.",
        color: "#ef4444",
        icon: TrendingDown
      };
    }
  };

  const getGlicemiaColor = (valor: number) => {
    if (valor < 70) return "#ef4444";
    if (valor <= 140) return "#10b981";
    return "#ef4444";
  };

  const formatFoodNames = (items: FoodItem[]) => {
    if (!items || items.length === 0) return "Nenhum alimento registrado";
    
    if (items.length === 1) {
      return items[0].foodName;
    } else if (items.length === 2) {
      return `${items[0].foodName} e ${items[1].foodName}`;
    } else {
      const firstTwo = items.slice(0, 2).map(item => item.foodName).join(", ");
      const remaining = items.length - 2;
      return `${firstTwo} e mais ${remaining} ${remaining === 1 ? 'item' : 'itens'}`;
    }
  };

  const formatMedicationInfo = (record: MedicationRecord) => {
    const parts = [];
    
    if (record.dose) {
      parts.push(record.dose);
    } else if (record.concentration) {
      parts.push(record.concentration);
    }
    
    if (record.pharmaceuticalForm) {
      parts.push(record.pharmaceuticalForm);
    }
    
    if (record.descricao) {
      parts.push(record.descricao);
    }
    
    return parts.length > 0 ? parts.join(" - ") : "Sem detalhes adicionais";
  };

  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    
    return dateStr;
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleGlicemiaClick = (record: GlicemiaRecord) => {
    setSelectedGlicemia(record);
    setShowGlicemiaModal(true);
  };

  const handleMedicationClick = (record: MedicationRecord) => {
    setSelectedMedication(record);
    setShowMedicationModal(true);
  };

  const handleMealClick = (record: MealRecord) => {
    setSelectedMeal(record);
    setShowMealModal(true);
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'g1':
        return '#10b981';
      case 'g2':
        return '#3b82f6';
      case 'g3':
        return '#f59e0b';
      case 'g4':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const statusMessage = getGlicemiaStatusMessage();
  const StatusIcon = statusMessage.icon;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header CORRIGIDO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Controle Glicêmico</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                activeFilter === filter.key && styles.activeFilterButton
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === filter.key && styles.activeFilterButtonText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards - apenas para glicemia */}
        {activeTab === "glicemia" && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Média</Text>
                <Text style={[styles.statValue, { color: "#10b981" }]}>
                  {glicemiaStats.media || 0}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Maior</Text>
                <Text style={[styles.statValue, { color: "#ef4444" }]}>
                  {glicemiaStats.maior || 0}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Menor</Text>
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                  {glicemiaStats.menor || 0}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
            </View>

            {/* Status Message */}
            <View style={[styles.statusMessage, { backgroundColor: `${statusMessage.color}15` }]}>
              <StatusIcon size={20} color={statusMessage.color} />
              <Text style={[styles.statusMessageText, { color: statusMessage.color }]}>
                {statusMessage.message}
              </Text>
            </View>
          </>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon 
                  size={20} 
                  color={activeTab === tab.key ? "#2563eb" : "#6b7280"} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : (
          <View style={styles.recordsContainer}>
            {/* Glicemia Records - COM TOUCHABLE */}
            {activeTab === "glicemia" && (
              <>
                {glicemiaRecords.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Droplet size={48} color="#e5e7eb" />
                    <Text style={styles.emptyStateTitle}>Nenhum registro encontrado</Text>
                    <Text style={styles.emptyStateText}>
                      Não há registros de glicemia para este período
                    </Text>
                  </View>
                ) : (
                  glicemiaRecords.map((record) => (
                    <TouchableOpacity 
                      key={record.id} 
                      style={styles.recordCard}
                      onPress={() => handleGlicemiaClick(record)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recordHeader}>
                        <View style={[
                          styles.recordIndicator,
                          { backgroundColor: getGlicemiaColor(record.valor) }
                        ]} />
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordValue}>
                            {record.valor} mg/dL
                          </Text>
                          <Text style={styles.recordDescription}>
                            {record.situacaoName}
                          </Text>
                        </View>
                        <Text style={styles.recordTime}>{record.hora}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {/* Medication Records - COM TOUCHABLE */}
            {activeTab === "medicacao" && (
              <>
                {medicationRecords.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Pill size={48} color="#e5e7eb" />
                    <Text style={styles.emptyStateTitle}>Nenhum registro encontrado</Text>
                    <Text style={styles.emptyStateText}>
                      Não há registros de medicação para este período
                    </Text>
                  </View>
                ) : (
                  medicationRecords.map((record) => (
                    <TouchableOpacity 
                      key={record.id} 
                      style={styles.recordCard}
                      onPress={() => handleMedicationClick(record)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recordHeader}>
                        <View style={[
                          styles.recordIndicator,
                          { backgroundColor: "#10b981" }
                        ]} />
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordValue}>
                            {record.medicationName || record.genericName}
                          </Text>
                          <Text style={styles.recordDescription} numberOfLines={1}>
                            {record.dose || record.concentration}
                          </Text>
                        </View>
                        <Text style={styles.recordTime}>{record.hora}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {/* Meal Records - COM TOUCHABLE */}
            {activeTab === "refeicoes" && (
              <>
                {mealRecords.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Utensils size={48} color="#e5e7eb" />
                    <Text style={styles.emptyStateTitle}>Nenhum registro encontrado</Text>
                    <Text style={styles.emptyStateText}>
                      Não há registros de refeições para este período
                    </Text>
                  </View>
                ) : (
                  mealRecords.map((record) => (
                    <TouchableOpacity 
                      key={record.id} 
                      style={styles.recordCard}
                      onPress={() => handleMealClick(record)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recordHeader}>
                        <View style={[
                          styles.recordIndicator,
                          { backgroundColor: "#f59e0b" }
                        ]} />
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordValue}>
                            {record.mealTypeName}
                          </Text>
                          <Text style={styles.recordDescription} numberOfLines={1}>
                            {record.totalItems} {record.totalItems === 1 ? 'item' : 'itens'} - {record.totalCarbs}g carboidratos
                          </Text>
                        </View>
                        <Text style={styles.recordTime}>{record.hora}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL DE GLICEMIA */}
      <Modal
        visible={showGlicemiaModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGlicemiaModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes do Registro</Text>
            <TouchableOpacity 
              onPress={() => setShowGlicemiaModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedGlicemia && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={[
                  styles.glicemiaValueCard,
                  { backgroundColor: `${getGlicemiaColor(selectedGlicemia.valor)}15` }
                ]}>
                  <Droplet size={32} color={getGlicemiaColor(selectedGlicemia.valor)} />
                  <Text style={[
                    styles.glicemiaValueLarge,
                    { color: getGlicemiaColor(selectedGlicemia.valor) }
                  ]}>
                    {selectedGlicemia.valor} mg/dL
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <Calendar size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Data</Text>
                    <Text style={styles.detailValue}>{selectedGlicemia.data}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Clock size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>{selectedGlicemia.hora}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Bell size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Situação</Text>
                    <Text style={styles.detailValue}>{selectedGlicemia.situacaoName}</Text>
                  </View>
                </View>

                {selectedGlicemia.descricao && (
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionLabel}>Observações</Text>
                    <Text style={styles.descriptionText}>{selectedGlicemia.descricao}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* MODAL DE MEDICAÇÃO */}
      <Modal
        visible={showMedicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes da Medicação</Text>
            <TouchableOpacity 
              onPress={() => setShowMedicationModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedMedication && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={styles.medicationCard}>
                  <Pill size={32} color="#10b981" />
                  <Text style={styles.medicationName}>
                    {selectedMedication.medicationName}
                  </Text>
                  {selectedMedication.genericName && (
                    <Text style={styles.genericName}>
                      ({selectedMedication.genericName})
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <Calendar size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Data</Text>
                    <Text style={styles.detailValue}>{selectedMedication.data}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Clock size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>{selectedMedication.hora}</Text>
                  </View>
                </View>

                {selectedMedication.dose && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Dose</Text>
                    <Text style={styles.infoValue}>{selectedMedication.dose}</Text>
                  </View>
                )}

                {selectedMedication.concentration && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Concentração</Text>
                    <Text style={styles.infoValue}>{selectedMedication.concentration}</Text>
                  </View>
                )}

                {selectedMedication.pharmaceuticalForm && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Forma Farmacêutica</Text>
                    <Text style={styles.infoValue}>{selectedMedication.pharmaceuticalForm}</Text>
                  </View>
                )}

                {selectedMedication.descricao && (
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionLabel}>Observações</Text>
                    <Text style={styles.descriptionText}>{selectedMedication.descricao}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* MODAL DE REFEIÇÃO */}
      <Modal
        visible={showMealModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes da Refeição</Text>
            <TouchableOpacity 
              onPress={() => setShowMealModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedMeal && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={styles.mealCard}>
                  <Utensils size={32} color="#f59e0b" />
                  <Text style={styles.mealName}>{selectedMeal.mealTypeName}</Text>
                  <Text style={styles.mealCarbs}>{selectedMeal.totalCarbs}g carboidratos</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <View style={styles.detailRow}>
                  <Calendar size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Data</Text>
                    <Text style={styles.detailValue}>{selectedMeal.data}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Clock size={20} color="#6b7280" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>{selectedMeal.hora}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>
                  Alimentos ({selectedMeal.items.length})
                </Text>
                
                {selectedMeal.items.map((item, index) => (
                  <View key={index} style={styles.foodItemCard}>
                    <View style={[
                      styles.foodClassificationBadge,
                      { backgroundColor: getClassificationColor(item.classification) }
                    ]}>
                      <Text style={styles.foodClassificationText}>
                        {item.classification.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.foodItemInfo}>
                      <Text style={styles.foodItemName}>{item.foodName}</Text>
                      <Text style={styles.foodItemDetails}>
                        {item.quantity}x {item.portionDesc} • {item.carbs}g carboidratos
                      </Text>
                      <Text style={styles.foodItemClassification}>
                        {item.classificationLabel}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {selectedMeal.description && (
                <View style={styles.modalSection}>
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionLabel}>Observações</Text>
                    <Text style={styles.descriptionText}>{selectedMeal.description}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    width: 40, // Largura fixa para centralizar
  },
  headerTitle: {
    flex: 1, // Ocupa o espaço central
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center", // Centraliza o texto
  },
  headerRight: {
    width: 40, // Mesma largura do backButton para equilibrar
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filtersContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  activeFilterButton: {
    backgroundColor: "#2563eb",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 10,
    color: "#9ca3af",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  statusMessageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2563eb",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  recordsContainer: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  recordDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  recordTime: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // NOVOS ESTILOS PARA OS MODAIS
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 24,
  },
  glicemiaValueCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
  },
  glicemiaValueLarge: {
    fontSize: 48,
    fontWeight: "700",
    marginTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  descriptionCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  medicationCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 12,
    textAlign: "center",
  },
  genericName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  mealCard: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fffbeb",
    borderRadius: 16,
  },
  mealName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 12,
  },
  mealCarbs: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  foodItemCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  foodClassificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  foodClassificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  foodItemDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  foodItemClassification: {
    fontSize: 12,
    color: "#9ca3af",
  },
});