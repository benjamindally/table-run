/**
 * Status Banner - Shows phase-specific info messages
 */

import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Eye, Clock, Check, Play, AlertCircle } from "lucide-react-native";
import type { TeamSide, LineupState } from "@league-genius/shared";

interface StatusBannerProps {
  lineupState: LineupState;
  captainRole: TeamSide | null;
  isLeagueOperator: boolean;
  isAuthenticated: boolean;
  onStartMatch?: () => void;
  isStartingMatch?: boolean;
}

export default function StatusBanner({
  lineupState,
  captainRole,
  isLeagueOperator,
  isAuthenticated,
  onStartMatch,
  isStartingMatch = false,
}: StatusBannerProps) {
  const canEdit = captainRole !== null || isLeagueOperator;

  // Anonymous viewer
  if (!isAuthenticated) {
    return (
      <View className="bg-gray-100 border border-gray-200 p-4">
        <View className="flex-row items-center gap-2">
          <Eye size={18} color="#6B7280" />
          <Text className="text-sm text-gray-600 flex-1">
            <Text className="font-medium">Viewing as guest.</Text> Sign in to
            enter scores if you're a team captain.
          </Text>
        </View>
      </View>
    );
  }

  // Viewer (not captain or operator)
  if (!canEdit) {
    return (
      <View className="bg-blue-50 border border-blue-200 p-4">
        <View className="flex-row items-center gap-2">
          <Eye size={18} color="#2563EB" />
          <Text className="text-sm text-blue-700 flex-1">
            <Text className="font-medium">Viewing only.</Text> Only team
            captains or league operators can enter scores.
          </Text>
        </View>
      </View>
    );
  }

  // League operator
  if (isLeagueOperator) {
    return (
      <View className="bg-purple-50 border border-purple-200 p-4">
        <View className="flex-row items-center gap-2">
          <AlertCircle size={18} color="#7C3AED" />
          <Text className="text-sm text-purple-700 flex-1">
            <Text className="font-medium">League Operator.</Text> You have full
            access to edit this match.
          </Text>
        </View>
      </View>
    );
  }

  // Phase-specific banners for captains
  switch (lineupState) {
    case "not_started":
    case "awaiting_away_lineup":
      if (captainRole === "away") {
        return (
          <View className="bg-primary-50 border border-primary-200 p-4">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color="#26A69A" />
              <Text className="text-sm text-primary-700 flex-1">
                <Text className="font-medium">Your turn!</Text> Mark your
                players' attendance and assign them to games.
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View className="bg-yellow-50 border border-yellow-200 p-4">
          <View className="flex-row items-center gap-2">
            <Clock size={18} color="#CA8A04" />
            <Text className="text-sm text-yellow-700 flex-1">
              <Text className="font-medium">Waiting for away team.</Text> The
              away captain is setting their lineup.
            </Text>
          </View>
        </View>
      );

    case "awaiting_home_lineup":
      if (captainRole === "home") {
        return (
          <View className="bg-primary-50 border border-primary-200 p-4">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color="#26A69A" />
              <Text className="text-sm text-primary-700 flex-1">
                <Text className="font-medium">Your turn!</Text> Mark your
                players' attendance and assign them to games.
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View className="bg-green-50 border border-green-200 p-4">
          <View className="flex-row items-center gap-2">
            <Check size={18} color="#16A34A" />
            <Text className="text-sm text-green-700 flex-1">
              <Text className="font-medium">Lineup submitted!</Text> Waiting for
              home team to set their lineup.
            </Text>
          </View>
        </View>
      );

    case "ready_to_start":
      if (captainRole === "home" && onStartMatch) {
        return (
          <View className="bg-green-50 border border-green-200 p-4">
            <View className="items-center gap-3">
              <View className="flex-row items-center gap-2">
                <Check size={18} color="#16A34A" />
                <Text className="text-sm text-green-700 flex-1">
                  <Text className="font-medium">Both lineups set!</Text> Ready
                  to start the match.
                </Text>
              </View>
              <TouchableOpacity
                onPress={onStartMatch}
                disabled={isStartingMatch}
                className={`flex-row items-center gap-2 px-4 py-2 ${
                  isStartingMatch ? "bg-gray-300" : "bg-primary-600"
                }`}
              >
                {isStartingMatch ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                )}
                <Text className="text-white font-medium">
                  {isStartingMatch ? "Starting..." : "Start Match"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      return (
        <View className="bg-green-50 border border-green-200 p-4">
          <View className="flex-row items-center gap-2">
            <Check size={18} color="#16A34A" />
            <Text className="text-sm text-green-700 flex-1">
              <Text className="font-medium">Both lineups set!</Text> Waiting for
              home captain to start the match.
            </Text>
          </View>
        </View>
      );

    case "match_live":
      return (
        <View className="bg-blue-50 border border-blue-200 p-4">
          <View className="flex-row items-center gap-2">
            <Play size={18} color="#2563EB" fill="#2563EB" />
            <Text className="text-sm text-blue-700 flex-1">
              <Text className="font-medium">Match in progress!</Text> Enter game
              results as they complete.
            </Text>
          </View>
        </View>
      );

    case "awaiting_confirmation":
      if (captainRole === "home") {
        return (
          <View className="bg-yellow-50 border border-yellow-200 p-4">
            <View className="flex-row items-center gap-2">
              <AlertCircle size={18} color="#CA8A04" />
              <Text className="text-sm text-yellow-700 flex-1">
                <Text className="font-medium">Review scores!</Text> The away
                captain submitted. Please verify and confirm.
              </Text>
            </View>
          </View>
        );
      }
      return (
        <View className="bg-green-50 border border-green-200 p-4">
          <View className="flex-row items-center gap-2">
            <Check size={18} color="#16A34A" />
            <Text className="text-sm text-green-700 flex-1">
              <Text className="font-medium">Scorecard submitted!</Text> Waiting
              for home captain to confirm.
            </Text>
          </View>
        </View>
      );

    case "completed":
      return (
        <View className="bg-gray-100 border border-gray-200 p-4">
          <View className="flex-row items-center gap-2">
            <Check size={18} color="#16A34A" />
            <Text className="text-sm text-gray-600 flex-1">
              <Text className="font-medium">Match completed!</Text> Final scores
              have been recorded.
            </Text>
          </View>
        </View>
      );

    default:
      return null;
  }
}
