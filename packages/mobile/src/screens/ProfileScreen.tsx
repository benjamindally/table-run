import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { User, LogOut, ChevronRight, LogIn, Shield } from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import type { MainTabScreenProps } from "../navigation/types";

export default function ProfileScreen() {
  const navigation =
    useNavigation<MainTabScreenProps<"Account">["navigation"]>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const handleLogin = () => {
    navigation.navigate("Auth");
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (!isAuthenticated) {
    // Not authenticated - show login prompt
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 pt-8">
          {/* Login Prompt Card */}
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <View className="bg-primary-100 rounded-full p-4 mb-4">
              <User color="#26A69A" size={48} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Account
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Sign in to access your profile, manage teams, and view exclusive
              content
            </Text>
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-primary rounded-md px-6 py-3 flex-row items-center gap-2"
            >
              <LogIn color="#fff" size={20} />
              <Text className="text-white font-semibold text-base ml-2">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Public Info */}
          <View className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-sm font-medium text-gray-500 mb-3">
              BROWSE WITHOUT SIGNING IN
            </Text>
            <Text className="text-gray-600 text-sm">
              You can view leagues, standings, and match results without an
              account. Sign in to manage teams, submit scores, and access admin
              features.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Authenticated - show profile and admin options
  return (
    <View className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white p-6 items-center border-b border-gray-100">
        <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-3">
          <User color="#26A69A" size={40} />
        </View>
        <Text className="text-xl font-bold text-gray-900">
          {user?.first_name} {user?.last_name}
        </Text>
        <Text className="text-gray-500 mt-1">{user?.email}</Text>
      </View>

      {/* Menu Items */}
      <View className="mt-4">
        <View className="bg-white">
          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <Text className="flex-1 text-gray-900">Match History</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <Text className="flex-1 text-gray-900">Settings</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-4 py-4">
            <Shield color="#26A69A" size={20} />
            <Text className="flex-1 text-gray-900 ml-3">Admin Dashboard</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View className="mt-4 px-4">
        <TouchableOpacity
          className="bg-white rounded-lg py-4 border border-gray-200 flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="text-red-500 font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <View className="mt-auto pb-6 items-center">
        <Text className="text-gray-400 text-sm">League Genius v1.0.0</Text>
      </View>
    </View>
  );
}
