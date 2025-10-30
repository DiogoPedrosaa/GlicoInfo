// src/screens/NotificationsScreen/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import {
  ArrowLeft,
  Bell,
  Plus,
  Droplet,
  Pill,
  Utensils,
  Clock,
  Check,
  ChevronDown,
  X,
  Edit3,
  Trash2,
  MoreVertical,
} from "lucide-react-native";
import { auth, db } from "../../api/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../components/BottomNavigation";

// CONFIGURAÇÃO CORRIGIDA - REMOVENDO O DEPRECATED shouldShowAlert
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface Reminder {
  id: string;
  type: "medication" | "meal" | "glucose";
  title: string;
  description: string;
  time: string;
  frequency: "daily" | "weekly" | "custom";
  isActive: boolean;
  createdAt: number;
  userId: string;
}

interface HistoryItem {
  id: string;
  type: "medication" | "meal" | "glucose";
  title: string;
  action: "created" | "completed" | "disabled";
  timestamp: number;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [newReminder, setNewReminder] = useState({
    type: "medication" as "medication" | "meal" | "glucose",
    title: "",
    description: "",
    time: "08:00",
    frequency: "daily" as "daily" | "weekly" | "custom",
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);

  // NOVOS ESTADOS PARA EDIÇÃO E OPÇÕES
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [editingReminder, setEditingReminder] = useState({
    type: "medication" as "medication" | "meal" | "glucose",
    title: "",
    description: "",
    time: "08:00",
    frequency: "daily" as "daily" | "weekly" | "custom",
  });
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);
  const [showEditFrequencyDropdown, setShowEditFrequencyDropdown] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editSelectedTime, setEditSelectedTime] = useState(new Date());

  // NOVOS ESTADOS PARA HISTÓRICO
  const [showHistoryOptionsModal, setShowHistoryOptionsModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  const reminderTypes = [
    { key: "medication", label: "Medicação", icon: Pill, color: "#2563eb" },
    { key: "glucose", label: "Glicemia", icon: Droplet, color: "#ef4444" },
    { key: "meal", label: "Refeição", icon: Utensils, color: "#10b981" },
  ];

  const frequencies = [
    { key: "daily", label: "Diariamente" },
    { key: "weekly", label: "Semanalmente" },
    { key: "custom", label: "Personalizado" },
  ];

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Para receber lembretes, é necessário permitir notificações.',
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log('Erro ao solicitar permissões:', error);
      Alert.alert(
        'Modo Desenvolvimento',
        'Notificações serão simuladas no console durante o desenvolvimento.',
      );
      return true;
    }
  };

  const scheduleNotification = async (reminder: Reminder) => {
    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;

      const [hours, minutes] = reminder.time.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);

      let notificationId: string;

      if (reminder.frequency === 'daily') {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `📋 ${reminder.title}`,
            body: reminder.description || 'Hora do seu lembrete!',
            sound: true,
          },
          trigger: {
            hour: hour,
            minute: minute,
            repeats: true,
          },
        });
      } else {
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(hour, minute, 0, 0);
        
        if (triggerDate <= now) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }

        const secondsUntilTrigger = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `📋 ${reminder.title}`,
            body: reminder.description || 'Hora do seu lembrete!',
            sound: true,
          },
          trigger: {
            seconds: secondsUntilTrigger,
          },
        });
      }

      console.log('✅ Notificação agendada com ID:', notificationId);
      console.log(`⏰ Lembrete: ${reminder.title} às ${reminder.time}`);
      return notificationId;
    } catch (error) {
      console.log('⚠️ Aviso ao agendar notificação:', error);
      
      const simulatedId = `sim_${Date.now()}_${Math.random()}`;
      console.log(`🔔 SIMULADO - Lembrete agendado: ${reminder.title} às ${reminder.time}`);
      
      return simulatedId;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      if (notificationId.startsWith('sim_')) {
        console.log('🔕 SIMULADO - Notificação cancelada:', notificationId);
        return;
      }
      
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🔕 Notificação cancelada:', notificationId);
    } catch (error) {
      console.log('Erro ao cancelar notificação:', error);
    }
  };

  useEffect(() => {
    requestNotificationPermissions();
    loadReminders();
    loadHistory();
  }, []);

  const loadReminders = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "reminders"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("time", "asc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const remindersData: Reminder[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          remindersData.push({
            id: doc.id,
            type: data.type,
            title: data.title,
            description: data.description,
            time: data.time,
            frequency: data.frequency,
            isActive: data.isActive,
            createdAt: data.createdAt,
            userId: data.userId,
          });
        });
        setReminders(remindersData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.log("Erro ao carregar lembretes:", error);
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "notificationHistory"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyData: HistoryItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          historyData.push({
            id: doc.id,
            type: data.type,
            title: data.title,
            action: data.action,
            timestamp: data.timestamp,
          });
        });
        setHistory(historyData);
      });

      return unsubscribe;
    } catch (error) {
      console.log("Erro ao carregar histórico:", error);
    }
  };

  const addReminder = async () => {
    if (!auth.currentUser) return;

    if (!newReminder.title.trim()) {
      Alert.alert("Erro", "Por favor, adicione um título para o lembrete");
      return;
    }

    try {
      const reminderData = {
        ...newReminder,
        isActive: true,
        createdAt: Date.now(),
        userId: auth.currentUser.uid,
      };

      const docRef = await addDoc(collection(db, "reminders"), reminderData);

      const notificationId = await scheduleNotification({
        ...reminderData,
        id: docRef.id,
      });

      if (notificationId) {
        await updateDoc(docRef, {
          notificationId: notificationId,
        });
      }

      await addDoc(collection(db, "notificationHistory"), {
        type: newReminder.type,
        title: newReminder.title,
        action: "created",
        timestamp: Date.now(),
        userId: auth.currentUser.uid,
      });

      setShowAddModal(false);
      setNewReminder({
        type: "medication",
        title: "",
        description: "",
        time: "08:00",
        frequency: "daily",
      });

      Alert.alert("Sucesso", "Lembrete criado e notificação agendada com sucesso!");
    } catch (error) {
      console.log("Erro ao criar lembrete:", error);
      Alert.alert("Erro", "Não foi possível criar o lembrete");
    }
  };

  // NOVA FUNÇÃO PARA EDITAR LEMBRETE
  const editReminder = async () => {
    if (!auth.currentUser || !selectedReminder) return;

    if (!editingReminder.title.trim()) {
      Alert.alert("Erro", "Por favor, adicione um título para o lembrete");
      return;
    }

    try {
      const reminderData = {
        ...editingReminder,
        isActive: selectedReminder.isActive,
        createdAt: selectedReminder.createdAt,
        userId: auth.currentUser.uid,
      };

      await updateDoc(doc(db, "reminders", selectedReminder.id), reminderData);

      // Se o lembrete estiver ativo, reagendar a notificação
      if (selectedReminder.isActive) {
        // Cancelar notificação anterior se existir
        // Agendar nova notificação
        const notificationId = await scheduleNotification({
          ...reminderData,
          id: selectedReminder.id,
        });

        if (notificationId) {
          await updateDoc(doc(db, "reminders", selectedReminder.id), {
            notificationId: notificationId,
          });
        }
      }

      // Adicionar ao histórico
      await addDoc(collection(db, "notificationHistory"), {
        type: editingReminder.type,
        title: editingReminder.title,
        action: "completed",
        timestamp: Date.now(),
        userId: auth.currentUser.uid,
      });

      setShowEditModal(false);
      setSelectedReminder(null);

      Alert.alert("Sucesso", "Lembrete atualizado com sucesso!");
    } catch (error) {
      console.log("Erro ao editar lembrete:", error);
      Alert.alert("Erro", "Não foi possível editar o lembrete");
    }
  };

  // NOVA FUNÇÃO PARA EXCLUIR LEMBRETE
  const deleteReminder = async () => {
    if (!selectedReminder) return;

    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o lembrete "${selectedReminder.title}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // Cancelar notificação se existir
              // await cancelNotification(selectedReminder.notificationId);

              // Excluir documento do Firestore
              await deleteDoc(doc(db, "reminders", selectedReminder.id));

              // Adicionar ao histórico
              if (auth.currentUser) {
                await addDoc(collection(db, "notificationHistory"), {
                  type: selectedReminder.type,
                  title: selectedReminder.title,
                  action: "disabled",
                  timestamp: Date.now(),
                  userId: auth.currentUser.uid,
                });
              }

              setShowOptionsModal(false);
              setSelectedReminder(null);

              Alert.alert("Sucesso", "Lembrete excluído com sucesso!");
            } catch (error) {
              console.log("Erro ao excluir lembrete:", error);
              Alert.alert("Erro", "Não foi possível excluir o lembrete");
            }
          },
        },
      ]
    );
  };

  // NOVA FUNÇÃO PARA EXCLUIR ITEM DO HISTÓRICO
  const deleteHistoryItem = async () => {
    if (!selectedHistoryItem) return;

    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir este item do histórico?\n\n"${selectedHistoryItem.title}"`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // Excluir documento do histórico
              await deleteDoc(doc(db, "notificationHistory", selectedHistoryItem.id));

              setShowHistoryOptionsModal(false);
              setSelectedHistoryItem(null);

              Alert.alert("Sucesso", "Item removido do histórico!");
            } catch (error) {
              console.log("Erro ao excluir item do histórico:", error);
              Alert.alert("Erro", "Não foi possível excluir o item do histórico");
            }
          },
        },
      ]
    );
  };

  // FUNÇÃO PARA ABRIR MODAL DE OPÇÕES DO HISTÓRICO
  const openHistoryOptionsModal = (historyItem: HistoryItem) => {
    setSelectedHistoryItem(historyItem);
    setShowHistoryOptionsModal(true);
  };

  // FUNÇÃO PARA ABRIR MODAL DE OPÇÕES
  const openOptionsModal = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowOptionsModal(true);
  };

  // FUNÇÃO PARA ABRIR MODAL DE EDIÇÃO
  const openEditModal = () => {
    if (!selectedReminder) return;

    setEditingReminder({
      type: selectedReminder.type,
      title: selectedReminder.title,
      description: selectedReminder.description,
      time: selectedReminder.time,
      frequency: selectedReminder.frequency,
    });

    // Configurar o time picker com o horário atual
    const [hours, minutes] = selectedReminder.time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    setEditSelectedTime(date);

    setShowOptionsModal(false);
    setShowEditModal(true);
  };

  const toggleReminder = async (reminderId: string, currentState: boolean) => {
    try {
      const reminderDoc = reminders.find(r => r.id === reminderId);
      
      if (!currentState && reminderDoc) {
        const notificationId = await scheduleNotification(reminderDoc);
        
        await updateDoc(doc(db, "reminders", reminderId), {
          isActive: true,
          notificationId: notificationId,
        });
      } else {
        await updateDoc(doc(db, "reminders", reminderId), {
          isActive: false,
        });
      }
    } catch (error) {
      console.log("Erro ao atualizar lembrete:", error);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setSelectedTime(selectedDate);
      const timeString = selectedDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setNewReminder(prev => ({ ...prev, time: timeString }));
    }
  };

  // NOVA FUNÇÃO PARA EDITAR HORÁRIO
  const handleEditTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditTimePicker(false);
    }
    
    if (selectedDate) {
      setEditSelectedTime(selectedDate);
      const timeString = selectedDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setEditingReminder(prev => ({ ...prev, time: timeString }));
    }
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const showEditTimePickerModal = () => {
    setShowEditTimePicker(true);
  };

  const getReminderIcon = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.key === type);
    return reminderType ? reminderType.icon : Clock;
  };

  const getReminderColor = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.key === type);
    return reminderType ? reminderType.color : "#6b7280";
  };

  // FUNÇÃO PARA OBTER LABEL DA AÇÃO DO HISTÓRICO
  const getActionLabel = (action: string) => {
    switch (action) {
      case "created":
        return "Criado";
      case "completed":
        return "Atualizado";
      case "disabled":
        return "Excluído";
      default:
        return action;
    }
  };

  // FUNÇÃO PARA OBTER COR DA AÇÃO DO HISTÓRICO
  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "#10b981";
      case "completed":
        return "#2563eb";
      case "disabled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatHistoryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Toggle Notificações Gerais */}
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color="#2563eb" />
              <Text style={styles.settingLabel}>Notificações gerais</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={notificationsEnabled ? "#2563eb" : "#f3f4f6"}
            />
          </View>
        </View>

        {/* Botão Adicionar Lembrete */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar novo lembrete</Text>
        </TouchableOpacity>

        {/* Lembretes Ativos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes Ativos</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Carregando lembretes...</Text>
            </View>
          ) : (
            <View style={styles.remindersContainer}>
              {reminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#e5e7eb" />
                  <Text style={styles.emptyStateTitle}>Nenhum lembrete ativo</Text>
                  <Text style={styles.emptyStateText}>
                    Adicione lembretes para medicações, refeições ou testes de glicemia
                  </Text>
                </View>
              ) : (
                reminders.map((reminder) => {
                  const Icon = getReminderIcon(reminder.type);
                  const color = getReminderColor(reminder.type);
                  
                  return (
                    <TouchableOpacity
                      key={reminder.id}
                      style={styles.reminderCard}
                      onPress={() => openOptionsModal(reminder)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.reminderLeft}>
                        <View style={[styles.reminderIcon, { backgroundColor: `${color}15` }]}>
                          <Icon size={20} color={color} />
                        </View>
                        <View style={styles.reminderInfo}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                          <Text style={styles.reminderDescription}>
                            {reminder.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reminderRight}>
                        <Text style={styles.reminderTime}>{reminder.time}</Text>
                        <Switch
                          value={reminder.isActive}
                          onValueChange={() => toggleReminder(reminder.id, reminder.isActive)}
                          trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                          thumbColor={reminder.isActive ? "#2563eb" : "#f3f4f6"}
                          style={styles.reminderSwitch}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Histórico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          
          <View style={styles.historyContainer}>
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>Nenhum histórico encontrado</Text>
              </View>
            ) : (
              history.map((item) => {
                const Icon = getReminderIcon(item.type);
                const color = getReminderColor(item.type);
                const actionColor = getActionColor(item.action);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItem}
                    onPress={() => openHistoryOptionsModal(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyLeft}>
                      <View style={[styles.historyIcon, { backgroundColor: `${color}15` }]}>
                        <Icon size={16} color={color} />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyDate}>
                          {formatHistoryDate(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <View style={[styles.actionBadge, { backgroundColor: `${actionColor}15` }]}>
                        <Text style={[styles.actionText, { color: actionColor }]}>
                          {getActionLabel(item.action)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Opções do Histórico */}
      <Modal
        visible={showHistoryOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistoryOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções do Histórico</Text>
              <TouchableOpacity
                onPress={() => setShowHistoryOptionsModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedHistoryItem && (
              <View style={styles.reminderPreview}>
                <Text style={styles.reminderPreviewTitle}>{selectedHistoryItem.title}</Text>
                <View style={styles.historyPreviewDetails}>
                  <Text style={styles.historyPreviewAction}>
                    Ação: {getActionLabel(selectedHistoryItem.action)}
                  </Text>
                  <Text style={styles.historyPreviewDate}>
                    {formatHistoryDate(selectedHistoryItem.timestamp)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, styles.deleteOption]}
                onPress={deleteHistoryItem}
              >
                <Trash2 size={20} color="#ef4444" />
                <Text style={[styles.optionText, styles.deleteText]}>Excluir do Histórico</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Opções do Lembrete */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções do Lembrete</Text>
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedReminder && (
              <View style={styles.reminderPreview}>
                <Text style={styles.reminderPreviewTitle}>{selectedReminder.title}</Text>
                <Text style={styles.reminderPreviewTime}>{selectedReminder.time}</Text>
              </View>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={openEditModal}
              >
                <Edit3 size={20} color="#2563eb" />
                <Text style={styles.optionText}>Editar Lembrete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.deleteOption]}
                onPress={deleteReminder}
              >
                <Trash2 size={20} color="#ef4444" />
                <Text style={[styles.optionText, styles.deleteText]}>Excluir Lembrete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Adicionar Lembrete */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Lembrete</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Tipo de lembrete */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Tipo de lembrete</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {reminderTypes.find(t => t.key === newReminder.type)?.label || "Selecione o tipo"}
                  </Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
                
                {showTypeDropdown && (
                  <View style={styles.dropdownOptions}>
                    {reminderTypes.map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setNewReminder(prev => ({ ...prev, type: type.key as any }));
                          setShowTypeDropdown(false);
                        }}
                      >
                        <type.icon size={16} color={type.color} />
                        <Text style={styles.dropdownOptionText}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Horário */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Horário</Text>
                <TouchableOpacity
                  style={styles.timeContainer}
                  onPress={showTimePickerModal}
                >
                  <Clock size={20} color="#6b7280" />
                  <Text style={styles.timeText}>{newReminder.time}</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Frequência */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Frequência</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {frequencies.find(f => f.key === newReminder.frequency)?.label || "Selecione a frequência"}
                  </Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
                
                {showFrequencyDropdown && (
                  <View style={styles.dropdownOptions}>
                    {frequencies.map((freq) => (
                      <TouchableOpacity
                        key={freq.key}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setNewReminder(prev => ({ ...prev, frequency: freq.key as any }));
                          setShowFrequencyDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{freq.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Título */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Título</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newReminder.title}
                  onChangeText={(text) => setNewReminder(prev => ({ ...prev, title: text }))}
                  placeholder="Ex: Insulina NPH, Café da manhã..."
                />
              </View>

              {/* Descrição */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Descrição (opcional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={newReminder.description}
                  onChangeText={(text) => setNewReminder(prev => ({ ...prev, description: text }))}
                  placeholder="Observações adicionais..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Botões Modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={addReminder}
              >
                <Text style={styles.modalConfirmText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Lembrete */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Lembrete</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Tipo de lembrete */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Tipo de lembrete</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowEditTypeDropdown(!showEditTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {reminderTypes.find(t => t.key === editingReminder.type)?.label || "Selecione o tipo"}
                  </Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
                
                {showEditTypeDropdown && (
                  <View style={styles.dropdownOptions}>
                    {reminderTypes.map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setEditingReminder(prev => ({ ...prev, type: type.key as any }));
                          setShowEditTypeDropdown(false);
                        }}
                      >
                        <type.icon size={16} color={type.color} />
                        <Text style={styles.dropdownOptionText}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Horário */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Horário</Text>
                <TouchableOpacity
                  style={styles.timeContainer}
                  onPress={showEditTimePickerModal}
                >
                  <Clock size={20} color="#6b7280" />
                  <Text style={styles.timeText}>{editingReminder.time}</Text>
                  <ChevronDown size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Frequência */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Frequência</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowEditFrequencyDropdown(!showEditFrequencyDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {frequencies.find(f => f.key === editingReminder.frequency)?.label || "Selecione a frequência"}
                  </Text>
                  <ChevronDown size={20} color="#6b7280" />
                </TouchableOpacity>
                
                {showEditFrequencyDropdown && (
                  <View style={styles.dropdownOptions}>
                    {frequencies.map((freq) => (
                      <TouchableOpacity
                        key={freq.key}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setEditingReminder(prev => ({ ...prev, frequency: freq.key as any }));
                          setShowEditFrequencyDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{freq.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Título */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Título</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingReminder.title}
                  onChangeText={(text) => setEditingReminder(prev => ({ ...prev, title: text }))}
                  placeholder="Ex: Insulina NPH, Café da manhã..."
                />
              </View>

              {/* Descrição */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Descrição (opcional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={editingReminder.description}
                  onChangeText={(text) => setEditingReminder(prev => ({ ...prev, description: text }))}
                  placeholder="Observações adicionais..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Botões Modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={editReminder}
              >
                <Text style={styles.modalConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Pickers */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          locale="pt-BR"
        />
      )}

      {showEditTimePicker && (
        <DateTimePicker
          value={editSelectedTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEditTimeChange}
          locale="pt-BR"
        />
      )}

      {/* Bottom Navigation */}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginLeft: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  remindersContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  reminderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  reminderRight: {
    alignItems: "flex-end",
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
    marginBottom: 8,
  },
  reminderSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  historyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyHistory: {
    padding: 20,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#6b7280",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  // NOVOS ESTILOS PARA O HISTÓRICO
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyPreviewDetails: {
    marginTop: 8,
  },
  historyPreviewAction: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  historyPreviewDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalField: {
    marginBottom: 20,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1f2937",
  },
  dropdownOptions: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#1f2937",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 12,
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
    color: "#1f2937",
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  
  // NOVOS ESTILOS PARA MODAL DE OPÇÕES
  optionsModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: "50%",
  },
  reminderPreview: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reminderPreviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  reminderPreviewTime: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  deleteOption: {
    backgroundColor: "#fef2f2",
  },
  deleteText: {
    color: "#ef4444",
  },
});