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
import { Search, X, Check, AlertTriangle } from 'lucide-react-native';
import { useComplications, Complication } from '../hooks/useComplications';

interface ComplicationSelectorProps {
  selectedComplications: string[];
  onComplicationsChange: (complications: string[]) => void;
  placeholder?: string;
}

export default function ComplicationSelector({
  selectedComplications,
  onComplicationsChange,
  placeholder = "Selecione as complicações"
}: ComplicationSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { complications, loading, error } = useComplications();

  const filteredComplications = complications.filter(complication =>
    complication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complication.keywords && complication.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleComplicationToggle = (complicationName: string) => {
    const isSelected = selectedComplications.includes(complicationName);
    
    if (isSelected) {
      onComplicationsChange(selectedComplications.filter(name => name !== complicationName));
    } else {
      onComplicationsChange([...selectedComplications, complicationName]);
    }
  };

  const renderComplicationItem = ({ item }: { item: Complication }) => {
    const isSelected = selectedComplications.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.complicationItem, isSelected && styles.selectedItem]}
        onPress={() => handleComplicationToggle(item.name)}
      >
        <View style={styles.complicationInfo}>
          <Text style={[styles.complicationName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          {item.instructions && (
            <Text style={[styles.complicationInstructions, isSelected && styles.selectedText]}>
              {item.instructions}
            </Text>
          )}
          {item.keywords && item.keywords.length > 0 && (
            <Text style={[styles.complicationKeywords, isSelected && styles.selectedText]}>
              Palavras-chave: {item.keywords.join(', ')}
            </Text>
          )}
        </View>
        {isSelected && (
          <Check size={20} color="#dc2626" />
        )}
      </TouchableOpacity>
    );
  };

  const handleOpenModal = () => {
    if (error) {
      Alert.alert("Erro", "Não foi possível carregar as complicações. Tente novamente.");
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
        <AlertTriangle size={18} color="#6b7280" style={styles.alertIcon} />
        <Text style={styles.selectorText}>
          {selectedComplications.length > 0
            ? `${selectedComplications.length} complicação(ões) selecionada(s)`
            : placeholder
          }
        </Text>
      </TouchableOpacity>

      {selectedComplications.length > 0 && (
        <View style={styles.selectedComplicationsContainer}>
          {selectedComplications.map((complication, index) => (
            <View key={index} style={styles.selectedComplicationChip}>
              <Text style={styles.chipText}>{complication}</Text>
              <TouchableOpacity
                onPress={() => handleComplicationToggle(complication)}
                style={styles.removeChip}
              >
                <X size={14} color="#dc2626" />
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
            <Text style={styles.modalTitle}>Selecionar Complicações Crônicas</Text>
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
              placeholder="Buscar complicações..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.loadingText}>Carregando complicações...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erro ao carregar complicações</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => window.location.reload()}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredComplications}
              renderItem={renderComplicationItem}
              keyExtractor={(item) => item.id}
              style={styles.complicationList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchTerm 
                      ? "Nenhuma complicação encontrada" 
                      : "Nenhuma complicação disponível"
                    }
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Se sua complicação não está na lista, você pode deixar em branco
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
                Concluir ({selectedComplications.length})
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
  alertIcon: {
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#6b7280',
  },
  selectedComplicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedComplicationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#dc2626',
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
  complicationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  complicationItem: {
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
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  complicationInfo: {
    flex: 1,
  },
  complicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  complicationInstructions: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  complicationKeywords: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  selectedText: {
    color: '#dc2626',
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
    backgroundColor: '#dc2626',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  doneButton: {
    backgroundColor: '#dc2626',
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