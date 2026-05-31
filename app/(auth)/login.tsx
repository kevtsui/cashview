// app/(auth)/login.tsx
// Magic-link login screen. User enters email → receives link → taps → signed in.

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendLink() {
    if (!email.trim()) return;
    setLoading(true);

    // The redirect URL must be listed in:
    // Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
    const redirectTo =
      Platform.OS === "web"
        ? window.location.origin           // e.g. http://localhost:8081
        : Linking.createURL("/");          // e.g. cashview://

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.inner}>
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.linkButton}>
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.inner}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>CashView</Text>
        <Text style={styles.subtitle}>
          Your household cash, at a glance.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSendLink}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendLink}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send magic link</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          No password needed. We'll email you a one-tap sign-in link.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  logo: {
    fontSize: 56,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  emailText: {
    color: "#38bdf8",
    fontWeight: "600",
  },
  form: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#f8fafc",
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },
  linkButton: {
    marginTop: 24,
  },
  linkText: {
    color: "#38bdf8",
    fontSize: 15,
  },
});
