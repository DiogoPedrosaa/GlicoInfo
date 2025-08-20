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
  Alert,
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

  async function handleLogin() {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // onAuthStateChanged no AppNavigator troca para o AppStack
    } catch (e: any) {
      Alert.alert("Falha no login", e?.message ?? "Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Heart size={32} color="#fff" />
          </View>
          <Text style={styles.title}>GlicoInfo</Text>
          <Text style={styles.subtitle}>
            Seu cuidado com diabetes na palma da mão
          </Text>
        </View>

        <View style={styles.formContainer}>
          

          {/* Campo Email */}
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
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Campo Senha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!show}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity onPress={() => setShow((s) => !s)}>
                {show ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerTxt}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.footerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 48,
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
    backgroundColor: "transparent",
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
    height: 52,
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
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3b82f6",
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
    marginBottom: 24,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
});
