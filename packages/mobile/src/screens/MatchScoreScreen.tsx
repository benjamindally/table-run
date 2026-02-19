/**
 * Match Score Screen - Real-time match scoring with WebSocket updates
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Send, AlertTriangle } from "lucide-react-native";
import {
  matchesApi,
  teamsApi,
  seasonsApi,
  type Match,
  type Season,
  type TeamMembership,
  type TeamSide,
  type IncomingMessage,
  type LineupState,
} from "@league-genius/shared";
import type { SeasonsStackScreenProps } from "../navigation/types";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import {
  useMatchScoringStore,
  type PlayerAttendance,
} from "../stores/matchScoringStore";
import { useMatchWebSocket } from "../hooks/useMatchWebSocket";

import MatchScoreHeader from "../components/match/MatchScoreHeader";
import StatusBanner from "../components/match/StatusBanner";
import AttendanceSection from "../components/match/AttendanceSection";
import GamesSection from "../components/match/GamesSection";

export default function MatchScoreScreen({
  route,
}: SeasonsStackScreenProps<"MatchScore">) {
  const { matchId } = route.params;

  // Auth and user context
  const { accessToken, isAuthenticated } = useAuthStore();
  const { isCaptain, isOperator, myLeagues } = useUserContextStore();

  // Match scoring store
  const {
    state: scoringState,
    initializeMatch,
    setHomeRoster,
    setAwayRoster,
    toggleHomeAttendance,
    toggleAwayAttendance,
    updateGame,
    setLineupState,
    setSubmittedBy,
    getHomeScore,
    getAwayScore,
    getPresentHomePlayers,
    getPresentAwayPlayers,
    getIsAwayLineupComplete,
    getIsHomeLineupComplete,
  } = useMatchScoringStore();

  // Local state
  const [match, setMatch] = useState<Match | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine user role
  const captainRole: TeamSide | null = useMemo(() => {
    if (!match || !isAuthenticated) return null;
    if (isCaptain(match.home_team)) return "home";
    if (isCaptain(match.away_team)) return "away";
    return null;
  }, [match, isAuthenticated, isCaptain]);

  const isLeagueOperator = useMemo(() => {
    if (!match || !isAuthenticated || !season) return false;
    return isOperator(season.league);
  }, [match, season, isAuthenticated, isOperator]);

  const canEdit = captainRole !== null || isLeagueOperator;

  // Games configuration from league
  const gamesPerSet = season?.league_detail?.games_per_set || 4;
  const setsPerMatch = season?.league_detail?.sets_per_match || 4;
  const totalGames = gamesPerSet * setsPerMatch;

  // Lineup state derived values
  const lineupState = scoringState?.lineupState || "awaiting_away_lineup";
  const isAwayLineupPhase =
    lineupState === "awaiting_away_lineup" || lineupState === "not_started";
  const isHomeLineupPhase = lineupState === "awaiting_home_lineup";
  const isReadyToStart = lineupState === "ready_to_start";
  const isMatchLive =
    lineupState === "match_live" || lineupState === "awaiting_confirmation";
  const isMatchCompleted = lineupState === "completed";

  // Permission checks
  const canEditAwayLineup =
    !isMatchCompleted &&
    isAwayLineupPhase &&
    (captainRole === "away" || isLeagueOperator);
  const canEditHomeLineup =
    !isMatchCompleted &&
    isHomeLineupPhase &&
    (captainRole === "home" || isLeagueOperator);
  const canScore = !isMatchCompleted && isMatchLive && canEdit;
  const isReadOnly = isMatchCompleted || !canEdit;

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      switch (message.type) {
        case "player_assignment":
          const playerKey =
            message.team_side === "home" ? "homePlayerId" : "awayPlayerId";
          // game_id is 1-indexed from backend
          updateGame(message.game_id - 1, { [playerKey]: message.player_id });
          break;

        case "game_update":
          // Find game by database ID
          const gameIndex =
            scoringState?.games.findIndex((g) => g.id === message.game_id) ??
            -1;
          if (gameIndex >= 0) {
            updateGame(gameIndex, {
              winner: message.game_data.winner ?? undefined,
              homeTableRun: message.game_data.home_table_run,
              awayTableRun: message.game_data.away_table_run,
              home8Ball: message.game_data.home_8ball_break,
              away8Ball: message.game_data.away_8ball_break,
            });
          }
          break;

        case "match_state":
          // Initial state from backend - populate game IDs
          if (message.data?.games) {
            message.data.games.forEach((gameData, index) => {
              updateGame(index, {
                id: gameData.id,
                homePlayerId: gameData.home_player?.id ?? null,
                awayPlayerId: gameData.away_player?.id ?? null,
                winner: gameData.winner,
                homeTableRun: gameData.home_table_run,
                awayTableRun: gameData.away_table_run,
                home8Ball: gameData.home_8ball_break,
                away8Ball: gameData.away_8ball_break,
              });
            });
          }
          if (message.data?.lineup_state) {
            setLineupState(message.data.lineup_state as LineupState);
          }
          break;

        case "away_lineup_submitted":
          setLineupState("awaiting_home_lineup");
          break;

        case "home_lineup_submitted":
          setLineupState("ready_to_start");
          break;

        case "match_started":
        case "match_start":
          setLineupState("match_live");
          break;

        case "scorecard_submitted":
          setSubmittedBy(message.submitted_by);
          break;

        case "match_finalized":
          setLineupState("completed");
          break;

        default:
          break;
      }
    },
    [scoringState?.games, updateGame, setLineupState, setSubmittedBy]
  );

  // WebSocket connection - only after match and scoring state are initialized to avoid race condition
  const { send: sendWebSocket, status: connectionStatus } = useMatchWebSocket({
    matchId,
    enabled: match !== null && scoringState !== null,
    onMessage: handleWebSocketMessage,
  });

  // Load match and related data
  const loadData = useCallback(async () => {
    try {
      setError(null);

      // Fetch match
      const matchData = await matchesApi.getById(
        matchId,
        accessToken || undefined
      );
      setMatch(matchData);

      // Fetch season for league config
      const seasonData = await seasonsApi.getById(
        matchData.season,
        accessToken || undefined
      );
      setSeason(seasonData);

      // Initialize scoring store
      const gamesCount =
        (seasonData.league_detail?.games_per_set || 4) *
        (seasonData.league_detail?.sets_per_match || 4);
      await initializeMatch(
        matchId,
        gamesCount,
        (matchData.lineup_state as LineupState) || "awaiting_away_lineup"
      );

      // Fetch team rosters
      const [homeRoster, awayRoster] = await Promise.all([
        teamsApi.getRoster(matchData.home_team, accessToken || undefined),
        teamsApi.getRoster(matchData.away_team, accessToken || undefined),
      ]);

      // Convert to PlayerAttendance format
      const homeAttendance: PlayerAttendance[] = homeRoster.map((m) => ({
        playerId: m.player,
        playerName: m.player_detail?.full_name || "Unknown",
        present: false,
      }));
      const awayAttendance: PlayerAttendance[] = awayRoster.map((m) => ({
        playerId: m.player,
        playerName: m.player_detail?.full_name || "Unknown",
        present: false,
      }));

      setHomeRoster(homeAttendance);
      setAwayRoster(awayAttendance);
    } catch (err) {
      console.error("[MatchScoreScreen] Failed to load:", err);
      setError("Failed to load match data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId, accessToken, initializeMatch, setHomeRoster, setAwayRoster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle player changes with WebSocket
  const handlePlayerChange = useCallback(
    (gameIndex: number, team: TeamSide, playerId: number | null) => {
      const key = team === "home" ? "homePlayerId" : "awayPlayerId";
      updateGame(gameIndex, { [key]: playerId });

      // Send via WebSocket
      if (playerId !== null) {
        sendWebSocket({
          type: "player_assignment",
          game_id: gameIndex + 1, // Backend uses 1-indexed
          player_id: playerId,
          team_side: team,
        });
      }
    },
    [updateGame, sendWebSocket]
  );

  // Handle game data changes with WebSocket
  const handleWinnerChange = useCallback(
    (gameIndex: number, winner: TeamSide) => {
      const game = scoringState?.games[gameIndex];
      if (!game?.id) return;

      updateGame(gameIndex, { winner });

      sendWebSocket({
        type: "game_update",
        game_id: game.id,
        game_data: { winner },
      });
    },
    [scoringState?.games, updateGame, sendWebSocket]
  );

  const handleTableRunToggle = useCallback(
    (gameIndex: number, team: TeamSide) => {
      const game = scoringState?.games[gameIndex];
      if (!game?.id) return;

      const newValue =
        team === "home" ? !game.homeTableRun : !game.awayTableRun;
      const key = team === "home" ? "homeTableRun" : "awayTableRun";
      updateGame(gameIndex, { [key]: newValue });

      sendWebSocket({
        type: "game_update",
        game_id: game.id,
        game_data:
          team === "home"
            ? { home_table_run: newValue }
            : { away_table_run: newValue },
      });
    },
    [scoringState?.games, updateGame, sendWebSocket]
  );

  const handle8BallToggle = useCallback(
    (gameIndex: number, team: TeamSide) => {
      const game = scoringState?.games[gameIndex];
      if (!game?.id) return;

      const newValue = team === "home" ? !game.home8Ball : !game.away8Ball;
      const key = team === "home" ? "home8Ball" : "away8Ball";
      updateGame(gameIndex, { [key]: newValue });

      sendWebSocket({
        type: "game_update",
        game_id: game.id,
        game_data:
          team === "home"
            ? { home_8ball_break: newValue }
            : { away_8ball_break: newValue },
      });
    },
    [scoringState?.games, updateGame, sendWebSocket]
  );

  // Handle start match
  const handleStartMatch = async () => {
    if (!accessToken) return;

    setIsStartingMatch(true);
    try {
      await matchesApi.startMatch(matchId, accessToken);
      setLineupState("match_live");
      sendWebSocket({ type: "match_start" });
    } catch (err) {
      console.error("[MatchScoreScreen] Failed to start match:", err);
      Alert.alert("Error", "Failed to start match. Please try again.");
    } finally {
      setIsStartingMatch(false);
    }
  };

  // Handle lineup submission
  const handleSubmitLineup = async (team: TeamSide) => {
    if (!accessToken || !scoringState) return;

    const games = scoringState.games.map((g) => ({
      game_number: g.gameNumber,
      player_id: team === "away" ? g.awayPlayerId! : g.homePlayerId!,
    }));

    setIsSubmitting(true);
    try {
      await matchesApi.submitLineup(
        matchId,
        { games, team_side: team },
        accessToken
      );
      sendWebSocket({ type: "lineup_submitted", team_side: team });

      if (team === "away") {
        setLineupState("awaiting_home_lineup");
      } else {
        setLineupState("ready_to_start");
      }
    } catch (err) {
      console.error("[MatchScoreScreen] Failed to submit lineup:", err);
      Alert.alert("Error", "Failed to submit lineup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
        <Text className="text-gray-500 mt-2">Loading match...</Text>
      </View>
    );
  }

  // Error state
  if (error || !match) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <AlertTriangle size={48} color="#EF4444" />
        <Text className="text-red-600 font-medium mt-4 text-center">
          {error || "Match not found"}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-4 px-4 py-2 bg-primary-600 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const homeTeamName = match.home_team_detail?.name || "Home";
  const awayTeamName = match.away_team_detail?.name || "Away";
  const presentHome = getPresentHomePlayers();
  const presentAway = getPresentAwayPlayers();
  const isAwayLineupComplete = getIsAwayLineupComplete();
  const isHomeLineupComplete = getIsHomeLineupComplete();

  // Show submit button for away during away phase
  const showAwaySubmit =
    isAwayLineupPhase &&
    (captainRole === "away" || isLeagueOperator) &&
    isAwayLineupComplete;

  // Show submit button for home during home phase
  const showHomeSubmit =
    isHomeLineupPhase &&
    (captainRole === "home" || isLeagueOperator) &&
    isHomeLineupComplete;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4 pb-20 space-y-4">
        {/* Header with score and status */}
        <MatchScoreHeader
          match={match}
          homeScore={getHomeScore()}
          awayScore={getAwayScore()}
          connectionStatus={connectionStatus}
        />

        {/* Status banner */}
        <StatusBanner
          lineupState={lineupState}
          captainRole={captainRole}
          isLeagueOperator={isLeagueOperator}
          isAuthenticated={isAuthenticated}
          onStartMatch={isReadyToStart ? handleStartMatch : undefined}
          isStartingMatch={isStartingMatch}
        />

        {/* Attendance sections - show during lineup phases or for operators */}
        {(isAwayLineupPhase || isHomeLineupPhase || isLeagueOperator) && (
          <View className="space-y-3">
            <AttendanceSection
              team="away"
              teamName={awayTeamName}
              roster={scoringState?.awayRoster || []}
              canEdit={canEditAwayLineup}
              onToggleAttendance={toggleAwayAttendance}
              defaultExpanded={isAwayLineupPhase}
            />
            <AttendanceSection
              team="home"
              teamName={homeTeamName}
              roster={scoringState?.homeRoster || []}
              canEdit={canEditHomeLineup}
              onToggleAttendance={toggleHomeAttendance}
              defaultExpanded={isHomeLineupPhase}
            />
          </View>
        )}

        {/* Submit lineup button */}
        {showAwaySubmit && (
          <TouchableOpacity
            onPress={() => handleSubmitLineup("away")}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center gap-2 p-4 rounded-lg ${
              isSubmitting ? "bg-gray-300" : "bg-primary-600"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
            <Text className="text-white font-bold">Submit Away Lineup</Text>
          </TouchableOpacity>
        )}

        {showHomeSubmit && (
          <TouchableOpacity
            onPress={() => handleSubmitLineup("home")}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center gap-2 p-4 rounded-lg ${
              isSubmitting ? "bg-gray-300" : "bg-primary-600"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
            <Text className="text-white font-bold">Submit Home Lineup</Text>
          </TouchableOpacity>
        )}

        {/* Games section */}
        {scoringState && scoringState.games.length > 0 && (
          <GamesSection
            games={scoringState.games}
            gamesPerSet={gamesPerSet}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            presentHomePlayers={presentHome}
            presentAwayPlayers={presentAway}
            canEditHome={
              canEditHomeLineup || (isLeagueOperator && !isMatchCompleted)
            }
            canEditAway={
              canEditAwayLineup || (isLeagueOperator && !isMatchCompleted)
            }
            canScore={canScore}
            isReadOnly={isReadOnly}
            onPlayerChange={handlePlayerChange}
            onWinnerChange={handleWinnerChange}
            onTableRunToggle={handleTableRunToggle}
            on8BallToggle={handle8BallToggle}
          />
        )}
      </View>
    </ScrollView>
  );
}
