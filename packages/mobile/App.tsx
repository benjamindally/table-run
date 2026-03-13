import "./global.css"; // Temporarily disabled for testing
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

import { NavigationContainer } from "@react-navigation/native";
import type { LinkingOptions } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { configureApi, setStorageAdapter } from "@league-genius/shared";
import { RootNavigator } from "./src/navigation";
import { useAuthStore } from "./src/stores/authStore";
import { mobileStorageAdapter } from "./src/adapters/storage";
import { API_BASE_URL } from "./src/config";
import type { RootStackParamList } from "./src/navigation/types";
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

// Keep the native splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

// Configure shared package for mobile
configureApi({ baseUrl: API_BASE_URL });
setStorageAdapter(mobileStorageAdapter);

// Deep link / Universal Link configuration
// Custom scheme (dev/fallback): leaguegenius://
// Universal links (production):  https://leaguegenius.app
// Supported paths:
//   /reset-password/{uid}/{token}        → ResetPassword (in Auth stack)
//   /activate?token=xxx                 → ActivatePlayer (root)
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["leaguegenius://", "https://leaguegenius.app"],
  config: {
    screens: {
      ActivatePlayer: {
        path: "activate",
        parse: { token: String },
      },
      // ResetPassword lives inside the Auth modal stack
      Auth: {
        screens: {
          ResetPassword: {
            path: "reset-password/:uid/:token",
          },
        },
      },
    },
  },
};

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

  useEffect(() => {
    if (isReady && !isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, isLoading, fontsLoaded]);

  if (!isReady || isLoading || !fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer linking={linking}>
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

