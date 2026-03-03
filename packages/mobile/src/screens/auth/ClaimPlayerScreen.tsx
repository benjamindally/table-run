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
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, playerClaimsApi, type ValidateInviteResponse } from "@league-genius/shared";
import type { RootStackScreenProps } from "../../navigation/types";

export default function ClaimPlayerScreen({
  route,
  navigation,
}: RootStackScreenProps<"ClaimPlayer">) {
  const { token } = route.params;

  const [playerInfo, setPlayerInfo] = useState<ValidateInviteResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await playerClaimsApi.validateInviteToken(token);
        setPlayerInfo(response);
        setFirstName(response.first_name || "");
        setLastName(response.last_name || "");
        setEmail(response.email || "");
        setPhone(response.phone || "");
      } catch (err: any) {
        setValidationError(err?.message || "Invalid or expired invite link");
      } finally {
        setIsValidating(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      // Register user
      const registerResponse = await authApi.register({
        email: email.trim(),
        password,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // Link player to new user
      await playerClaimsApi.completeClaim(token, registerResponse.user.id);

      Alert.alert(
        "Account Created",
        "Your account has been created and linked to your player profile. Please sign in.",
        [{ text: "OK", onPress: () => navigation.navigate("Auth") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#26A69A" />
          <Text style={styles.loadingText}>Validating invite link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (validationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Invalid Invite</Text>
          <Text style={styles.errorMessage}>{validationError}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Auth")}
          >
            <Text style={styles.buttonText}>Sign Up Instead</Text>
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome, {playerInfo?.first_name}!</Text>
            <Text style={styles.subtitle}>
              Complete your registration to claim your player profile
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
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
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#37474F",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#90A4AE",
    textAlign: "center",
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    gap: 12,
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
