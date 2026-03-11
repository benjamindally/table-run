import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Calendar, CalendarDays, Users, ChevronRight, ChevronDown, Clock, MapPin, Shield, Trophy, RefreshCw } from "lucide-react-native";
import { useState, useEffect, useMemo } from "react";
import { api, formatDateDisplay, type SeasonMatchesResponse } from "@league-genius/shared";
import type { SeasonsStackScreenProps } from "../navigation/types";
import { useUserContextStore } from "../stores/userContextStore";

interface Season {
  id: number;
  league: number;
  league_detail?: {
    id: number;
    name: string;
  };
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_archived: boolean;
  team_count?: number;
}

interface TeamStanding {
  team_id: number;
  team_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
}

interface Match {
  id: number;
  home_team_detail?: { name: string };
  away_team_detail?: { name: string };
  home_score: number | null;
  away_score: number | null;
  date: string;
  status: string;
  week_number?: number | null;
}

interface PlayerStats {
  player_id: number;
  player_name: string;
  team_id: number;
  team_name: string;
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_percentage: number;
}

export default function SeasonDetailsScreen({
  route,
  navigation,
}: SeasonsStackScreenProps<"SeasonDetails">) {
  const { seasonId } = route.params;

  // Get upcoming matches from context and filter for this season
  const upcomingMatches = useUserContextStore((state) => state.upcomingMatches);
  const myTeams = useUserContextStore((state) => state.myTeams);
  const isOperatorFn = useUserContextStore((state) => state.isOperator);
  const myNextMatch = useMemo(() => {
    return upcomingMatches.find((m) => m.season_id === seasonId) || null;
  }, [upcomingMatches, seasonId]);
  const userTeamIds = useMemo(() => myTeams.map((t) => t.id), [myTeams]);

  const [season, setSeason] = useState<Season | null>(null);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [standingsCollapsed, setStandingsCollapsed] = useState(false);
  const [matchesCollapsed, setMatchesCollapsed] = useState(false);
  const [playersCollapsed, setPlayersCollapsed] = useState(false);

  const loadSeasonData = async () => {
    try {
      // Load season details
      const seasonResponse = await api.get<Season>(`/seasons/${seasonId}/`);
      setSeason(seasonResponse);

      // Load standings
      const standingsResponse = await api.get<{ standings: TeamStanding[] }>(
        `/seasons/${seasonId}/standings/`
      );
      setStandings(standingsResponse.standings || []);

      // Load matches
      const matchesResponse = await api.get<SeasonMatchesResponse>(
        `/seasons/${seasonId}/matches/`
      );
      setMatches(matchesResponse.matches);

      // Load players
      const playersResponse = await api.get<{ players: PlayerStats[] }>(
        `/seasons/${seasonId}/players/`
      );
      setPlayers(playersResponse.players || []);
    } catch (error) {
      console.error("Failed to load season data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSeasonData();
  }, [seasonId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeasonData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      return formatDateDisplay(dateString);
    } catch {
      return "TBD";
    }
  };

  // Group matches by week
  const matchesByWeek = matches.reduce((acc, match) => {
    const week = match.week_number || 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Get weeks sorted chronologically (ascending)
  const weeks = Object.keys(matchesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the upcoming week (first week with matches today or in the future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingWeek = weeks.find((week) =>
    matchesByWeek[week].some((match) => {
      const matchDate = new Date(match.date);
      return matchDate >= today;
    })
  );

  // Show only the upcoming week, or the last week if all completed
  const displayWeeks = upcomingWeek
    ? [upcomingWeek]
    : weeks.length > 0
    ? [weeks[weeks.length - 1]]
    : [];

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!season) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center">
          Failed to load season details
        </Text>
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
        {/* Overview Section */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Season Information
          </Text>
          {season.league_detail && (
            <View className="mb-3">
              <Text className="text-sm text-gray-500 mb-1">League</Text>
              <Text className="text-base text-gray-900">
                {season.league_detail.name}
              </Text>
            </View>
          )}
          <View className="space-y-3">
            <View className="flex-row items-center gap-2">
              <Calendar color="#6b7280" size={18} />
              <Text className="text-sm text-gray-600">
                {formatDate(season.start_date)}
                {season.end_date && ` - ${formatDate(season.end_date)}`}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Users color="#6b7280" size={18} />
              <Text className="text-sm text-gray-600">
                {season.team_count || standings.length}{" "}
                {(season.team_count || standings.length) === 1
                  ? "Team"
                  : "Teams"}
              </Text>
            </View>
            {/* <View className="flex-row items-center gap-2">
              <Trophy color="#6b7280" size={18} />
              <Text className="text-sm text-gray-600">
                {matches.filter((m) => m.status === "completed").length} /{" "}
                {matches.length} Matches Completed
              </Text>
            </View> */}
          </View>
        </View>

        {/* Season Schedule card — operators only */}
        {isOperatorFn(season.league) && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("SeasonSchedule", {
                seasonId,
                seasonName: season.name,
                leagueId: season.league,
              })
            }
            className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <CalendarDays color="#26A69A" size={20} />
              <Text className="text-base font-semibold text-gray-900">Season Schedule</Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        )}

        {/* Playoffs — visible to all users */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("PlayoffBracket", {
              seasonId,
              seasonName: season.name,
              leagueId: season.league,
            })
          }
          className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <Trophy color="#26A69A" size={20} />
            <Text className="text-base font-semibold text-gray-900">Playoffs</Text>
          </View>
          <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>

        {/* Manage Teams — operators only */}
        {isOperatorFn(season.league) && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TeamManagement", {
                seasonId,
                seasonName: season.name,
              })
            }
            className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Shield color="#26A69A" size={20} />
              <Text className="text-base font-semibold text-gray-900">Manage Teams</Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        )}

        {/* Rollover Season — operators only */}
        {isOperatorFn(season.league) && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("SeasonRollover", {
                seasonId,
                seasonName: season.name,
                leagueId: season.league,
              })
            }
            className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <RefreshCw color="#26A69A" size={20} />
              <Text className="text-base font-semibold text-gray-900">Rollover Season</Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        )}

        {/* Your Next Match Card - TODO: Navigate to MatchScoreScreen */}
        {myNextMatch && (
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center gap-2 mb-3">
              <Clock color="#26A69A" size={18} />
              <Text className="text-base font-bold text-gray-900">
                Your Next Match
              </Text>
            </View>
            <Text className="text-sm text-gray-500 mb-2">
              {formatDateDisplay(myNextMatch.date)}
            </Text>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {userTeamIds.includes(myNextMatch.home_team_id)
                ? `vs ${myNextMatch.away_team_name}`
                : `@ ${myNextMatch.home_team_name}`}
            </Text>
            <View className="flex-row items-center justify-between">
              <View
                className={`px-2 py-1 rounded ${
                  userTeamIds.includes(myNextMatch.home_team_id)
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    userTeamIds.includes(myNextMatch.home_team_id)
                      ? "text-green-700"
                      : "text-gray-600"
                  }`}
                >
                  {userTeamIds.includes(myNextMatch.home_team_id) ? "Home" : "Away"}
                </Text>
              </View>
              {myNextMatch.venue_name && (
                <View className="flex-row items-center gap-1">
                  <MapPin color="#9ca3af" size={14} />
                  <Text className="text-xs text-gray-500">
                    {myNextMatch.venue_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Standings Section - Top 5 */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-10">
          <TouchableOpacity
            onPress={() => setStandingsCollapsed(!standingsCollapsed)}
            className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <Text className="text-base font-bold text-gray-900">
              Team Standings
            </Text>
            {standingsCollapsed ? (
              <ChevronRight color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>
          {!standingsCollapsed && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FullStandings", {
                  seasonId,
                  seasonName: season.name,
                })
              }
            >
              {standings.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No standings data available
                  </Text>
                </View>
              ) : (
                <View>
                  {standings.slice(0, 5).map((team, index) => (
                    <View
                      key={`standing-${team.team_id}-${index}`}
                      className={`p-4 ${
                        index < 4 && index < standings.length - 1
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
                            <Text className="text-sm text-gray-600">
                              W: {team.wins}
                            </Text>
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
                  {standings.length > 5 && (
                    <View className="p-3 bg-gray-50 border-t border-gray-200">
                      <Text className="text-sm text-primary text-center font-medium">
                        View All {standings.length} Teams →
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Matches Section - Recent Weeks */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-10">
          <TouchableOpacity
            onPress={() => setMatchesCollapsed(!matchesCollapsed)}
            className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <Text className="text-base font-bold text-gray-900">Matches</Text>
            {matchesCollapsed ? (
              <ChevronRight color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>
          {!matchesCollapsed && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FullMatches", {
                  seasonId,
                  seasonName: season.name,
                })
              }
            >
              <View className="p-4 space-y-4">
                {matches.length === 0 ? (
                  <View className="p-4">
                    <Text className="text-gray-400 text-center">
                      No matches scheduled
                    </Text>
                  </View>
                ) : (
                  <>
                    {displayWeeks.map((weekNum) => (
                      <View key={`week-${weekNum}`} className="space-y-2">
                        <Text className="text-sm font-bold text-gray-700 mb-2">
                          Week {weekNum}
                        </Text>
                        {matchesByWeek[weekNum].map((match, index) => (
                          <View
                            key={`match-${match.id}-${index}`}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-2"
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <Text className="text-xs text-gray-500">
                                {formatDate(match.date)}
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
                                  {match.status === "completed"
                                    ? "Final"
                                    : "Scheduled"}
                                </Text>
                              </View>
                            </View>
                            <View className="flex-row items-center justify-between">
                              <Text className="text-sm font-medium text-gray-900 flex-1">
                                {match.home_team_detail?.name || "TBD"}
                              </Text>
                              <View className="flex-row items-center gap-2">
                                <Text className="text-base font-bold text-gray-900">
                                  {match.home_score ?? "-"}
                                </Text>
                                <Text className="text-xs text-gray-400">vs</Text>
                                <Text className="text-base font-bold text-gray-900">
                                  {match.away_score ?? "-"}
                                </Text>
                              </View>
                              <Text className="text-sm font-medium text-gray-900 flex-1 text-right">
                                {match.away_team_detail?.name || "TBD"}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                    {weeks.length > 0 && (
                      <View className="p-3 bg-gray-50 border-t border-gray-200 rounded-lg">
                        <Text className="text-sm text-primary text-center font-medium">
                          View All Matches →
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Players Section - Top 5 */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-10">
          <TouchableOpacity
            onPress={() => setPlayersCollapsed(!playersCollapsed)}
            className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <Text className="text-base font-bold text-gray-900">
              Player Statistics
            </Text>
            {playersCollapsed ? (
              <ChevronRight color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>
          {!playersCollapsed && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FullPlayers", {
                  seasonId,
                  seasonName: season.name,
                })
              }
            >
              {players.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No player data available
                  </Text>
                </View>
              ) : (
                <View>
                  {players
                    .sort((a, b) => b.total_wins - a.total_wins)
                    .slice(0, 5)
                    .map((player, index) => (
                      <View
                        key={`player-${player.player_id}-${index}`}
                        className={`p-4 ${
                          index < 4 && index < players.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-base font-semibold text-gray-900 flex-1">
                            {player.player_name}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {player.team_name}
                          </Text>
                        </View>
                        <View className="flex-row gap-4">
                          <Text className="text-sm text-gray-600">
                            W: {player.total_wins}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            L: {player.total_losses}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            GP: {player.total_games}
                          </Text>
                          {player.total_games > 0 && (
                            <Text className="text-sm text-gray-600">
                              Win%: {player.win_percentage.toFixed(0)}%
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  {players.length > 5 && (
                    <View className="p-3 bg-gray-50 border-t border-gray-200">
                      <Text className="text-sm text-primary text-center font-medium">
                        View All {players.length} Players →
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
