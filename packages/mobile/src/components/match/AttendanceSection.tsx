/**
 * Attendance Section - Team roster with attendance checkboxes
 */

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ChevronDown, ChevronUp, Check, Users } from "lucide-react-native";
import type { PlayerAttendance } from "../../stores/matchScoringStore";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AttendanceSectionProps {
  team: "home" | "away";
  teamName: string;
  roster: PlayerAttendance[];
  canEdit: boolean;
  onToggleAttendance: (playerId: number) => void;
  defaultExpanded?: boolean;
}

export default function AttendanceSection({
  team,
  teamName,
  roster,
  canEdit,
  onToggleAttendance,
  defaultExpanded = true,
}: AttendanceSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const presentCount = roster.filter((p) => p.present).length;
  const totalCount = roster.length;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const bgColor = team === "home" ? "bg-blue-50" : "bg-orange-50";
  const borderColor =
    team === "home" ? "border-blue-200" : "border-orange-200";
  const headerColor = team === "home" ? "bg-blue-100" : "bg-orange-100";
  const textColor = team === "home" ? "text-blue-700" : "text-orange-700";
  const checkColor = team === "home" ? "#2563EB" : "#EA580C";

  return (
    <View className={`${bgColor} rounded-lg border ${borderColor} overflow-hidden`}>
      {/* Header */}
      <TouchableOpacity
        onPress={toggleExpanded}
        className={`flex-row items-center justify-between p-3 ${headerColor}`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2">
          <Users size={18} color={checkColor} />
          <Text className={`font-bold ${textColor}`}>{teamName}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="bg-white px-2 py-1 rounded">
            <Text className={`text-xs font-medium ${textColor}`}>
              {presentCount}/{totalCount} present
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={20} color={checkColor} />
          ) : (
            <ChevronDown size={20} color={checkColor} />
          )}
        </View>
      </TouchableOpacity>

      {/* Player list */}
      {expanded && (
        <View className="p-3">
          {roster.length === 0 ? (
            <Text className="text-gray-500 text-sm text-center py-4">
              No players on roster
            </Text>
          ) : (
            <View className="space-y-2">
              {roster.map((player) => (
                <TouchableOpacity
                  key={player.playerId}
                  onPress={() => canEdit && onToggleAttendance(player.playerId)}
                  disabled={!canEdit}
                  className={`flex-row items-center justify-between p-3 rounded-lg bg-white border ${
                    player.present ? "border-green-300" : "border-gray-200"
                  }`}
                  activeOpacity={canEdit ? 0.7 : 1}
                >
                  <Text
                    className={`font-medium ${
                      player.present ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {player.playerName}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${
                      player.present ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {player.present && <Check size={16} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {presentCount < 4 && (
            <View className="mt-3 p-2 bg-yellow-100 rounded-lg">
              <Text className="text-xs text-yellow-700 text-center">
                Minimum 4 players required ({4 - presentCount} more needed)
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
