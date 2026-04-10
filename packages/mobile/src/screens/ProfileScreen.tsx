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
  Linking,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  User,
  LogOut,
  ChevronRight,
  LogIn,
  Info,
  Pencil,
  X,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Crown,
  ExternalLink,
} from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import type { RootStackScreenProps } from "../navigation/types";

function SubscriptionCard({
  navigation,
}: {
  navigation: RootStackScreenProps<"Profile">["navigation"];
}) {
  const entitlements = useSubscriptionStore((s) => s.entitlements);
  const isPro = entitlements?.tier === "pro";

  const handleManageSubscription = () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    Linking.openURL(url);
  };

  return (
    <View className="mt-4 px-4">
      <View className="bg-white rounded-lg border border-gray-200 p-4">
        <View className="flex-row items-center mb-3">
          <Crown color={isPro ? "#d97706" : "#9ca3af"} size={20} />
          <Text className="text-sm font-semibold text-gray-900 ml-2">
            Subscription
          </Text>
        </View>

        {isPro ? (
          <>
            <View className="bg-amber-50 rounded-lg px-3 py-2 mb-3 flex-row items-center">
              <Text className="text-sm font-medium text-amber-800">
                League Genius Pro
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleManageSubscription}
              className="flex-row items-center justify-center py-2.5 rounded-lg border border-gray-300"
            >
              <ExternalLink color="#4B5563" size={16} />
              <Text className="text-sm font-medium text-gray-700 ml-2">
                Manage Subscription
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-sm text-gray-500 mb-3">
              Free Plan — Upgrade to create leagues and unlock pro features.
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Paywall", { source: "profile" })
              }
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold text-sm">
                Upgrade to Pro
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation =
    useNavigation<RootStackScreenProps<"Profile">["navigation"]>();
  const user = useAuthStore((state) => state.user);
  const player = useAuthStore((state) => state.player);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete account state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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
    setSkillLevel(
      player?.skill_level != null ? String(player.skill_level) : ""
    );
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

  const openDeleteModal = () => {
    setDeletePassword("");
    setDeleteError("");
    setShowDeletePassword(false);
    setDeleteModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password to continue.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAccount(deletePassword);
      setDeleteModalVisible(false);
    } catch (err: any) {
      const message = err?.message || "Something went wrong. Please try again.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
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
    <ScrollView className="flex-1 bg-gray-50">
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
          <Text className="text-sm font-medium text-gray-700">
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Section */}
      <SubscriptionCard navigation={navigation} />

      {/* Menu Items */}
      <View className="mt-4">
        <View className="bg-white">
          <TouchableOpacity
            className="flex-row items-center px-4 py-4"
            onPress={() => navigation.navigate("About")}
          >
            <Info color="#26A69A" size={20} />
            <Text className="flex-1 text-gray-900 ml-3">
              About League Genius
            </Text>
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
      {/* Logout Button */}
      <View className="mt-4 px-4">
        <TouchableOpacity
          className="bg-red-600 rounded-lg py-4 border border-gray-200 flex-row items-center justify-center"
          onPress={openDeleteModal}
        >
          <Trash2 color="#fff" size={18} />
          <Text className="text-white font-medium ml-2">Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !isDeleting && setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">
              Delete Your Account
            </Text>
            <TouchableOpacity
              onPress={() => !isDeleting && setDeleteModalVisible(false)}
              className="p-1"
            >
              <X color="#6b7280" size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Warning */}
            <View className="flex-row bg-red-50 rounded-lg p-3 mb-4">
              <View className="bg-red-100 rounded-full p-2 mr-3 self-start">
                <AlertTriangle color="#dc2626" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-700 mb-2">
                  We're sad to see you go! Before you continue, here's what will
                  happen if you delete your account:
                </Text>
                <Text className="text-sm text-gray-600 mb-1">
                  {"\u2022"} Your personal data, player profile, stats, and team
                  memberships will be permanently removed.
                </Text>
                <Text className="text-sm text-gray-600 mb-1">
                  {"\u2022"} Any teams where you're the only captain will be
                  deactivated.
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {"\u2022"} Past match results will still be visible, but your
                  name will no longer be attached.
                </Text>
                <Text className="text-sm font-semibold text-gray-900">
                  This action is permanent and cannot be undone.
                </Text>
              </View>
            </View>

            {/* Password field */}
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Confirm your password
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg">
              <TextInput
                className="flex-1 px-3 py-2.5 text-gray-900"
                value={deletePassword}
                onChangeText={(text) => {
                  setDeletePassword(text);
                  setDeleteError("");
                }}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showDeletePassword}
                editable={!isDeleting}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowDeletePassword(!showDeletePassword)}
                className="px-3"
              >
                {showDeletePassword ? (
                  <EyeOff color="#6b7280" size={20} />
                ) : (
                  <Eye color="#6b7280" size={20} />
                )}
              </TouchableOpacity>
            </View>
            {deleteError ? (
              <Text className="text-sm text-red-600 mt-1">{deleteError}</Text>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setDeleteModalVisible(false)}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={isDeleting || !deletePassword.trim()}
              className={`flex-1 py-3 rounded-lg items-center ${
                isDeleting || !deletePassword.trim()
                  ? "bg-red-300"
                  : "bg-red-600"
              }`}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="font-semibold text-white">
                  Delete My Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
            <Text className="text-lg font-bold text-gray-900">
              Edit Profile
            </Text>
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
    </ScrollView>
  );
}
