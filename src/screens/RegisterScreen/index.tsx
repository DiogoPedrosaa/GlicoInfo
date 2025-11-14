import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { User, Mail, Lock, Eye, EyeOff, Heart, ArrowLeft, ArrowRight } from "lucide-react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../api/firebase/config";
import { hashCPF, maskCPF, maskCPFForSave, validateCPF, validateEmail, validatePassword } from "../../utils/validators";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AppNavigator";
import MedicationSelector from "../../components/medicationSelector";
import ComplicationSelector from "../../components/complicationSelector";
import Dropdown from "../../components/Dropdown";

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
  chronicComplications: string[];
  chronicComplicationsDescription: string;
  isHypertensive: boolean | null;
  weight: string;
  height: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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
    chronicComplications: [],
    chronicComplicationsDescription: "",
    isHypertensive: null,
    weight: "",
    height: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const totalSteps = 5;

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

  const updateField = (field: keyof RegisterData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCPFChange = (text: string) => {
    const numericOnly = text.replace(/\D/g, "");
    const masked = maskCPF(numericOnly);
    updateField("cpf", masked);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Dados pessoais
        if (!formData.name || formData.name.length < 20) {
          Alert.alert("Erro", "Nome completo deve ter pelo menos 20 caracteres");
          return false;
        }
        if (!validateEmail(formData.email)) {
          Alert.alert("Erro", "Email inválido");
          return false;
        }
        if (!validateCPF(formData.cpf.replace(/\D/g, ""))) {
          Alert.alert("Erro", "CPF inválido");
          return false;
        }
        if (!validatePassword(formData.password)) {
          Alert.alert("Erro", "Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          Alert.alert("Erro", "Senhas não coincidem");
          return false;
        }
        break;

      case 2: // Sobre você
        if (!formData.gender) {
          Alert.alert("Erro", "Selecione o gênero");
          return false;
        }
        break;

      case 3: // Sua saúde
        if (!formData.diabetesType) {
          Alert.alert("Erro", "Selecione o tipo de diabetes");
          return false;
        }
        if (!formData.diabetesDuration) {
          Alert.alert("Erro", "Informe há quanto tempo tem diabetes");
          return false;
        }
        break;

      case 4: // Medicamentos
        // Medicamentos são opcionais
        break;

      case 5: // Histórico de saúde e dados físicos
        if (formData.isFollowedUp === null) {
          Alert.alert("Erro", "Informe se é acompanhado por médico");
          return false;
        }
        if (formData.hasChronicComplications === null) {
          Alert.alert("Erro", "Informe se possui complicações crônicas");
          return false;
        }
        if (formData.isHypertensive === null) {
          Alert.alert("Erro", "Informe se é hipertenso");
          return false;
        }
        
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

        if (formData.hasChronicComplications && 
            formData.chronicComplications.length === 0 && 
            formData.chronicComplicationsDescription.length < 10) {
          Alert.alert("Erro", "Selecione pelo menos uma complicação ou descreva com pelo menos 10 caracteres");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const cleanCPF = formData.cpf.replace(/\D/g, "");

      const userData = {
        name: formData.name,
        email: formData.email,
        cpfHash: hashCPF(cleanCPF),
        cpfMasked: maskCPFForSave(cleanCPF),
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

      await setDoc(doc(db, "users", user.uid), userData);

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.stepText}>Etapa {currentStep} de {totalSteps}</Text>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <User size={32} color="#2563eb" />
            </View>
            <Text style={styles.stepTitle}>Cadastre-se</Text>
            <Text style={styles.stepSubtitle}>Vamos começar conhecendo você melhor para personalizar sua experiência</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(text) => updateField("name", text)}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => updateField("email", text)}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
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

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Confirmar Senha</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua senha"
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

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CPF</Text>
              <View style={styles.inputContainer}>
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
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <User size={32} color="#2563eb" />
            </View>
            <Text style={styles.stepTitle}>Sobre você</Text>
            <Text style={styles.stepSubtitle}>Vamos começar conhecendo você melhor para personalizar sua experiência</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Gênero</Text>
              <Dropdown
                options={genderOptions}
                selectedValue={formData.gender}
                onValueChange={(value) => updateField("gender", value)}
                placeholder="Selecione seu gênero"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Heart size={32} color="#2563eb" />
            </View>
            <Text style={styles.stepTitle}>Sua saúde</Text>
            <Text style={styles.stepSubtitle}>Conte-nos sobre seu histórico de diabetes</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Tipo de diabetes</Text>
              <Dropdown
                options={diabetesTypes}
                selectedValue={formData.diabetesType}
                onValueChange={(value) => updateField("diabetesType", value)}
                placeholder="Selecione o tipo de diabetes"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Há quanto tempo tem diabetes?</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={formData.diabetesDuration}
                  onChangeText={(text) => updateField("diabetesDuration", text)}
                />
                <Text style={styles.inputSuffix}>Anos</Text>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Heart size={32} color="#2563eb" />
            </View>
            <Text style={styles.stepTitle}>Seus medicamentos</Text>
            <Text style={styles.stepSubtitle}>Selecione os medicamentos que você usa frequentemente</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Tipo de medicamentos</Text>
              <MedicationSelector
                selectedMedications={formData.medications}
                onMedicationsChange={(medications) => updateField("medications", medications)}
                placeholder="Selecione os medicamentos utilizados"
              />
            </View>
          </View>
        );

      case 5:
        return (
          <ScrollView 
            style={styles.scrollableStep}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollableStepContent}
          >
            <View style={styles.stepHeaderContainer}>
              <View style={styles.iconContainer}>
                <User size={32} color="#2563eb" />
              </View>
              <Text style={styles.stepTitle}>Dados físicos</Text>
              <Text style={styles.stepSubtitle}>Informações para calcular seu IMC</Text>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Peso (kg)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 70"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.weight}
                    onChangeText={(text) => updateField("weight", text)}
                  />
                </View>
              </View>
              <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Altura (cm)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 175"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.height}
                    onChangeText={(text) => updateField("height", text)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Histórico de Saúde</Text>
              <Text style={styles.sectionSubtitle}>Selecione suas condições de saúde</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>É Acompanhado?</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.isFollowedUp === true && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("isFollowedUp", true)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.isFollowedUp === true && styles.optionButtonTextSelected
                  ]}>Sim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.isFollowedUp === false && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("isFollowedUp", false)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.isFollowedUp === false && styles.optionButtonTextSelected
                  ]}>Não</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Possui Complicações Crônicas?</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.hasChronicComplications === true && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("hasChronicComplications", true)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.hasChronicComplications === true && styles.optionButtonTextSelected
                  ]}>Sim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.hasChronicComplications === false && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("hasChronicComplications", false)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.hasChronicComplications === false && styles.optionButtonTextSelected
                  ]}>Não</Text>
                </TouchableOpacity>
              </View>
            </View>

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

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Descrição das complicações</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Ex: Retinopatia, neuropatia, rinç..."
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

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>É Hipertenso?</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.isHypertensive === true && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("isHypertensive", true)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.isHypertensive === true && styles.optionButtonTextSelected
                  ]}>Sim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.isHypertensive === false && styles.optionButtonSelected
                  ]}
                  onPress={() => updateField("isHypertensive", false)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    formData.isHypertensive === false && styles.optionButtonTextSelected
                  ]}>Não</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Espaço extra no final para garantir que o último campo não fique colado no botão */}
            <View style={{ height: 40 }} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          enableOnAndroid={true}
          extraScrollHeight={30}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            {/* ...existing logo code... */}
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            {/* Progress Bar */}
            {renderProgressBar()}

            {/* Conteúdo da etapa */}
            <View style={styles.content}>
              <View style={styles.scrollContainer}>
                {renderStepContent()}
              </View>

              {/* Botões de navegação */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.nextButton, loading && { opacity: 0.7 }]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps 
                      ? (loading ? "Cadastrando..." : "Cadastrar")
                      : "Próximo"
                    }
                  </Text>
                  {currentStep < totalSteps && <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>

                {currentStep === 1 && (
                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.loginButtonText}>Já tem uma conta? <Text style={styles.loginLink}>Fazer Login</Text></Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Espaçamento extra */}
          <View style={{ height: 80 }} />
        </KeyboardAwareScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 3,
  },
  stepText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollableStep: {
    flex: 1,
  },
  scrollableStepContent: {
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: "100%",
  },
  stepHeaderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  sectionDivider: {
    alignItems: "center",
    marginVertical: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    padding: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputSuffix: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  optionButtonTextSelected: {
    color: "#fff",
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  nextButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loginButton: {
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    color: "#2563eb",
    fontWeight: "500",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  formContainer: {
    flex: 3,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});