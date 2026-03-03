import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { MapPin, Calendar, Plus } from "lucide-react-native";
import { useState, useEffect } from "react";
import { api } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { LeaguesStackScreenProps } from "../navigation/types";

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

export default function LeaguesScreen({ navigation }: LeaguesStackScreenProps<"LeaguesScreen">) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const loadLeagues = async () => {
    try {
      const response = await api.get<{ results: League[] }>("/leagues/");
      const activeLeagues = response.results.filter((l) => l.is_active);
      setLeagues(activeLeagues);
    } catch (error) {
      console.error("Failed to load leagues:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Pool Leagues
            </Text>
            <Text className="text-gray-600">
              Select a league to view standings and statistics
            </Text>
          </View>

          {/* Leagues List */}
          {leagues.length === 0 ? (
            <View className="pb-24 items-center">
              <View className="bg-white rounded-lg p-8 border border-gray-200 items-center w-full">
                <Text className="text-gray-400 text-center">
                  No active leagues found
                </Text>
              </View>
            </View>
          ) : (
            <View className="pb-24">
              {leagues.map((league) => (
                <TouchableOpacity
                  key={league.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 active:border-primary mb-4"
                  onPress={() =>
                    navigation.navigate("LeagueDetails", {
                      leagueId: league.id,
                      leagueName: league.name,
                    })
                  }
                >
                  <View className="mb-3">
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                      {league.name}
                    </Text>
                    {league.description && (
                      <Text className="text-sm text-gray-600" numberOfLines={2}>
                        {league.description}
                      </Text>
                    )}
                  </View>

                  <View className="space-y-2">
                    {(league.city || league.state) && (
                      <View className="flex-row items-center gap-2">
                        <MapPin color="#6b7280" size={16} />
                        <Text className="text-sm text-gray-600">
                          {[league.city, league.state].filter(Boolean).join(", ")}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-2">
                      <Calendar color="#6b7280" size={16} />
                      <Text className="text-sm text-gray-600">Active League</Text>
                    </View>
                  </View>

                  <View className="mt-4 pt-4 border-t border-gray-200">
                    <Text className="text-sm font-medium text-primary text-center">
                      View Seasons →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create League FAB */}
      {isAuthenticated && (
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateLeague", undefined)}
          className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center"
          style={{ elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
        >
          <Plus size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
