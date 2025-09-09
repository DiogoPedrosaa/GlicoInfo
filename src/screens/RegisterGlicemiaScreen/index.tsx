import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Home, FileText, Bell, User } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { auth, db } from "../../api/firebase/config";

interface Complicacao {
  id: string;
  name: string;
  keywords: string[];
  instructions: string;
}

export default function RegisterGlicemiaScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  
  const [formData, setFormData] = useState({
    valor: "",
    data: "",
    hora: "",
    descricao: "",
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Formatador para data (DD/MM/AAAA)
  const formatDate = (text: string) => {
    // Remove tudo que não é número
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

  // Formatador para hora (HH:MM) - Melhorado
  const formatTime = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Se tem menos de 3 dígitos, retorna apenas os números
    if (numbers.length <= 2) {
      return numbers;
    } 
    // Se tem 3 dígitos, adiciona : após o primeiro dígito se for válido
    else if (numbers.length === 3) {
      const firstDigit = numbers.substring(0, 1);
      const remaining = numbers.substring(1, 3);
      
      // Se o primeiro dígito for 0, 1 ou 2, pode ser uma hora válida
      if (firstDigit === '0' || firstDigit === '1' || firstDigit === '2') {
        return `${firstDigit}${remaining.substring(0, 1)}:${remaining.substring(1, 2)}`;
      } else {
        // Se não, trata como MM:SS onde o primeiro é minuto
        return `${numbers.substring(0, 2)}:${numbers.substring(2, 3)}`;
      }
    }
    // Se tem 4 dígitos, formata como HH:MM
    else if (numbers.length === 4) {
      const hours = numbers.substring(0, 2);
      const minutes = numbers.substring(2, 4);
      
      // Validar horas (00-23) e minutos (00-59)
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
    
    // Verificar se os valores são válidos
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Verificar se a data existe (considerando anos bissextos, etc.)
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  };

  // Validar hora no formato HH:MM
  const validateTime = (timeString: string) => {
    // Aceita formatos: HH:MM, H:MM, HH:M, H:M
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
    // Se o usuário está apagando (texto menor que o anterior), permite
    if (text.length < formData.hora.length) {
      setFormData({ ...formData, hora: text });
      return;
    }
    
    const formatted = formatTime(text);
    setFormData({ ...formData, hora: formatted });
  };

  const validateForm = () => {
    if (!formData.valor.trim()) {
      Alert.alert("Erro", "Por favor, informe o valor da glicemia");
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

    // Validar se o valor é um número válido
    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Erro", "Por favor, informe um valor válido para a glicemia");
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

  const checkGlicemiaLevel = (valor: number) => {
    if (valor < 70) {
      Alert.alert(
        "⚠️ Glicemia Baixa",
        `Seu nível de glicemia está baixo (${valor} mg/dL). Isso pode indicar hipoglicemia. Considere consumir uma fonte de açúcar de ação rápida e monitore seus sintomas. Se persistir, procure ajuda médica.`,
        [{ text: "Entendi", style: "default" }]
      );
    } else if (valor > 180) {
      Alert.alert(
        "⚠️ Glicemia Alta",
        `Seu nível de glicemia está alto (${valor} mg/dL). Isso pode indicar hiperglicemia. Verifique se tomou sua medicação, mantenha-se hidratado e monitore seus sintomas. Se persistir, procure orientação médica.`,
        [{ text: "Entendi", style: "default" }]
      );
    }
  };

  const checkComplications = async (descricao: string) => {
    if (!descricao.trim()) return;

    try {
      // Buscar todas as complicações do Firebase
      const complicacoesQuery = query(collection(db, "complications"));
      const complicacoesSnapshot = await getDocs(complicacoesQuery);
      
      const complicacoes: Complicacao[] = [];
      complicacoesSnapshot.forEach((doc) => {
        const data = doc.data();
        complicacoes.push({
          id: doc.id,
          name: data.name || "",
          keywords: data.keywords || [],
          instructions: data.instructions || "",
        });
      });

      const descricaoLower = descricao.toLowerCase();
      
      // Verificar se alguma keyword das complicações está presente na descrição
      const complicacaoEncontrada = complicacoes.find(complicacao => {
        return complicacao.keywords.some(keyword => 
          descricaoLower.includes(keyword.toLowerCase())
        );
      });

      if (complicacaoEncontrada) {
        Alert.alert(
          "🩺 Atenção - Possível Complicação",
          `Identificamos sintomas relacionados a "${complicacaoEncontrada.name}" em sua descrição.\n\n${complicacaoEncontrada.instructions}\n\nRecomendamos que discuta estes sintomas com seu médico na próxima consulta para um acompanhamento adequado.`,
          [{ text: "Entendi", style: "default" }]
        );
      }
    } catch (error) {
      console.log("Erro ao verificar complicações:", error);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (!auth.currentUser) {
        Alert.alert("Erro", "Usuário não autenticado");
        return;
      }

      const valor = parseFloat(formData.valor);

      // Criar documento de glicemia
      const glicemiaData = {
        userId: auth.currentUser.uid,
        valor: valor,
        data: formData.data,
        hora: formData.hora,
        descricao: formData.descricao.trim(),
        createdAt: new Date(),
        timestamp: Date.now(),
      };

      // Salvar no Firebase na coleção "glicemia"
      await addDoc(collection(db, "glicemia"), glicemiaData);

      // Verificar nível de glicemia
      checkGlicemiaLevel(valor);

      // Verificar complicações na descrição
      await checkComplications(formData.descricao);

      // Mostrar sucesso e voltar
      Alert.alert(
        "✅ Sucesso",
        "Glicemia registrada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.log("Erro ao registrar glicemia:", error);
      Alert.alert("Erro", "Não foi possível registrar a glicemia. Tente novamente.");
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Glicemia</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Espaço superior para centralizar */}
        <View style={styles.spacer} />
        
        {/* Valor e Unidade */}
        <View style={styles.rowContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Valor</Text>
            <TextInput
              style={styles.input}
              value={formData.valor}
              onChangeText={(text) => setFormData({ ...formData, valor: text })}
              placeholder="129"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Unidade</Text>
            <View style={styles.unitContainer}>
              <Text style={styles.unitText}>mg/dl</Text>
            </View>
          </View>
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
            placeholder="Ex: Sentir tontura, visão embaçada..."
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
              <Text style={styles.registerButtonText}>Registrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Espaço extra para a navegação inferior */}
        <View style={{ height: 120 }} />
      </ScrollView>

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
    paddingHorizontal: 20,
  },
  spacer: {
    height: 60, // Espaço para centralizar o formulário
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    flex: 1,
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
  unitContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  unitText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
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