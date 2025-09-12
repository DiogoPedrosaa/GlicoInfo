import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { ArrowLeft, ChevronDown, Check } from "lucide-react-native";
import { auth, db } from "../../api/firebase/config";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

interface UserData {
  name: string;
  cpf: string;
  cpfMasked: string;
  weight: string;
  height: string;
  diabetesType: string;
  diabetesTypeName: string;
  selectedMedications: string[];
  selectedMedicationsNames: string[];
}

interface DiabetesType {
  id: string;
  name: string;
}

interface Medication {
  id: string;
  commercialName: string;
  genericName: string;
  concentration: string;
  pharmaceuticalForm: string;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [showDiabetesModal, setShowDiabetesModal] = useState(false);
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  
  const [formData, setFormData] = useState<UserData>({
    name: "",
    cpf: "",
    cpfMasked: "",
    weight: "",
    height: "",
    diabetesType: "",
    diabetesTypeName: "",
    selectedMedications: [],
    selectedMedicationsNames: [],
  });

  const diabetesTypes: DiabetesType[] = [
    { id: "type1", name: "Tipo 1" },
    { id: "type2", name: "Tipo 2" },
    { id: "gestational", name: "Gestacional" },
    { id: "prediabetes", name: "Pré-diabetes" },
  ];

  useEffect(() => {
    loadUserData();
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoadingMedications(true);
      const medicationsSnapshot = await getDocs(collection(db, "medications"));
      const medicationsData: Medication[] = [];
      
      medicationsSnapshot.forEach((doc) => {
        const data = doc.data();
        medicationsData.push({
          id: doc.id,
          commercialName: data.commercialName || "",
          genericName: data.genericName || "",
          concentration: data.concentration || "",
          pharmaceuticalForm: data.pharmaceuticalForm || "",
        });
      });
      
      setAvailableMedications(medicationsData);
    } catch (error) {
      console.log("Erro ao carregar medicamentos:", error);
      Alert.alert("Erro", "Não foi possível carregar os medicamentos");
    } finally {
      setLoadingMedications(false);
    }
  };

  const loadUserData = async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userMedications = data.medications || [];
          
