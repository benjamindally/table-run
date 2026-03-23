import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Send, Check, Shuffle, RotateCcw } from "lucide-react-native";
import type { TeamSide } from "@league-genius/shared";

interface MatchActionBarProps {
  // Phase & role
  captainRole: TeamSide | null;
  isLeagueOperator: boolean;
  isMatchLive: boolean;
  lineupState: string;

  // Lineup submit visibility
  showAwaySubmit: boolean;
  showHomeSubmit: boolean;
  canEditAwayLineup: boolean;
  canEditHomeLineup: boolean;
  isAwayLineupComplete: boolean;
  isHomeLineupComplete: boolean;

  // Player counts for auto-assign
  presentAwayCount: number;
  presentHomeCount: number;
  gamesPerSet: number;

  // Scoring state
  totalGames: number;
  gamesWithWinners: number;
  submittedBy: TeamSide | null;

  // Loading states
  isSubmitting: boolean;

  // Handlers
  onAutoAssign: () => void;
  onSubmitLineup: (team: TeamSide) => Promise<void>;
  onScorecardSubmit: () => void;
  onScorecardReject: () => void;
  onFinalizeMatch: () => Promise<void>;
}

export default function MatchActionBar({
  captainRole,
  isLeagueOperator,
  isMatchLive,
  lineupState,
  showAwaySubmit,
  showHomeSubmit,
  canEditAwayLineup,
  canEditHomeLineup,
  isAwayLineupComplete,
  isHomeLineupComplete,
  presentAwayCount,
  presentHomeCount,
  gamesPerSet,
  totalGames,
  gamesWithWinners,
  submittedBy,
  isSubmitting,
  onAutoAssign,
  onSubmitLineup,
  onScorecardSubmit,
  onScorecardReject,
  onFinalizeMatch,
}: MatchActionBarProps) {
  const awayHasEnough = presentAwayCount >= gamesPerSet;
  const homeHasEnough = presentHomeCount >= gamesPerSet;
  const autoAssignEnabled =
    (canEditAwayLineup && awayHasEnough) ||
    (canEditHomeLineup && homeHasEnough);
  const allGamesComplete = gamesWithWinners === totalGames && totalGames > 0;

  return (
    <>
      {/* Auto-assign */}
      {(canEditAwayLineup || canEditHomeLineup) && (
        <TouchableOpacity
          onPress={onAutoAssign}
          disabled={!autoAssignEnabled}
          className={`flex-row items-center justify-center gap-2 py-2.5 border ${
            autoAssignEnabled
              ? "bg-gray-700 border-gray-700"
              : "bg-gray-100 border-gray-200"
          }`}
        >
          <Shuffle
            size={15}
            color={autoAssignEnabled ? "#FFFFFF" : "#9CA3AF"}
          />
          <Text
            className={`text-sm font-medium ${
              autoAssignEnabled ? "text-white" : "text-gray-400"
            }`}
          >
            Auto-Assign Players
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit away lineup */}
      {showAwaySubmit && (
        <TouchableOpacity
          onPress={() => onSubmitLineup("away")}
          disabled={isSubmitting || !isAwayLineupComplete}
          className={`flex-row items-center justify-center gap-2 p-4 ${
            isSubmitting || !isAwayLineupComplete ? "bg-gray-300" : "bg-primary-600"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color={isAwayLineupComplete ? "#FFFFFF" : "#9CA3AF"} />
          )}
          <Text className={`font-bold ${isAwayLineupComplete ? "text-white" : "text-gray-400"}`}>
            Submit Away Lineup
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit home lineup */}
      {showHomeSubmit && (
        <TouchableOpacity
          onPress={() => onSubmitLineup("home")}
          disabled={isSubmitting || !isHomeLineupComplete}
          className={`flex-row items-center justify-center gap-2 p-4 ${
            isSubmitting || !isHomeLineupComplete ? "bg-gray-300" : "bg-primary-600"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color={isHomeLineupComplete ? "#FFFFFF" : "#9CA3AF"} />
          )}
          <Text className={`font-bold ${isHomeLineupComplete ? "text-white" : "text-gray-400"}`}>
            Submit Home Lineup
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit scorecard (away captain or operator) */}
      {isMatchLive &&
        (captainRole === "away" || isLeagueOperator) &&
        submittedBy === null && (
          <TouchableOpacity
            onPress={onScorecardSubmit}
            disabled={!allGamesComplete}
            className={`flex-row items-center justify-center gap-2 p-4 ${
              allGamesComplete ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <Send size={18} color="#FFFFFF" />
            <Text className="text-white font-bold">
              {allGamesComplete
                ? "Submit Scorecard"
                : `Record All Games First (${gamesWithWinners}/${totalGames})`}
            </Text>
          </TouchableOpacity>
        )}

      {/* Operator direct finalize during live match */}
      {isMatchLive && isLeagueOperator && (
        <TouchableOpacity
          onPress={onFinalizeMatch}
          disabled={isSubmitting}
          className={`flex-row items-center justify-center gap-2 p-4 border rounded-lg ${
            isSubmitting ? "bg-gray-100 border-gray-200" : "bg-white border-purple-400"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Check size={18} color="#7C3AED" />
          )}
          <Text className={`font-bold ${isSubmitting ? "text-gray-400" : "text-purple-700"}`}>
            {isSubmitting ? "Finalizing..." : "Finalize Match (Operator)"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Awaiting confirmation (away captain, non-operator) */}
      {lineupState === "awaiting_confirmation" &&
        captainRole === "away" &&
        !isLeagueOperator && (
          <View className="bg-gray-100 border border-gray-200 p-4 items-center">
            <Text className="text-gray-600 font-medium">
              Scorecard submitted — waiting for home captain to confirm
            </Text>
          </View>
        )}

      {/* Confirm & finalize / send back (home captain or operator) */}
      {lineupState === "awaiting_confirmation" &&
        (captainRole === "home" || isLeagueOperator) && (
          <>
            <TouchableOpacity
              onPress={onFinalizeMatch}
              disabled={isSubmitting}
              className={`flex-row items-center justify-center gap-2 p-4 ${
                isSubmitting ? "bg-gray-300" : "bg-green-600"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Check size={18} color="#FFFFFF" />
              )}
              <Text className="text-white font-bold">
                {isSubmitting ? "Finalizing..." : "Confirm & Finalize Match"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onScorecardReject}
              disabled={isSubmitting}
              className="flex-row items-center justify-center gap-2 p-4 bg-white border-t border-red-200"
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color="#DC2626" />
              <Text className="text-red-600 font-semibold">Send Back for Correction</Text>
            </TouchableOpacity>
          </>
        )}
    </>
  );
}
