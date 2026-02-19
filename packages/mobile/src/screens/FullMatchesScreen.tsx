import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { api } from "@league-genius/shared";
import type { SeasonsStackScreenProps } from "../navigation/types";

interface Match {
  id: number;
  week?: number;
  home_team_detail?: { name: string };
  away_team_detail?: { name: string };
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: string;
}


export default function FullMatchesScreen({
  route,
  navigation,
}: SeasonsStackScreenProps<"FullMatches">) {
  const { seasonId } = route.params;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const matchesResponse = await api.get<Match[]>(
        `/seasons/${seasonId}/matches/`
      );
      setMatches(matchesResponse);
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [seasonId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "TBD";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "TBD";
    }
  };

  // Group matches by week
  const matchesByWeek = matches.reduce((acc, match) => {
    const week = match.week || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Get weeks sorted (most recent first)
  const weeks = Object.keys(matchesByWeek)
    .map(Number)
    .sort((a, b) => b - a);

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
      <View className="p-4 pb-20 space-y-4">
        {matches.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200">
            <Text className="text-gray-400 text-center">
              No matches scheduled
            </Text>
          </View>
        ) : (
          weeks.map((weekNum) => (
            <View
              key={`week-${weekNum}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <View className="bg-gray-50 p-3 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900">
                  Week {weekNum}
                </Text>
              </View>
              <View className="p-4 space-y-3">
                {matchesByWeek[weekNum].map((match, index) => (
                  <TouchableOpacity
                    key={`match-${match.id}-${index}`}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    onPress={() => navigation.navigate("MatchScore", { matchId: match.id })}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-gray-500">
                        {formatDate(match.match_date)}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          match.status === "completed"
                            ? "bg-green-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            match.status === "completed"
                              ? "text-green-700"
                              : "text-yellow-700"
                          }`}
                        >
                          {match.status === "completed" ? "Final" : "Scheduled"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-medium text-gray-900 flex-1">
                        {match.home_team_detail?.name || "TBD"}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-lg font-bold text-gray-900">
                          {match.home_score ?? "-"}
                        </Text>
                        <Text className="text-sm text-gray-400">vs</Text>
                        <Text className="text-lg font-bold text-gray-900">
                          {match.away_score ?? "-"}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium text-gray-900 flex-1 text-right">
                        {match.away_team_detail?.name || "TBD"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
