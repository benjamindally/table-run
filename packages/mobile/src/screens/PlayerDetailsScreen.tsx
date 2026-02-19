import { View, Text, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { User } from "lucide-react-native";
import { api } from "@league-genius/shared";
import type { PlayersStackScreenProps } from "../navigation/types";

interface PlayerDetail {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  skill_level: number | null;
}

export default function PlayerDetailsScreen({
  route,
}: PlayersStackScreenProps<"PlayerDetails">) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const response = await api.get<PlayerDetail>(`/players/${playerId}/`);
        setPlayer(response);
      } catch (error) {
        console.error("Failed to load player:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!player) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-500 text-center">Player not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-6 border border-gray-200 items-center">
        {/* Avatar */}
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
          <User color="#9ca3af" size={48} />
        </View>

        {/* Name */}
        <Text className="text-2xl font-bold text-gray-900 text-center">
          {player.full_name}
        </Text>

        {/* Skill Level */}
        {player.skill_level && (
          <View className="mt-3 bg-primary px-4 py-2 rounded-full">
            <Text className="text-white font-bold">
              Skill Level {player.skill_level}
            </Text>
          </View>
        )}
      </View>

      {/* Placeholder for stats */}
      <View className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-gray-400 text-center text-sm">
          Detailed stats coming soon
        </Text>
      </View>
    </View>
  );
}
