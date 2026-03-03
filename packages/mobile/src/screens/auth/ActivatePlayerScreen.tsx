import { useState, useEffect } from "react";
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
import { playerClaimsApi, type ValidateActivationResponse } from "@league-genius/shared";
import type { RootStackScreenProps } from "../../navigation/types";

export default function ActivatePlayerScreen({
  route,
  navigation,
}: RootStackScreenProps<"ActivatePlayer">) {
  const { token } = route.params;

  const [playerInfo, setPlayerInfo] = useState<ValidateActivationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await playerClaimsApi.validateActivationToken(token);
        setPlayerInfo(response);
      } catch (err: any) {
        setValidationError(err?.message || "Invalid or expired activation link");
      } finally {
        setIsValidating(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await playerClaimsApi.completeActivation(token, email.trim(), password);

      Alert.alert(
        "Account Activated",
        "Your account has been activated. Please sign in with your new email and password.",
        [{ text: "OK", onPress: () => navigation.navigate("Auth") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to activate account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#26A69A" />
          <Text style={styles.loadingText}>Validating activation link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (validationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Invalid Activation Link</Text>
          <Text style={styles.errorMessage}>{validationError}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Auth")}
          >
            <Text style={styles.buttonText}>Go to Sign In</Text>
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
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>
              Activate your account by setting a real email and password
            </Text>
          </View>

          {/* Current account info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current username: </Text>
              {playerInfo?.username}
            </Text>
            <Text style={styles.infoRow}>
              <Text style={styles.infoLabel}>Placeholder email: </Text>
              {playerInfo?.current_email}
            </Text>
            <Text style={styles.infoNote}>
              You'll replace the placeholder email with your real email below.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            <Text style={styles.hint}>This will be your new login email</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
            <Text style={styles.hint}>Must be at least 8 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
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
              <Text style={styles.buttonText}>Activate Account</Text>
            )}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#90A4AE",
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#37474F",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    color: "#78909C",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#37474F",
    marginBottom: 8,
  },
  subtitle: {
    color: "#90A4AE",
    textAlign: "center",
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoRow: {
    fontSize: 13,
    color: "#1E40AF",
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: "600",
  },
  infoNote: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
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
  hint: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
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
});
