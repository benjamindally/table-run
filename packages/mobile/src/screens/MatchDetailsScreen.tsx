/**
 * Match Details Screen - Match info, real-time scoring, and status.
 *
 * Single destination for tapping any match. Handles all roles:
 *   - Anonymous / non-captain: read-only view
 *   - Captain: interactive lineup and scoring flow
 *   - League operator: full edit access
 *
 * Registered in both MatchesStack and SeasonsStack, so it uses
 * useRoute / useNavigation hooks instead of typed screen props.
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
import { Send, AlertTriangle, Check, Shuffle, Shield, WifiOff, RotateCcw } from "lucide-react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import {
  matchesApi,
  teamsApi,
  seasonsApi,
  type Match,
  type Season,
  type TeamSide,
  type IncomingMessage,
  type LineupState,
  type MatchLineupResponse,
} from "@league-genius/shared";
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

type MatchDetailsRouteParams = { matchId: number };

export default function MatchDetailsScreen() {
  const route = useRoute<RouteProp<{ MatchDetails: MatchDetailsRouteParams }, "MatchDetails">>();
  const { matchId } = route.params;

  // Auth and user context
  const { accessToken, isAuthenticated } = useAuthStore();
  const { isCaptain, isOperator } = useUserContextStore();

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
  // League operators can edit at any phase, including completed matches
  const canEditAwayLineup =
    (isAwayLineupPhase || isLeagueOperator) &&
    (captainRole === "away" || isLeagueOperator);
  const canEditHomeLineup =
    (isHomeLineupPhase || isLeagueOperator) &&
    (captainRole === "home" || isLeagueOperator);
  // Scoring is locked once away captain submits (awaiting_confirmation) to prevent
  // the home captain from silently altering results before confirming.
  // League operators can always score.
  const canScore =
    (isLeagueOperator || (!isMatchCompleted && lineupState === "match_live")) &&
    canEdit;
  const isReadOnly = (isMatchCompleted && !isLeagueOperator) || !canEdit;

  // Show connection indicator only for active matches where user can edit
  const showConnectionStatus = canEdit && !isMatchCompleted;

  // Fetch the current lineup from the server and apply it to local state.
  // Called on initial load (when lineup already exists) and when a lineup
  // submission WebSocket event arrives while the screen is open.
  const loadLineupData = useCallback(async () => {
    // Read fresh state imperatively so stale closures never cause issues
    const currentState = useMatchScoringStore.getState().state;
    if (!currentState) return;
    try {
      const lineupData: MatchLineupResponse = await matchesApi.getLineup(
        matchId,
        accessToken || undefined
      );
      const awayIds = new Set(
        lineupData.games
          .filter((g) => g.away_player !== null)
          .map((g) => g.away_player!.id)
      );
      const homeIds = new Set(
        lineupData.games
          .filter((g) => g.home_player !== null)
          .map((g) => g.home_player!.id)
      );
      setAwayRoster(
        currentState.awayRoster.map((p) => ({
          ...p,
          present: awayIds.has(p.playerId),
        }))
      );
      setHomeRoster(
        currentState.homeRoster.map((p) => ({
          ...p,
          present: homeIds.has(p.playerId),
        }))
      );
      lineupData.games.forEach((g) => {
        updateGame(g.game_number - 1, {
          ...(g.id !== undefined ? { id: g.id } : {}),
          awayPlayerId: g.away_player?.id ?? null,
          homePlayerId: g.home_player?.id ?? null,
        });
      });
    } catch (err) {
      console.warn("[MatchDetailsScreen] Could not load lineup data:", err);
    }
  }, [matchId, accessToken, setAwayRoster, setHomeRoster, updateGame]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      switch (message.type) {
        case "player_assignment":
          const playerKey =
            message.team_side === "home" ? "homePlayerId" : "awayPlayerId";
          updateGame(message.game_id - 1, { [playerKey]: message.player_id });
          break;

        case "game_update":
          const gameIndex =
            scoringState?.games.findIndex((g) => g.id === message.game_id) ?? -1;
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

        case "lineup_submitted":
          if (message.team_side === "away") {
            setLineupState("awaiting_home_lineup");
          } else {
            setLineupState("ready_to_start");
          }
          loadLineupData();
          break;

        case "away_lineup_submitted":
          setLineupState("awaiting_home_lineup");
          loadLineupData();
          break;

        case "home_lineup_submitted":
          setLineupState("ready_to_start");
          loadLineupData();
          break;

        case "match_started":
        case "match_start":
          setLineupState("match_live");
          // Fetch game IDs from lineup endpoint for any captain who stayed on
          // the screen throughout (WS match_state only fires on initial connect,
          // which may have been before games existed)
          loadLineupData();
          break;

        case "scorecard_submitted":
          setSubmittedBy(message.submitted_by);
          setLineupState("awaiting_confirmation");
          break;

        case "scorecard_rejected":
          setSubmittedBy(null);
          setLineupState("match_live");
          if (captainRole === "away") {
            Alert.alert(
              "Scorecard Sent Back",
              "The home captain returned the scorecard for correction. Review the results and resubmit when ready.",
              [{ text: "OK" }]
            );
          }
          break;

        case "match_finalized":
          setLineupState("completed");
          break;

        default:
          break;
      }
    },
    [scoringState?.games, updateGame, setLineupState, setSubmittedBy, loadLineupData]
  );

  // WebSocket — only connect for active matches (skip completed)
  const { send: sendWebSocket, status: connectionStatus, reconnect: reconnectWebSocket } = useMatchWebSocket({
    matchId,
    enabled: match !== null && scoringState !== null && !isMatchCompleted,
    onMessage: handleWebSocketMessage,
  });

  // Load match and related data
  const loadData = useCallback(async () => {
    try {
      setError(null);

      const matchData = await matchesApi.getById(
        matchId,
        accessToken || undefined
      );
      setMatch(matchData);

      const seasonData = await seasonsApi.getById(
        matchData.season,
        accessToken || undefined
      );
      setSeason(seasonData);

      const leagueGamesPerSet = seasonData.league_detail?.games_per_set || 4;
      const gamesCount =
        leagueGamesPerSet * (seasonData.league_detail?.sets_per_match || 4);
      await initializeMatch(
        matchId,
        gamesCount,
        leagueGamesPerSet,
        (matchData.lineup_state as LineupState) || "awaiting_away_lineup"
      );

      const [homeRoster, awayRoster] = await Promise.all([
        teamsApi.getRoster(matchData.home_team, accessToken || undefined),
        teamsApi.getRoster(matchData.away_team, accessToken || undefined),
      ]);

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

      // If lineup has already been (partially) submitted, load it from the server
      // so the home captain can see what the away captain entered.
      const serverLineupState = matchData.lineup_state as LineupState;
      const hasSubmittedLineup =
        serverLineupState &&
        serverLineupState !== "not_started" &&
        serverLineupState !== "awaiting_away_lineup";

      if (hasSubmittedLineup) {
        try {
          const lineupData: MatchLineupResponse = await matchesApi.getLineup(
            matchId,
            accessToken || undefined
          );

          // Determine which players appear in the lineup → mark as present
          const awayIdsInLineup = new Set(
            lineupData.games
              .filter((g) => g.away_player !== null)
              .map((g) => g.away_player!.id)
          );
          const homeIdsInLineup = new Set(
            lineupData.games
              .filter((g) => g.home_player !== null)
              .map((g) => g.home_player!.id)
          );

          setAwayRoster(
            awayAttendance.map((p) => ({
              ...p,
              present: awayIdsInLineup.has(p.playerId),
            }))
          );
          setHomeRoster(
            homeAttendance.map((p) => ({
              ...p,
              present: homeIdsInLineup.has(p.playerId),
            }))
          );

          // Apply player assignments and game IDs
          lineupData.games.forEach((gameData) => {
            updateGame(gameData.game_number - 1, {
              ...(gameData.id !== undefined ? { id: gameData.id } : {}),
              awayPlayerId: gameData.away_player?.id ?? null,
              homePlayerId: gameData.home_player?.id ?? null,
            });
          });
        } catch (err) {
          console.warn("[MatchDetailsScreen] Could not load lineup data:", err);
          setHomeRoster(homeAttendance);
          setAwayRoster(awayAttendance);
        }
      } else {
        setHomeRoster(homeAttendance);
        setAwayRoster(awayAttendance);
      }
    } catch (err) {
      console.error("[MatchDetailsScreen] Failed to load:", err);
      setError("Failed to load match data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId, accessToken, initializeMatch, setHomeRoster, setAwayRoster, updateGame]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle player assignment (lineup phase)
  const handlePlayerChange = useCallback(
    (gameIndex: number, team: TeamSide, playerId: number | null) => {
      const key = team === "home" ? "homePlayerId" : "awayPlayerId";
      updateGame(gameIndex, { [key]: playerId });

      if (playerId !== null) {
        sendWebSocket({
          type: "player_assignment",
          game_id: gameIndex + 1,
          player_id: playerId,
          team_side: team,
        });
      }
    },
    [updateGame, sendWebSocket]
  );

  // Handle game result changes (scoring phase).
  // game.id is the DB primary key, populated from the /lineup/ endpoint
  // (called after match starts for both captains via loadLineupData).
  const handleWinnerChange = useCallback(
    (gameIndex: number, winner: TeamSide) => {
      const game = scoringState?.games[gameIndex];
      if (!game?.id) return;
      updateGame(gameIndex, { winner });
      sendWebSocket({ type: "game_update", game_id: game.id, game_data: { winner } });
    },
    [scoringState?.games, updateGame, sendWebSocket]
  );

  const handleTableRunToggle = useCallback(
    (gameIndex: number, team: TeamSide) => {
      const game = scoringState?.games[gameIndex];
      if (!game?.id) return;
      const newValue = team === "home" ? !game.homeTableRun : !game.awayTableRun;
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

  // Start match (home captain, ready_to_start phase)
  const handleStartMatch = async () => {
    if (!accessToken) return;
    setIsStartingMatch(true);
    try {
      await matchesApi.startMatch(matchId, accessToken);
      setLineupState("match_live");
      sendWebSocket({ type: "match_start" });
      // Refresh game data immediately so game IDs are available for scoring
      // without waiting for the WS match_state broadcast
      await loadLineupData();
    } catch (err) {
      console.error("[MatchDetailsScreen] Failed to start match:", err);
      Alert.alert("Error", "Failed to start match. Please try again.");
    } finally {
      setIsStartingMatch(false);
    }
  };

  // Submit lineup
  const handleSubmitLineup = async (team: TeamSide) => {
    if (!accessToken || !scoringState) return;
    const games = scoringState.games.map((g) => ({
      game_number: g.gameNumber,
      player_id: team === "away" ? g.awayPlayerId! : g.homePlayerId!,
    }));
    setIsSubmitting(true);
    try {
      await matchesApi.submitLineup(matchId, { games, team_side: team }, accessToken);
      sendWebSocket({ type: "lineup_submitted", team_side: team });
      setLineupState(team === "away" ? "awaiting_home_lineup" : "ready_to_start");
    } catch (err) {
      console.error("[MatchDetailsScreen] Failed to submit lineup:", err);
      Alert.alert("Error", "Failed to submit lineup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-assign present players to games (ported from web MatchForm)
  const autoAssignPlayers = useCallback(() => {
    if (!scoringState) return;

    const isAwayAssigning = isAwayLineupPhase && (captainRole === "away" || isLeagueOperator);
    const isHomeAssigning = isHomeLineupPhase && (captainRole === "home" || isLeagueOperator);
    const isBothTeams = isMatchLive;

    if (isBothTeams) {
      const homePlayers = getPresentHomePlayers().map((p) => p.playerId);
      const awayPlayers = getPresentAwayPlayers().map((p) => p.playerId);
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const availableHome = [...homePlayers];
        const availableAway = [...awayPlayers];

        for (let gameInSet = 0; gameInSet < gamesPerSet; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (availableHome.length === 0 || availableAway.length === 0) break;

          const homePlayerId = availableHome.shift()!;
          let awayPlayerId: number | null = null;

          for (let i = 0; i < availableAway.length; i++) {
            const key = `${homePlayerId}-${availableAway[i]}`;
            if (!usedMatchups.has(key)) {
              awayPlayerId = availableAway[i];
              availableAway.splice(i, 1);
              usedMatchups.add(key);
              break;
            }
          }

          if (awayPlayerId) {
            handlePlayerChange(gameIndex, "home", homePlayerId);
            handlePlayerChange(gameIndex, "away", awayPlayerId);
          }
        }
      }
    } else if (isAwayAssigning) {
      const players = getPresentAwayPlayers().map((p) => p.playerId);

      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const available = [...players];

        for (let gameInSet = 0; gameInSet < gamesPerSet; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (available.length === 0) break;
          handlePlayerChange(gameIndex, "away", available.shift()!);
        }
      }
    } else if (isHomeAssigning) {
      const players = getPresentHomePlayers().map((p) => p.playerId);
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const available = [...players];

        for (let gameInSet = 0; gameInSet < gamesPerSet; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (available.length === 0) break;

          const awayPlayerId = scoringState.games[gameIndex]?.awayPlayerId;
          let assignedId: number | null = null;

          for (let i = 0; i < available.length; i++) {
            const key = `${available[i]}-${awayPlayerId}`;
            if (!awayPlayerId || !usedMatchups.has(key)) {
              assignedId = available[i];
              available.splice(i, 1);
              if (awayPlayerId) usedMatchups.add(key);
              break;
            }
          }

          if (assignedId) handlePlayerChange(gameIndex, "home", assignedId);
        }
      }
    }
  }, [
    isAwayLineupPhase,
    isHomeLineupPhase,
    isMatchLive,
    captainRole,
    isLeagueOperator,
    getPresentHomePlayers,
    getPresentAwayPlayers,
    handlePlayerChange,
    scoringState,
    gamesPerSet,
    setsPerMatch,
  ]);

  // Home captain: send scorecard back to both teams for correction
  const handleScorecardReject = () => {
    setSubmittedBy(null);
    setLineupState("match_live");
    sendWebSocket({ type: "scorecard_rejected" });
  };

  // Away captain: submit scorecard
  const handleScorecardSubmit = () => {
    if (!scoringState) return;
    const gamesWithWinners = scoringState.games.filter((g) => g.winner !== null).length;
    const totalGames = scoringState.games.length;
    if (gamesWithWinners < totalGames) {
      Alert.alert(
        "Incomplete Scorecard",
        `All ${totalGames} games must have a winner recorded before submitting. (${gamesWithWinners}/${totalGames} complete)`,
        [{ text: "OK" }]
      );
      return;
    }
    const homeScore = getHomeScore();
    const awayScore = getAwayScore();
    setSubmittedBy("away");
    setLineupState("awaiting_confirmation");
    sendWebSocket({
      type: "scorecard_submitted",
      submitted_by: "away",
      home_score: homeScore,
      away_score: awayScore,
    });
  };

  // Home captain: finalize match
  const handleFinalizeMatch = async () => {
    if (!accessToken) return;
    if (scoringState) {
      const gamesWithWinners = scoringState.games.filter((g) => g.winner !== null).length;
      const totalGames = scoringState.games.length;
      if (gamesWithWinners < totalGames) {
        Alert.alert(
          "Incomplete Scorecard",
          `All ${totalGames} games must have a winner recorded before finalizing. (${gamesWithWinners}/${totalGames} complete)`,
          [{ text: "OK" }]
        );
        return;
      }
    }
    const homeScore = getHomeScore();
    const awayScore = getAwayScore();
    setIsSubmitting(true);
    try {
      await matchesApi.submitScore(
        matchId,
        { home_score: homeScore, away_score: awayScore },
        accessToken
      );
      sendWebSocket({ type: "scorecard_confirmed", home_score: homeScore, away_score: awayScore });
      setLineupState("completed");
    } catch (err) {
      console.error("[MatchDetailsScreen] Failed to finalize match:", err);
      Alert.alert("Error", "Failed to finalize match. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
        <Text className="text-gray-500 mt-2">Loading match...</Text>
      </View>
    );
  }

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

  // ── Derived values ───────────────────────────────────────────────────────

  const homeTeamName = match.home_team_detail?.name || "Home";
  const awayTeamName = match.away_team_detail?.name || "Away";
  const presentHome = getPresentHomePlayers();
  const presentAway = getPresentAwayPlayers();
  const isAwayLineupComplete = getIsAwayLineupComplete();
  const isHomeLineupComplete = getIsHomeLineupComplete();

  const showAwaySubmit =
    isAwayLineupPhase &&
    (captainRole === "away" || isLeagueOperator) &&
    isAwayLineupComplete;

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
        {/* Compact match header: date, teams, live score, status */}
        <MatchScoreHeader
          match={match}
          homeScore={getHomeScore()}
          awayScore={getAwayScore()}
          connectionStatus={connectionStatus}
          showConnectionStatus={showConnectionStatus}
          isCompleted={isMatchCompleted}
        />

        {/* Operator mode badge */}
        {isLeagueOperator && (
          <View className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex-row items-center gap-2">
            <Shield size={14} color="#7C3AED" />
            <Text className="text-xs font-medium text-purple-700">Operator Mode — Full edit access</Text>
          </View>
        )}

        {/* Phase and role-aware status banner */}
        <StatusBanner
          lineupState={lineupState}
          captainRole={captainRole}
          isLeagueOperator={isLeagueOperator}
          isAuthenticated={isAuthenticated}
          onStartMatch={isReadyToStart ? handleStartMatch : undefined}
          isStartingMatch={isStartingMatch}
        />

        {/* Connection lost banner */}
        {showConnectionStatus && connectionStatus === "error" && (
          <TouchableOpacity
            onPress={reconnectWebSocket}
            className="flex-row items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-2">
              <WifiOff size={14} color="#DC2626" />
              <Text className="text-xs font-medium text-red-700">Connection lost</Text>
            </View>
            <Text className="text-xs text-red-600 underline">Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Attendance — shown during lineup phases */}
        {(isAwayLineupPhase || isHomeLineupPhase || isLeagueOperator) && (
          <View className="space-y-3">
            <AttendanceSection
              team="away"
              teamName={awayTeamName}
              roster={scoringState?.awayRoster || []}
              canEdit={canEditAwayLineup}
              onToggleAttendance={toggleAwayAttendance}
              defaultExpanded={isAwayLineupPhase}
              minPlayers={gamesPerSet}
            />
            <AttendanceSection
              team="home"
              teamName={homeTeamName}
              roster={scoringState?.homeRoster || []}
              canEdit={canEditHomeLineup}
              onToggleAttendance={toggleHomeAttendance}
              defaultExpanded={isHomeLineupPhase}
              minPlayers={gamesPerSet}
            />
          </View>
        )}

        {/* Auto-assign — always visible during lineup phase, disabled until enough players are present */}
        {(canEditAwayLineup || canEditHomeLineup) && (
          <TouchableOpacity
            onPress={autoAssignPlayers}
            disabled={
              (canEditAwayLineup && presentAway.length < gamesPerSet) ||
              (canEditHomeLineup && presentHome.length < gamesPerSet)
            }
            className={`flex-row items-center justify-center gap-2 py-2.5 border ${
              (canEditAwayLineup && presentAway.length >= gamesPerSet) ||
              (canEditHomeLineup && presentHome.length >= gamesPerSet)
                ? "bg-gray-700 border-gray-700"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <Shuffle
              size={15}
              color={
                (canEditAwayLineup && presentAway.length >= gamesPerSet) ||
                (canEditHomeLineup && presentHome.length >= gamesPerSet)
                  ? "#FFFFFF"
                  : "#9CA3AF"
              }
            />
            <Text
              className={`text-sm font-medium ${
                (canEditAwayLineup && presentAway.length >= gamesPerSet) ||
                (canEditHomeLineup && presentHome.length >= gamesPerSet)
                  ? "text-white"
                  : "text-gray-400"
              }`}
            >
              Auto-Assign Players
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit lineup — away */}
        {showAwaySubmit && (
          <TouchableOpacity
            onPress={() => handleSubmitLineup("away")}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center gap-2 p-4 ${
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

        {/* Submit lineup — home */}
        {showHomeSubmit && (
          <TouchableOpacity
            onPress={() => handleSubmitLineup("home")}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center gap-2 p-4 ${
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

        {/* Games grid */}
        {scoringState && scoringState.games.length > 0 && (
          <GamesSection
            games={scoringState.games}
            gamesPerSet={gamesPerSet}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            presentHomePlayers={presentHome}
            presentAwayPlayers={presentAway}
            canEditHome={canEditHomeLineup}
            canEditAway={canEditAwayLineup}
            canScore={canScore}
            isReadOnly={isReadOnly}
            onPlayerChange={handlePlayerChange}
            onWinnerChange={handleWinnerChange}
            onTableRunToggle={handleTableRunToggle}
            on8BallToggle={handle8BallToggle}
          />
        )}

        {/* Away captain: submit scorecard */}
        {isMatchLive && captainRole === "away" && scoringState?.submittedBy === null && (() => {
          const totalGames = scoringState?.games.length ?? 0;
          const gamesWithWinners = scoringState?.games.filter((g) => g.winner !== null).length ?? 0;
          const allComplete = gamesWithWinners === totalGames && totalGames > 0;
          return (
            <TouchableOpacity
              onPress={handleScorecardSubmit}
              disabled={!allComplete}
              className={`flex-row items-center justify-center gap-2 p-4 ${
                allComplete ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <Send size={18} color="#FFFFFF" />
              <Text className="text-white font-bold">
                {allComplete
                  ? "Submit Scorecard"
                  : `Record All Games First (${gamesWithWinners}/${totalGames})`}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Operator: direct finalize during live match (bypass two-step captain flow) */}
        {isMatchLive && isLeagueOperator && (
          <TouchableOpacity
            onPress={handleFinalizeMatch}
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

        {/* Away captain: waiting for home to confirm */}
        {lineupState === "awaiting_confirmation" && captainRole === "away" && (
          <View className="bg-gray-100 border border-gray-200 p-4 items-center">
            <Text className="text-gray-600 font-medium">
              Scorecard submitted — waiting for home captain to confirm
            </Text>
          </View>
        )}

        {/* Home captain (or operator): confirm and finalize, or send back */}
        {lineupState === "awaiting_confirmation" &&
          (captainRole === "home" || isLeagueOperator) && (
            <>
              <TouchableOpacity
                onPress={handleFinalizeMatch}
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
                onPress={handleScorecardReject}
                disabled={isSubmitting}
                className="flex-row items-center justify-center gap-2 p-4 bg-white border-t border-red-200"
                activeOpacity={0.7}
              >
                <RotateCcw size={16} color="#DC2626" />
                <Text className="text-red-600 font-semibold">Send Back for Correction</Text>
              </TouchableOpacity>
            </>
          )}
      </View>
    </ScrollView>
  );
}
