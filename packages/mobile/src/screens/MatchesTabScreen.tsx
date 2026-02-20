import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Calendar, ChevronRight, LogIn } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, type Match } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { MatchesStackParamList } from "../navigation/types";
import type { MainTabScreenProps } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<MatchesStackParamList>;

export default function MatchesTabScreen() {
  const navigation = useNavigation<MainTabScreenProps<"Matches">["navigation"]>();
  const matchesNav = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const { mySeasons, myTeams, isLoaded: contextLoaded } = useUserContextStore();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      if (mySeasons.length > 0) {
        const allMatches: Match[] = [];
        for (const season of mySeasons.slice(0, 3)) {
          try {
            const response = await api.get<Match[]>(`/seasons/${season.id}/matches/`);
            allMatches.push(...response);
          } catch {
            // Continue if one season fails
          }
        }
        // Sort by date descending and limit
        const sortedMatches = allMatches
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20);
        setMatches(sortedMatches);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && contextLoaded) {
      loadMatches();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, contextLoaded, mySeasons.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      await useUserContextStore.getState().loadUserContext();
    }
    await loadMatches();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "TBD";
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "TBD";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Final" },
      in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "Live" },
      scheduled: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Scheduled" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    };
    return styles[status as keyof typeof styles] || styles.scheduled;
  };

  // Check if a match involves user's team
  const isMyMatch = (match: Match) => {
    if (!isAuthenticated || myTeams.length === 0) return false;
    const teamIds = myTeams.map((t) => t.id);
    return teamIds.includes(match.home_team) || teamIds.includes(match.away_team);
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 pt-8">
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <View className="bg-primary-100 rounded-full p-4 mb-4">
              <Calendar color="#26A69A" size={48} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Matches
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Sign in to view upcoming matches for your teams and leagues
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Auth")}
              className="bg-primary rounded-md px-6 py-3 flex-row items-center gap-2"
            >
              <LogIn color="#fff" size={20} />
              <Text className="text-white font-semibold text-base ml-2">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading || !contextLoaded) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  const showingMyMatches = myTeams.length > 0;

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
            {showingMyMatches ? "My Matches" : "Matches"}
          </Text>
          <Text className="text-gray-600">
            {showingMyMatches
              ? "Upcoming and recent matches for your teams"
              : "Join a team to see your matches"}
          </Text>
        </View>

        {/* Browse All Link for users with teams */}
        {showingMyMatches && (
          <TouchableOpacity
            className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex-row items-center justify-between"
            onPress={() => {
              // TODO: Navigate to all matches view
            }}
          >
            <Text className="text-primary font-medium">Browse All Matches</Text>
            <ChevronRight color="#26A69A" size={20} />
          </TouchableOpacity>
        )}

        {/* Matches List */}
        {matches.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Calendar color="#9ca3af" size={48} />
            <Text className="text-gray-500 text-center mt-4 text-lg font-medium">
              No matches found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {showingMyMatches
                ? "Your teams don't have any scheduled matches"
                : "Join a team to see match schedules"}
            </Text>
          </View>
        ) : (
          <View className="pb-20 space-y-3">
            {matches.map((match, index) => {
              const status = getStatusBadge(match.status);
              const highlighted = isMyMatch(match);

              return (
                <TouchableOpacity
                  key={`match-${match.id}-${index}`}
                  className={`bg-white rounded-lg p-4 border ${
                    highlighted ? "border-primary" : "border-gray-200"
                  }`}
                  onPress={() =>
                    matchesNav.navigate("MatchDetails", { matchId: match.id })
                  }
                >
                  {/* Date and Status Row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs text-gray-500">
                      {formatDate(match.date)}
                      {match.week_number && ` - Week ${match.week_number}`}
                    </Text>
                    <View className={`px-2 py-1 rounded ${status.bg}`}>
                      <Text className={`text-xs font-medium ${status.text}`}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {/* Teams and Score */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {match.home_team_detail?.name || "TBD"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2 px-4">
                      <Text className="text-xl font-bold text-gray-900">
                        {match.home_score ?? "-"}
                      </Text>
                      <Text className="text-sm text-gray-400">vs</Text>
                      <Text className="text-xl font-bold text-gray-900">
                        {match.away_score ?? "-"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 text-right">
                        {match.away_team_detail?.name || "TBD"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
