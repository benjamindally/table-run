import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Calendar, Users, ChevronRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, type Season } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { SeasonsStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<SeasonsStackParamList>;

export default function SeasonsTabScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const { mySeasons, myLeagues, isLoaded: contextLoaded } = useUserContextStore();

  const [publicSeasons, setPublicSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPublicSeasons = async () => {
    try {
      const response = await api.get<{ results: Season[] }>("/seasons/");
      // Filter to active seasons and sort by most recent
      const activeSeasons = response.results
        .filter((s) => s.is_active && !s.is_archived)
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      setPublicSeasons(activeSeasons);
    } catch (error) {
      console.error("Failed to load seasons:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // For anonymous users or if user has no seasons, load public seasons
    if (!isAuthenticated || mySeasons.length === 0) {
      loadPublicSeasons();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, mySeasons.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && mySeasons.length > 0) {
      await useUserContextStore.getState().loadUserContext();
      setRefreshing(false);
    } else {
      await loadPublicSeasons();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-green-600" : "text-gray-500";
  };

  if (loading || (isAuthenticated && !contextLoaded)) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  // Determine which seasons to show
  const seasonsToShow = isAuthenticated && mySeasons.length > 0 ? mySeasons : publicSeasons;
  const showingMySeasons = isAuthenticated && mySeasons.length > 0;

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
            {showingMySeasons ? "My Seasons" : "Active Seasons"}
          </Text>
          <Text className="text-gray-600">
            {showingMySeasons
              ? "Seasons from leagues you're part of"
              : "Browse active seasons across all leagues"}
          </Text>
        </View>

        {/* Browse All Link for authenticated users */}
        {showingMySeasons && (
          <TouchableOpacity
            className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex-row items-center justify-between"
            onPress={() => {
              // TODO: Navigate to all public seasons view
            }}
          >
            <Text className="text-primary font-medium">Browse All Public Seasons</Text>
            <ChevronRight color="#26A69A" size={20} />
          </TouchableOpacity>
        )}

        {/* Seasons List */}
        {seasonsToShow.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Calendar color="#9ca3af" size={48} />
            <Text className="text-gray-500 text-center mt-4 text-lg font-medium">
              No seasons found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {isAuthenticated
                ? "Join a league to see your seasons here"
                : "Check back later for active seasons"}
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {seasonsToShow.map((season) => (
              <TouchableOpacity
                key={season.id}
                className="bg-white rounded-lg p-4 border border-gray-200 active:border-primary mb-4"
                onPress={() =>
                  navigation.navigate("SeasonDetails", { seasonId: season.id })
                }
              >
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xl font-bold text-gray-900 flex-1">
                      {season.name}
                    </Text>
                    <Text
                      className={`text-sm font-medium ${getStatusColor(season.is_active)}`}
                    >
                      {season.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  {"league_name" in season && (
                    <Text className="text-sm text-gray-500">
                      {(season as { league_name: string }).league_name}
                    </Text>
                  )}
                </View>

                <View className="space-y-2">
                  <View className="flex-row items-center gap-2">
                    <Calendar color="#6b7280" size={16} />
                    <Text className="text-sm text-gray-600">
                      {formatDate(season.start_date)}
                      {season.end_date && ` - ${formatDate(season.end_date)}`}
                    </Text>
                  </View>
                  {"team_count" in season && (season as { team_count?: number }).team_count !== undefined && (
                    <View className="flex-row items-center gap-2">
                      <Users color="#6b7280" size={16} />
                      <Text className="text-sm text-gray-600">
                        {(season as { team_count: number }).team_count}{" "}
                        {(season as { team_count: number }).team_count === 1 ? "Team" : "Teams"}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-sm font-medium text-primary text-center">
                    View Season Details
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
