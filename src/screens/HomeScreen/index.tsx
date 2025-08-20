// src/screens/HomeScreen/index.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../api/firebase/config";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao DiaCheck Pro 👋</Text>
      <TouchableOpacity style={styles.btn} onPress={() => signOut(auth)}>
        <Text style={styles.btnText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 },
  btn: { backgroundColor: "#ef4444", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontFamily: "Inter_600SemiBold" },
});
