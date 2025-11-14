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
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ArrowLeft, Home, FileText, Bell, User, ChevronDown, Calculator, Plus, Trash2, X, Search } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { auth, db } from "../../api/firebase/config";

interface Food {
  id: string;
  name: string;
  classification: string;
  carbs100: number;
  carbsPortion: number;
  portionDesc: string;
}

interface MealType {
  id: string;
  name: string;
  icon: string;
}

interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  classification: string;
  classificationLabel: string;
  quantity: number;
  carbs: number;
  portionDesc: string;
}

// RENOMEAR INTERFACE
interface SelectedItem {
  id: string;
  foodId: string;
  foodName: string;
  classification: string;
  quantity: string;
  portionDesc: string;
}

export default function RegisterMealScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]); // RENOMEADO
  
  const [formData, setFormData] = useState({
    mealType: "",
    mealTypeName: "",
    data: "",
    hora: "",
    descricao: "",
  });

  // Estados para adicionar item temporário
  const [tempItem, setTempItem] = useState({
    foodId: "",
    foodName: "",
    quantity: "",
  });

  const mealTypes: MealType[] = [
    { id: "breakfast", name: "Café da manhã", icon: "🌅" },
    { id: "lunch", name: "Almoço", icon: "🍽️" },
    { id: "snack", name: "Lanche", icon: "🍎" },
    { id: "dinner", name: "Jantar", icon: "🌙" },
    { id: "other", name: "Outro", icon: "🍴" },
  ];

  // FILTROS DE CLASSIFICAÇÃO
  const classificationFilters = [
    { id: "todos", name: "TODOS" },
    { id: "g1", name: "G1", color: "#10b981" },
    { id: "g2", name: "G2", color: "#3b82f6" },
    { id: "g3", name: "G3", color: "#f59e0b" },
    { id: "g4", name: "G4", color: "#ef4444" },
  ];

  useEffect(() => {
    loadFoods();
  }, []);

  // NOVO: FILTRAR ALIMENTOS QUANDO MUDAR BUSCA OU FILTRO
  useEffect(() => {
    filterFoods();
  }, [searchQuery, selectedFilter, foods]);

  const loadFoods = async () => {
    try {
      setLoadingFoods(true);
      const foodsQuery = query(collection(db, "foods"));
      const foodsSnapshot = await getDocs(foodsQuery);
      
      const foodsList: Food[] = [];
      foodsSnapshot.forEach((doc) => {
        const data = doc.data();
        foodsList.push({
          id: doc.id,
          name: data.name || "",
          classification: data.classification || "",
          carbs100: data.carbs100 || 0,
          carbsPortion: data.carbsPortion || 0,
          portionDesc: data.portionDesc || "",
        });
      });
      
      foodsList.sort((a, b) => a.name.localeCompare(b.name));
      setFoods(foodsList);
      setFilteredFoods(foodsList);
    } catch (error) {
      console.log("Erro ao carregar alimentos:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de alimentos");
    } finally {
      setLoadingFoods(false);
    }
  };

  // NOVA FUNÇÃO: FILTRAR ALIMENTOS
  const filterFoods = () => {
    let filtered = [...foods];

    // Filtrar por busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por classificação
    if (selectedFilter !== "todos") {
      filtered = filtered.filter(food => food.classification === selectedFilter);
    }

    setFilteredFoods(filtered);
  };

  // NOVA FUNÇÃO: LIMPAR FILTROS
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("todos");
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Formatadores (mantidos iguais)
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

  const handleMealTypeSelect = (mealType: MealType) => {
    setFormData({
      ...formData,
      mealType: mealType.id,
      mealTypeName: mealType.name,
    });
    setShowMealTypeModal(false);
  };

  const handleFoodSelect = (food: Food) => {
    setTempItem({
      foodId: food.id,
      foodName: food.name,
      quantity: "1",
    });
  };

  // RENOMEAR FUNÇÃO
  const addToSelected = () => {
    if (!tempItem.foodId || !tempItem.quantity.trim()) {
      Alert.alert("Erro", "Selecione um alimento e informe a quantidade");
      return;
    }

    const quantity = parseFloat(tempItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }

    const selectedFood = foods.find(food => food.id === tempItem.foodId);
    if (!selectedFood) {
      Alert.alert("Erro", "Alimento não encontrado");
      return;
    }

    const existsInSelected = selectedItems.find(item => item.foodId === tempItem.foodId);
    if (existsInSelected) {
      Alert.alert("Aviso", "Este alimento já está selecionado");
      return;
    }

    const newSelectedItem: SelectedItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      classification: selectedFood.classification,
      quantity: tempItem.quantity,
      portionDesc: selectedFood.portionDesc,
    };

    setSelectedItems([...selectedItems, newSelectedItem]);
    
    // Limpar seleção mas NÃO fechar modal
    setTempItem({
      foodId: "",
      foodName: "",
      quantity: "",
    });
  };

  // RENOMEAR FUNÇÃO
  const removeFromSelected = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  // RENOMEAR FUNÇÃO
  const confirmSelected = () => {
    if (selectedItems.length === 0) {
      Alert.alert("Erro", "Nenhum alimento selecionado");
      return;
    }

    const newMealItems: MealItem[] = selectedItems.map(selectedItem => {
      const selectedFood = foods.find(food => food.id === selectedItem.foodId);
      if (!selectedFood) return null;

      const quantity = parseFloat(selectedItem.quantity);
      const totalCarbs = selectedFood.carbsPortion * quantity;

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        classification: selectedFood.classification,
        classificationLabel: getClassificationLabel(selectedFood.classification),
        quantity: quantity,
        carbs: parseFloat(totalCarbs.toFixed(1)),
        portionDesc: selectedFood.portionDesc,
      };
    }).filter(item => item !== null) as MealItem[];

    setMealItems([...mealItems, ...newMealItems]);
    setSelectedItems([]);
    setShowFoodModal(false); // Fechar modal
    clearFilters(); // LIMPAR FILTROS AO FECHAR
    
    Alert.alert("✅ Sucesso", `${newMealItems.length} alimento(s) adicionado(s) à refeição!`);
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'g1':
        return 'G1 - Minimamente processados';
      case 'g2':
        return 'G2 - Ingredientes culinários processados';
      case 'g3':
        return 'G3 - Alimentos processados';
      case 'g4':
        return 'G4 - Alimentos e bebidas ultraprocessados';
      default:
        return classification;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'g1':
        return '#10b981'; // Verde
      case 'g2':
        return '#3b82f6'; // Azul
      case 'g3':
        return '#f59e0b'; // Amarelo
      case 'g4':
        return '#ef4444'; // Vermelho
      default:
        return '#6b7280'; // Cinza padrão
    }
  };

  const addItemToMeal = () => {
    if (!tempItem.foodId || !tempItem.quantity.trim()) {
      Alert.alert("Erro", "Selecione um alimento e informe a quantidade");
      return;
    }

    const quantity = parseFloat(tempItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }

    const selectedFood = foods.find(food => food.id === tempItem.foodId);
    if (!selectedFood) {
      Alert.alert("Erro", "Alimento não encontrado");
      return;
    }

    const totalCarbs = selectedFood.carbsPortion * quantity;

    const newItem: MealItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      classification: selectedFood.classification,
      classificationLabel: getClassificationLabel(selectedFood.classification),
      quantity: quantity,
      carbs: parseFloat(totalCarbs.toFixed(1)),
      portionDesc: selectedFood.portionDesc,
    };

    setMealItems([...mealItems, newItem]);
    
    // Limpar item temporário
    setTempItem({
      foodId: "",
      foodName: "",
      quantity: "",
    });

    Alert.alert("✅ Sucesso", "Alimento adicionado à refeição!");
  };

  const removeItemFromMeal = (itemId: string) => {
    Alert.alert(
      "Remover item",
      "Deseja remover este alimento da refeição?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          style: "destructive",
          onPress: () => {
            setMealItems(mealItems.filter(item => item.id !== itemId));
          }
        },
      ]
    );
  };

  const getTotalCarbs = () => {
    return mealItems.reduce((total, item) => total + item.carbs, 0).toFixed(1);
  };

  const validateForm = () => {
    if (!formData.mealType.trim()) {
      Alert.alert("Erro", "Por favor, selecione o tipo de refeição");
      return false;
    }

    if (mealItems.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um alimento à refeição");
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

    if (!validateDate(formData.data)) {
      Alert.alert("Erro", "Por favor, informe uma data válida no formato DD/MM/AAAA");
      return false;
    }

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

      const mealData = {
        userId: auth.currentUser.uid,
        mealType: formData.mealType,
        mealTypeName: formData.mealTypeName,
        items: mealItems,
        totalCarbs: parseFloat(getTotalCarbs()),
        totalItems: mealItems.length,
        data: formData.data,
        hora: formData.hora,
        descricao: formData.descricao.trim(),
        createdAt: new Date(),
        timestamp: Date.now(),
      };

      await addDoc(collection(db, "mealRecords"), mealData);

      Alert.alert(
        "✅ Sucesso",
        "Refeição registrada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.log("Erro ao registrar refeição:", error);
      Alert.alert("Erro", "Não foi possível registrar a refeição. Tente novamente.");
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

  const renderMealTypeItem = ({ item }: { item: MealType }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleMealTypeSelect(item)}
    >
      <Text style={styles.listItemIcon}>{item.icon}</Text>
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: Food }) => {
    const isInSelected = selectedItems.some(selectedItem => selectedItem.foodId === item.id);
    const isSelected = tempItem.foodId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.foodItem,
          isSelected && styles.selectedFoodItem,
          isInSelected && styles.foodItemInSelected,
        ]}
        onPress={() => handleFoodSelect(item)}
      >
        <View style={styles.foodInfo}>
          <View style={styles.foodNameRow}>
            <Text style={styles.foodName}>{item.name}</Text>
            {isInSelected && (
              <View style={styles.inSelectedBadge}>
                <Text style={styles.inSelectedBadgeText}>Selecionado</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.foodClassification,
            { color: getClassificationColor(item.classification) }
          ]}>
            {getClassificationLabel(item.classification)}
          </Text>
          <Text style={styles.foodDetails}>
            {item.carbsPortion}g de carboidratos por {item.portionDesc}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // RENOMEAR FUNÇÃO
  const renderSelectedItem = ({ item }: { item: SelectedItem }) => {
    const food = foods.find(f => f.id === item.foodId);
    if (!food) return null;

    const quantity = parseFloat(item.quantity);
    const totalCarbs = food.carbsPortion * quantity;

    return (
      <View style={styles.selectedItemCard}>
        <View style={styles.selectedItemInfo}>
          <Text style={styles.selectedItemName}>{item.foodName}</Text>
          <Text style={styles.selectedItemDetails}>
            {item.quantity}x {item.portionDesc} • {totalCarbs.toFixed(1)}g carboidratos
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeSelectedButton}
          onPress={() => removeFromSelected(item.id)}
        >
          <X size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // ADICIONAR ESTA FUNÇÃO QUE ESTAVA FALTANDO
  const renderMealItem = ({ item }: { item: MealItem }) => (
    <View style={styles.mealItemCard}>
      <View style={styles.mealItemInfo}>
        <Text style={styles.mealItemName}>{item.foodName}</Text>
        <Text style={[
          styles.mealItemClassification,
          { color: getClassificationColor(item.classification) }
        ]}>
          {item.classificationLabel}
        </Text>
        <Text style={styles.mealItemDetails}>
          {item.quantity}x {item.portionDesc} • {item.carbs}g de carboidratos
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItemFromMeal(item.id)}
      >
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Refeição</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={30}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Espaço superior */}
        <View style={styles.spacer} />
        
        {/* Tipo de refeição */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de refeição</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowMealTypeModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !formData.mealTypeName && styles.selectButtonPlaceholder
            ]}>
              {formData.mealTypeName || "Selecione o tipo de refeição"}
            </Text>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Seção para adicionar alimentos */}
        <View style={styles.addFoodSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Adicionar Alimentos</Text>
            {selectedItems.length > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{selectedItems.length}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={() => setShowFoodModal(true)}
            disabled={loadingFoods}
          >
            <Text style={styles.openModalButtonText}>
              {loadingFoods ? "Carregando..." : "Selecionar Alimentos"}
            </Text>
            <Plus size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Lista de alimentos adicionados */}
        {mealItems.length > 0 && (
          <View style={styles.mealItemsSection}>
            <Text style={styles.sectionTitle}>Alimentos da Refeição</Text>
            
            {/* Total de carboidratos abaixo do título */}
            <View style={styles.totalCarbsContainer}>
              <Text style={styles.totalCarbsText}>Total: {getTotalCarbs()}g carboidratos</Text>
            </View>
            
            <FlatList
              data={mealItems}
              renderItem={renderMealItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.mealItemsList}
            />
          </View>
        )}

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
            placeholder="Adicione observações sobre a refeição..."
            placeholderTextColor="#9ca3af"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
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
              <Text style={styles.registerButtonText}>Registrar Refeição</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Espaçamento extra */}
        <View style={{ height: 150 }} />
      </KeyboardAwareScrollView>

      {/* Modal de Seleção de Tipo de Refeição */}
      <Modal
        visible={showMealTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tipo de Refeição</Text>
            <TouchableOpacity 
              onPress={() => setShowMealTypeModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={mealTypes}
            renderItem={renderMealTypeItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Modal de Seleção de Alimento */}
      <Modal
        visible={showFoodModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Selecionar Alimentos
              {selectedItems.length > 0 && ` (${selectedItems.length} selecionado${selectedItems.length > 1 ? 's' : ''})`}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowFoodModal(false);
                setTempItem({ foodId: "", foodName: "", quantity: "" });
                clearFilters();
              }}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {/* BARRA DE PESQUISA E FILTROS */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar alimento..."
                placeholderTextColor="#9ca3af"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {classificationFilters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.id && styles.filterChipActive,
                    selectedFilter === filter.id && filter.color && {
                      backgroundColor: filter.color,
                      borderColor: filter.color,
                    }
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedFilter === filter.id && styles.filterChipTextActive,
                  ]}>
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SELECIONADOS */}
          {selectedItems.length > 0 && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedTitle}>Selecionados ({selectedItems.length})</Text>
                <TouchableOpacity
                  style={styles.confirmSelectedButton}
                  onPress={confirmSelected}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.confirmSelectedButtonText}>
                    Adicionar à Refeição
                  </Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={selectedItems}
                renderItem={renderSelectedItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedList}
                contentContainerStyle={styles.selectedListContent}
              />
            </View>
          )}

          {/* SELEÇÃO ATUAL */}
          {tempItem.foodId && (
            <View style={styles.selectionSection}>
              <Text style={styles.selectionTitle}>Item Atual</Text>
              <View style={styles.selectionCard}>
                <View style={styles.selectionInfo}>
                  <Text style={styles.selectionName}>{tempItem.foodName}</Text>
                  <TextInput
                    style={styles.selectionQuantityInput}
                    value={tempItem.quantity}
                    onChangeText={(text) => setTempItem({...tempItem, quantity: text})}
                    placeholder="Quantidade"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  style={styles.addToSelectedButton}
                  onPress={addToSelected}
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* LISTA DE ALIMENTOS */}
          {loadingFoods ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Carregando alimentos...</Text>
            </View>
          ) : filteredFoods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedFilter !== "todos" 
                  ? "Nenhum alimento encontrado"
                  : "Nenhum alimento disponível"}
              </Text>
              {(searchQuery || selectedFilter !== "todos") && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredFoods}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
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
    paddingBottom: 20,
  },
  spacer: {
    height: 20,
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
  addFoodSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  selectedBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  selectedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  openModalButton: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  openModalButtonText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  mealItemsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCarbsContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  totalCarbsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  mealItemsList: {
    marginTop: 8,
  },
  mealItemCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  mealItemClassification: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  mealItemDetails: {
    fontSize: 14,
    color: "#6b7280",
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
    color: "#6b7280",
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
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 32,
    height: 3,
    backgroundColor: "#2563eb",
    borderRadius: 2,
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
  
  // NOVOS ESTILOS PARA BUSCA E FILTRO
  searchSection: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 8,
  },
  filterContainer: {
    paddingLeft: 20,
  },
  filterContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearFiltersButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  listItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  listItemText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  foodItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedFoodItem: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  foodItemInCart: {
    opacity: 0.6,
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  inCartBadge: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  inCartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  foodClassification: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 14,
    color: "#6b7280",
  },
  cartSection: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  confirmCartButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmCartButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cartList: {
    paddingLeft: 20,
  },
  cartListContent: {
    paddingRight: 20,
  },
  cartItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 12,
    color: "#6b7280",
  },
  removeCartButton: {
    padding: 4,
    marginLeft: 8,
  },
  selectionSection: {
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#2563eb",
    padding: 16,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 8,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  selectionQuantityInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  addToCartButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  modalList: {
    flex: 1,
  },
  foodItemInSelected: {
    opacity: 0.6,
  },
  inSelectedBadge: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  inSelectedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  selectedSection: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  confirmSelectedButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmSelectedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedList: {
    paddingLeft: 20,
  },
  selectedListContent: {
    paddingRight: 20,
  },
  selectedItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  selectedItemDetails: {
    fontSize: 12,
    color: "#6b7280",
  },
  removeSelectedButton: {
    padding: 4,
    marginLeft: 8,
  },
  addToSelectedButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});