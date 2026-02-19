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

interface TeamStanding {
  team_id: number;
  team_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
}

export default function FullStandingsScreen({
  route,
}: SeasonsStackScreenProps<"FullStandings">) {
  const { seasonId } = route.params;
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStandings = async () => {
    try {
      const standingsResponse = await api.get<{ standings: TeamStanding[] }>(
        `/seasons/${seasonId}/standings/`
      );
      setStandings(standingsResponse.standings || []);
    } catch (error) {
      console.error("Failed to load standings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, [seasonId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStandings();
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
          {standings.length === 0 ? (
            <View className="p-8">
              <Text className="text-gray-400 text-center">
                No standings data available
              </Text>
            </View>
          ) : (
            <View>
              {standings.map((team, index) => (
                <View
                  key={`standing-${team.team_id}-${index}`}
                  className={`p-4 ${
                    index < standings.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white font-bold text-xs">
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-base font-semibold text-gray-900 flex-1">
                          {team.team_name}
                        </Text>
                        <Text className="text-lg font-bold text-primary">
                          {team.points}
                        </Text>
                      </View>
                      <View className="flex-row gap-4">
                        <Text className="text-sm text-gray-600">W: {team.wins}</Text>
                        <Text className="text-sm text-gray-600">
                          L: {team.losses}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          GB: {index === 0 ? "-" : (standings[0].wins - standings[0].losses) - (team.wins - team.losses)}
                        </Text>
                      </View>
                    </View>
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
