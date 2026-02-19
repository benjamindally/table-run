import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Calendar, MapPin, ChevronRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { api, type League, type Season } from "@league-genius/shared";
import type { LeaguesStackParamList, MainTabParamList } from "../navigation/types";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LeaguesStackParamList, "LeagueDetails">,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  route: { params: { leagueId: number; leagueName: string } };
}

export default function LeagueDetailsScreen({ route }: Props) {
  const { leagueId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [leagueResponse, seasonsResponse] = await Promise.all([
        api.get<League>(`/leagues/${leagueId}/`),
        api.get<{ results: Season[] }>("/seasons/"),
      ]);
      setLeague(leagueResponse);
      // Filter seasons for this league
      const leagueSeasons = seasonsResponse.results
        .filter((s) => s.league === leagueId)
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      setSeasons(leagueSeasons);
    } catch (error) {
      console.error("Failed to load league:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!league) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-500 text-center">League not found</Text>
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
      <View className="p-4">
        {/* League Info Card */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {league.name}
          </Text>

          <View className="flex-row items-center gap-2 mb-2">
            <MapPin color="#6b7280" size={16} />
            <Text className="text-sm text-gray-600">
              {league.city}, {league.state}
            </Text>
          </View>

          {league.description && (
            <Text className="text-gray-600 mt-2">{league.description}</Text>
          )}

          <View className="mt-4 pt-4 border-t border-gray-200">
            <Text className="text-xs text-gray-500">
              {league.games_per_set} games per set • {league.sets_per_match} sets per match
            </Text>
          </View>
        </View>

        {/* Seasons Section */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Seasons</Text>

          {seasons.length === 0 ? (
            <View className="bg-white rounded-lg p-6 border border-gray-200 items-center">
              <Calendar color="#9ca3af" size={32} />
              <Text className="text-gray-500 text-center mt-2">
                No seasons yet
              </Text>
            </View>
          ) : (
            <View className="space-y-2">
              {seasons.slice(0, 5).map((season) => (
                <TouchableOpacity
                  key={season.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => {
                    // Navigate to Seasons tab with this season
                    navigation.navigate("Seasons", {
                      screen: "SeasonDetails",
                      params: { seasonId: season.id },
                    } as any);
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {season.name}
                    </Text>
                    <Text className={`text-xs ${season.is_active ? "text-green-600" : "text-gray-500"}`}>
                      {season.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  <ChevronRight color="#9ca3af" size={20} />
                </TouchableOpacity>
              ))}

              {seasons.length > 5 && (
                <TouchableOpacity
                  className="p-3"
                  onPress={() => {
                    navigation.navigate("Seasons", {
                      screen: "SeasonsScreen",
                      params: { leagueId },
                    } as any);
                  }}
                >
                  <Text className="text-primary text-center font-medium">
                    View all {seasons.length} seasons
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
