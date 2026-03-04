import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Calendar, LogIn, MapPin } from "lucide-react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, formatDateDisplay, type Match, type SeasonMatchesResponse, type Season } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { MatchesStackParamList } from "../navigation/types";
import type { MainTabScreenProps } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<MatchesStackParamList>;

const STATUS_OPTIONS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Scheduled", value: "scheduled" },
  { label: "Live", value: "in_progress" },
  { label: "Pending", value: "awaiting_confirmation" },
  { label: "Final", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function MatchesTabScreen() {
  const navigation = useNavigation<MainTabScreenProps<"Matches">["navigation"]>();
  const matchesNav = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const { mySeasons, myTeams, myLeagues, isLoaded: contextLoaded } = useUserContextStore();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operatorSeasonInfo, setOperatorSeasonInfo] = useState<
    Record<number, { name: string; league_name: string }>
  >({});

  // Filter state
  const [filterSeasonId, setFilterSeasonId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Match>>(null);

  const myTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);

  const operatorLeagues = useMemo(
    () => myLeagues.filter((l) => l.is_operator),
    [myLeagues]
  );
  const isAnyOperator = operatorLeagues.length > 0;

  const seasonMap = useMemo(
    () => Object.fromEntries(mySeasons.map((s) => [s.id, s])),
    [mySeasons]
  );

  const getSeasonDisplay = (seasonId: number) => {
    const player = seasonMap[seasonId];
    if (player) return { name: player.name, league_name: player.league_name };
    return operatorSeasonInfo[seasonId] ?? null;
  };

  // Unique seasons present in the loaded matches (for filter chips)
  const uniqueSeasons = useMemo(() => {
    const seen = new Set<number>();
    const result: { id: number; name: string; league_name: string }[] = [];
    for (const m of matches) {
      if (!seen.has(m.season)) {
        seen.add(m.season);
        const display = getSeasonDisplay(m.season);
        if (display) {
          result.push({ id: m.season, name: display.name, league_name: display.league_name });
        }
      }
    }
    return result.sort((a, b) => b.name.localeCompare(a.name)); // newest name first
  }, [matches, seasonMap, operatorSeasonInfo]);

  // Client-side filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterSeasonId !== null && m.season !== filterSeasonId) return false;
      if (filterStatus !== null && m.status !== filterStatus) return false;
      return true;
    });
  }, [matches, filterSeasonId, filterStatus]);

  const filtersActive = filterSeasonId !== null || filterStatus !== null;

  const loadMatches = async () => {
    try {
      const allMatchesMap = new Map<number, Match>();
      const newOperatorSeasonInfo: Record<number, { name: string; league_name: string }> = {};

      if (!isAnyOperator) {
        // Regular player: load only matches for my teams
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
            myMatches.forEach((m) => allMatchesMap.set(m.id, m));
          } catch {
            // Continue if one season fails
          }
        }
      } else {
        // Operator: load ALL matches for all seasons in operated leagues
        const seasonsResp = await api.get<{ results: Season[] }>("/seasons/");
        const operatorLeagueIds = new Set(operatorLeagues.map((l) => l.id));
        const operatorLeagueNameMap = Object.fromEntries(
          operatorLeagues.map((l) => [l.id, l.name])
        );

        const allOperatorSeasons = seasonsResp.results.filter((s) =>
          operatorLeagueIds.has(s.league)
        );
        const operatorSeasonIds = new Set(allOperatorSeasons.map((s) => s.id));

        // Build season info for display
        for (const s of allOperatorSeasons) {
          newOperatorSeasonInfo[s.id] = {
            name: s.name,
            league_name: operatorLeagueNameMap[s.league] ?? "",
          };
        }

        // Fetch all matches for operator seasons (no team filter)
        for (const season of allOperatorSeasons) {
          try {
            const response = await api.get<SeasonMatchesResponse>(
              `/seasons/${season.id}/matches/`
            );
            response.matches.forEach((m) => allMatchesMap.set(m.id, m));
          } catch {
            // Continue if one season fails
          }
        }

        // Also fetch player-only seasons (leagues where user is a player but NOT an operator)
        const playerOnlySeasons = mySeasons.filter(
          (s) => !operatorSeasonIds.has(s.id)
        );
        for (const season of playerOnlySeasons) {
          try {
            const response = await api.get<SeasonMatchesResponse>(
              `/seasons/${season.id}/matches/`
            );
            const myMatches = response.matches.filter(
              (m) =>
                myTeamIds.includes(m.home_team) ||
                myTeamIds.includes(m.away_team)
            );
            myMatches.forEach((m) => allMatchesMap.set(m.id, m));
          } catch {
            // Continue if one season fails
          }
        }
      }

      setOperatorSeasonInfo(newOperatorSeasonInfo);
      // Reset filters when data reloads
      setFilterSeasonId(null);
      setFilterStatus(null);
      const sorted = Array.from(allMatchesMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setMatches(sorted);
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
  }, [isAuthenticated, contextLoaded, mySeasons.length, operatorLeagues.length]);

  // Anchor = first upcoming unfinalized match
  const anchorIndex = useMemo(() => {
    const now = new Date();
    const idx = filteredMatches.findIndex((m) => new Date(m.date) >= now);
    return idx >= 0 ? idx : Math.max(0, filteredMatches.length - 1);
  }, [filteredMatches]);

  // Scroll anchor to top of visible area after data or filter changes
  useEffect(() => {
    if (filteredMatches.length === 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: anchorIndex,
        animated: false,
        viewPosition: 0,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [filteredMatches, anchorIndex]);

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
      return formatDateDisplay(dateString);
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
          {isAnyOperator
            ? "No matches found in your leagues"
            : "Your teams don't have any matches yet"}
        </Text>
      </View>
    );
  }

  const renderMatch = ({ item: match, index }: { item: Match; index: number }) => {
    const isMyTeamMatch =
      myTeamIds.includes(match.home_team) || myTeamIds.includes(match.away_team);
    const isHome = myTeamIds.includes(match.home_team);
    const statusStyle = getStatusStyle(match.status);
    const isAnchor = index === anchorIndex;
    const location = match.home_team_detail?.establishment;
    const seasonDisplay = getSeasonDisplay(match.season);

    return (
      <TouchableOpacity
        className={`mx-4 mb-3 bg-white rounded-xl overflow-hidden border-2 ${
          isAnchor ? "border-primary" : "border-transparent"
        }`}
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}
        onPress={() => matchesNav.navigate("MatchDetails", { matchId: match.id })}
        activeOpacity={0.75}
      >
        {/* Top bar: week + season context */}
        <View className={`flex-row items-center justify-between px-4 py-2 ${isAnchor ? "bg-primary" : "bg-gray-50"} border-b ${isAnchor ? "border-primary-700" : "border-gray-100"}`}>
          <Text className={`text-xs font-semibold ${isAnchor ? "text-white" : "text-gray-500"}`}>
            {match.week_number != null ? `Week ${match.week_number}` : ""}
            {match.week_number != null && seasonDisplay ? "  ·  " : ""}
            {seasonDisplay ? seasonDisplay.name : ""}
            {seasonDisplay?.league_name ? `  ·  ${seasonDisplay.league_name}` : ""}
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

          {/* HOME / AWAY badge — only shown when user is a player in this match */}
          {isMyTeamMatch && (
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
          )}

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

  const showFilters = isAnyOperator && uniqueSeasons.length > 1;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">
          {isAnyOperator ? "League Matches" : "My Matches"}
        </Text>
        <Text className="text-gray-500 text-sm mt-0.5">
          {filtersActive
            ? `${filteredMatches.length} of ${matches.length} matches`
            : `${matches.length} match${matches.length !== 1 ? "es" : ""}${
                isAnyOperator
                  ? ` across ${operatorLeagues.length} league${operatorLeagues.length !== 1 ? "s" : ""}`
                  : ` across ${mySeasons.length} season${mySeasons.length !== 1 ? "s" : ""}`
              }`}
        </Text>
      </View>

      {/* Filter strip — shown for operators with multiple seasons */}
      {showFilters && (
        <View className="pb-3 border-b border-gray-200">
          {/* Season chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            className="mb-2"
          >
            <TouchableOpacity
              onPress={() => setFilterSeasonId(null)}
              className={`px-3 py-1.5 rounded-full border ${
                filterSeasonId === null
                  ? "bg-primary border-primary"
                  : "bg-white border-gray-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filterSeasonId === null ? "text-white" : "text-gray-600"
                }`}
              >
                All Seasons
              </Text>
            </TouchableOpacity>
            {uniqueSeasons.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() =>
                  setFilterSeasonId(filterSeasonId === s.id ? null : s.id)
                }
                className={`px-3 py-1.5 rounded-full border ${
                  filterSeasonId === s.id
                    ? "bg-primary border-primary"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    filterSeasonId === s.id ? "text-white" : "text-gray-600"
                  }`}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Status chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = filterStatus === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => setFilterStatus(isSelected ? null : opt.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-gray-700 border-gray-700"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Empty filtered state */}
      {filteredMatches.length === 0 && filtersActive ? (
        <View className="flex-1 items-center justify-center p-8">
          <Calendar color="#9ca3af" size={40} />
          <Text className="text-gray-500 font-medium mt-4">No matches match this filter</Text>
          <TouchableOpacity
            onPress={() => { setFilterSeasonId(null); setFilterStatus(null); }}
            className="mt-3"
          >
            <Text className="text-primary font-medium">Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredMatches}
          keyExtractor={(item, index) => `match-${item.id}-${index}`}
          renderItem={renderMatch}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScrollToIndexFailed={(info) => {
            const offset = info.averageItemLength * info.index;
            flatListRef.current?.scrollToOffset({ offset, animated: false });
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
