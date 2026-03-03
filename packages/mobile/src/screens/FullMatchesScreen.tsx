import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { api, formatDateDisplay, type SeasonMatchesResponse } from "@league-genius/shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type FullMatchesParamList = {
  FullMatches: { seasonId: number; seasonName: string };
  MatchDetails: { matchId: number };
};
type Props = NativeStackScreenProps<FullMatchesParamList, "FullMatches">;

interface Match {
  id: number;
  week_number?: number | null;
  home_team_detail?: { name: string };
  away_team_detail?: { name: string };
  home_score: number | null;
  away_score: number | null;
  date: string;
  status: string;
}

type Filter = "all" | "scheduled" | "completed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
];

const isPastDue = (match: Match) => {
  if (match.status === "completed") return false;
  try {
    return new Date(match.date) < new Date();
  } catch {
    return false;
  }
};

export default function FullMatchesScreen({
  route,
  navigation,
}: Props) {
  const { seasonId } = route.params;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const loadMatches = async () => {
    try {
      const matchesResponse = await api.get<SeasonMatchesResponse>(
        `/seasons/${seasonId}/matches/`
      );
      setMatches(matchesResponse.matches);
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
      return formatDateDisplay(dateString);
    } catch {
      return "TBD";
    }
  };

  const filteredMatches = useMemo(() => {
    switch (filter) {
      case "scheduled":
        return matches.filter((m) => m.status !== "completed");
      case "completed":
        return matches.filter((m) => m.status === "completed");
      default:
        return matches;
    }
  }, [matches, filter]);

  const matchesByWeek = useMemo(() => {
    return filteredMatches.reduce((acc, match) => {
      const week = match.week_number || 0;
      if (!acc[week]) acc[week] = [];
      acc[week].push(match);
      return acc;
    }, {} as Record<number, Match[]>);
  }, [filteredMatches]);

  const weeks = useMemo(
    () =>
      Object.keys(matchesByWeek)
        .map(Number)
        .sort((a, b) => (sortAsc ? a - b : b - a)),
    [matchesByWeek, sortAsc]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter + sort bar */}
      <View className="bg-white border-b border-gray-200 px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full ${
                filter === f.value ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  filter === f.value ? "text-white" : "text-gray-600"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setSortAsc((v) => !v)}
          className="px-3 py-1.5 bg-gray-100 rounded-full"
        >
          <Text className="text-xs font-medium text-gray-600">
            Week {sortAsc ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 pb-20 space-y-4">
          {filteredMatches.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border border-gray-200">
              <Text className="text-gray-400 text-center">
                {filter === "all"
                  ? "No matches scheduled"
                  : `No ${filter} matches`}
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
                  {matchesByWeek[weekNum].map((match, index) => {
                    const pastDue = isPastDue(match);
                    return (
                      <TouchableOpacity
                        key={`match-${match.id}-${index}`}
                        className={`rounded-lg p-3 border ${
                          pastDue
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                        onPress={() =>
                          navigation.navigate("MatchDetails", {
                            matchId: match.id,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-xs text-gray-500">
                            {formatDate(match.date)}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded ${
                              match.status === "completed"
                                ? "bg-green-100"
                                : pastDue
                                ? "bg-red-100"
                                : "bg-yellow-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                match.status === "completed"
                                  ? "text-green-700"
                                  : pastDue
                                  ? "text-red-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {match.status === "completed"
                                ? "Final"
                                : pastDue
                                ? "Past Due"
                                : "Scheduled"}
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
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
