/**
 * Match Score Header - Displays teams, score, and status
 */

import { View, Text } from "react-native";
import { Wifi, WifiOff, RefreshCw } from "lucide-react-native";
import type { Match, ConnectionStatus } from "@league-genius/shared";

interface MatchScoreHeaderProps {
  match: Match;
  homeScore: number;
  awayScore: number;
  connectionStatus: ConnectionStatus;
}

export default function MatchScoreHeader({
  match,
  homeScore,
  awayScore,
  connectionStatus,
}: MatchScoreHeaderProps) {
  const homeTeamName = match.home_team_detail?.name || "Home";
  const awayTeamName = match.away_team_detail?.name || "Away";

  const getStatusBadge = () => {
    switch (match.status) {
      case "completed":
        return (
          <View className="px-2 py-1 bg-green-100 rounded">
            <Text className="text-xs font-medium text-green-700">Final</Text>
          </View>
        );
      case "in_progress":
        return (
          <View className="px-2 py-1 bg-blue-100 rounded">
            <Text className="text-xs font-medium text-blue-700">Live</Text>
          </View>
        );
      default:
        return (
          <View className="px-2 py-1 bg-yellow-100 rounded">
            <Text className="text-xs font-medium text-yellow-700">
              Scheduled
            </Text>
          </View>
        );
    }
  };

  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Wifi size={14} color="#22C55E" />
          </View>
        );
      case "connecting":
        return (
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-yellow-500" />
            <RefreshCw size={14} color="#EAB308" />
          </View>
        );
      default:
        return (
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <WifiOff size={14} color="#EF4444" />
          </View>
        );
    }
  };

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200">
      {/* Connection status and match status */}
      <View className="flex-row items-center justify-between mb-4">
        {getConnectionIndicator()}
        {getStatusBadge()}
      </View>

      {/* Teams and score */}
      <View className="flex-row items-center justify-between">
        {/* Home team */}
        <View className="flex-1 items-center">
          <Text className="text-sm font-bold text-gray-900 text-center">
            {homeTeamName}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Home</Text>
        </View>

        {/* Score */}
        <View className="px-4">
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl font-bold text-gray-900">{homeScore}</Text>
            <Text className="text-lg text-gray-400">-</Text>
            <Text className="text-3xl font-bold text-gray-900">{awayScore}</Text>
          </View>
        </View>

        {/* Away team */}
        <View className="flex-1 items-center">
          <Text className="text-sm font-bold text-gray-900 text-center">
            {awayTeamName}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Away</Text>
        </View>
      </View>
    </View>
  );
}
