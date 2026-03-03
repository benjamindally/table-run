import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Switch,
} from "react-native";
import { Calendar, MapPin, ChevronRight, Award, X, Pencil, Plus, MapPinned, Users, Shield } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  api,
  leaguesApi,
  type League,
  type Season,
  type ScoringConfig,
  type ScoringPreset,
  type GameFormat,
  type StandingsFormat,
} from "@league-genius/shared";
import type { LeaguesStackParamList, MainTabParamList } from "../navigation/types";
import { useUserContextStore } from "../stores/userContextStore";
import { useAuthStore } from "../stores/authStore";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LeaguesStackParamList, "LeagueDetails">,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  route: { params: { leagueId: number; leagueName: string } };
}

const PRESET_LABELS: Record<ScoringPreset, string> = {
  simple_win_loss: "Simple Win/Loss",
  bca_8ball: "BCA 8-Ball",
  vnea: "VNEA / 10-Point",
  nine_ball: "9-Ball Points",
  race_to_wins: "Race to Wins",
  custom: "Custom",
};

const PRESET_DESCRIPTIONS: Record<ScoringPreset, string> = {
  simple_win_loss: "Track wins and losses only",
  bca_8ball: "Ball points, BCA rules",
  vnea: "10-point system, handicap-friendly",
  nine_ball: "Ball points for 9-ball format",
  race_to_wins: "First to N wins the match",
  custom: "Fine-tune individual scoring values",
};

const PRESET_OPTIONS: ScoringPreset[] = [
  "simple_win_loss",
  "bca_8ball",
  "vnea",
  "nine_ball",
  "race_to_wins",
  "custom",
];

const GAME_FORMATS: { value: GameFormat; label: string; description: string }[] = [
  { value: "win_loss", label: "Win/Loss", description: "Track match wins only" },
  { value: "ball_points_8ball", label: "Ball Points (8-Ball)", description: "8-ball rack scoring" },
  { value: "ball_points_9ball", label: "Ball Points (9-Ball)", description: "9-ball rack scoring" },
  { value: "race_to_wins", label: "Race to Wins", description: "First to reach win count" },
];

const STANDINGS_FORMATS: { value: StandingsFormat; label: string; description: string }[] = [
  { value: "win_loss_pct", label: "Win/Loss %", description: "Rank by win percentage" },
  { value: "match_points", label: "Match Points", description: "Points awarded per result (W/T/L)" },
  { value: "cumulative_points", label: "Cumulative Points", description: "Total ball points earned" },
];

const DEFAULT_DRAFT: Partial<ScoringConfig> = {
  preset: "bca_8ball",
  game_format: "ball_points_8ball",
  ball_value: 1,
  object_ball_value: 2,
  race_to: null,
  standings_format: "win_loss_pct",
  allow_ties: false,
  match_win_points: 3,
  match_tie_points: 1,
  match_loss_points: 0,
};

