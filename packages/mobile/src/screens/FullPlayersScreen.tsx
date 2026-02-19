import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { api } from "@league-genius/shared";
import type { SeasonsStackScreenProps } from "../navigation/types";

interface PlayerStats {
  player_id: number;
  player_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  skill_level?: number;
}

export default function FullPlayersScreen({
  route,
}: SeasonsStackScreenProps<"FullPlayers">) {
  const { seasonId } = route.params;
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlayers = async () => {
    try {
      const playersResponse = await api.get<{ players: PlayerStats[] }>(
        `/seasons/${seasonId}/players/`
      );
      setPlayers(playersResponse.players || []);
    } catch (error) {
      console.error("Failed to load players:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [seasonId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayers();
  };

  if (loading) {
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
      <View className="p-4 pb-20">
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {players.length === 0 ? (
            <View className="p-8">
              <Text className="text-gray-400 text-center">
                No player data available
              </Text>
            </View>
          ) : (
            <View>
              {players
                .sort((a, b) => b.wins - a.wins)
                .map((player, index) => (
                  <View
                    key={`player-${player.player_id}-${index}`}
                    className={`p-4 ${
                      index < players.length - 1
                        ? "border-b border-gray-200"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-semibold text-gray-900 flex-1">
                        {player.player_name}
                      </Text>
                      {player.skill_level && (
                        <View className="bg-primary px-2 py-1 rounded">
                          <Text className="text-white text-xs font-bold">
                            SL {player.skill_level}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row gap-4">
                      <Text className="text-sm text-gray-600">
                        W: {player.wins}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        L: {player.losses}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        GP: {player.matches_played}
                      </Text>
                      {player.matches_played > 0 && (
                        <Text className="text-sm text-gray-600">
                          Win%:{" "}
                          {((player.wins / player.matches_played) * 100).toFixed(
                            0
                          )}
                          %
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
