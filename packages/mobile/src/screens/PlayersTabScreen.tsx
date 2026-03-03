import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Users, Trophy } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, type PlayerSeasonStat, type MeSeason } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { PlayersStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<PlayersStackParamList>;
type SeasonOption = Pick<MeSeason, "id" | "name" | "league_name" | "is_active">;

export default function PlayersTabScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, accessToken } = useAuthStore();
  const { mySeasons, isLoaded: contextLoaded } = useUserContextStore();

  const [players, setPlayers] = useState<PlayerSeasonStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<SeasonOption[]>([]);

  const selectedSeason = seasonOptions.find((s) => s.id === selectedSeasonId);

  const loadPlayers = async (seasonId: number) => {
    try {
      const response = await api.get<{ players: PlayerSeasonStat[] }>(
        `/seasons/${seasonId}/players/`,
        accessToken ?? undefined
      );
      const sortedPlayers = (response.players || [])
        .sort((a, b) => b.total_wins - a.total_wins)
        .slice(0, 50);
      setPlayers(sortedPlayers);
    } catch (error) {
      console.error("[PlayersTab] Failed to load players:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize season options and default selection
  useEffect(() => {
    if (!isAuthenticated || contextLoaded) {
      const init = async () => {
        if (isAuthenticated && mySeasons.length > 0) {
          setSeasonOptions(mySeasons);
          const defaultSeason = mySeasons.find((s) => s.is_active) ?? mySeasons[0];
          setSelectedSeasonId(defaultSeason.id);
        } else if (!isAuthenticated) {
          try {
            const res = await api.get<{ results: SeasonOption[] }>("/seasons/");
            const results = res.results || [];
            setSeasonOptions(results);
            const defaultSeason = results.find((s) => s.is_active) ?? results[0];
            if (defaultSeason) {
              setSelectedSeasonId(defaultSeason.id);
            } else {
              setLoading(false);
            }
          } catch (error) {
            console.error("[PlayersTab] Failed to load seasons:", error);
            setLoading(false);
          }
        }
      };
      init();
    }
  }, [isAuthenticated, contextLoaded, mySeasons.length]);

  // Fetch players whenever the selected season changes
  useEffect(() => {
    if (selectedSeasonId !== null) {
      setLoading(true);
      loadPlayers(selectedSeasonId);
    }
  }, [selectedSeasonId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      await useUserContextStore.getState().loadUserContext();
    }
    if (selectedSeasonId !== null) {
      await loadPlayers(selectedSeasonId);
    }
  };

  if (loading && players.length === 0 && seasonOptions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
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
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            Leaderboard
          </Text>
          {selectedSeason && (
            <Text className="text-gray-500 text-sm">{selectedSeason.league_name}</Text>
          )}
        </View>

        {/* Season filter chips */}
        {seasonOptions.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 -mx-4 px-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {seasonOptions.map((season) => {
              const active = season.id === selectedSeasonId;
              return (
                <TouchableOpacity
                  key={season.id}
                  onPress={() => setSelectedSeasonId(season.id)}
                  className={`px-4 py-2 rounded-full border ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {season.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Players list */}
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#26A69A" />
          </View>
        ) : players.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Users color="#9ca3af" size={48} />
            <Text className="text-gray-500 text-center mt-4 text-lg font-medium">
              No player data available
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {isAuthenticated
                ? "Stats will appear once matches are played"
                : "Check back after matches have been completed"}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden pb-20">
            {/* Table Header */}
            <View className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center">
              <Text className="w-8 text-xs font-bold text-gray-500">#</Text>
              <Text className="flex-1 text-xs font-bold text-gray-500">Player</Text>
              <Text className="w-12 text-xs font-bold text-gray-500 text-center">W</Text>
              <Text className="w-12 text-xs font-bold text-gray-500 text-center">L</Text>
              <Text className="w-14 text-xs font-bold text-gray-500 text-center">Win%</Text>
            </View>

            {players.map((player, index) => {
              const winPercentage =
                player.total_games > 0
                  ? ((player.total_wins / player.total_games) * 100).toFixed(0)
                  : "0";
              const isTopThree = index < 3;

              return (
                <TouchableOpacity
                  key={`player-${player.player_id}-${index}`}
                  className={`p-3 flex-row items-center ${
                    index < players.length - 1 ? "border-b border-gray-100" : ""
                  } ${isTopThree ? "bg-yellow-50" : ""}`}
                  onPress={() =>
                    navigation.navigate("PlayerDetails", { playerId: player.player_id })
                  }
                >
                  {/* Rank */}
                  <View className="w-8">
                    {isTopThree ? (
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center ${
                          index === 0
                            ? "bg-yellow-400"
                            : index === 1
                            ? "bg-gray-300"
                            : "bg-amber-600"
                        }`}
                      >
                        <Trophy color="#fff" size={12} />
                      </View>
                    ) : (
                      <Text className="text-sm text-gray-500">{index + 1}</Text>
                    )}
                  </View>

                  {/* Player Name and Team */}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {player.player_name}
                    </Text>
                    <Text className="text-xs text-gray-500">{player.team_name}</Text>
                  </View>

                  {/* Stats */}
                  <Text className="w-12 text-sm text-center text-gray-900 font-medium">
                    {player.total_wins}
                  </Text>
                  <Text className="w-12 text-sm text-center text-gray-500">
                    {player.total_losses}
                  </Text>
                  <Text className="w-14 text-sm text-center text-primary font-medium">
                    {winPercentage}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
