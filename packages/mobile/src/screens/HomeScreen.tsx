import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  LogIn,
  UserPlus,
  MapPin,
  Users,
  Trophy,
  Shield,
  ChevronRight,
  Calendar,
} from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import { api } from "@league-genius/shared";
import { HorizontalTileScroller } from "../components/HorizontalTileScroller";

interface League {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [topLeagues, setTopLeagues] = useState<League[]>([]);
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // User context from /me/ endpoint
  const player = useUserContextStore((state) => state.player);
  const myTeams = useUserContextStore((state) => state.myTeams);
  const mySeasons = useUserContextStore((state) => state.mySeasons);
  const myLeagues = useUserContextStore((state) => state.myLeagues);
  const upcomingMatches = useUserContextStore((state) => state.upcomingMatches);
  const isLoaded = useUserContextStore((state) => state.isLoaded);
  const loadUserContext = useUserContextStore((state) => state.loadUserContext);

  const loadTopLeagues = async () => {
    try {
      const response = await api.get<{ results: League[] }>("/leagues/");
      const activeLeagues = response.results.filter((l) => l.is_active);
      setTopLeagues(activeLeagues.slice(0, 5));
    } catch (error) {
      console.error("Failed to load top leagues:", error);
    }
  };

  useEffect(() => {
    loadTopLeagues();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTopLeagues(), loadUserContext()]);
    setRefreshing(false);
  };

  const handleLogin = () => {
    navigation.navigate("Auth" as never);
  };

  // Get display name
  const displayName = player?.full_name || user?.first_name || user?.email?.split("@")[0] || "there";

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Login/Signup CTA for guests */}
        {!isAuthenticated && (
          <View className="bg-gradient-to-r from-primary to-primary-600 rounded-lg p-6 border border-primary-200 mb-4 bg-primary">
            <Text className="text-2xl font-bold text-white mb-2">
              Join League Genius!
            </Text>
            <Text className="text-primary-50 mb-4">
              Create an account to manage teams, track scores, and compete in
              leagues.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleLogin}
                className="flex-1 bg-white rounded-md px-4 py-3 flex-row items-center justify-center gap-2"
              >
                <LogIn color="#26A69A" size={20} />
                <Text className="text-primary font-semibold">Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                className="flex-1 bg-primary-700 rounded-md px-4 py-3 flex-row items-center justify-center gap-2"
              >
                <UserPlus color="#fff" size={20} />
                <Text className="text-white font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Welcome Card */}
        {isAuthenticated && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <Text className="text-xl font-semibold text-gray-900">
              Welcome back, {displayName}!
            </Text>
            <Text className="text-gray-500 mt-1">
              Here's what's happening in your leagues.
            </Text>
          </View>
        )}

        {/* My Teams Section */}
        {isAuthenticated && isLoaded && myTeams.length > 0 && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Users color="#26A69A" size={18} />
                <Text className="text-sm font-medium text-gray-500">
                  MY TEAMS
                </Text>
              </View>
              <Text className="text-xs text-gray-400">{myTeams.length} team{myTeams.length !== 1 ? 's' : ''}</Text>
            </View>
            {myTeams.map((team) => (
              <TouchableOpacity
                key={team.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  navigation.navigate("TeamDetails", {
                    teamId: team.id,
                    teamName: team.name,
                  })
                }
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-medium text-gray-900">
                      {team.name}
                    </Text>
                    {team.is_captain && (
                      <View className="bg-amber-100 rounded px-1.5 py-0.5">
                        <Text className="text-amber-700 text-xs font-medium">Captain</Text>
                      </View>
                    )}
                  </View>
                  {team.establishment && (
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {team.establishment}
                    </Text>
                  )}
                </View>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Seasons Section */}
        {isAuthenticated && isLoaded && mySeasons.length > 0 && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Trophy color="#26A69A" size={18} />
                <Text className="text-sm font-medium text-gray-500">
                  ACTIVE SEASONS
                </Text>
              </View>
              <Text className="text-xs text-gray-400">{mySeasons.filter(s => s.is_active).length} active</Text>
            </View>
            {mySeasons.filter(s => s.is_active).map((season) => (
              <TouchableOpacity
                key={season.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  navigation.navigate("Seasons", {
                    screen: "SeasonDetails",
                    params: {
                      seasonId: season.id,
                      seasonName: season.name,
                    },
                  })
                }
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {season.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {season.league_name}
                  </Text>
                </View>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Leagues Section (for operators) */}
        {isAuthenticated && isLoaded && myLeagues.length > 0 && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Shield color="#26A69A" size={18} />
                <Text className="text-sm font-medium text-gray-500">
                  MY LEAGUES
                </Text>
              </View>
              <Text className="text-xs text-gray-400">{myLeagues.length} league{myLeagues.length !== 1 ? 's' : ''}</Text>
            </View>
            {myLeagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  navigation.navigate("Leagues", {
                    screen: "LeagueDetails",
                    params: {
                      leagueId: league.id,
                      leagueName: league.name,
                    },
                  })
                }
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-medium text-gray-900">
                      {league.name}
                    </Text>
                    {league.is_operator && (
                      <View className="bg-primary-100 rounded px-1.5 py-0.5">
                        <Text className="text-primary-700 text-xs font-medium">
                          {league.role === 'owner' ? 'Owner' : 'Operator'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {(league.city || league.state) && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <MapPin color="#9ca3af" size={12} />
                      <Text className="text-sm text-gray-500">
                        {[league.city, league.state].filter(Boolean).join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state for authenticated users with no data */}
        {isAuthenticated && isLoaded && myTeams.length === 0 && myLeagues.length === 0 && (
          <View className="bg-white rounded-lg p-6 border border-gray-200 mb-4 items-center">
            <Text className="text-gray-400 text-center mb-2">
              You're not part of any teams or leagues yet.
            </Text>
            <Text className="text-gray-500 text-center text-sm">
              Browse the Leagues tab to find leagues near you!
            </Text>
          </View>
        )}

        {/* Upcoming Matches - Only for authenticated users */}
        {isAuthenticated && myTeams.length > 0 && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Calendar color="#26A69A" size={18} />
              <Text className="text-sm font-medium text-gray-500">
                UPCOMING MATCHES
              </Text>
            </View>
            <HorizontalTileScroller
              data={upcomingMatches}
              keyExtractor={(match) => match.id}
              onItemPress={(match) =>
                navigation.navigate("Matches", {
                  screen: "MatchDetails",
                  params: { matchId: match.id },
                })
              }
              seeAllText="All Matches"
              onSeeAllPress={() => navigation.navigate("Matches")}
              emptyMessage="No upcoming matches"
              renderItem={(match) => (
                <>
                  <Text className="text-xs text-gray-500 mb-1">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text
                    className="text-sm font-semibold text-gray-900 mb-1"
                    numberOfLines={2}
                  >
                    {match.home_team_name} vs {match.away_team_name}
                  </Text>
                  {match.venue_name && (
                    <View className="flex-row items-center gap-1">
                      <MapPin color="#9ca3af" size={12} />
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {match.venue_name}
                      </Text>
                    </View>
                  )}
                </>
              )}
            />
          </View>
        )}

        {/* Guest Info - For non-authenticated users */}
        {!isAuthenticated && (
          <View className="bg-white rounded-lg p-5 border border-gray-200">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Explore Leagues
            </Text>
            <Text className="text-gray-600 mb-4">
              Browse active leagues, view standings, and see match results
              without signing in. Tap the Leagues tab below to get started!
            </Text>

            {/* Top Leagues Horizontal Scroll */}
            <HorizontalTileScroller
              title="TOP PUBLIC LEAGUES"
              data={topLeagues}
              keyExtractor={(league) => league.id}
              onItemPress={(league) =>
                navigation.navigate("Leagues", {
                  screen: "LeagueDetails",
                  params: {
                    leagueId: league.id,
                    leagueName: league.name,
                  },
                })
              }
              seeAllText="All Leagues"
              onSeeAllPress={() => navigation.navigate("Leagues")}
              renderItem={(league) => (
                <>
                  <View className="mb-2">
                    <View className="bg-primary rounded px-2 py-0.5 self-start mb-2">
                      <Text className="text-white text-xs font-medium">
                        Active
                      </Text>
                    </View>
                    <Text
                      className="text-sm font-semibold text-gray-900 mb-2"
                      numberOfLines={2}
                    >
                      {league.name}
                    </Text>
                  </View>
                  {(league.city || league.state) && (
                    <View className="flex-row items-center gap-1">
                      <MapPin color="#9ca3af" size={12} />
                      <Text
                        className="text-xs text-gray-500"
                        numberOfLines={1}
                      >
                        {[league.city, league.state]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    </View>
                  )}
                </>
              )}
            />

            <View className="bg-gray-50 rounded-md p-4 border border-gray-100">
              <Text className="text-sm text-gray-500 font-medium mb-1">
                Pro Tip
              </Text>
              <Text className="text-sm text-gray-600">
                Sign up to join teams, submit scores, and track your stats
                across seasons.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
