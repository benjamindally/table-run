import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Calendar, Users } from "lucide-react-native";
import { useState, useEffect } from "react";
import { api, formatDateDisplay } from "@league-genius/shared";
import type { LeaguesStackScreenProps } from "../navigation/types";

interface Season {
  id: number;
  league: number;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_archived: boolean;
  team_count?: number;
}

export default function SeasonsScreen({
  route,
  navigation,
}: LeaguesStackScreenProps<"Seasons">) {
  const { leagueId } = route.params;
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSeasons = async () => {
    try {
      const response = await api.get<{ results: Season[] }>("/seasons/");
      // Filter seasons for this league and sort by most recent first
      const leagueSeasons = response.results
        .filter((s) => s.league === leagueId)
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      setSeasons(leagueSeasons);
    } catch (error) {
      console.error("Failed to load seasons:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, [leagueId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeasons();
  };

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  const getSeasonStatus = (season: Season) => {
    if (season.is_archived) return "Archived";
    if (season.is_active) return "Active";
    return "Inactive";
  };

  const getStatusColor = (season: Season) => {
    if (season.is_archived) return "text-gray-500";
    if (season.is_active) return "text-green-600";
    return "text-yellow-600";
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
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-gray-600">
            Select a season to view details and standings
          </Text>
        </View>

        {/* Seasons List */}
        {seasons.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Text className="text-gray-400 text-center">
              No seasons found for this league
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {seasons.map((season) => (
              <TouchableOpacity
                key={season.id}
                className="bg-white rounded-lg p-4 border border-gray-200 active:border-primary mb-4"
                onPress={() =>
                  navigation.navigate("SeasonDetails", { seasonId: season.id })
                }
              >
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                      {season.name}
                    </Text>
                    <Text
                      className={`text-sm font-medium ${getStatusColor(season)}`}
                    >
                      {getSeasonStatus(season)}
                    </Text>
                  </View>
                </View>

                <View className="space-y-2">
                  <View className="flex-row items-center gap-2">
                    <Calendar color="#6b7280" size={16} />
                    <Text className="text-sm text-gray-600">
                      {formatDate(season.start_date)}
                      {season.end_date && ` - ${formatDate(season.end_date)}`}
                    </Text>
                  </View>
                  {season.team_count !== undefined && (
                    <View className="flex-row items-center gap-2">
                      <Users color="#6b7280" size={16} />
                      <Text className="text-sm text-gray-600">
                        {season.team_count}{" "}
                        {season.team_count === 1 ? "Team" : "Teams"}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-sm font-medium text-primary text-center">
                    View Season Details →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
