/**
 * useMatchDetails — all logic for MatchDetailsScreen in one hook.
 *
 * Owns: data fetching, WebSocket, role/permission derivation,
 * lineup + scoring action handlers, and derived display values.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
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
import { useMatchWebSocket } from "./useMatchWebSocket";

export function useMatchDetails(matchId: number) {
  // ── Auth & user context ──────────────────────────────────────────────
  const { accessToken, isAuthenticated } = useAuthStore();
  const { isCaptain, isOperator } = useUserContextStore();

  // ── Scoring store ────────────────────────────────────────────────────
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

  // ── Local state ──────────────────────────────────────────────────────
  const [match, setMatch] = useState<Match | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreOverrideHome, setScoreOverrideHome] = useState("");
  const [scoreOverrideAway, setScoreOverrideAway] = useState("");
  const [isSavingScoreOverride, setIsSavingScoreOverride] = useState(false);

  // ── Role & permission derivation ─────────────────────────────────────
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

  // ── League config ────────────────────────────────────────────────────
  const gamesPerSet = season?.league_detail?.games_per_set || 4;
  const setsPerMatch = season?.league_detail?.sets_per_match || 4;

  // ── Lineup phase flags ───────────────────────────────────────────────
  const lineupState = scoringState?.lineupState || "awaiting_away_lineup";
  const isAwayLineupPhase =
    lineupState === "awaiting_away_lineup" || lineupState === "not_started";
  const isHomeLineupPhase = lineupState === "awaiting_home_lineup";
  const isReadyToStart = lineupState === "ready_to_start";
  const isMatchLive =
    lineupState === "match_live" || lineupState === "awaiting_confirmation";
  const isMatchCompleted = lineupState === "completed";

  // ── Permission checks ────────────────────────────────────────────────
  const canEditAwayLineup =
    (isAwayLineupPhase || isLeagueOperator) &&
    (captainRole === "away" || isLeagueOperator);
  const canEditHomeLineup =
    (isHomeLineupPhase || isLeagueOperator) &&
    (captainRole === "home" || isLeagueOperator);
  const canScore =
    (isLeagueOperator || (!isMatchCompleted && lineupState === "match_live")) &&
    canEdit;
  const isReadOnly = (isMatchCompleted && !isLeagueOperator) || !canEdit;

  const showConnectionStatus = canEdit && !isMatchCompleted;

  // ── Data loading ─────────────────────────────────────────────────────

  const loadLineupData = useCallback(async () => {
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
      console.warn("[useMatchDetails] Could not load lineup data:", err);
    }
  }, [matchId, accessToken, setAwayRoster, setHomeRoster, updateGame]);

  // ── WebSocket ────────────────────────────────────────────────────────

  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      switch (message.type) {
        case "player_assignment": {
          const playerKey =
            message.team_side === "home" ? "homePlayerId" : "awayPlayerId";
          updateGame(message.game_id - 1, { [playerKey]: message.player_id });
          break;
        }

        case "game_update": {
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
        }

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
    [scoringState?.games, updateGame, setLineupState, setSubmittedBy, loadLineupData, captainRole]
  );

  const {
    send: sendWebSocket,
    status: connectionStatus,
    reconnect: reconnectWebSocket,
  } = useMatchWebSocket({
    matchId,
    enabled: match !== null && scoringState !== null && !isMatchCompleted,
    onMessage: handleWebSocketMessage,
  });

  // ── Load match data ──────────────────────────────────────────────────

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

      setScoreOverrideHome(String(matchData.home_score ?? 0));
      setScoreOverrideAway(String(matchData.away_score ?? 0));

      let homeRoster: Awaited<ReturnType<typeof teamsApi.getRoster>> = [];
      let awayRoster: Awaited<ReturnType<typeof teamsApi.getRoster>> = [];
      try {
        [homeRoster, awayRoster] = await Promise.all([
          teamsApi.getRoster(matchData.home_team, accessToken || undefined),
          teamsApi.getRoster(matchData.away_team, accessToken || undefined),
        ]);
      } catch (err) {
        console.warn("[useMatchDetails] Could not load rosters:", err);
      }

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

          lineupData.games.forEach((gameData) => {
            updateGame(gameData.game_number - 1, {
              ...(gameData.id !== undefined ? { id: gameData.id } : {}),
              awayPlayerId: gameData.away_player?.id ?? null,
              homePlayerId: gameData.home_player?.id ?? null,
            });
          });
        } catch (err) {
          console.warn("[useMatchDetails] Could not load lineup data:", err);
          setHomeRoster(homeAttendance);
          setAwayRoster(awayAttendance);
        }
      } else {
        setHomeRoster(homeAttendance);
        setAwayRoster(awayAttendance);
      }
    } catch (err) {
      console.error("[useMatchDetails] Failed to load:", err);
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

  // ── Game action handlers ─────────────────────────────────────────────

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

  // ── Match flow actions ───────────────────────────────────────────────

  const handleStartMatch = async () => {
    if (!accessToken) return;
    setIsStartingMatch(true);
    try {
      await matchesApi.startMatch(matchId, accessToken);
      setLineupState("match_live");
      sendWebSocket({ type: "match_start" });
      await loadLineupData();
    } catch (err) {
      console.error("[useMatchDetails] Failed to start match:", err);
      Alert.alert("Error", "Failed to start match. Please try again.");
    } finally {
      setIsStartingMatch(false);
    }
  };

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
      console.error("[useMatchDetails] Failed to submit lineup:", err);
      Alert.alert("Error", "Failed to submit lineup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoAssignPlayers = useCallback(() => {
    if (!scoringState) return;

    const awayPlayerIds = getPresentAwayPlayers().map((p) => p.playerId);
    const homePlayerIds = getPresentHomePlayers().map((p) => p.playerId);

    const shouldAssignAway = isLeagueOperator
      ? awayPlayerIds.length >= gamesPerSet
      : (isMatchLive || (isAwayLineupPhase && captainRole === "away"));
    const shouldAssignHome = isLeagueOperator
      ? homePlayerIds.length >= gamesPerSet
      : (isMatchLive || (isHomeLineupPhase && captainRole === "home"));

    if (shouldAssignAway && shouldAssignHome) {
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const availableHome = [...homePlayerIds];
        const availableAway = [...awayPlayerIds];

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
    } else if (shouldAssignAway) {
      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const available = [...awayPlayerIds];

        for (let gameInSet = 0; gameInSet < gamesPerSet; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (available.length === 0) break;
          handlePlayerChange(gameIndex, "away", available.shift()!);
        }
      }
    } else if (shouldAssignHome) {
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= setsPerMatch; setNum++) {
        const setStartIndex = (setNum - 1) * gamesPerSet;
        const available = [...homePlayerIds];

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

  const handleScorecardReject = () => {
    setSubmittedBy(null);
    setLineupState("match_live");
    sendWebSocket({ type: "scorecard_rejected" });
  };

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
      console.error("[useMatchDetails] Failed to finalize match:", err);
      Alert.alert("Error", "Failed to finalize match. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Score override (operator) ────────────────────────────────────────

  const handleScoreOverrideSave = async () => {
    if (!accessToken) return;
    const homeVal = parseInt(scoreOverrideHome) || 0;
    const awayVal = parseInt(scoreOverrideAway) || 0;
    setIsSavingScoreOverride(true);
    try {
      const updated = await matchesApi.update(
        matchId,
        { home_score: homeVal, away_score: awayVal, status: "completed" },
        accessToken
      );
      setMatch(updated);
      Alert.alert("Saved", `Score updated to ${homeVal} - ${awayVal}.`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save score.");
    } finally {
      setIsSavingScoreOverride(false);
    }
  };

  // ── Derived display values ───────────────────────────────────────────

  const homeTeamName = match?.home_team_detail?.name || "Home";
  const awayTeamName = match?.away_team_detail?.name || "Away";
  const presentHome = getPresentHomePlayers();
  const presentAway = getPresentAwayPlayers();
  const isAwayLineupComplete = getIsAwayLineupComplete();
  const isHomeLineupComplete = getIsHomeLineupComplete();

  const gameHomeScore = getHomeScore();
  const gameAwayScore = getAwayScore();
  const hasGameResults = scoringState?.games.some((g) => g.winner !== null) ?? false;
  const displayHomeScore = hasGameResults ? gameHomeScore : (match?.home_score ?? 0);
  const displayAwayScore = hasGameResults ? gameAwayScore : (match?.away_score ?? 0);

  const hasNoGameData =
    !hasGameResults &&
    (scoringState?.homeRoster.length === 0 || scoringState?.awayRoster.length === 0);
  const showScoreOverride = isLeagueOperator && (hasNoGameData || isMatchCompleted);

  const showAwaySubmit =
    isAwayLineupPhase && (captainRole === "away" || isLeagueOperator);
  const showHomeSubmit =
    isHomeLineupPhase && (captainRole === "home" || isLeagueOperator);

  // ── Return ───────────────────────────────────────────────────────────

  return {
    // Data
    match,
    scoringState,

    // Loading
    loading,
    refreshing,
    error,
    onRefresh,

    // Roles & permissions
    captainRole,
    isLeagueOperator,
    isAuthenticated,
    canEditAwayLineup,
    canEditHomeLineup,
    canScore,
    isReadOnly,

    // Lineup phase flags
    lineupState,
    isAwayLineupPhase,
    isHomeLineupPhase,
    isReadyToStart,
    isMatchLive,
    isMatchCompleted,

    // Connection
    connectionStatus,
    showConnectionStatus,
    reconnectWebSocket,

    // Display values
    homeTeamName,
    awayTeamName,
    presentHome,
    presentAway,
    displayHomeScore,
    displayAwayScore,
    isAwayLineupComplete,
    isHomeLineupComplete,
    gamesPerSet,

    // Visibility flags
    showScoreOverride,
    hasNoGameData: hasNoGameData ?? false,
    showAwaySubmit,
    showHomeSubmit,

    // Attendance
    toggleHomeAttendance,
    toggleAwayAttendance,

    // Game actions
    handlePlayerChange,
    handleWinnerChange,
    handleTableRunToggle,
    handle8BallToggle,

    // Match flow
    handleSubmitLineup,
    handleStartMatch,
    autoAssignPlayers,
    handleScorecardSubmit,
    handleScorecardReject,
    handleFinalizeMatch,
    isStartingMatch,
    isSubmitting,

    // Score override
    scoreOverrideHome,
    scoreOverrideAway,
    setScoreOverrideHome,
    setScoreOverrideAway,
    isSavingScoreOverride,
    handleScoreOverrideSave,
  };
}
