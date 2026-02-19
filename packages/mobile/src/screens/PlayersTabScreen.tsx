import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Users, Trophy, ChevronRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, type PlayerSeasonStat } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { PlayersStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<PlayersStackParamList>;

export default function PlayersTabScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const { mySeasons, isLoaded: contextLoaded } = useUserContextStore();

  const [players, setPlayers] = useState<PlayerSeasonStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seasonName, setSeasonName] = useState<string>("");

  const loadPlayers = async () => {
    try {
      let seasonId: number | null = null;

      // For authenticated users with seasons, use their first active season
      if (isAuthenticated && mySeasons.length > 0) {
        const activeSeason = mySeasons.find((s) => s.is_active) || mySeasons[0];
        seasonId = activeSeason.id;
        setSeasonName(activeSeason.name);
      } else {
        // For anonymous users, find a public active season
        const seasonsResponse = await api.get<{ results: { id: number; name: string; is_active: boolean }[] }>("/seasons/");
        const activeSeason = seasonsResponse.results.find((s) => s.is_active);
        if (activeSeason) {
          seasonId = activeSeason.id;
          setSeasonName(activeSeason.name);
        }
      }

      if (seasonId) {
        const response = await api.get<{ players: PlayerSeasonStat[] }>(
          `/seasons/${seasonId}/players/`
        );
        // Sort by total wins descending (leaderboard style)
        const sortedPlayers = (response.players || [])
          .sort((a, b) => b.total_wins - a.total_wins)
          .slice(0, 50); // Limit to top 50
        setPlayers(sortedPlayers);
      }
    } catch (error) {
      console.error("Failed to load players:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || contextLoaded) {
      loadPlayers();
    }
  }, [isAuthenticated, contextLoaded, mySeasons.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      await useUserContextStore.getState().loadUserContext();
    }
    await loadPlayers();
  };

  if (loading || (isAuthenticated && !contextLoaded)) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  const showingMyLeaguePlayers = isAuthenticated && mySeasons.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {showingMyLeaguePlayers ? "Leaderboard" : "Top Players"}
          </Text>
          <Text className="text-gray-600">
            {seasonName
              ? `Player rankings for ${seasonName}`
              : "Top performers across leagues"}
          </Text>
        </View>

        {/* Browse All Link for authenticated users */}
        {showingMyLeaguePlayers && mySeasons.length > 1 && (
          <TouchableOpacity
            className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex-row items-center justify-between"
            onPress={() => {
              // TODO: Show season picker or navigate to all players
            }}
          >
            <Text className="text-primary font-medium">View Other Seasons</Text>
            <ChevronRight color="#26A69A" size={20} />
          </TouchableOpacity>
        )}

        {/* Players List */}
        {players.length === 0 ? (
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
