import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { User, ChevronDown, ChevronUp } from "lucide-react-native";
import {
  api,
  playersApi,
  type PlayerSeasonStatsResponse,
  type PlayerSeasonStatDetail,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { PlayersStackScreenProps } from "../navigation/types";

interface PlayerDetail {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  skill_level: number | null;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 bg-gray-50 rounded-lg p-3 items-center">
      <Text className="text-lg font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5 text-center">{label}</Text>
    </View>
  );
}

function SeasonRow({ season }: { season: PlayerSeasonStatDetail }) {
  const [expanded, setExpanded] = useState(false);
  const winPct =
    season.total_games > 0
      ? Math.round((season.total_wins / season.total_games) * 100)
      : 0;

  return (
    <View className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        className="flex-row items-center justify-between p-3 bg-white"
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">
            {season.season_name}
          </Text>
          <Text className="text-xs text-gray-500">
            {season.team_name} · {season.league_name}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-sm text-gray-700">
            {season.total_wins}–{season.total_losses}
          </Text>
          <Text className="text-xs text-gray-400">{winPct}%</Text>
          {expanded ? (
            <ChevronUp size={16} color="#9CA3AF" />
          ) : (
            <ChevronDown size={16} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View className="bg-gray-50 px-3 pb-3">
          {/* Season totals */}
          <View className="flex-row gap-2 mt-2 mb-3">
            <StatBox label="Wins" value={season.total_wins} />
            <StatBox label="Losses" value={season.total_losses} />
            <StatBox label="Win %" value={`${winPct}%`} />
            <StatBox label="TRs" value={season.table_runs} />
            <StatBox label="8BBs" value={season.eight_ball_breaks} />
          </View>

          {/* Weekly breakdown */}
          {season.weeks.length > 0 && (
            <View>
              <Text className="text-xs font-semibold text-gray-500 mb-1">
                Weekly
              </Text>
              <View className="flex-row flex-wrap gap-1">
                {season.weeks.map((w) => (
                  <View
                    key={w.week}
                    className="bg-white border border-gray-200 rounded px-2 py-1 items-center min-w-[52px]"
                  >
                    <Text className="text-xs text-gray-400">Wk {w.week}</Text>
                    <Text className="text-xs font-semibold text-gray-700">
                      {w.wins}–{w.losses}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function PlayerDetailsScreen({
  route,
}: PlayersStackScreenProps<"PlayerDetails">) {
  const { playerId } = route.params;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [stats, setStats] = useState<PlayerSeasonStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const [playerResponse, statsResponse] = await Promise.all([
          api.get<PlayerDetail>(`/players/${playerId}/`, accessToken ?? undefined),
          playersApi.getSeasonStats(playerId, accessToken ?? undefined).catch(() => null),
        ]);
        setPlayer(playerResponse);
        setStats(statsResponse);
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

  const career = stats?.career_totals;
  const careerWinPct =
    career && career.total_games > 0
      ? Math.round((career.total_wins / career.total_games) * 100)
      : 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Avatar + name */}
      <View className="bg-white rounded-lg p-6 border border-gray-200 items-center mb-4">
        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
          <User color="#9ca3af" size={48} />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          {player.full_name}
        </Text>
        {player.skill_level != null && (
          <View className="mt-3 bg-primary px-4 py-2 rounded-full">
            <Text className="text-white font-bold">
              Skill Level {player.skill_level}
            </Text>
          </View>
        )}
      </View>

      {/* Career totals */}
      {career && (
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Career Stats
          </Text>
          <View className="flex-row gap-2 mb-2">
            <StatBox label="Wins" value={career.total_wins} />
            <StatBox label="Losses" value={career.total_losses} />
            <StatBox label="Win %" value={`${careerWinPct}%`} />
          </View>
          <View className="flex-row gap-2">
            <StatBox label="Table Runs" value={career.table_runs} />
            <StatBox label="8-Ball Breaks" value={career.eight_ball_breaks} />
            <StatBox label="Seasons" value={career.seasons_played} />
          </View>
        </View>
      )}

      {/* Season-by-season */}
      {stats && stats.seasons.length > 0 && (
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Season History
          </Text>
          {stats.seasons.map((season) => (
            <SeasonRow key={season.id} season={season} />
          ))}
        </View>
      )}

      {/* No stats yet */}
      {!stats && (
        <View className="bg-white rounded-lg p-4 border border-gray-200 items-center">
          <Text className="text-gray-400 text-sm">No stats available yet</Text>
        </View>
      )}
    </ScrollView>
  );
}
