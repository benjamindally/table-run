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
import { Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "@league-genius/shared";
import type { AuthScreenProps } from "../../navigation/types";

export default function ResetPasswordScreen({
  route,
  navigation,
}: AuthScreenProps<"ResetPassword">) {
  const { uid, token } = route.params;

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await authApi.validatePasswordReset({ uid, token });
        setEmail(response.email);
        setIsValid(true);
      } catch (err: any) {
        setValidationError(err?.message || "Invalid or expired reset link");
      } finally {
        setIsValidating(false);
      }
    };
    validate();
  }, [uid, token]);

  const handleSubmit = async () => {
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
      await authApi.confirmPasswordReset({ uid, token, password });
      Alert.alert(
        "Password Set",
        "Your password has been updated. Please sign in.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to set password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#26A69A" />
          <Text style={styles.loadingText}>Validating reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (validationError || !isValid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Invalid Link</Text>
          <Text style={styles.errorMessage}>
            {validationError || "This password reset link is invalid or has expired."}
          </Text>
          <Text style={styles.errorHint}>
            Reset links expire after 24 hours. Contact your league operator for
            a new invite.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
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
            <Text style={styles.title}>Set Your Password</Text>
            <Text style={styles.subtitle}>
              Welcome! Set a password for{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#90A4AE" />
                ) : (
                  <Eye size={20} color="#90A4AE" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Must be at least 8 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#90A4AE" />
                ) : (
                  <Eye size={20} color="#90A4AE" />
                )}
              </TouchableOpacity>
            </View>
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
              <Text style={styles.buttonText}>Set Password & Continue</Text>
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
    marginBottom: 12,
    lineHeight: 22,
  },
  errorHint: {
    color: "#90A4AE",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
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
  emailText: {
    color: "#37474F",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#37474F",
    marginBottom: 4,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: "#B0BEC5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
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
