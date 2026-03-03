/**
 * Games Section - Organizes games into sets with collapsible headers
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import type { TeamSide } from "@league-genius/shared";
import type { GameState, PlayerAttendance } from "../../stores/matchScoringStore";
import GameRow from "./GameRow";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface GamesSectionProps {
  games: GameState[];
  gamesPerSet: number;
  homeTeamName: string;
  awayTeamName: string;
  presentHomePlayers: PlayerAttendance[];
  presentAwayPlayers: PlayerAttendance[];
  canEditHome: boolean;
  canEditAway: boolean;
  canScore: boolean;
  isReadOnly: boolean;
  onPlayerChange: (gameIndex: number, team: TeamSide, playerId: number | null) => void;
  onWinnerChange: (gameIndex: number, winner: TeamSide) => void;
  onTableRunToggle: (gameIndex: number, team: TeamSide) => void;
  on8BallToggle: (gameIndex: number, team: TeamSide) => void;
}

interface SetData {
  setNumber: number;
  games: { game: GameState; globalIndex: number }[];
  homeWins: number;
  awayWins: number;
}

export default function GamesSection({
  games,
  gamesPerSet,
  homeTeamName,
  awayTeamName,
  presentHomePlayers,
  presentAwayPlayers,
  canEditHome,
  canEditAway,
  canScore,
  isReadOnly,
  onPlayerChange,
  onWinnerChange,
  onTableRunToggle,
  on8BallToggle,
}: GamesSectionProps) {
  // Organize games into sets
  const sets = useMemo<SetData[]>(() => {
    const result: SetData[] = [];
    for (let i = 0; i < games.length; i += gamesPerSet) {
      const setGames = games.slice(i, i + gamesPerSet);
      const setNumber = Math.floor(i / gamesPerSet) + 1;
      result.push({
        setNumber,
        games: setGames.map((game, idx) => ({
          game,
          globalIndex: i + idx,
        })),
        homeWins: setGames.filter((g) => g.winner === "home").length,
        awayWins: setGames.filter((g) => g.winner === "away").length,
      });
    }
    return result;
  }, [games, gamesPerSet]);

  // Track which sets are expanded
  const [expandedSets, setExpandedSets] = useState<Set<number>>(() => {
    // Start with first incomplete set expanded
    const firstIncomplete = sets.findIndex((s) =>
      s.games.some((g) => g.game.winner === null)
    );
    return new Set([firstIncomplete >= 0 ? firstIncomplete + 1 : 1]);
  });

  // Auto-expand: when a set completes, open the next incomplete set (leave completed set open)
  const firstIncompleteSetNumber = useMemo(() => {
    const idx = sets.findIndex((s) => s.games.some((g) => g.game.winner === null));
    return idx >= 0 ? sets[idx].setNumber : null;
  }, [sets]);

  const prevFirstIncompleteRef = useRef(firstIncompleteSetNumber);

  useEffect(() => {
    if (prevFirstIncompleteRef.current !== firstIncompleteSetNumber) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (firstIncompleteSetNumber === null) {
        // All sets complete — collapse everything
        setExpandedSets(new Set());
      } else {
        setExpandedSets((prev) => {
          const next = new Set(prev);
          next.add(firstIncompleteSetNumber);
          return next;
        });
      }
      prevFirstIncompleteRef.current = firstIncompleteSetNumber;
    }
  }, [firstIncompleteSetNumber]);

  const toggleSet = (setNumber: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSets((prev) => {
      const next = new Set(prev);
      if (next.has(setNumber)) {
        next.delete(setNumber);
      } else {
        next.add(setNumber);
      }
      return next;
    });
  };

  // Calculate disabled player IDs for each set (players already used in that set)
  const getDisabledPlayerIdsForSet = (
    setNumber: number,
    team: TeamSide,
    currentGameIndex: number
  ): number[] => {
    const set = sets.find((s) => s.setNumber === setNumber);
    if (!set) return [];

    const usedPlayerIds: number[] = [];
    for (const { game, globalIndex } of set.games) {
      if (globalIndex === currentGameIndex) continue;
      const playerId =
        team === "home" ? game.homePlayerId : game.awayPlayerId;
      if (playerId !== null) {
        usedPlayerIds.push(playerId);
      }
    }
    return usedPlayerIds;
  };

  return (
    <View className="space-y-4">
      {sets.map((set) => {
        const isExpanded = expandedSets.has(set.setNumber);
        const isComplete = set.games.every((g) => g.game.winner !== null);

        return (
          <View
            key={set.setNumber}
            className="bg-gray-50 border border-gray-200 overflow-hidden"
          >
            {/* Set header */}
            <TouchableOpacity
              onPress={() => toggleSet(set.setNumber)}
              className={`flex-row items-center justify-between p-3 ${
                isComplete ? "bg-green-50" : "bg-white"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <Text className="font-bold text-gray-900">
                  Set {set.setNumber}
                </Text>
                <View className="bg-gray-100 px-2 py-1 rounded">
                  <Text className="text-xs text-gray-600">
                    {set.games.length} games
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                {/* Set score */}
                <View className="flex-row items-center gap-2">
                  <View className="bg-blue-100 px-2 py-1 rounded">
                    <Text className="text-xs font-medium text-blue-700">
                      {set.homeWins}
                    </Text>
                  </View>
                  <Text className="text-gray-400">-</Text>
                  <View className="bg-orange-100 px-2 py-1 rounded">
                    <Text className="text-xs font-medium text-orange-700">
                      {set.awayWins}
                    </Text>
                  </View>
                </View>

                {isExpanded ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </View>
            </TouchableOpacity>

            {/* Games */}
            {isExpanded && (
              <View className="p-3 space-y-3">
                {set.games.map(({ game, globalIndex }) => (
                  <GameRow
                    key={game.gameNumber}
                    game={game}
                    gameIndex={globalIndex}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    presentHomePlayers={presentHomePlayers}
                    presentAwayPlayers={presentAwayPlayers}
                    canEditHome={canEditHome}
                    canEditAway={canEditAway}
                    canScore={canScore}
                    isReadOnly={isReadOnly}
                    disabledHomePlayerIds={getDisabledPlayerIdsForSet(
                      set.setNumber,
                      "home",
                      globalIndex
                    )}
                    disabledAwayPlayerIds={getDisabledPlayerIdsForSet(
                      set.setNumber,
                      "away",
                      globalIndex
                    )}
                    onHomePlayerChange={(playerId) =>
                      onPlayerChange(globalIndex, "home", playerId)
                    }
                    onAwayPlayerChange={(playerId) =>
                      onPlayerChange(globalIndex, "away", playerId)
                    }
                    onWinnerChange={(winner) =>
                      onWinnerChange(globalIndex, winner)
                    }
                    onTableRunToggle={(team) =>
                      onTableRunToggle(globalIndex, team)
                    }
                    on8BallToggle={(team) => on8BallToggle(globalIndex, team)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
