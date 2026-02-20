import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  MapPin,
  Users,
  Calendar,
  Trophy,
  ChevronRight,
  ChevronDown,
  Mail,
  Crown,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { teamsApi } from "@league-genius/shared";
import type {
  Team,
  TeamMembership,
  SeasonParticipation,
} from "@league-genius/shared";
import type { RootStackScreenProps } from "../navigation/types";
import { useUserContextStore } from "../stores/userContextStore";

export default function TeamDetailsScreen({
  route,
  navigation,
}: RootStackScreenProps<"TeamDetails">) {
  const { teamId } = route.params;
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamMembership[]>([]);
  const [seasons, setSeasons] = useState<SeasonParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [seasonsCollapsed, setSeasonsCollapsed] = useState(false);

  const isCaptain = useUserContextStore((state) => state.isCaptain);
  const isTeamCaptain = isCaptain(teamId);

  const loadTeamData = async () => {
    try {
      const [teamResponse, rosterResponse, seasonsResponse] = await Promise.all([
        teamsApi.getById(teamId),
        teamsApi.getRoster(teamId),
        teamsApi.getSeasons(teamId),
      ]);

      setTeam(teamResponse);
      setRoster(rosterResponse);
      setSeasons(seasonsResponse);
    } catch (error) {
      console.error("Failed to load team data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamData();
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

  // Get captain IDs for highlighting
  const captainIds = team?.captains_detail?.map((c) => c.player) || [];

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!team) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center">
          Failed to load team details
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
        {/* Team Overview Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {team.name}
              </Text>
              {team.establishment && (
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin color="#6b7280" size={14} />
                  <Text className="text-sm text-gray-600">
                    {team.establishment}
                  </Text>
                </View>
              )}
            </View>
            <View
              className={`px-3 py-1 rounded-full ${
                team.active ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  team.active ? "text-green-700" : "text-gray-600"
                }`}
              >
                {team.active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-4 pt-3 border-t border-gray-100">
            <View className="flex-row items-center gap-2">
              <Users color="#6b7280" size={16} />
              <Text className="text-sm text-gray-600">
                {roster.length} {roster.length === 1 ? "Player" : "Players"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Calendar color="#6b7280" size={16} />
              <Text className="text-sm text-gray-600">
                Created {formatDate(team.created_at)}
              </Text>
            </View>
          </View>

          {/* Captain Badge for Current User */}
          {isTeamCaptain && (
            <View className="mt-3 bg-amber-50 rounded-lg p-3 flex-row items-center gap-2">
              <Crown color="#d97706" size={16} />
              <Text className="text-sm text-amber-700 font-medium">
                You are a captain of this team
              </Text>
            </View>
          )}
        </View>

        {/* Team Captains Section */}
        {team.captains_detail && team.captains_detail.length > 0 && (
          <View className="bg-white rounded-lg p-4 border border-gray-200 mt-3">
            <View className="flex-row items-center gap-2 mb-3">
              <Crown color="#d97706" size={18} />
              <Text className="text-base font-bold text-gray-900">
                Team Leadership
              </Text>
            </View>
            <View className="space-y-2">
              {team.captains_detail.map((captain) => (
                <View
                  key={captain.id}
                  className="flex-row items-center justify-between p-3 bg-amber-50 rounded-lg"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                      <Text className="text-sm font-bold text-amber-700">
                        {captain.player_detail?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-medium text-gray-900">
                        {captain.player_detail?.full_name}
                      </Text>
                      <Text className="text-xs text-gray-500">Captain</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500">
                    {formatDate(captain.appointed_at)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Team Roster Section */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3">
          <TouchableOpacity
            onPress={() => setRosterCollapsed(!rosterCollapsed)}
            className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Users color="#26A69A" size={18} />
              <Text className="text-base font-bold text-gray-900">
                Team Roster
              </Text>
              <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600">{roster.length}</Text>
              </View>
            </View>
            {rosterCollapsed ? (
              <ChevronRight color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>

          {!rosterCollapsed && (
            <View>
              {roster.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    No players on the roster yet
                  </Text>
                </View>
              ) : (
                <View>
                  {roster.map((membership, index) => {
                    const isMemberCaptain = captainIds.includes(membership.player);
                    return (
                      <View
                        key={membership.id}
                        className={`p-4 flex-row items-center justify-between ${
                          index < roster.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                              isMemberCaptain ? "bg-amber-100" : "bg-primary-100"
                            }`}
                          >
                            <Text
                              className={`text-sm font-bold ${
                                isMemberCaptain ? "text-amber-700" : "text-primary"
                              }`}
                            >
                              {membership.player_detail?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="font-medium text-gray-900">
                                {membership.player_detail?.full_name}
                              </Text>
                              {isMemberCaptain && (
                                <Crown color="#d97706" size={14} />
                              )}
                            </View>
                            {membership.player_detail?.email && (
                              <View className="flex-row items-center gap-1 mt-0.5">
                                <Mail color="#9ca3af" size={12} />
                                <Text
                                  className="text-xs text-gray-500"
                                  numberOfLines={1}
                                >
                                  {membership.player_detail.email}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="items-end">
                          <View
                            className={`px-2 py-1 rounded-full ${
                              membership.is_active
                                ? "bg-green-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                membership.is_active
                                  ? "text-green-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {membership.is_active ? "Active" : "Inactive"}
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-400 mt-1">
                            Joined {formatDate(membership.joined_at)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Season History Section */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3">
          <TouchableOpacity
            onPress={() => setSeasonsCollapsed(!seasonsCollapsed)}
            className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Trophy color="#26A69A" size={18} />
              <Text className="text-base font-bold text-gray-900">
                Season History
              </Text>
              <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600">{seasons.length}</Text>
              </View>
            </View>
            {seasonsCollapsed ? (
              <ChevronRight color="#6b7280" size={20} />
            ) : (
              <ChevronDown color="#6b7280" size={20} />
            )}
          </TouchableOpacity>

          {!seasonsCollapsed && (
            <View>
              {seasons.length === 0 ? (
                <View className="p-8">
                  <Text className="text-gray-400 text-center">
                    This team hasn't participated in any seasons yet
                  </Text>
                </View>
              ) : (
                <View>
                  {seasons.map((participation, index) => (
                    <TouchableOpacity
                      key={participation.id}
                      onPress={() =>
                        navigation.navigate("Main", {
                          screen: "Seasons",
                          params: {
                            screen: "SeasonDetails",
                            params: { seasonId: participation.season },
                          },
                        } as any)
                      }
                      className={`p-4 ${
                        index < seasons.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Calendar color="#6b7280" size={16} />
                            <Text className="font-medium text-gray-900">
                              {participation.season_detail?.name || "Unknown Season"}
                            </Text>
                          </View>
                          {participation.season_detail?.league_name && (
                            <Text className="text-sm text-gray-500 mt-1 ml-6">
                              {participation.season_detail.league_name}
                            </Text>
                          )}
                        </View>
                        <View
                          className={`px-2 py-1 rounded-full ${
                            participation.is_active
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              participation.is_active
                                ? "text-green-700"
                                : "text-gray-600"
                            }`}
                          >
                            {participation.is_active ? "Active" : "Completed"}
                          </Text>
                        </View>
                      </View>

                      {/* Record Stats */}
                      <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3 mt-2">
                        <View className="flex-row gap-4">
                          <View className="items-center">
                            <Text className="text-xs text-gray-500 mb-1">
                              Record
                            </Text>
                            <Text className="text-sm font-bold">
                              <Text className="text-green-600">
                                {participation.wins}
                              </Text>
                              {" - "}
                              <Text className="text-red-600">
                                {participation.losses}
                              </Text>
                            </Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-xs text-gray-500 mb-1">
                              Win %
                            </Text>
                            <Text className="text-sm font-bold text-gray-900">
                              {participation.win_percentage?.toFixed(1) || 0}%
                            </Text>
                          </View>
                        </View>
                        <ChevronRight color="#9ca3af" size={20} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