          setFormData({
            name: data.name || "",
            cpf: data.cpfHash || "", // CPF original não mascarado para comparação
            cpfMasked: data.cpfMasked || "", // CPF mascarado para exibição
            weight: data.weight ? data.weight.toString() : "",
            height: data.height ? data.height.toString() : "",
            diabetesType: data.diabetesType || "",
            diabetesTypeName: getDiabetesTypeName(data.diabetesType || ""),
            selectedMedications: Array.isArray(userMedications) ? userMedications : [],
            selectedMedicationsNames: Array.isArray(userMedications) ? userMedications : [],
          });
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados do usuário:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  const getDiabetesTypeName = (id: string) => {
    const type = diabetesTypes.find(t => t.id === id);
    return type ? type.name : "";
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleDiabetesSelect = (diabetes: DiabetesType) => {
    setFormData({
      ...formData,
      diabetesType: diabetes.id,
      diabetesTypeName: diabetes.name,
    });
    setShowDiabetesModal(false);
  };

  const handleMedicationToggle = (medication: Medication) => {
    const medicationName = medication.commercialName || medication.genericName;
    const isSelected = formData.selectedMedications.includes(medication.id);
    
    if (isSelected) {
      // Remove o medicamento
      const newSelectedMedications = formData.selectedMedications.filter(id => id !== medication.id);
      const newSelectedMedicationsNames = formData.selectedMedicationsNames.filter(name => 
        name !== medicationName
      );
      
      setFormData({
        ...formData,
        selectedMedications: newSelectedMedications,
        selectedMedicationsNames: newSelectedMedicationsNames,
      });
    } else {
      // Adiciona o medicamento
      setFormData({
        ...formData,
        selectedMedications: [...formData.selectedMedications, medication.id],
        selectedMedicationsNames: [...formData.selectedMedicationsNames, medicationName],
      });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Erro", "Por favor, informe seu nome completo");
      return false;
    }

    if (!formData.weight.trim()) {
      Alert.alert("Erro", "Por favor, informe seu peso");
      return false;
    }

    if (!formData.height.trim()) {
      Alert.alert("Erro", "Por favor, informe sua altura");
      return false;
    }

    if (!formData.diabetesType.trim()) {
      Alert.alert("Erro", "Por favor, selecione o tipo de diabetes");
      return false;
    }

    if (formData.selectedMedications.length === 0) {
      Alert.alert("Erro", "Por favor, selecione pelo menos um medicamento");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (!auth.currentUser) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        weight: parseFloat(formData.weight) || 0,
        height: parseFloat(formData.height) || 0,
        diabetesType: formData.diabetesType,
        medications: formData.selectedMedicationsNames, // Salvar os nomes dos medicamentos
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "users", auth.currentUser.uid), updateData);

      Alert.alert(
        "✅ Sucesso",
        "Perfil atualizado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.log("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const renderDiabetesItem = ({ item }: { item: DiabetesType }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleDiabetesSelect(item)}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    const isSelected = formData.selectedMedications.includes(item.id);
    const displayName = item.commercialName || item.genericName;
    const displayDetails = `${item.concentration} - ${item.pharmaceuticalForm}`;
    
    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.selectedListItem]}
        onPress={() => handleMedicationToggle(item)}
      >
        <View style={styles.medicationItemContent}>
          <Text style={[styles.listItemText, isSelected && styles.selectedListItemText]}>
            {displayName}
          </Text>
          <Text style={[styles.medicationDetails, isSelected && styles.selectedMedicationDetails]}>
            {displayDetails}
          </Text>
        </View>
        {isSelected && (
          <Check size={20} color="#2563eb" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading || loadingMedications) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>
          {loading ? "Carregando dados..." : "Carregando medicamentos..."}
        </Text>
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>
              {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
            </Text>
            <View style={styles.onlineIndicator} />
          </View>
          
          <Text style={styles.profileName}>
            {formData.name || "Nome do usuário"}
          </Text>
          <Text style={styles.profileEmail}>
            {auth.currentUser?.email || "email@exemplo.com"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Nome completo */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* E-mail (somente leitura) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>
                {auth.currentUser?.email || ""}
              </Text>
            </View>
          </View>

          {/* CPF (somente leitura e mascarado) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>CPF</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>
                {formData.cpfMasked || "***.***.***-**"}
              </Text>
            </View>
            <Text style={styles.fieldNote}>
              O CPF não pode ser alterado após o cadastro
            </Text>
          </View>

          {/* Peso e Altura */}
          <View style={styles.rowContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                placeholder="65"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => setFormData({ ...formData, height: text })}
                placeholder="165"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          {/* Tipo de diabetes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tipo de diabetes</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDiabetesModal(true)}
            >
              <Text style={[
                styles.selectButtonText,
                !formData.diabetesTypeName && styles.selectButtonPlaceholder
              ]}>
                {formData.diabetesTypeName || "Selecione o tipo"}
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Medicamentos */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Medicamentos {formData.selectedMedicationsNames.length > 0 && 
              `(${formData.selectedMedicationsNames.length} selecionado${formData.selectedMedicationsNames.length > 1 ? 's' : ''})`}
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMedicationsModal(true)}
            >
              <Text style={[
                styles.selectButtonText,
                formData.selectedMedicationsNames.length === 0 && styles.selectButtonPlaceholder
              ]}>
                {formData.selectedMedicationsNames.length > 0 
                  ? formData.selectedMedicationsNames.join(", ")
                  : "Selecione os medicamentos"
                }
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Tipo de Diabetes */}
      <Modal
        visible={showDiabetesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tipo de Diabetes</Text>
            <TouchableOpacity 
              onPress={() => setShowDiabetesModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={diabetesTypes}
            renderItem={renderDiabetesItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </View>
      </Modal>

      {/* Modal de Medicamentos */}
      <Modal
        visible={showMedicationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Medicamentos
              {formData.selectedMedicationsNames.length > 0 && 
                ` (${formData.selectedMedicationsNames.length} selecionado${formData.selectedMedicationsNames.length > 1 ? 's' : ''})`
              }
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMedicationsModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Concluir</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalInstructions}>
            <Text style={styles.instructionsText}>
              Selecione todos os medicamentos que você utiliza
            </Text>
          </View>
          
          <FlatList
            data={availableMedications}
            renderItem={renderMedicationItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
          />
        </View>
      </Modal>
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
  form: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 16,
  },
  fieldContainer: {
    flex: 1,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  fieldNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  readOnlyField: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  selectButton: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
    flexWrap: "wrap",
  },
  selectButtonPlaceholder: {
    color: "#9ca3af",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
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
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  modalInstructions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  instructionsText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  modalList: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedListItem: {
    backgroundColor: "#eff6ff",
  },
  listItemText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
    fontWeight: "500",
  },
  selectedListItemText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  medicationItemContent: {
    flex: 1,
    marginRight: 12,
  },
  medicationDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedMedicationDetails: {
    color: "#60a5fa",
  },
});