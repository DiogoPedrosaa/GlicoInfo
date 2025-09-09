// src/screens/LoginScreen/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AppNavigator";
import { Mail, Lock, Eye, EyeOff, Heart } from "lucide-react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../api/firebase/config";

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const clearErrors = () => {
    setErrors({
      email: "",
      password: "",
      general: "",
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    // Validação de email
    if (!email.trim()) {
      newErrors.email = "E-mail é obrigatório";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "E-mail inválido";
      isValid = false;
    }

    // Validação de senha
    if (!senha.trim()) {
      newErrors.password = "Senha é obrigatória";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "E-mail inválido";
      case "auth/user-disabled":
        return "Esta conta foi desabilitada";
      case "auth/user-not-found":
        return "Usuário não encontrado. Verifique o e-mail ou cadastre-se";
      case "auth/wrong-password":
        return "Senha incorreta. Tente novamente";
      case "auth/invalid-credential":
        return "E-mail ou senha incorretos";
      case "auth/too-many-requests":
        return "Muitas tentativas de login. Tente novamente mais tarde";
      case "auth/network-request-failed":
        return "Erro de conexão. Verifique sua internet";
      default:
        return "Erro no login. Tente novamente";
    }
  };

  async function handleLogin() {
    clearErrors();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (error: any) {
      console.log("Login error:", error.code, error.message);
      
      const errorMessage = getFirebaseErrorMessage(error.code);
      
      // Define onde mostrar o erro baseado no tipo
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (error.code === "auth/wrong-password") {
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  }

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setSenha(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        {/* Logo e título */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Heart size={24} color="#fff" />
          </View>
          <Text style={styles.title}>GlicoInfo</Text>
          <Text style={styles.subtitle}>Sistema de Gestão Diabético</Text>
        </View>

        {/* Erro geral */}
        {errors.general ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* Formulário */}
        <View style={styles.formContainer}>
          {/* Campo Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={[
              styles.inputContainer,
              errors.email ? styles.inputError : null
            ]}>
              <Mail size={20} color={errors.email ? "#ef4444" : "#94a3b8"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={handleEmailChange}
                editable={!loading}
              />
            </View>
            {errors.email ? (
              <Text style={styles.fieldError}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Campo Senha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={[
              styles.inputContainer,
              errors.password ? styles.inputError : null
            ]}>
              <Lock size={20} color={errors.password ? "#ef4444" : "#94a3b8"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!show}
                value={senha}
                onChangeText={handlePasswordChange}
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={() => setShow(!show)} 
                style={styles.eyeButton}
                disabled={loading}
              >
                {show ? (
                  <EyeOff size={20} color={errors.password ? "#ef4444" : "#94a3b8"} />
                ) : (
                  <Eye size={20} color={errors.password ? "#ef4444" : "#94a3b8"} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Link esqueci senha */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.separator}>
            <Text style={styles.separatorText}>ou</Text>
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  // Novo estilo para container de erro geral
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  // Novo estilo para input com erro
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
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
  eyeButton: {
    padding: 4,
  },
  // Novo estilo para erro de campo
  fieldError: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  separator: {
    alignItems: "center",
    marginBottom: 24,
  },
  separatorText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
});
