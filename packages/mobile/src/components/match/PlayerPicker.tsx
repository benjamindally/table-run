/**
 * Player Picker - Bottom sheet for selecting players
 */

import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Search, Check, AlertCircle } from "lucide-react-native";
import type { PlayerAttendance } from "../../stores/matchScoringStore";

interface PlayerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (playerId: number) => void;
  players: PlayerAttendance[];
  selectedPlayerId: number | null;
  disabledPlayerIds: number[];
  title: string;
  teamColor?: "home" | "away";
}

export default function PlayerPicker({
  visible,
  onClose,
  onSelect,
  players,
  selectedPlayerId,
  disabledPlayerIds,
  title,
  teamColor = "home",
}: PlayerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter((p) => p.playerName.toLowerCase().includes(query));
  }, [players, searchQuery]);

  const handleSelect = (playerId: number) => {
    onSelect(playerId);
    setSearchQuery("");
    onClose();
  };

  const primaryColor = teamColor === "home" ? "#2563EB" : "#EA580C";
  const bgColor = teamColor === "home" ? "bg-blue-50" : "bg-orange-50";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                onClose();
              }}
              className="p-2"
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <Search size={18} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search players..."
                className="flex-1 ml-2 text-gray-900"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Player list */}
          <FlatList
            data={filteredPlayers}
            keyExtractor={(item) => String(item.playerId)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const isSelected = item.playerId === selectedPlayerId;
              const isDisabled = disabledPlayerIds.includes(item.playerId);

              return (
                <TouchableOpacity
                  onPress={() => !isDisabled && handleSelect(item.playerId)}
                  disabled={isDisabled}
                  className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${
                    isSelected
                      ? bgColor
                      : isDisabled
                      ? "bg-gray-100"
                      : "bg-white border border-gray-200"
                  }`}
                  activeOpacity={isDisabled ? 1 : 0.7}
                >
                  <View className="flex-row items-center flex-1">
                    <Text
                      className={`font-medium ${
                        isDisabled
                          ? "text-gray-400"
                          : isSelected
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {item.playerName}
                    </Text>
                    {isDisabled && (
                      <View className="flex-row items-center ml-2">
                        <AlertCircle size={14} color="#9CA3AF" />
                        <Text className="text-xs text-gray-400 ml-1">
                          Already assigned
                        </Text>
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View className="items-center py-8">
                <Text className="text-gray-500">No players found</Text>
              </View>
            )}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
