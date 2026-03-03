import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Calendar, LogIn, MapPin } from "lucide-react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, type Match, type SeasonMatchesResponse } from "@league-genius/shared";
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
  const flatListRef = useRef<FlatList<Match>>(null);

  const myTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);

  const seasonMap = useMemo(
    () => Object.fromEntries(mySeasons.map((s) => [s.id, s])),
    [mySeasons]
  );

  const loadMatches = async () => {
    try {
      if (mySeasons.length > 0) {
        const allMatches: Match[] = [];
        for (const season of mySeasons) {
          try {
            const response = await api.get<SeasonMatchesResponse>(
              `/seasons/${season.id}/matches/`
            );
            const myMatches = response.matches.filter(
              (m) =>
                myTeamIds.includes(m.home_team) ||
                myTeamIds.includes(m.away_team)
            );
            allMatches.push(...myMatches);
          } catch {
            // Continue if one season fails
          }
        }
        // Sort ascending: oldest at top, newest at bottom
        allMatches.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setMatches(allMatches);
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

  // Anchor = first match that is (a) in the future and (b) not yet finalized.
  // Past-dated unscored matches don't count — fall back to last match.
  const anchorIndex = useMemo(() => {
    const now = new Date();
    const idx = matches.findIndex((m) => new Date(m.date) >= now);
    return idx >= 0 ? idx : Math.max(0, matches.length - 1);
  }, [matches]);

  // Scroll anchor to top of visible area after data loads
  useEffect(() => {
    if (matches.length === 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: anchorIndex,
        animated: false,
        viewPosition: 0,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [matches, anchorIndex]);

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
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "TBD";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "bg-green-100", text: "text-green-700", label: "Final" };
      case "in_progress":
        return { bg: "bg-blue-100", text: "text-blue-700", label: "Live" };
      case "awaiting_confirmation":
        return { bg: "bg-orange-100", text: "text-orange-700", label: "Pending" };
      case "cancelled":
        return { bg: "bg-gray-100", text: "text-gray-400", label: "Cancelled" };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Scheduled" };
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-8">
        <View className="bg-white rounded-xl p-8 border border-gray-200 items-center w-full">
          <View className="bg-primary-100 rounded-full p-4 mb-4">
            <Calendar color="#26A69A" size={48} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Matches</Text>
          <Text className="text-gray-500 text-center mb-6">
            Sign in to view your match schedule
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Auth")}
            className="bg-primary rounded-lg px-6 py-3 flex-row items-center gap-2"
          >
            <LogIn color="#fff" size={20} />
            <Text className="text-white font-semibold text-base ml-2">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading || !contextLoaded) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-8">
        <Calendar color="#9ca3af" size={48} />
        <Text className="text-gray-500 text-lg font-medium mt-4">
          No matches scheduled
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Your teams don't have any matches yet
        </Text>
      </View>
    );
  }

  const renderMatch = ({ item: match, index }: { item: Match; index: number }) => {
    const isHome = myTeamIds.includes(match.home_team);
    const statusStyle = getStatusStyle(match.status);
    const isAnchor = index === anchorIndex;
    const location = match.home_team_detail?.establishment;
    const season = seasonMap[match.season];

    return (
      <TouchableOpacity
        className={`mx-4 mb-3 bg-white rounded-xl overflow-hidden border-2 ${
          isAnchor ? "border-primary" : "border-transparent"
        }`}
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}
        onPress={() => matchesNav.navigate("MatchDetails", { matchId: match.id })}
        activeOpacity={0.75}
      >
        {/* Top bar: week + season context + status */}
        <View className={`flex-row items-center justify-between px-4 py-2 ${isAnchor ? "bg-primary" : "bg-gray-50"} border-b ${isAnchor ? "border-primary-700" : "border-gray-100"}`}>
          <Text className={`text-xs font-semibold ${isAnchor ? "text-white" : "text-gray-500"}`}>
            {match.week_number != null ? `Week ${match.week_number}` : ""}
            {match.week_number != null && season ? "  ·  " : ""}
            {season ? season.name : ""}
            {season?.league_name ? `  ·  ${season.league_name}` : ""}
          </Text>
          {isAnchor && (
            <View className="bg-white/20 rounded px-2 py-0.5">
              <Text className="text-white text-xs font-bold">NEXT MATCH</Text>
            </View>
          )}
        </View>

        <View className="px-4 pt-3 pb-4">
          {/* Date + Location row */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">
                {formatDate(match.date)}
              </Text>
              {location ? (
                <View className="flex-row items-center mt-1 gap-1">
                  <MapPin size={12} color="#9ca3af" />
                  <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className={`ml-3 px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
              <Text className={`text-xs font-semibold ${statusStyle.text}`}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* HOME / AWAY badge */}
          <View
            className={`self-start px-2 py-0.5 rounded mb-3 ${
              isHome ? "bg-primary-100" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-bold tracking-wide ${
                isHome ? "text-primary" : "text-gray-500"
              }`}
            >
              {isHome ? "HOME" : "AWAY"}
            </Text>
          </View>

          {/* Teams + Score */}
          <View className="flex-row items-center">
            <Text
              className={`flex-1 text-sm font-semibold ${
                myTeamIds.includes(match.home_team) ? "text-primary" : "text-gray-900"
              }`}
              numberOfLines={1}
            >
              {match.home_team_detail?.name || "TBD"}
            </Text>
            <View className="flex-row items-center px-3">
              <Text className="text-xl font-bold text-gray-900 w-7 text-center">
                {match.home_score ?? "–"}
              </Text>
              <Text className="text-xs text-gray-300 mx-1">·</Text>
              <Text className="text-xl font-bold text-gray-900 w-7 text-center">
                {match.away_score ?? "–"}
              </Text>
            </View>
            <Text
              className={`flex-1 text-sm font-semibold text-right ${
                myTeamIds.includes(match.away_team) ? "text-primary" : "text-gray-900"
              }`}
              numberOfLines={1}
            >
              {match.away_team_detail?.name || "TBD"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">My Matches</Text>
        <Text className="text-gray-500 text-sm mt-0.5">
          {matches.length} match{matches.length !== 1 ? "es" : ""} across{" "}
          {mySeasons.length} season{mySeasons.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={matches}
        keyExtractor={(item, index) => `match-${item.id}-${index}`}
        renderItem={renderMatch}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollToIndexFailed={(info) => {
          // Fallback if layout not yet measured
          const offset = info.averageItemLength * info.index;
          flatListRef.current?.scrollToOffset({ offset, animated: false });
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
