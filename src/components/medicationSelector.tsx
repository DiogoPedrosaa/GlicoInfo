import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Search, X, Check, Pill } from 'lucide-react-native';
import { useMedications, Medication } from '../hooks/useMedications';

interface MedicationSelectorProps {
  selectedMedications: string[];
  onMedicationsChange: (medications: string[]) => void;
  placeholder?: string;
}

export default function MedicationSelector({
  selectedMedications,
  onMedicationsChange,
  placeholder = "Selecione os medicamentos"
}: MedicationSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { medications, loading, error } = useMedications();

  const filteredMedications = medications.filter(medication =>
    medication.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMedicationToggle = (medicationName: string) => {
    const isSelected = selectedMedications.includes(medicationName);
    
    if (isSelected) {
      onMedicationsChange(selectedMedications.filter(name => name !== medicationName));
    } else {
      onMedicationsChange([...selectedMedications, medicationName]);
    }
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    const isSelected = selectedMedications.includes(item.commercialName);
    const displayName = `${item.commercialName} - ${item.concentration}`;
    
    return (
      <TouchableOpacity
        style={[styles.medicationItem, isSelected && styles.selectedItem]}
        onPress={() => handleMedicationToggle(item.commercialName)}
      >
        <View style={styles.medicationInfo}>
          <Text style={[styles.medicationName, isSelected && styles.selectedText]}>
            {item.commercialName}
          </Text>
          <Text style={[styles.medicationDetails, isSelected && styles.selectedText]}>
            {item.genericName} • {item.concentration}
          </Text>
          <Text style={[styles.medicationForm, isSelected && styles.selectedText]}>
            {getFormLabel(item.pharmaceuticalForm)} • {getRouteLabel(item.administrationRoute)}
          </Text>
        </View>
        {isSelected && (
          <Check size={20} color="#3b82f6" />
        )}
      </TouchableOpacity>
    );
  };

  const getFormLabel = (value: string): string => {
    const forms: Record<string, string> = {
      comprimido: "Comprimido",
      capsula: "Cápsula",
      solucao_injetavel: "Solução injetável",
      caneta_insulina: "Caneta de insulina",
      frasco_ampola: "Frasco-ampola",
      xarope: "Xarope",
      suspensao: "Suspensão",
      creme: "Creme",
      gel: "Gel",
      aerossol: "Aerossol"
    };
    return forms[value] || value;
  };

  const getRouteLabel = (value: string): string => {
    const routes: Record<string, string> = {
      oral: "Oral",
      subcutanea: "Subcutânea",
      intravenosa: "Intravenosa",
      intramuscular: "Intramuscular",
      topica: "Tópica",
      inalatoria: "Inalatória",
      retal: "Retal",
      oftalmologica: "Oftalmológica"
    };
    return routes[value] || value;
  };

  const handleOpenModal = () => {
    if (error) {
      Alert.alert("Erro", "Não foi possível carregar os medicamentos. Tente novamente.");
      return;
    }
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={handleOpenModal}
      >
        <Pill size={18} color="#6b7280" style={styles.pillIcon} />
        <Text style={styles.selectorText}>
          {selectedMedications.length > 0
            ? `${selectedMedications.length} medicamento(s) selecionado(s)`
            : placeholder
          }
        </Text>
      </TouchableOpacity>

      {selectedMedications.length > 0 && (
        <View style={styles.selectedMedicationsContainer}>
          {selectedMedications.map((medication, index) => (
            <View key={index} style={styles.selectedMedicationChip}>
              <Text style={styles.chipText}>{medication}</Text>
              <TouchableOpacity
                onPress={() => handleMedicationToggle(medication)}
                style={styles.removeChip}
              >
                <X size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Medicamentos</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={16} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar medicamentos..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Carregando medicamentos...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erro ao carregar medicamentos</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => window.location.reload()}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredMedications}
              renderItem={renderMedicationItem}
              keyExtractor={(item) => item.id}
              style={styles.medicationList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchTerm 
                      ? "Nenhum medicamento encontrado" 
                      : "Nenhum medicamento disponível"
                    }
                  </Text>
                </View>
              }
            />
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>
                Concluir ({selectedMedications.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillIcon: {
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#6b7280',
  },
  selectedMedicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedMedicationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#1e40af',
    marginRight: 6,
  },
  removeChip: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1f2937',
  },
  medicationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  medicationForm: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedText: {
    color: '#1e40af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});