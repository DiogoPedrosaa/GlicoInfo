import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { User, Mail, Lock, Eye, EyeOff, Heart } from "lucide-react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../api/firebase/config";
import { hashCPF, maskCPF, maskCPFForSave, validateCPF, validateEmail, validatePassword } from "../../utils/validators";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AppNavigator";
import MedicationSelector from "../../components/MedicationSelector";
import ComplicationSelector from "../../components/complicationSelector";

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterData {
  name: string;
  email: string;
  cpf: string;
  gender: string;
  diabetesType: string;
  diabetesDuration: string;
  medications: string[];
  isFollowedUp: boolean | null;
  hasChronicComplications: boolean | null;
  chronicComplications: string[]; // Mudança aqui: array em vez de string
  chronicComplicationsDescription: string; // Mantém para descrição adicional
  isHypertensive: boolean | null;
  weight: string;
  height: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    cpf: "",
    gender: "",
    diabetesType: "",
    diabetesDuration: "",
    medications: [],
    isFollowedUp: null,
    hasChronicComplications: null,
    chronicComplications: [], // Inicializar como array vazio
    chronicComplicationsDescription: "",
    isHypertensive: null,
    weight: "",
    height: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const diabetesTypes = [
    { label: "Selecione o tipo", value: "" },
    { label: "Tipo 1", value: "type1" },
    { label: "Tipo 2", value: "type2" },
    { label: "Gestacional", value: "gestational" },
    { label: "LADA", value: "lada" },
  ];

  const genderOptions = [
    { label: "Selecione", value: "" },
    { label: "Masculino", value: "masculino" },
    { label: "Feminino", value: "feminino" },
    { label: "Outro", value: "outro" },
  ];

  const booleanOptions = [
    { label: "Selecione", value: null },
    { label: "Sim", value: true },
    { label: "Não", value: false },
  ];

  const updateField = (field: keyof RegisterData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCPFChange = (text: string) => {
    const numericOnly = text.replace(/\D/g, "");
    const masked = maskCPF(numericOnly);
    updateField("cpf", masked);
  };

  const validateForm = (): boolean => {
    // Validar nome completo
    if (!formData.name || formData.name.length < 20) {
      Alert.alert("Erro", "Nome completo deve ter pelo menos 20 caracteres");
      return false;
    }

    // Validar email
    if (!validateEmail(formData.email)) {
      Alert.alert("Erro", "Email inválido");
      return false;
    }

    // Validar CPF
    if (!validateCPF(formData.cpf.replace(/\D/g, ""))) {
      Alert.alert("Erro", "CPF inválido");
      return false;
    }

    // Validar senha
    if (!validatePassword(formData.password)) {
      Alert.alert("Erro", "Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número");
      return false;
    }

    // Confirmar senha
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Erro", "Senhas não coincidem");
      return false;
    }

    // Validar campos obrigatórios
    const requiredFields = [
      { field: formData.gender, name: "Gênero" },
      { field: formData.diabetesType, name: "Tipo de diabetes" },
      { field: formData.diabetesDuration, name: "Duração da diabetes" },
      { field: formData.isFollowedUp, name: "É acompanhado por médico" },
      { field: formData.hasChronicComplications, name: "Possui complicações crônicas" },
      { field: formData.isHypertensive, name: "É hipertenso" },
    ];

    for (const { field, name } of requiredFields) {
      if (field === null || field === "") {
        Alert.alert("Erro", `${name} é obrigatório`);
        return false;
      }
    }

    // Validar peso e altura
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (!weight || weight < 20 || weight > 350) {
      Alert.alert("Erro", "Peso deve estar entre 20 e 350 kg");
      return false;
    }

    if (!height || height < 80 || height > 250) {
      Alert.alert("Erro", "Altura deve estar entre 80 e 250 cm");
      return false;
    }

    // Validar descrição de complicações se necessário
    if (formData.hasChronicComplications && 
        formData.chronicComplications.length === 0 && 
        formData.chronicComplicationsDescription.length < 10) {
      Alert.alert("Erro", "Selecione pelo menos uma complicação ou descreva com pelo menos 10 caracteres");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Limpar CPF para processamento
      const cleanCPF = formData.cpf.replace(/\D/g, "");

      // Preparar dados para o Firestore
      const userData = {
        name: formData.name,
        email: formData.email,
        cpfHash: hashCPF(cleanCPF),
        cpfMasked: maskCPFForSave(cleanCPF), // Usar a nova função de mascaramento
        gender: formData.gender,
        diabetesType: formData.diabetesType,
        diabetesDuration: formData.diabetesDuration,
        medications: formData.medications,
        isFollowedUp: formData.isFollowedUp,
        hasChronicComplications: formData.hasChronicComplications,
        chronicComplications: formData.hasChronicComplications ? formData.chronicComplications : [],
        chronicComplicationsDescription: formData.hasChronicComplications 
          ? formData.chronicComplicationsDescription 
          : "",
        isHypertensive: formData.isHypertensive,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        role: "user",
        status: "active",
        createdAt: new Date(),
      };

      // Salvar no Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar",
      "Todas as alterações serão perdidas. Deseja realmente cancelar?",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim", 
          onPress: () => {
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Heart size={32} color="#fff" />
          </View>
          <Text style={styles.title}>DiaCheck Pro</Text>
          <Text style={styles.subtitle}>
            Crie sua conta e comece a cuidar da sua saúde
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.cardTitle}>Criar Conta</Text>
          <Text style={styles.cardSub}>
            Preencha seus dados para começar
          </Text>

          {/* Nome Completo */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome completo</Text>
            <View style={styles.inputWrap}>
              <User size={18} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#94a3b8"
                value={formData.name}
                onChangeText={(text) => updateField("name", text)}
                maxLength={120}
              />
            </View>
          </View>

          {/* E-mail */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => updateField("email", text)}
                maxLength={120}
              />
            </View>
          </View>

          {/* CPF */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>CPF</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formData.cpf}
                onChangeText={handleCPFChange}
                maxLength={14}
              />
            </View>
          </View>

          {/* Gênero */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gênero</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => updateField("gender", value)}
                style={styles.picker}
              >
                {genderOptions.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Tipo de diabetes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tipo de diabetes</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.diabetesType}
                onValueChange={(value) => updateField("diabetesType", value)}
                style={styles.picker}
              >
                {diabetesTypes.map((option) => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Duração da diabetes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Há quanto tempo tem diabetes? (anos)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5"
                placeholderTextColor="#94a3b8"
                value={formData.diabetesDuration}
                onChangeText={(text) => updateField("diabetesDuration", text)}
              />
            </View>
          </View>

          {/* Medicamentos */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Medicamentos frequentemente utilizados</Text>
            <MedicationSelector
              selectedMedications={formData.medications}
              onMedicationsChange={(medications) => updateField("medications", medications)}
              placeholder="Selecione os medicamentos utilizados"
            />
          </View>

          {/* É acompanhado por médico? */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>É acompanhado por médico?</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.isFollowedUp}
                onValueChange={(value) => updateField("isFollowedUp", value)}
                style={styles.picker}
              >
                {booleanOptions.map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Possui complicações crônicas? */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Possui complicações crônicas?</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.hasChronicComplications}
                onValueChange={(value) => updateField("hasChronicComplications", value)}
                style={styles.picker}
              >
                {booleanOptions.map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Seleção de complicações (condicional) */}
          {formData.hasChronicComplications && (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Selecione as complicações</Text>
                <ComplicationSelector
                  selectedComplications={formData.chronicComplications}
                  onComplicationsChange={(complications) => updateField("chronicComplications", complications)}
                  placeholder="Selecione suas complicações crônicas"
                />
              </View>

              {/* Descrição adicional das complicações */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Descrição adicional 
                  <Text style={styles.optional}> (opcional)</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Informações adicionais sobre suas complicações..."
                    placeholderTextColor="#94a3b8"
                    value={formData.chronicComplicationsDescription}
                    onChangeText={(text) => updateField("chronicComplicationsDescription", text)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </>
          )}

          {/* É hipertenso? */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>É hipertenso?</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.isHypertensive}
                onValueChange={(value) => updateField("isHypertensive", value)}
                style={styles.picker}
              >
                {booleanOptions.map((option, index) => (
                  <Picker.Item
                    key={index}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Peso e Altura */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Peso (kg)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={formData.weight}
                  onChangeText={(text) => updateField("weight", text)}
                />
              </View>
            </View>
            <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.fieldLabel}>Altura (cm)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="170"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={formData.height}
                  onChangeText={(text) => updateField("height", text)}
                />
              </View>
            </View>
          </View>

          {/* Senha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Criar senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => updateField("password", text)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar Senha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Confirmar senha</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField("confirmPassword", text)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Botões */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerTxt}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={handleGoToLogin}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leftIcon: {
    marginRight: 12,
    color: "#6b7280",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  picker: {
    height: 52,
    color: "#1f2937",
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cancelBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 24,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerTxt: {
    fontSize: 16,
    color: "#6b7280",
  },
  footerLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  optional: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});