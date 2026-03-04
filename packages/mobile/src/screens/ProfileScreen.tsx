import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { User, LogOut, ChevronRight, LogIn, Info, Pencil, X } from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import type { RootStackScreenProps } from "../navigation/types";

export default function ProfileScreen() {
  const navigation =
    useNavigation<RootStackScreenProps<"Profile">["navigation"]>();
  const user = useAuthStore((state) => state.user);
  const player = useAuthStore((state) => state.player);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state — initialised when modal opens
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const openEditModal = () => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setPhone(player?.phone ?? "");
    setSkillLevel(player?.skill_level != null ? String(player.skill_level) : "");
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        skill_level: skillLevel ? parseInt(skillLevel) : null,
      });
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 pt-8">
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
        {player?.skill_level != null && (
          <Text className="text-xs text-gray-400 mt-1">
            Skill Level {player.skill_level}
          </Text>
        )}
        {!!player?.phone && (
          <Text className="text-xs text-gray-400 mt-0.5">{player.phone}</Text>
        )}

        <TouchableOpacity
          onPress={openEditModal}
          className="mt-4 flex-row items-center gap-2 bg-gray-100 px-4 py-2 rounded-full"
        >
          <Pencil size={14} color="#4B5563" />
          <Text className="text-sm font-medium text-gray-700">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View className="mt-4">
        <View className="bg-white">
          <TouchableOpacity
            className="flex-row items-center px-4 py-4"
            onPress={() => navigation.navigate("About")}
          >
            <Info color="#26A69A" size={20} />
            <Text className="flex-1 text-gray-900 ml-3">About League Genius</Text>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              className="p-1"
            >
              <X color="#6b7280" size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Phone
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Skill Level
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  value={skillLevel}
                  onChangeText={setSkillLevel}
                  keyboardType="number-pad"
                  placeholder="e.g. 5"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-lg bg-primary items-center"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="font-semibold text-white">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
