import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { authApi } from "@league-genius/shared";
import type { AuthScreenProps } from "../../navigation/types";

export default function ForgotPasswordScreen() {
  const navigation =
    useNavigation<AuthScreenProps<"ForgotPassword">["navigation"]>();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      // Show success regardless — avoids email enumeration
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✉️</Text>
          </View>
          <Text style={styles.title}>Check Your Inbox</Text>
          <Text style={styles.description}>
            If an account exists for {email}, you'll receive a password reset
            link shortly.
          </Text>
          <Text style={styles.hint}>
            Reset links expire after 24 hours. Contact your league operator if
            you need further help.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isSubmitting ? styles.buttonDisabled : styles.buttonActive,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.backButtonText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBF5",
  },
  flex1: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  successIcon: {
    alignItems: "center",
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#37474F",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#90A4AE",
    textAlign: "center",
    marginTop: 4,
  },
  description: {
    color: "#37474F",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },
  hint: {
    color: "#90A4AE",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#37474F",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#B0BEC5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
  },
  buttonActive: {
    backgroundColor: "#26A69A",
  },
  buttonDisabled: {
    backgroundColor: "#80CBC4",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#26A69A",
    fontSize: 14,
    fontWeight: "500",
  },
});
