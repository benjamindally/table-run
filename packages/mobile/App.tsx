import "./global.css"; // Temporarily disabled for testing
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureApi, setStorageAdapter } from "@league-genius/shared";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/stores/authStore";
import { mobileStorageAdapter } from "./src/adapters/storage";
import { API_BASE_URL } from "./src/config";
import {
  useFonts,
  Antonio_100Thin,
  Antonio_200ExtraLight,
  Antonio_300Light,
  Antonio_400Regular,
  Antonio_500Medium,
  Antonio_600SemiBold,
  Antonio_700Bold,
} from "@expo-google-fonts/antonio";

// Configure shared package for mobile
configureApi({ baseUrl: API_BASE_URL });
setStorageAdapter(mobileStorageAdapter);

function AppContent() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Antonio_100Thin,
    Antonio_200ExtraLight,
    Antonio_300Light,
    Antonio_400Regular,
    Antonio_500Medium,
    Antonio_600SemiBold,
    Antonio_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      await loadStoredAuth();
      setIsReady(true);
    };
    init();
  }, [loadStoredAuth]);

  if (!isReady || isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#37474F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
