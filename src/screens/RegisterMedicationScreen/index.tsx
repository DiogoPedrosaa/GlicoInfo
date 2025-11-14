import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  ScrollView
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ArrowLeft, Home, FileText, Bell, User, ChevronDown } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { auth, db } from "../../api/firebase/config";

interface Medication {
  id: string;
  commercialName: string;
  genericName: string;
  concentration: string;
  pharmaceuticalForm: string;
  administrationRoute: string;
  description: string;
}

export default function RegisterMedicationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  
  const [formData, setFormData] = useState({
    medicationId: "",
    medicationName: "",
    dose: "",
    data: "",
    hora: "",
    descricao: "",
  });

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoadingMedications(true);
      const medicationsQuery = query(collection(db, "medications"));
      const medicationsSnapshot = await getDocs(medicationsQuery);
      
      const medicationsList: Medication[] = [];
      medicationsSnapshot.forEach((doc) => {
        const data = doc.data();
        medicationsList.push({
          id: doc.id,
          commercialName: data.commercialName || "",
          genericName: data.genericName || "",
          concentration: data.concentration || "",
          pharmaceuticalForm: data.pharmaceuticalForm || "",
          administrationRoute: data.administrationRoute || "",
          description: data.description || "",
        });
      });
      
      setMedications(medicationsList);
    } catch (error) {
      console.log("Erro ao carregar medicações:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de medicamentos");
    } finally {
      setLoadingMedications(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Formatador para data (DD/MM/AAAA)
  const formatDate = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}/${numbers.substring(4, 8)}`;
    }
    
    return text;
  };

  // Formatador para hora (HH:MM)
  const formatTime = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length === 3) {
      const firstDigit = numbers.substring(0, 1);
      const remaining = numbers.substring(1, 3);
      
      if (firstDigit === '0' || firstDigit === '1' || firstDigit === '2') {
        return `${firstDigit}${remaining.substring(0, 1)}:${remaining.substring(1, 2)}`;
      } else {
        return `${numbers.substring(0, 2)}:${numbers.substring(2, 3)}`;
      }
    } else if (numbers.length === 4) {
      const hours = numbers.substring(0, 2);
      const minutes = numbers.substring(2, 4);
      
      const validHours = Math.min(parseInt(hours) || 0, 23).toString().padStart(2, '0');
      const validMinutes = Math.min(parseInt(minutes) || 0, 59).toString().padStart(2, '0');
      
      return `${validHours}:${validMinutes}`;
    }
    
    return text;
  };

  // Validar data no formato DD/MM/AAAA
  const validateDate = (dateString: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return false;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  };

  // Validar hora no formato HH:MM
  const validateTime = (timeString: string) => {
    const regex = /^(\d{1,2}):(\d{1,2})$/;
    const match = timeString.match(regex);
    
    if (!match) return false;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDate(text);
    setFormData({ ...formData, data: formatted });
  };

  const handleTimeChange = (text: string) => {
    if (text.length < formData.hora.length) {
      setFormData({ ...formData, hora: text });
      return;
    }
    
    const formatted = formatTime(text);
    setFormData({ ...formData, hora: formatted });
  };

  const handleMedicationSelect = (medication: Medication) => {
    setFormData({
      ...formData,
      medicationId: medication.id,
      medicationName: medication.commercialName,
    });
    setShowMedicationModal(false);
  };

  const validateForm = () => {
    if (!formData.medicationId.trim()) {
      Alert.alert("Erro", "Por favor, selecione um medicamento");
      return false;
    }

    if (!formData.dose.trim()) {
      Alert.alert("Erro", "Por favor, informe a dose");
      return false;
    }

    if (!formData.data.trim()) {
      Alert.alert("Erro", "Por favor, informe a data");
      return false;
    }

    if (!formData.hora.trim()) {
      Alert.alert("Erro", "Por favor, informe a hora");
      return false;
    }

    // Validar formato da data
    if (!validateDate(formData.data)) {
      Alert.alert("Erro", "Por favor, informe uma data válida no formato DD/MM/AAAA");
      return false;
    }

    // Validar formato da hora
    if (!validateTime(formData.hora)) {
      Alert.alert("Erro", "Por favor, informe uma hora válida no formato HH:MM");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (!auth.currentUser) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      // Encontrar o medicamento selecionado
      const selectedMedication = medications.find(med => med.id === formData.medicationId);

      // Criar documento de medicação
      const medicationData = {
        userId: auth.currentUser.uid,
        medicationId: formData.medicationId,
        medicationName: formData.medicationName,
        genericName: selectedMedication?.genericName || "",
        concentration: selectedMedication?.concentration || "",
        pharmaceuticalForm: selectedMedication?.pharmaceuticalForm || "",
        dose: formData.dose.trim(),
        data: formData.data,
        hora: formData.hora,
        descricao: formData.descricao.trim(),
        createdAt: new Date(),
        timestamp: Date.now(),
      };

      // Salvar no Firebase na coleção "medicationRecords"
      await addDoc(collection(db, "medicationRecords"), medicationData);

      // Mostrar sucesso e voltar
      Alert.alert(
        "✅ Sucesso",
        "Medicação registrada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.log("Erro ao registrar medicação:", error);
      Alert.alert("Erro", "Não foi possível registrar a medicação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar",
      "Deseja realmente cancelar? Os dados não salvos serão perdidos.",
      [
        { text: "Continuar editando", style: "cancel" },
        { text: "Cancelar", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
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

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <TouchableOpacity
      style={styles.medicationItem}
      onPress={() => handleMedicationSelect(item)}
    >
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationCommercialName}>{item.commercialName}</Text>
        <Text style={styles.medicationGenericName}>{item.genericName}</Text>
        <Text style={styles.medicationDetails}>
          {item.concentration} - {item.pharmaceuticalForm}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Medicação</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Formulário */}
        <View style={styles.formContainer}>
          {/* Espaço superior para centralizar */}
          <View style={styles.spacer} />
          
          {/* Medicamento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Medicamento</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMedicationModal(true)}
              disabled={loadingMedications}
            >
              <Text style={[
                styles.selectButtonText,
                !formData.medicationName && styles.selectButtonPlaceholder
              ]}>
                {loadingMedications 
                  ? "Carregando medicamentos..." 
                  : formData.medicationName || "Selecione o medicamento"
                }
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Dose */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Dose</Text>
            <TextInput
              style={styles.input}
              value={formData.dose}
              onChangeText={(text) => setFormData({ ...formData, dose: text })}
              placeholder="Ex: 500mg"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Data e Hora */}
          <View style={styles.rowContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Data</Text>
              <TextInput
                style={styles.input}
                value={formData.data}
                onChangeText={handleDateChange}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Hora</Text>
              <TextInput
                style={styles.input}
                value={formData.hora}
                onChangeText={handleTimeChange}
                placeholder="hh:mm"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={styles.textArea}
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              placeholder="Observações (opcional)"
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Registrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Espaçamento extra */}
        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>

      {/* Modal de Seleção de Medicamento */}
      <Modal
        visible={showMedicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Medicamento</Text>
            <TouchableOpacity 
              onPress={() => setShowMedicationModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          
          {loadingMedications ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Carregando medicamentos...</Text>
            </View>
          ) : (
            <FlatList
              data={medications}
              renderItem={renderMedicationItem}
              keyExtractor={(item) => item.id}
              style={styles.medicationList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>

      {/* Navegação Inferior */}
      <View style={styles.bottomNavigation}>
        <TabButton 
          icon={Home} 
          label="Início" 
          tabKey="home"
          onPress={() => navigation.goBack()}
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
        />
      </View>
    </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formContainer: {
    flex: 1,
  },
  spacer: {
    height: 60,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    flex: 1,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: "#9ca3af",
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  registerButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalCloseText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  medicationList: {
    flex: 1,
  },
  medicationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  medicationInfo: {
    flex: 1,
  },
  medicationCommercialName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  medicationGenericName: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 12,
    color: "#9ca3af",
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