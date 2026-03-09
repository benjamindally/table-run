/**
 * Game Row - Individual game with player pickers and scoring
 */

import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown, Trophy, Zap, Target } from "lucide-react-native";
import type { TeamSide } from "@league-genius/shared";
import type { GameState, PlayerAttendance } from "../../stores/matchScoringStore";
import PlayerPicker from "./PlayerPicker";

interface GameRowProps {
  game: GameState;
  gameIndex: number;
  homeTeamName: string;
  awayTeamName: string;
  presentHomePlayers: PlayerAttendance[];
  presentAwayPlayers: PlayerAttendance[];
  canEditHome: boolean;
  canEditAway: boolean;
  canScore: boolean;
  isReadOnly: boolean;
  disabledHomePlayerIds: number[];
  disabledAwayPlayerIds: number[];
  onHomePlayerChange: (playerId: number | null) => void;
  onAwayPlayerChange: (playerId: number | null) => void;
  onWinnerChange: (winner: TeamSide) => void;
  onTableRunToggle: (team: TeamSide) => void;
  on8BallToggle: (team: TeamSide) => void;
}

export default function GameRow({
  game,
  gameIndex,
  homeTeamName,
  awayTeamName,
  presentHomePlayers,
  presentAwayPlayers,
  canEditHome,
  canEditAway,
  canScore,
  isReadOnly,
  disabledHomePlayerIds,
  disabledAwayPlayerIds,
  onHomePlayerChange,
  onAwayPlayerChange,
  onWinnerChange,
  onTableRunToggle,
  on8BallToggle,
}: GameRowProps) {
  const [showHomePicker, setShowHomePicker] = useState(false);
  const [showAwayPicker, setShowAwayPicker] = useState(false);

  const homePlayer = presentHomePlayers.find(
    (p) => p.playerId === game.homePlayerId
  );
  const awayPlayer = presentAwayPlayers.find(
    (p) => p.playerId === game.awayPlayerId
  );

  const bothPlayersAssigned =
    game.homePlayerId !== null && game.awayPlayerId !== null;

  return (
    <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Game number header */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <Text className="text-xs font-medium text-gray-500">
          Game {game.gameNumber}
        </Text>
        {game.winner && (
          <View className="flex-row items-center gap-1">
            <Trophy size={12} color="#16A34A" />
            <Text className="text-xs font-medium text-green-600">
              {game.winner === "home" ? homeTeamName : awayTeamName} wins
            </Text>
          </View>
        )}
      </View>

      {/* Player assignments */}
      <View className="p-3">
        <View className="flex-row items-center gap-2">
          {/* Home player */}
          <TouchableOpacity
            onPress={() => canEditHome && setShowHomePicker(true)}
            disabled={!canEditHome || isReadOnly}
            className={`flex-1 p-3 rounded-lg border ${
              game.homePlayerId
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            }`}
            activeOpacity={canEditHome && !isReadOnly ? 0.7 : 1}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Home</Text>
                <Text
                  className={`font-medium ${
                    homePlayer ? "text-gray-900" : "text-gray-400"
                  }`}
                  numberOfLines={1}
                >
                  {homePlayer?.playerName || "Select player"}
                </Text>
              </View>
              {canEditHome && !isReadOnly && (
                <ChevronDown size={16} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>

          <Text className="text-gray-400 font-bold">vs</Text>

          {/* Away player */}
          <TouchableOpacity
            onPress={() => canEditAway && setShowAwayPicker(true)}
            disabled={!canEditAway || isReadOnly}
            className={`flex-1 p-3 rounded-lg border ${
              game.awayPlayerId
                ? "bg-orange-50 border-orange-200"
                : "bg-gray-50 border-gray-200"
            }`}
            activeOpacity={canEditAway && !isReadOnly ? 0.7 : 1}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Away</Text>
                <Text
                  className={`font-medium ${
                    awayPlayer ? "text-gray-900" : "text-gray-400"
                  }`}
                  numberOfLines={1}
                >
                  {awayPlayer?.playerName || "Select player"}
                </Text>
              </View>
              {canEditAway && !isReadOnly && (
                <ChevronDown size={16} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Scoring section - show when players assigned or operator can score */}
        {(bothPlayersAssigned || canScore) && (canScore || game.winner) && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            {/* Winner buttons */}
            <View className="flex-row items-center gap-2 mb-3">
              <TouchableOpacity
                onPress={() => canScore && onWinnerChange("home")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 p-3 rounded-lg items-center ${
                  game.winner === "home"
                    ? "bg-green-500"
                    : "bg-gray-100"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Text
                  className={`font-medium ${
                    game.winner === "home" ? "text-white" : "text-gray-600"
                  }`}
                >
                  {homeTeamName} Wins
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => canScore && onWinnerChange("away")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 p-3 rounded-lg items-center ${
                  game.winner === "away"
                    ? "bg-green-500"
                    : "bg-gray-100"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Text
                  className={`font-medium ${
                    game.winner === "away" ? "text-white" : "text-gray-600"
                  }`}
                >
                  {awayTeamName} Wins
                </Text>
              </TouchableOpacity>
            </View>

            {/* Special achievements */}
            <View className="flex-row items-center gap-2">
              {/* Table Run toggles */}
              <TouchableOpacity
                onPress={() => canScore && onTableRunToggle("home")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 flex-row items-center justify-center gap-1 p-2 rounded-lg ${
                  game.homeTableRun ? "bg-yellow-100" : "bg-gray-50"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Zap
                  size={14}
                  color={game.homeTableRun ? "#CA8A04" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-medium ${
                    game.homeTableRun ? "text-yellow-700" : "text-gray-500"
                  }`}
                >
                  H TR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => canScore && onTableRunToggle("away")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 flex-row items-center justify-center gap-1 p-2 rounded-lg ${
                  game.awayTableRun ? "bg-yellow-100" : "bg-gray-50"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Zap
                  size={14}
                  color={game.awayTableRun ? "#CA8A04" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-medium ${
                    game.awayTableRun ? "text-yellow-700" : "text-gray-500"
                  }`}
                >
                  A TR
                </Text>
              </TouchableOpacity>

              {/* 8-Ball Break toggles */}
              <TouchableOpacity
                onPress={() => canScore && on8BallToggle("home")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 flex-row items-center justify-center gap-1 p-2 rounded-lg ${
                  game.home8Ball ? "bg-purple-100" : "bg-gray-50"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Target
                  size={14}
                  color={game.home8Ball ? "#7C3AED" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-medium ${
                    game.home8Ball ? "text-purple-700" : "text-gray-500"
                  }`}
                >
                  H 8B
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => canScore && on8BallToggle("away")}
                disabled={!canScore || isReadOnly}
                className={`flex-1 flex-row items-center justify-center gap-1 p-2 rounded-lg ${
                  game.away8Ball ? "bg-purple-100" : "bg-gray-50"
                }`}
                activeOpacity={canScore && !isReadOnly ? 0.7 : 1}
              >
                <Target
                  size={14}
                  color={game.away8Ball ? "#7C3AED" : "#9CA3AF"}
                />
                <Text
                  className={`text-xs font-medium ${
                    game.away8Ball ? "text-purple-700" : "text-gray-500"
                  }`}
                >
                  A 8B
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Player pickers */}
      <PlayerPicker
        visible={showHomePicker}
        onClose={() => setShowHomePicker(false)}
        onSelect={onHomePlayerChange}
        players={presentHomePlayers}
        selectedPlayerId={game.homePlayerId}
        disabledPlayerIds={disabledHomePlayerIds}
        title={`Select ${homeTeamName} Player`}
        teamColor="home"
      />

      <PlayerPicker
        visible={showAwayPicker}
        onClose={() => setShowAwayPicker(false)}
        onSelect={onAwayPlayerChange}
        players={presentAwayPlayers}
        selectedPlayerId={game.awayPlayerId}
        disabledPlayerIds={disabledAwayPlayerIds}
        title={`Select ${awayTeamName} Player`}
        teamColor="away"
      />
    </View>
  );
}
