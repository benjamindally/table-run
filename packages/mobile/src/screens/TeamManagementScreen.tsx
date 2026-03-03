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
import { Plus, Pencil, X, Users, Check, ChevronRight } from "lucide-react-native";
import {
  api,
  teamsApi,
  seasonsApi,
  type Team,
  type Season,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { LeaguesStackScreenProps } from "../navigation/types";

export default function TeamManagementScreen({
  route,
  navigation,
}: LeaguesStackScreenProps<"TeamManagement">) {
  const { leagueId, leagueName } = route.params;
  const { accessToken } = useAuthStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [teamsRes, seasonsRes] = await Promise.all([
        teamsApi.getAll(accessToken ?? undefined, { leagueId }),
        api.get<{ results: Season[] }>("/seasons/", accessToken ?? undefined),
      ]);
      const teamList = Array.isArray(teamsRes)
        ? teamsRes
        : (teamsRes as { results: Team[] }).results ?? [];
      setTeams(teamList);

      const leagueSeasons = seasonsRes.results
        .filter((s) => s.league === leagueId)
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      setSeasons(leagueSeasons);

      // Default to most recent active season
      const activeSeason = leagueSeasons.find((s) => s.is_active);
      if (activeSeason) setSelectedSeasonId(activeSeason.id);
      else if (leagueSeasons.length > 0) setSelectedSeasonId(leagueSeasons[0].id);
    } catch (err) {
      console.error("[TeamManagement] loadData error:", err);
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leagueId, accessToken]);

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

      if (selectedSeasonId) {
        try {
          await seasonsApi.addTeam(
            selectedSeasonId,
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
              Add teams to your league to get started
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {teams.map((team) => (
              <TouchableOpacity
                key={team.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
                onPress={() =>
                  (navigation as any).navigate("TeamDetails", { teamId: team.id })
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
            ))}
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

              {/* Season Picker */}
              {seasons.length > 0 && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Add to Season
                  </Text>
                  <View className="space-y-2">
                    <TouchableOpacity
                      onPress={() => setSelectedSeasonId(null)}
                      disabled={saving}
                      className={`p-3 rounded-lg border-2 flex-row items-center justify-between ${
                        selectedSeasonId === null
                          ? "border-primary bg-primary-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${
                          selectedSeasonId === null
                            ? "text-primary"
                            : "text-gray-800"
                        }`}
                      >
                        Don't add to a season
                      </Text>
                      {selectedSeasonId === null && (
                        <Check size={18} color="#26A69A" />
                      )}
                    </TouchableOpacity>
                    {seasons.map((season) => {
                      const isSelected = selectedSeasonId === season.id;
                      return (
                        <TouchableOpacity
                          key={season.id}
                          onPress={() => setSelectedSeasonId(season.id)}
                          disabled={saving}
                          className={`p-3 rounded-lg border-2 flex-row items-center justify-between ${
                            isSelected
                              ? "border-primary bg-primary-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <View>
                            <Text
                              className={`font-semibold text-sm ${
                                isSelected ? "text-primary" : "text-gray-800"
                              }`}
                            >
                              {season.name}
                            </Text>
                            <Text
                              className={`text-xs mt-0.5 ${
                                isSelected
                                  ? "text-primary-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {season.is_active ? "Active" : "Inactive"}
                            </Text>
                          </View>
                          {isSelected && <Check size={18} color="#26A69A" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
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
