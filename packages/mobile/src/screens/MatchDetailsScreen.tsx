import { View, Text, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { api, type Match } from "@league-genius/shared";
import type { MatchesStackScreenProps } from "../navigation/types";

export default function MatchDetailsScreen({
  route,
}: MatchesStackScreenProps<"MatchDetails">) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const response = await api.get<Match>(`/matches/${matchId}/`);
        setMatch(response);
      } catch (error) {
        console.error("Failed to load match:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMatch();
  }, [matchId]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!match) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-500 text-center">Match not found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-6 border border-gray-200">
        {/* Date */}
        <Text className="text-sm text-gray-500 text-center mb-4">
          {formatDate(match.date)}
          {match.week_number && ` - Week ${match.week_number}`}
        </Text>

        {/* Teams and Score */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-gray-900 text-center">
              {match.home_team_detail?.name || "TBD"}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">Home</Text>
          </View>

          <View className="px-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl font-bold text-gray-900">
                {match.home_score ?? "-"}
              </Text>
              <Text className="text-lg text-gray-400">-</Text>
              <Text className="text-3xl font-bold text-gray-900">
                {match.away_score ?? "-"}
              </Text>
            </View>
          </View>

          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-gray-900 text-center">
              {match.away_team_detail?.name || "TBD"}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">Away</Text>
          </View>
        </View>

        {/* Status */}
        <View className="items-center">
          <View
            className={`px-4 py-2 rounded-full ${
              match.status === "completed"
                ? "bg-green-100"
                : match.status === "in_progress"
                ? "bg-blue-100"
                : "bg-yellow-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                match.status === "completed"
                  ? "text-green-700"
                  : match.status === "in_progress"
                  ? "text-blue-700"
                  : "text-yellow-700"
              }`}
            >
              {match.status === "completed"
                ? "Final"
                : match.status === "in_progress"
                ? "In Progress"
                : "Scheduled"}
            </Text>
          </View>
        </View>
      </View>

      {/* Placeholder for future features */}
      <View className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-gray-400 text-center text-sm">
          Game-by-game details coming soon
        </Text>
      </View>
    </View>
  );
}