export default function LeagueDetailsScreen({ route }: Props) {
  const { leagueId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { isOperator } = useUserContextStore();
  const { accessToken } = useAuthStore();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoringModalVisible, setScoringModalVisible] = useState(false);
  const [draftConfig, setDraftConfig] = useState<Partial<ScoringConfig>>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);

  const canEditScoring = isOperator(leagueId);

  const isCustom = draftConfig.preset === "custom";
  const isBallPoints =
    draftConfig.game_format === "ball_points_8ball" ||
    draftConfig.game_format === "ball_points_9ball";
  const isRaceTo = draftConfig.game_format === "race_to_wins";
  const isMatchPoints = draftConfig.standings_format === "match_points";

  const loadData = async () => {
    try {
      const [leagueResponse, seasonsResponse] = await Promise.all([
        api.get<League>(`/leagues/${leagueId}/`),
        api.get<{ results: Season[] }>("/seasons/"),
      ]);
      setLeague(leagueResponse);
      const leagueSeasons = seasonsResponse.results
        .filter((s) => s.league === leagueId)
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      setSeasons(leagueSeasons);

      try {
        const config = await leaguesApi.getScoringConfig(leagueId, accessToken ?? undefined);
        setScoringConfig(config);
        setDraftConfig(config);
      } catch {
        // Scoring config may not exist yet
      }
    } catch (error) {
      console.error("Failed to load league:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openModal = () => {
    // Reset draft to current config (or defaults if none)
    setDraftConfig(scoringConfig ?? DEFAULT_DRAFT);
    setScoringModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let updated: ScoringConfig;
      if (draftConfig.preset === "custom") {
        updated = await leaguesApi.updateScoringConfig(leagueId, draftConfig, accessToken ?? undefined);
      } else {
        updated = await leaguesApi.applyScoringPreset(
          leagueId,
          draftConfig.preset as ScoringPreset,
          accessToken ?? undefined
        );
      }
      setScoringConfig(updated);
      setDraftConfig(updated);
      setScoringModalVisible(false);
    } catch (err) {
      console.error("Failed to save scoring config:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (updates: Partial<ScoringConfig>) => {
    setDraftConfig((prev) => ({ ...prev, ...updates }));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [leagueId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!league) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-500 text-center">League not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* League Info Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              {league.name}
            </Text>
            {canEditScoring && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("CreateLeague", { leagueId })
                }
                className="ml-3 p-2 bg-gray-100 rounded-lg"
              >
                <Pencil size={16} color="#4B5563" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center gap-2 mb-2">
            <MapPin color="#6b7280" size={16} />
            <Text className="text-sm text-gray-600">
              {league.city}, {league.state}
            </Text>
          </View>

          {league.description && (
            <Text className="text-gray-600 mt-2">{league.description}</Text>
          )}

          <View className="mt-4 pt-4 border-t border-gray-200">
            <Text className="text-xs text-gray-500">
              {league.games_per_set} games per set • {league.sets_per_match} sets per match
            </Text>
          </View>
        </View>

        {/* Scoring Format Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Award color="#26A69A" size={18} />
              <Text className="text-base font-semibold text-gray-900">Scoring Format</Text>
            </View>
            {canEditScoring && (
              <TouchableOpacity
                onPress={openModal}
                className="bg-teal-50 rounded-md px-3 py-1"
              >
                <Text className="text-xs font-medium text-teal-700">Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {scoringConfig ? (
            <View>
              <Text className="text-sm font-medium text-gray-800">
                {PRESET_LABELS[scoringConfig.preset]}
              </Text>
              {scoringConfig.max_points_per_game != null ? (
                <Text className="text-xs text-gray-500 mt-1">
                  Up to {scoringConfig.max_points_per_game} pts/rack  ·  {scoringConfig.players_per_team} players/team
                </Text>
              ) : scoringConfig.game_format === "race_to_wins" ? (
                <Text className="text-xs text-gray-500 mt-1">
                  Race to {scoringConfig.race_to}  ·  {scoringConfig.players_per_team} players/team
                </Text>
              ) : (
                <Text className="text-xs text-gray-500 mt-1">
                  {scoringConfig.players_per_team} players/team
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">No scoring config set</Text>
          )}
        </View>

        {/* Seasons Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Seasons</Text>
            {canEditScoring && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("CreateSeason", { leagueId })
                }
                className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full"
              >
                <Plus size={14} color="#fff" />
                <Text className="text-xs font-semibold text-white">Add Season</Text>
              </TouchableOpacity>
            )}
          </View>

          {seasons.length === 0 ? (
            <View className="bg-white rounded-lg p-6 border border-gray-200 items-center">
              <Calendar color="#9ca3af" size={32} />
              <Text className="text-gray-500 text-center mt-2 font-medium">
                No seasons yet
              </Text>
              {canEditScoring && (
                <>
                  <Text className="text-gray-400 text-center text-sm mt-1">
                    Create your first season to get started
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("CreateSeason", { leagueId })}
                    className="mt-4 bg-primary rounded-lg px-6 py-2.5 flex-row items-center gap-2"
                  >
                    <Plus size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-1">Create First Season</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View className="space-y-2">
              {seasons.slice(0, 5).map((season) => (
                <TouchableOpacity
                  key={season.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => {
                    navigation.navigate("Seasons", {
                      screen: "SeasonDetails",
                      params: { seasonId: season.id },
                    } as any);
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {season.name}
                    </Text>
                    <Text className={`text-xs ${season.is_active ? "text-green-600" : "text-gray-500"}`}>
                      {season.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  <ChevronRight color="#9ca3af" size={20} />
                </TouchableOpacity>
              ))}

              {seasons.length > 5 && (
                <TouchableOpacity
                  className="p-3"
                  onPress={() => {
                    navigation.navigate("Seasons", {
                      screen: "SeasonsScreen",
                      params: { leagueId },
                    } as any);
                  }}
                >
                  <Text className="text-primary text-center font-medium">
                    View all {seasons.length} seasons
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Operator Actions */}
        {canEditScoring && (
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">Operator</Text>
            <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-gray-100"
                onPress={() =>
                  (navigation as any).navigate("PlayerManagement", {
                    leagueId,
                    leagueName: league.name,
                  })
                }
              >
                <Users size={18} color="#26A69A" />
                <Text className="flex-1 text-gray-900 ml-3">Manage Players</Text>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-gray-100"
                onPress={() =>
                  navigation.navigate("TeamManagement", {
                    leagueId,
                    leagueName: league.name,
                  })
                }
              >
                <Shield size={18} color="#26A69A" />
                <Text className="flex-1 text-gray-900 ml-3">Manage Teams</Text>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-4"
                onPress={() =>
                  navigation.navigate("VenueManagement", {
                    leagueId,
                    leagueName: league.name,
                  })
                }
              >
                <MapPinned size={18} color="#26A69A" />
                <Text className="flex-1 text-gray-900 ml-3">Manage Venues</Text>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Scoring Format Edit Modal */}
      <Modal
        visible={scoringModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setScoringModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Scoring Format</Text>
            <Pressable onPress={() => setScoringModalVisible(false)} className="p-1">
              <X color="#6b7280" size={22} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>

            {/* Preset selection */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Scoring Preset</Text>
            <View className="space-y-2 mb-6">
              {PRESET_OPTIONS.map((preset) => {
                const isSelected = draftConfig.preset === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => updateDraft({ preset })}
                    className={`p-4 rounded-lg border-2 ${
                      isSelected ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text className={`font-semibold text-sm ${isSelected ? "text-teal-700" : "text-gray-800"}`}>
                      {PRESET_LABELS[preset]}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isSelected ? "text-teal-600" : "text-gray-500"}`}>
                      {PRESET_DESCRIPTIONS[preset]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom config fields — only when Custom is selected */}
            {isCustom && (
              <View className="space-y-6">

                {/* Game Format */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Game Format</Text>
                  <View className="space-y-2">
                    {GAME_FORMATS.map((f) => {
                      const isActive = draftConfig.game_format === f.value;
                      return (
                        <TouchableOpacity
                          key={f.value}
                          onPress={() => updateDraft({ game_format: f.value })}
                          className={`p-3 rounded-lg border-2 ${
                            isActive ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <Text className={`font-semibold text-sm ${isActive ? "text-teal-700" : "text-gray-800"}`}>
                            {f.label}
                          </Text>
                          <Text className={`text-xs mt-0.5 ${isActive ? "text-teal-600" : "text-gray-500"}`}>
                            {f.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Ball points fields */}
                {isBallPoints && (
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">Ball Value (pts)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                        keyboardType="number-pad"
                        value={String(draftConfig.ball_value ?? "")}
                        onChangeText={(v) => updateDraft({ ball_value: parseInt(v) || 0 })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-1">8/9-Ball Value (pts)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                        keyboardType="number-pad"
                        value={String(draftConfig.object_ball_value ?? "")}
                        onChangeText={(v) => updateDraft({ object_ball_value: parseInt(v) || 0 })}
                      />
                    </View>
                  </View>
                )}

                {/* Race to */}
                {isRaceTo && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Race To (games)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      keyboardType="number-pad"
                      value={draftConfig.race_to != null ? String(draftConfig.race_to) : ""}
                      onChangeText={(v) => updateDraft({ race_to: parseInt(v) || null })}
                    />
                  </View>
                )}

                {/* Standings Format */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Standings Format</Text>
                  <View className="space-y-2">
                    {STANDINGS_FORMATS.map((f) => {
                      const isActive = draftConfig.standings_format === f.value;
                      return (
                        <TouchableOpacity
                          key={f.value}
                          onPress={() => updateDraft({ standings_format: f.value })}
                          className={`p-3 rounded-lg border-2 ${
                            isActive ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <Text className={`font-semibold text-sm ${isActive ? "text-teal-700" : "text-gray-800"}`}>
                            {f.label}
                          </Text>
                          <Text className={`text-xs mt-0.5 ${isActive ? "text-teal-600" : "text-gray-500"}`}>
                            {f.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Match points W/T/L */}
                {isMatchPoints && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Match Points</Text>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Win</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                          keyboardType="number-pad"
                          value={String(draftConfig.match_win_points ?? "")}
                          onChangeText={(v) => updateDraft({ match_win_points: parseInt(v) || 0 })}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Tie</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                          keyboardType="number-pad"
                          value={String(draftConfig.match_tie_points ?? "")}
                          onChangeText={(v) => updateDraft({ match_tie_points: parseInt(v) || 0 })}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 mb-1">Loss</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                          keyboardType="number-pad"
                          value={String(draftConfig.match_loss_points ?? "")}
                          onChangeText={(v) => updateDraft({ match_loss_points: parseInt(v) || 0 })}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Allow Ties toggle */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-700">Allow Match Ties</Text>
                  <Switch
                    value={draftConfig.allow_ties ?? false}
                    onValueChange={(v) => updateDraft({ allow_ties: v })}
                    trackColor={{ true: "#14B8A6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setScoringModalVisible(false)}
              className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-lg bg-teal-500 items-center"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="font-semibold text-white">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
