import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Plus, X, Users, ChevronRight } from "lucide-react-native";
import {
  seasonsApi,
  teamsApi,
  type Team,
  type SeasonParticipation,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { SeasonsStackScreenProps } from "../navigation/types";

export default function TeamManagementScreen({
  route,
  navigation,
}: SeasonsStackScreenProps<"TeamManagement">) {
  const { seasonId, seasonName } = route.params;
  const { accessToken } = useAuthStore();

  const [teams, setTeams] = useState<
    (SeasonParticipation & { team_detail?: Team })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const participations = await seasonsApi.getTeams(
        seasonId,
        accessToken ?? undefined
      );
      setTeams(participations);
    } catch (err) {
      console.error("[TeamManagement] loadData error:", err);
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seasonId, accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openCreate = () => {
    setTeamName("");
    setEstablishment("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      Alert.alert("Validation", "Team name is required");
      return;
    }

    setSaving(true);
    try {
      const newTeam = await teamsApi.create(
        {
          name: teamName.trim(),
          establishment: establishment.trim() || undefined,
        },
        accessToken ?? undefined
      );

      try {
        await seasonsApi.addTeam(
          seasonId,
          { team_id: newTeam.id },
          accessToken ?? undefined
        );
      } catch (seasonErr: any) {
        Alert.alert(
          "Partial Success",
          `Team "${teamName}" was created but couldn't be added to the season: ${
            seasonErr?.message || "Unknown error"
          }`
        );
        setModalVisible(false);
        loadData();
        return;
      }

      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {teams.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Users color="#9ca3af" size={32} />
            <Text className="text-gray-500 text-center mt-2">
              No teams yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Add teams to this season to get started
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {teams.map((participation) => {
              const team = participation.team_detail;
              if (!team) return null;
              return (
                <TouchableOpacity
                  key={team.id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                  onPress={() =>
                    (navigation as any).navigate("TeamDetails", {
                      teamId: team.id,
                    })
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {team.name}
                      </Text>
                      {team.establishment && (
                        <Text className="text-sm text-gray-500 mt-0.5">
                          {team.establishment}
                        </Text>
                      )}
                      <Text className="text-xs text-gray-400 mt-1">
                        {team.player_count ?? 0} player
                        {team.player_count !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`px-2 py-1 rounded-full ${
                          team.active ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            team.active ? "text-green-700" : "text-gray-600"
                          }`}
                        >
                          {team.active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                      <ChevronRight color="#9ca3af" size={20} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={openCreate}
        className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{ elevation: 4 }}
      >
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create Team Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Add Team</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="p-1"
            >
              <X color="#6b7280" size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Team Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="e.g. The Breakers"
                  value={teamName}
                  onChangeText={setTeamName}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Home Venue / Establishment
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="e.g. The Break Room, Austin TX"
                  value={establishment}
                  onChangeText={setEstablishment}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <Text className="text-sm text-gray-600">
                  This team will be added to{" "}
                  <Text className="font-semibold text-gray-900">
                    {seasonName}
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={saving}
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
                <Text className="font-semibold text-white">Add Team</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
