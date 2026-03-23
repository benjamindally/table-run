import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Edit3, Check } from "lucide-react-native";

interface ScoreOverrideCardProps {
  homeTeamName: string;
  awayTeamName: string;
  scoreOverrideHome: string;
  scoreOverrideAway: string;
  onChangeHome: (value: string) => void;
  onChangeAway: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  hasNoGameData: boolean;
}

export default function ScoreOverrideCard({
  homeTeamName,
  awayTeamName,
  scoreOverrideHome,
  scoreOverrideAway,
  onChangeHome,
  onChangeAway,
  onSave,
  isSaving,
  hasNoGameData,
}: ScoreOverrideCardProps) {
  return (
    <View className="bg-white rounded-lg border border-purple-200 p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <Edit3 size={16} color="#7C3AED" />
        <Text className="text-sm font-semibold text-purple-700">
          Edit Match Score
        </Text>
      </View>
      {hasNoGameData && (
        <Text className="text-xs text-gray-500 mb-3">
          This match has no game-level data. You can set the final score directly.
        </Text>
      )}
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">{homeTeamName}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-center text-lg font-bold text-gray-900 bg-white"
            keyboardType="number-pad"
            value={scoreOverrideHome}
            onChangeText={onChangeHome}
          />
        </View>
        <Text className="text-gray-400 font-bold text-lg mt-4">-</Text>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">{awayTeamName}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-center text-lg font-bold text-gray-900 bg-white"
            keyboardType="number-pad"
            value={scoreOverrideAway}
            onChangeText={onChangeAway}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={onSave}
        disabled={isSaving}
        className={`mt-3 flex-row items-center justify-center gap-2 p-3 rounded-lg ${
          isSaving ? "bg-gray-300" : "bg-purple-600"
        }`}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Check size={16} color="#FFFFFF" />
        )}
        <Text className="text-white font-semibold">
          {isSaving ? "Saving..." : "Save Score"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
