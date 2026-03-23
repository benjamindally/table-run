import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Calendar,
  CalendarDays,
  Users,
  ChevronRight,
  ChevronDown,
  Clock,
  MapPin,
  Shield,
  Trophy,
  RefreshCw,
  Archive,
} from "lucide-react-native";
import { useState, useEffect, useMemo } from "react";
import {
  api,
  formatDateDisplay,
  type SeasonMatchesResponse,
} from "@league-genius/shared";
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
          </View>
        </View>

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
                  {userTeamIds.includes(myNextMatch.home_team_id)
                    ? "Home"
                    : "Away"}
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

        {/* Standings Section - Grid Tiles */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
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
            <>
              {standings.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No standings data available
                  </Text>
                </View>
              ) : (
                <View
                  className="p-3"
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {standings.slice(0, 6).map((team, index) => (
                    <TouchableOpacity
                      key={`standing-${team.team_id}-${index}`}
                      onPress={() =>
                        navigation.navigate("FullStandings", {
                          seasonId,
                          seasonName: season.name,
                        })
                      }
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-2"
                      style={{ width: "48%" }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                          <Text className="text-white font-bold text-xs">
                            {index + 1}
                          </Text>
                        </View>
                        <Text
                          className="text-sm font-semibold text-gray-900 flex-1"
                          numberOfLines={1}
                        >
                          {team.team_name}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-xs text-gray-500">
                          {team.wins}W - {team.losses}L
                        </Text>
                        <Text className="text-sm font-bold text-primary">
                          {team.points}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {standings.length > 6 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("FullStandings", {
                      seasonId,
                      seasonName: season.name,
                    })
                  }
                  className="p-3 bg-gray-50 border-t border-gray-200"
                >
                  <Text className="text-sm text-primary text-center font-medium">
                    View All {standings.length} Teams →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Matches Section - Grid Tiles */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
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
            <>
              {matches.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No matches scheduled
                  </Text>
                </View>
              ) : (
                <>
                  {displayWeeks.map((weekNum) => (
                    <View key={`week-${weekNum}`} className="p-3">
                      <Text className="text-sm font-bold text-gray-700 mb-2">
                        Week {weekNum}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                        }}
                      >
                        {matchesByWeek[weekNum].map((match, index) => (
                          <TouchableOpacity
                            key={`match-${match.id}-${index}`}
                            onPress={() =>
                              navigation.navigate("MatchDetails", {
                                matchId: match.id,
                              })
                            }
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-2"
                            style={{ width: "48%" }}
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <Text
                                className="text-xs text-gray-500"
                                numberOfLines={1}
                              >
                                {formatDate(match.date)}
                              </Text>
                              <View
                                className={`px-1.5 py-0.5 rounded ${
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
                                    : "Sched"}
                                </Text>
                              </View>
                            </View>
                            <Text
                              className="text-sm font-medium text-gray-900"
                              numberOfLines={1}
                            >
                              {match.home_team_detail?.name || "TBD"}
                            </Text>
                            <View className="flex-row items-center gap-1 my-0.5">
                              <Text className="text-xs text-gray-400">vs</Text>
                              <Text className="text-sm font-bold text-gray-900">
                                {match.home_score ?? "-"} -{" "}
                                {match.away_score ?? "-"}
                              </Text>
                            </View>
                            <Text
                              className="text-sm font-medium text-gray-900"
                              numberOfLines={1}
                            >
                              {match.away_team_detail?.name || "TBD"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </>
              )}
              {weeks.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("FullMatches", {
                      seasonId,
                      seasonName: season.name,
                    })
                  }
                  className="p-3 bg-gray-50 border-t border-gray-200"
                >
                  <Text className="text-sm text-primary text-center font-medium">
                    View All Matches →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Players Section - Grid Tiles */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
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
            <>
              {players.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No player data available
                  </Text>
                </View>
              ) : (
                <View
                  className="p-3"
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {players
                    .sort((a, b) => b.total_wins - a.total_wins)
                    .slice(0, 6)
                    .map((player, index) => (
                      <TouchableOpacity
                        key={`player-${player.player_id}-${index}`}
                        onPress={() =>
                          navigation.navigate("FullPlayers", {
                            seasonId,
                            seasonName: season.name,
                          })
                        }
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-2"
                        style={{ width: "48%" }}
                      >
                        <Text
                          className="text-sm font-semibold text-gray-900"
                          numberOfLines={1}
                        >
                          {player.player_name}
                        </Text>
                        <Text
                          className="text-xs text-gray-500 mb-1"
                          numberOfLines={1}
                        >
                          {player.team_name}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-600">
                            {player.total_wins}W - {player.total_losses}L
                          </Text>
                          {player.total_games > 0 && (
                            <Text className="text-xs font-bold text-primary">
                              {player.win_percentage.toFixed(0)}%
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
              {players.length > 6 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("FullPlayers", {
                      seasonId,
                      seasonName: season.name,
                    })
                  }
                  className="p-3 bg-gray-50 border-t border-gray-200"
                >
                  <Text className="text-sm text-primary text-center font-medium">
                    View All {players.length} Players →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Action Tiles — 2x2 grid */}
        {(() => {
          const isOperator = isOperatorFn(season.league);
          const actionItems: {
            key: string;
            label: string;
            icon: React.ReactNode;
          }[] = [
            ...(isOperator
              ? [
                  {
                    key: "schedule",
                    label: "Schedule",
                    icon: <CalendarDays color="#26A69A" size={24} />,
                  },
                ]
              : []),
            {
              key: "playoffs",
              label: "Playoffs",
              icon: <Trophy color="#26A69A" size={24} />,
            },
            ...(isOperator
              ? [
                  {
                    key: "teams",
                    label: "Manage Teams",
                    icon: <Shield color="#26A69A" size={24} />,
                  },
                  {
                    key: "rollover",
                    label: "Rollover",
                    icon: <RefreshCw color="#26A69A" size={24} />,
                  },
                ]
              : []),
          ];

          const handleActionPress = (key: string) => {
            switch (key) {
              case "schedule":
                navigation.navigate("SeasonSchedule", {
                  seasonId,
                  seasonName: season.name,
                  leagueId: season.league,
                });
                break;
              case "playoffs":
                navigation.navigate("PlayoffBracket", {
                  seasonId,
                  seasonName: season.name,
                  leagueId: season.league,
                });
                break;
              case "teams":
                navigation.navigate("TeamManagement", {
                  seasonId,
                  seasonName: season.name,
                });
                break;
              case "rollover":
                navigation.navigate("SeasonRollover", {
                  seasonId,
                  seasonName: season.name,
                  leagueId: season.league,
                });
                break;
            }
          };

          return (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              {actionItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handleActionPress(item.key)}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 items-center justify-center mb-2"
                  style={{ width: "48%" }}
                >
                  {item.icon}
                  <Text className="text-xs font-semibold text-gray-900 mt-2 text-center">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}

        {/* Archive Season — operators only */}
        {isOperatorFn(season.league) && (
          <TouchableOpacity
            onPress={() => {
              if (season.is_archived) {
                Alert.alert(
                  "Unarchive Season?",
                  "This will make the season visible in active season lists again.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Unarchive",
                      onPress: async () => {
                        try {
                          await api.patch(`/seasons/${seasonId}/`, {
                            is_archived: false,
                          });
                          setSeason({ ...season, is_archived: false });
                        } catch (error) {
                          console.error("Failed to unarchive season:", error);
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Archive Season?",
                  "This will hide the season from active season lists. You can unarchive it later.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Archive",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await api.patch(`/seasons/${seasonId}/`, {
                            is_archived: true,
                          });
                          navigation.goBack();
                        } catch (error) {
                          console.error("Failed to archive season:", error);
                        }
                      },
                    },
                  ]
                );
              }
            }}
            className={`rounded-lg p-3 border flex-row items-center justify-center gap-2 ${
              season.is_archived
                ? "bg-white border-gray-300"
                : "bg-red-50 border-red-200"
            }`}
          >
            <Archive
              color={season.is_archived ? "#6b7280" : "#dc2626"}
              size={18}
            />
            <Text
              className={`text-sm font-semibold ${
                season.is_archived ? "text-gray-700" : "text-red-600"
              }`}
            >
              {season.is_archived ? "Unarchive Season" : "Archive Season"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
