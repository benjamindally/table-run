/**
 * Match Score Header - Displays teams, score, date, and status
 */

import { View, Text } from "react-native";
import { Wifi, WifiOff, RefreshCw } from "lucide-react-native";
import { formatDateDisplay, type Match, type ConnectionStatus } from "@league-genius/shared";

interface MatchScoreHeaderProps {
  match: Match;
  homeScore: number;
  awayScore: number;
  connectionStatus: ConnectionStatus;
  showConnectionStatus?: boolean;
  isCompleted?: boolean;
}

export default function MatchScoreHeader({
  match,
  homeScore,
  awayScore,
  connectionStatus,
  showConnectionStatus = false,
  isCompleted = false,
}: MatchScoreHeaderProps) {
  const homeTeamName = match.home_team_detail?.name || "Home";
  const awayTeamName = match.away_team_detail?.name || "Away";

  const formatDate = (dateString: string) => {
    try {
      return formatDateDisplay(dateString);
    } catch {
      return "";
    }
  };

  const getStatusBadge = () => {
    if (isCompleted || match.status === "completed") {
      return (
        <View className="px-2 py-1 bg-green-100 rounded">
          <Text className="text-xs font-medium text-green-700">Final</Text>
        </View>
      );
    }
    switch (match.status) {
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
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Wifi size={12} color="#22C55E" />
            <Text className="text-xs text-green-600">Live</Text>
          </View>
        );
      case "connecting":
        return (
          <View className="flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <RefreshCw size={12} color="#EAB308" />
            <Text className="text-xs text-yellow-600">Connecting</Text>
          </View>
        );
      default:
        return (
          <View className="flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <WifiOff size={12} color="#EF4444" />
            <Text className="text-xs text-red-600">Offline</Text>
          </View>
        );
    }
  };

  return (
    <View className="bg-white p-4 border border-gray-200">
      {/* Date/week and status badge */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs text-gray-500">
          {formatDate(match.date)}
          {match.week_number ? ` · Week ${match.week_number}` : ""}
        </Text>
        {getStatusBadge()}
      </View>

      {/* Teams and score */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 items-center">
          <Text
            className="text-sm font-bold text-gray-900 text-center"
            numberOfLines={2}
          >
            {homeTeamName}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Home</Text>
        </View>

        <View className="px-4">
          <View className="flex-row items-center gap-3">
            <Text className="text-3xl font-bold text-gray-900">{homeScore}</Text>
            <Text className="text-lg text-gray-400">-</Text>
            <Text className="text-3xl font-bold text-gray-900">{awayScore}</Text>
          </View>
        </View>

        <View className="flex-1 items-center">
          <Text
            className="text-sm font-bold text-gray-900 text-center"
            numberOfLines={2}
          >
            {awayTeamName}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">Away</Text>
        </View>
      </View>

      {/* Connection indicator — only shown for active matches where user can edit */}
      {showConnectionStatus && (
        <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-end">
          {getConnectionIndicator()}
        </View>
      )}
    </View>
  );
}
