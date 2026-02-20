import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LogIn, Users, Trophy, ClipboardList, Settings } from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const { isAuthenticated } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  if (!isAuthenticated) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-6 items-center">
          {/* Header */}
          <View className="items-center mb-8 mt-4">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
              <Settings color="#26A69A" size={40} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              League Dashboard
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Sign in to access league management tools
            </Text>
          </View>

          {/* Feature Cards */}
          <View className="w-full space-y-4">
            <View className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                <Trophy color="#3B82F6" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Create & Manage Leagues
                </Text>
                <Text className="text-sm text-gray-500">
                  Set up new leagues and customize rules
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center">
              <View className="w-12 h-12 bg-green-50 rounded-full items-center justify-center mr-4">
                <Users color="#22C55E" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Assign Team Captains
                </Text>
                <Text className="text-sm text-gray-500">
                  Manage team rosters and captain permissions
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center">
              <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mr-4">
                <ClipboardList color="#F97316" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Score Matches
                </Text>
                <Text className="text-sm text-gray-500">
                  Submit and track match results in real-time
                </Text>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-xl py-4 mt-8 flex-row items-center justify-center"
            onPress={() => navigation.navigate("Auth")}
          >
            <LogIn color="#fff" size={20} />
            <Text className="text-white font-semibold text-base ml-2">
              Sign In to Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Placeholder for authenticated users - to be built out later
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Dashboard
          </Text>
          <Text className="text-gray-500 mt-2">
            League management tools coming soon.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
