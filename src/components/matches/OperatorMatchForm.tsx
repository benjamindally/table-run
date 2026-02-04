/**
 * OperatorMatchForm - League Operator Match Management Form
 * All sections editable at once without sequential workflow restrictions
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTeamRoster } from "../../hooks/useTeams";
import { matchesApi } from "../../api";
import { toast } from "react-toastify";
import {
  Calendar,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  AlertCircle,
  AlertTriangle,
  Users,
  Settings,
  Zap,
} from "lucide-react";
import type { Match, LineupState } from "../../api/types";
import { formatLocalDate } from "../../utils/dateUtils";
import { useMatchScoring } from "../../contexts/MatchScoringContext";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";
import { useAuth } from "../../contexts/AuthContext";
import type { IncomingMessage, TeamSide } from "../../types/websocket";
import Modal from "../Modal";

interface OperatorMatchFormProps {
  match: Match;
  gamesCount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LINEUP_STATES: { value: LineupState; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "awaiting_away_lineup", label: "Awaiting Away Lineup" },
  { value: "awaiting_home_lineup", label: "Awaiting Home Lineup" },
  { value: "ready_to_start", label: "Ready to Start" },
  { value: "match_live", label: "Match Live" },
  { value: "awaiting_confirmation", label: "Awaiting Confirmation" },
  { value: "completed", label: "Completed" },
];

const OperatorMatchForm: React.FC<OperatorMatchFormProps> = ({
  match,
  gamesCount,
  onSuccess,
  onCancel,
}) => {
  // Get context state and actions
  const {
    state,
    setHomeRoster,
    setAwayRoster,
    toggleHomeAttendance,
    toggleAwayAttendance,
    updateGame,
    setSubmittedBy,
    setLineupState,
    homeScore,
    awayScore,
    presentHomePlayers,
    presentAwayPlayers,
  } = useMatchScoring();

  // Get auth token for API calls
  const { getAuthToken } = useAuth();

  // Local UI state
  const [rostersCollapsed, setRostersCollapsed] = useState(false);
  const [collapsedSets, setCollapsedSets] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"sets" | "table">("sets");
  const [statusOverride, setStatusOverride] = useState<LineupState | "">("");
  const lineupFetchedRef = useRef(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({ isOpen: false, title: "", message: "", action: null });

  // Get state values with defaults
  const homeRoster = useMemo(() => state?.homeRoster || [], [state?.homeRoster]);
  const awayRoster = useMemo(() => state?.awayRoster || [], [state?.awayRoster]);
  const games = useMemo(() => state?.games || [], [state?.games]);
  const lineupState: LineupState = state?.lineupState || match.lineup_state || "awaiting_away_lineup";

  // Fetch rosters
  const { data: homeRosterData, isLoading: homeRosterLoading } = useTeamRoster(match.home_team);
  const { data: awayRosterData, isLoading: awayRosterLoading } = useTeamRoster(match.away_team);

  const homeTeam = match.home_team_detail;
  const awayTeam = match.away_team_detail;

  // Sync status override dropdown with current state
  useEffect(() => {
    setStatusOverride(lineupState);
  }, [lineupState]);

  // Initialize rosters when data loads
  useEffect(() => {
    if (homeRosterData && state?.homeRoster.length === 0) {
      const assignedPlayerIds = new Set<number>();
      games.forEach((g) => {
        if (g.homePlayerId) assignedPlayerIds.add(g.homePlayerId);
      });

      setHomeRoster(
        homeRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: assignedPlayerIds.has(member.player),
        }))
      );
    }
  }, [homeRosterData, setHomeRoster, state?.homeRoster.length, games]);

  useEffect(() => {
    if (awayRosterData && state?.awayRoster.length === 0) {
      const assignedPlayerIds = new Set<number>();
      games.forEach((g) => {
        if (g.awayPlayerId) assignedPlayerIds.add(g.awayPlayerId);
      });

      setAwayRoster(
        awayRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: assignedPlayerIds.has(member.player),
        }))
      );
    }
  }, [awayRosterData, setAwayRoster, state?.awayRoster.length, games]);

  // Fetch existing lineup data on mount
  useEffect(() => {
    const fetchLineup = async () => {
      if (lineupFetchedRef.current) return;

      const token = getAuthToken();
      if (!token) return;

      if (!state?.awayRoster || state.awayRoster.length === 0) return;
      if (!state?.homeRoster || state.homeRoster.length === 0) return;

      lineupFetchedRef.current = true;

      try {
        const lineupData = await matchesApi.getLineup(match.id, token);

        if (lineupData.games && lineupData.games.length > 0) {
          const awayPlayerIds = new Set<number>();
          const homePlayerIds = new Set<number>();

          lineupData.games.forEach((game) => {
            if (game.away_player) awayPlayerIds.add(game.away_player.id);
            if (game.home_player) homePlayerIds.add(game.home_player.id);
          });

          // Mark players as present
          if (awayPlayerIds.size > 0) {
            const updatedAwayRoster = state.awayRoster.map((player) => ({
              ...player,
              present: awayPlayerIds.has(player.playerId) ? true : player.present,
            }));
            setAwayRoster(updatedAwayRoster);
          }

          if (homePlayerIds.size > 0) {
            const updatedHomeRoster = state.homeRoster.map((player) => ({
              ...player,
              present: homePlayerIds.has(player.playerId) ? true : player.present,
            }));
            setHomeRoster(updatedHomeRoster);
          }

          // Update games with player assignments
          lineupData.games.forEach((game) => {
            if (game.away_player) {
              updateGame(game.game_number - 1, { awayPlayerId: game.away_player.id });
            }
            if (game.home_player) {
              updateGame(game.game_number - 1, { homePlayerId: game.home_player.id });
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch lineup:", error);
        lineupFetchedRef.current = false;
      }
    };

    fetchLineup();
  }, [match.id, getAuthToken, updateGame, state?.awayRoster, state?.homeRoster, setAwayRoster, setHomeRoster]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      switch (message.type) {
        case "player_assignment":
          updateGame(message.game_id - 1, {
            [message.team_side === "home" ? "homePlayerId" : "awayPlayerId"]: message.player_id,
          });
          break;

        case "game_update": {
          const gameIndex = games.findIndex((g) => g.id === message.game_id);
          if (gameIndex === -1) break;

          const gameUpdates: Partial<{
            winner: TeamSide | null;
            homeTableRun: boolean;
            awayTableRun: boolean;
            home8Ball: boolean;
            away8Ball: boolean;
          }> = {};

          if (message.game_data.winner !== undefined) gameUpdates.winner = message.game_data.winner;
          if (message.game_data.home_table_run !== undefined) gameUpdates.homeTableRun = message.game_data.home_table_run;
          if (message.game_data.away_table_run !== undefined) gameUpdates.awayTableRun = message.game_data.away_table_run;
          if (message.game_data.home_8ball_break !== undefined) gameUpdates.home8Ball = message.game_data.home_8ball_break;
          if (message.game_data.away_8ball_break !== undefined) gameUpdates.away8Ball = message.game_data.away_8ball_break;

          updateGame(gameIndex, gameUpdates);
          break;
        }

        case "scorecard_submitted":
          setSubmittedBy(message.submitted_by);
          toast.info(`${message.submitted_by === "home" ? homeTeam?.name : awayTeam?.name} captain submitted scorecard`);
          break;

        case "match_finalized":
          if (message.success) {
            toast.success("Match finalized!");
            if (onSuccess) onSuccess();
          }
          break;

        case "away_lineup_submitted":
        case "home_lineup_submitted":
        case "lineup_submitted":
          // Sync lineup state changes from captains
          if (message.type === "away_lineup_submitted" || (message as any).team_side === "away") {
            setLineupState("awaiting_home_lineup");
          } else {
            setLineupState("ready_to_start");
          }
          lineupFetchedRef.current = false; // Refetch lineup
          break;

        case "match_started":
        case "match_start":
          setLineupState("match_live");
          break;

        case "match_state": {
          const { data: matchData } = message;
          if (matchData?.games && matchData.games.length > 0) {
            const homePlayerIds = new Set<number>();
            const awayPlayerIds = new Set<number>();

            matchData.games.forEach((gameData) => {
              if (gameData.home_player?.id) homePlayerIds.add(gameData.home_player.id);
              if (gameData.away_player?.id) awayPlayerIds.add(gameData.away_player.id);

              const gameUpdate: Partial<{
                id: number;
                homePlayerId: number;
                awayPlayerId: number;
                winner: TeamSide | null;
                homeTableRun: boolean;
                awayTableRun: boolean;
                home8Ball: boolean;
                away8Ball: boolean;
              }> = {
                id: gameData.id,
                winner: gameData.winner || null,
                homeTableRun: gameData.home_table_run || false,
                awayTableRun: gameData.away_table_run || false,
                home8Ball: gameData.home_8ball_break || false,
                away8Ball: gameData.away_8ball_break || false,
              };

              if (gameData.home_player?.id) gameUpdate.homePlayerId = gameData.home_player.id;
              if (gameData.away_player?.id) gameUpdate.awayPlayerId = gameData.away_player.id;

              updateGame(gameData.game_number - 1, gameUpdate);
            });

            if (homeRoster.length > 0 && homePlayerIds.size > 0) {
              setHomeRoster(homeRoster.map((p) => ({
                ...p,
                present: homePlayerIds.has(p.playerId) ? true : p.present,
              })));
            }
            if (awayRoster.length > 0 && awayPlayerIds.size > 0) {
              setAwayRoster(awayRoster.map((p) => ({
                ...p,
                present: awayPlayerIds.has(p.playerId) ? true : p.present,
              })));
            }

            if (matchData.lineup_state) {
              setLineupState(matchData.lineup_state as LineupState);
            }
          }
          break;
        }
      }
    },
    [games, updateGame, setSubmittedBy, setLineupState, homeTeam, awayTeam, onSuccess, homeRoster, awayRoster, setHomeRoster, setAwayRoster]
  );

  // Initialize WebSocket connection
  const { send: sendWebSocket, status } = useMatchWebSocket({
    matchId: match.id,
    enabled: true,
    onMessage: handleWebSocketMessage,
  });

  // Wrapper functions for context + WebSocket
  const handlePlayerChange = useCallback(
    (gameIndex: number, teamSide: TeamSide, playerId: number | null) => {
      updateGame(gameIndex, {
        [teamSide === "home" ? "homePlayerId" : "awayPlayerId"]: playerId,
      });

      if (playerId !== null) {
        sendWebSocket({
          type: "player_assignment",
          game_id: gameIndex + 1,
          player_id: playerId,
          team_side: teamSide,
        });
      }
    },
    [updateGame, sendWebSocket]
  );

  const handleGameDataChange = useCallback(
    (
      gameIndex: number,
      updates: {
        winner?: TeamSide | null;
        homeTableRun?: boolean;
        awayTableRun?: boolean;
        home8Ball?: boolean;
        away8Ball?: boolean;
      }
    ) => {
      const game = games[gameIndex];
      const gameId = game?.id;

      updateGame(gameIndex, updates);

      if (!gameId) return;

      const game_data: {
        winner?: TeamSide | null;
        home_table_run?: boolean;
        away_table_run?: boolean;
        home_8ball_break?: boolean;
        away_8ball_break?: boolean;
      } = {};

      if (updates.winner !== undefined) game_data.winner = updates.winner;
      if (updates.homeTableRun !== undefined) game_data.home_table_run = updates.homeTableRun;
      if (updates.awayTableRun !== undefined) game_data.away_table_run = updates.awayTableRun;
      if (updates.home8Ball !== undefined) game_data.home_8ball_break = updates.home8Ball;
      if (updates.away8Ball !== undefined) game_data.away_8ball_break = updates.away8Ball;

      sendWebSocket({
        type: "game_update" as const,
        game_id: gameId,
        game_data,
      });
    },
    [games, updateGame, sendWebSocket]
  );

  // Submit lineup for a team
  const handleSubmitLineup = useCallback(async (teamSide: TeamSide) => {
    const isAway = teamSide === "away";
    const lineupGames = games.map((g) => ({
      game_number: g.gameNumber,
      player_id: isAway ? g.awayPlayerId! : g.homePlayerId!,
    }));

    // Check for incomplete assignments
    const incompleteGames = lineupGames.filter((g) => !g.player_id);
    if (incompleteGames.length > 0) {
      toast.warning(`${incompleteGames.length} games without ${teamSide} players - submitting partial lineup`);
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      await matchesApi.submitLineup(
        match.id,
        { games: lineupGames.filter((g) => g.player_id), team_side: teamSide },
        token
      );

      const newState = isAway ? "awaiting_home_lineup" : "ready_to_start";
      setLineupState(newState);

      sendWebSocket({
        type: "lineup_submitted",
        team_side: teamSide,
      });

      toast.success(`${isAway ? "Away" : "Home"} lineup submitted`);
    } catch (error: any) {
      console.error("Failed to submit lineup:", error);
      toast.error(error.message || "Failed to submit lineup");
    }
  }, [games, match.id, setLineupState, getAuthToken, sendWebSocket]);

  // Start the match
  const handleStartMatch = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      await matchesApi.startMatch(match.id, token);
      setLineupState("match_live");
      sendWebSocket({ type: "match_start" });
      toast.success("Match started!");
    } catch (error: any) {
      console.error("Failed to start match:", error);
      toast.error(error.message || "Failed to start match");
    }
  }, [match.id, setLineupState, getAuthToken, sendWebSocket]);

  // Finalize match
  const handleFinalizeMatch = useCallback(() => {
    sendWebSocket({
      type: "scorecard_confirmed",
      home_score: homeScore,
      away_score: awayScore,
    });
    toast.info("Finalizing match...");
  }, [sendWebSocket, homeScore, awayScore]);

  // Override status (internal)
  const executeStatusOverride = useCallback(() => {
    if (statusOverride && statusOverride !== lineupState) {
      setLineupState(statusOverride);
      toast.success(`Status changed to: ${LINEUP_STATES.find((s) => s.value === statusOverride)?.label}`);
    }
  }, [statusOverride, lineupState, setLineupState]);

  // Status override with confirmation check
  const handleStatusOverride = useCallback(() => {
    const existingData = getExistingDataInfo();

    // If reverting to an earlier state when data exists, warn the user
    if (existingData.hasScores || existingData.isCompleted) {
      const warnings: string[] = [];
      if (existingData.gamesWithScores > 0) {
        warnings.push(`${existingData.gamesWithScores} game scores already recorded`);
      }
      if (existingData.isCompleted) {
        warnings.push("This match is already completed and may affect standings");
      }

      requestConfirmation(
        "Override Match Status?",
        `You are changing the status of a match that has existing data:\n\n• ${warnings.join("\n• ")}\n\nThis may override data that captains or players have already submitted. Are you sure you want to proceed?`,
        executeStatusOverride
      );
      return;
    }

    executeStatusOverride();
  }, [getExistingDataInfo, requestConfirmation, executeStatusOverride]);

  // Lineup submission with confirmation check
  const handleSubmitLineupWithConfirm = useCallback((teamSide: TeamSide) => {
    const existingData = getExistingDataInfo();

    // If submitting lineup when scores already exist or match is further along
    if (existingData.hasScores || existingData.isLive || existingData.isCompleted) {
      const warnings: string[] = [];
      if (existingData.gamesWithScores > 0) {
        warnings.push(`${existingData.gamesWithScores} game scores already recorded`);
      }
      if (existingData.isCompleted) {
        warnings.push("This match is already completed");
      }
      if (existingData.isLive) {
        warnings.push("This match is currently live");
      }

      requestConfirmation(
        "Override Lineup Data?",
        `You are submitting a ${teamSide} lineup for a match that has existing data:\n\n• ${warnings.join("\n• ")}\n\nThis may override lineup assignments made by captains. Are you sure you want to proceed?`,
        () => handleSubmitLineup(teamSide)
      );
      return;
    }

    handleSubmitLineup(teamSide);
  }, [getExistingDataInfo, requestConfirmation, handleSubmitLineup]);

  // Start match with confirmation check
  const handleStartMatchWithConfirm = useCallback(() => {
    const existingData = getExistingDataInfo();

    if (existingData.hasScores || existingData.isCompleted) {
      const warnings: string[] = [];
      if (existingData.gamesWithScores > 0) {
        warnings.push(`${existingData.gamesWithScores} game scores already recorded`);
      }
      if (existingData.isCompleted) {
        warnings.push("This match was previously completed and may have affected standings");
      }

      requestConfirmation(
        "Start Match?",
        `This match has existing data:\n\n• ${warnings.join("\n• ")}\n\nStarting the match will reset the workflow. Are you sure you want to proceed?`,
        handleStartMatch
      );
      return;
    }

    handleStartMatch();
  }, [getExistingDataInfo, requestConfirmation, handleStartMatch]);

  // Finalize match with confirmation check (always confirm since it affects standings)
  const handleFinalizeMatchWithConfirm = useCallback(() => {
    const gamesWithWinner = games.filter((g) => g.winner !== null).length;
    const totalGames = games.length;

    requestConfirmation(
      "Finalize Match?",
      `You are about to finalize this match with a score of ${homeScore} - ${awayScore} (${gamesWithWinner}/${totalGames} games scored).\n\nThis will:\n• Record final results to standings\n• Lock the match from further editing\n• Notify connected captains and players\n\nAre you sure you want to proceed?`,
      handleFinalizeMatch
    );
  }, [games, homeScore, awayScore, requestConfirmation, handleFinalizeMatch]);

  // Auto-assign all players
  const autoAssignAll = useCallback(() => {
    const homePlayers = presentHomePlayers.map((p) => p.playerId);
    const awayPlayers = presentAwayPlayers.map((p) => p.playerId);

    if (homePlayers.length < 4 || awayPlayers.length < 4) {
      toast.error("Need at least 4 present players on each team");
      return;
    }

    const usedMatchups = new Set<string>();
    const setsCount = Math.ceil(gamesCount / 4);

    for (let setNum = 1; setNum <= setsCount; setNum++) {
      const setStartIndex = (setNum - 1) * 4;
      const availableHome = [...homePlayers];
      const availableAway = [...awayPlayers];

      for (let gameInSet = 0; gameInSet < 4; gameInSet++) {
        const gameIndex = setStartIndex + gameInSet;
        if (gameIndex >= gamesCount) break;
        if (availableHome.length === 0 || availableAway.length === 0) break;

        const homePlayerId = availableHome.shift()!;
        let awayPlayerId: number | null = null;

        for (let i = 0; i < availableAway.length; i++) {
          const candidateAwayId = availableAway[i];
          const matchupKey = `${homePlayerId}-${candidateAwayId}`;
          if (!usedMatchups.has(matchupKey)) {
            awayPlayerId = candidateAwayId;
            availableAway.splice(i, 1);
            usedMatchups.add(matchupKey);
            break;
          }
        }

        if (awayPlayerId) {
          handlePlayerChange(gameIndex, "home", homePlayerId);
          handlePlayerChange(gameIndex, "away", awayPlayerId);
        }
      }
    }

    toast.success("Players auto-assigned to all games");
  }, [presentHomePlayers, presentAwayPlayers, gamesCount, handlePlayerChange]);

  // Mark all players present for a team
  const markAllPresent = useCallback((team: "home" | "away") => {
    if (team === "home") {
      setHomeRoster(homeRoster.map((p) => ({ ...p, present: true })));
    } else {
      setAwayRoster(awayRoster.map((p) => ({ ...p, present: true })));
    }
    toast.success(`All ${team} players marked present`);
  }, [homeRoster, awayRoster, setHomeRoster, setAwayRoster]);

  // Toggle set collapse
  const toggleSetCollapse = (setNum: number) => {
    setCollapsedSets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(setNum)) {
        newSet.delete(setNum);
      } else {
        newSet.add(setNum);
      }
      return newSet;
    });
  };

  // Calculate warnings
  const warnings: string[] = [];
  const gamesWithoutPlayers = games.filter((g) => !g.homePlayerId || !g.awayPlayerId).length;
  const gamesWithoutWinner = games.filter((g) => g.winner === null).length;
  if (gamesWithoutPlayers > 0) warnings.push(`${gamesWithoutPlayers} games without players assigned`);
  if (gamesWithoutWinner > 0 && lineupState === "match_live") warnings.push(`${gamesWithoutWinner} games without winner`);
  if (presentHomePlayers.length < 4) warnings.push(`Home team has only ${presentHomePlayers.length} present players`);
  if (presentAwayPlayers.length < 4) warnings.push(`Away team has only ${presentAwayPlayers.length} present players`);

  // Helper to determine what data has been recorded
  const getExistingDataInfo = useCallback(() => {
    const gamesWithScores = games.filter((g) => g.winner !== null).length;
    const hasLineupSubmitted = lineupState !== "not_started" && lineupState !== "awaiting_away_lineup";
    const hasHomeLineup = lineupState !== "not_started" && lineupState !== "awaiting_away_lineup" && lineupState !== "awaiting_home_lineup";
    const hasScores = gamesWithScores > 0;
    const isLive = lineupState === "match_live" || lineupState === "awaiting_confirmation";
    const isCompleted = lineupState === "completed";

    return {
      hasLineupSubmitted,
      hasHomeLineup,
      hasScores,
      isLive,
      isCompleted,
      gamesWithScores,
    };
  }, [games, lineupState]);

  // Request confirmation before potentially destructive actions
  const requestConfirmation = useCallback((
    title: string,
    message: string,
    action: () => void
  ) => {
    setConfirmModal({ isOpen: true, title, message, action });
  }, []);

  const executeConfirmedAction = useCallback(() => {
    if (confirmModal.action) {
      confirmModal.action();
    }
    setConfirmModal({ isOpen: false, title: "", message: "", action: null });
  }, [confirmModal.action]);

  const cancelConfirmation = useCallback(() => {
    setConfirmModal({ isOpen: false, title: "", message: "", action: null });
  }, []);

  const setsCount = Math.ceil(gamesCount / 4);

  return (
    <div className="space-y-4">
      {/* Match Info Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-dark-500">
            <Calendar className="h-4 w-4" />
            <span>{formatLocalDate(match.date)}</span>
            {match.week_number && <span>• Week {match.week_number}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {status === "connected" ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Live</span>
              </>
            ) : status === "connecting" ? (
              <>
                <WifiOff className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-600">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>
        {homeTeam?.establishment && (
          <div className="flex items-center gap-2 text-sm text-dark-600">
            <MapPin className="h-4 w-4" />
            <span>{homeTeam.establishment}</span>
          </div>
        )}

        {/* Status Override */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Match Status Override</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusOverride}
              onChange={(e) => setStatusOverride(e.target.value as LineupState)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {LINEUP_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} {s.value === lineupState ? "(current)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusOverride}
              disabled={!statusOverride || statusOverride === lineupState}
              className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Current Score Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-sm text-gray-500">{homeTeam?.name}</div>
            <div className="text-3xl font-bold text-primary">{homeScore}</div>
          </div>
          <div className="text-2xl font-bold text-gray-400 px-4">-</div>
          <div className="text-center flex-1">
            <div className="text-sm text-gray-500">{awayTeam?.name}</div>
            <div className="text-3xl font-bold text-primary">{awayScore}</div>
          </div>
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Warnings (can still save)</p>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Rosters Section */}
      <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setRostersCollapsed(!rostersCollapsed)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold">Team Rosters</h2>
            <span className="text-sm text-gray-500">
              ({presentHomePlayers.length} home, {presentAwayPlayers.length} away present)
            </span>
          </div>
          {rostersCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>

        {!rostersCollapsed && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Team Roster */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-dark-700">{homeTeam?.name} (Home)</h3>
                  <button
                    onClick={() => markAllPresent("home")}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Mark All Present
                  </button>
                </div>
                {homeRosterLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-cream-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : homeRoster.length === 0 ? (
                  <p className="text-dark-400 italic">No players on roster</p>
                ) : (
                  <div className="space-y-2">
                    {homeRoster.map((player) => (
                      <button
                        key={player.playerId}
                        onClick={() => toggleHomeAttendance(player.playerId)}
                        className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                          player.present
                            ? "border-primary bg-primary-50"
                            : "border-dark-200 bg-white hover:border-dark-300"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            player.present ? "border-primary bg-primary" : "border-dark-300"
                          }`}
                        >
                          {player.present && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="font-medium">{player.playerName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Away Team Roster */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-dark-700">{awayTeam?.name} (Away)</h3>
                  <button
                    onClick={() => markAllPresent("away")}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Mark All Present
                  </button>
                </div>
                {awayRosterLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-cream-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : awayRoster.length === 0 ? (
                  <p className="text-dark-400 italic">No players on roster</p>
                ) : (
                  <div className="space-y-2">
                    {awayRoster.map((player) => (
                      <button
                        key={player.playerId}
                        onClick={() => toggleAwayAttendance(player.playerId)}
                        className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                          player.present
                            ? "border-primary bg-primary-50"
                            : "border-dark-200 bg-white hover:border-dark-300"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            player.present ? "border-primary bg-primary" : "border-dark-300"
                          }`}
                        >
                          {player.present && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="font-medium">{player.playerName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Games Section */}
      {games.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Games</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={autoAssignAll}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden xs:inline">Auto-Assign</span>
                <span className="xs:hidden">Auto</span>
              </button>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode("sets")}
                  className={`px-3 py-1.5 text-sm font-medium ${
                    viewMode === "sets" ? "bg-gray-200" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Sets
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 text-sm font-medium hidden sm:block ${
                    viewMode === "table" ? "bg-gray-200" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {viewMode === "sets" ? (
            // Set-based view
            <div className="space-y-4">
              {Array.from({ length: setsCount }, (_, i) => i + 1).map((setNum) => {
                const setGames = games.slice((setNum - 1) * 4, setNum * 4);
                const setScore = {
                  home: setGames.filter((g) => g.winner === "home").length,
                  away: setGames.filter((g) => g.winner === "away").length,
                };

                return (
                  <div key={setNum} className="border border-dark-200 rounded-lg">
                    <button
                      onClick={() => toggleSetCollapse(setNum)}
                      className="w-full p-3 flex items-center justify-between hover:bg-cream-100 transition-colors rounded-t-lg"
                    >
                      <h3 className="font-bold text-dark-700">Set {setNum}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary">
                          {setScore.home} - {setScore.away}
                        </span>
                        {collapsedSets.has(setNum) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {!collapsedSets.has(setNum) && (
                      <div className="p-3 pt-0 space-y-3">
                        {setGames.map((game, idx) => {
                          const gameIndex = (setNum - 1) * 4 + idx;
                          return (
                            <div key={gameIndex} className="border border-dark-200 rounded-lg p-3">
                              <div className="text-xs font-medium text-dark-500 mb-3">Game {game.gameNumber}</div>

                              {/* Player selection */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <label className="text-xs text-dark-600 mb-1 block">{homeTeam?.name}</label>
                                  <select
                                    value={game.homePlayerId || ""}
                                    onChange={(e) => handlePlayerChange(gameIndex, "home", Number(e.target.value) || null)}
                                    className="w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="">Select player...</option>
                                    {presentHomePlayers.map((player) => (
                                      <option key={player.playerId} value={player.playerId}>
                                        {player.playerName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-dark-600 mb-1 block">{awayTeam?.name}</label>
                                  <select
                                    value={game.awayPlayerId || ""}
                                    onChange={(e) => handlePlayerChange(gameIndex, "away", Number(e.target.value) || null)}
                                    className="w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    <option value="">Select player...</option>
                                    {presentAwayPlayers.map((player) => (
                                      <option key={player.playerId} value={player.playerId}>
                                        {player.playerName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Winner buttons */}
                              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                                <button
                                  onClick={() => handleGameDataChange(gameIndex, { winner: "home" })}
                                  className={`py-2 px-2 sm:px-3 rounded-md font-medium text-xs sm:text-sm transition-all ${
                                    game.winner === "home"
                                      ? "bg-primary text-white shadow-md"
                                      : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                  }`}
                                >
                                  <span className="hidden sm:inline">Home Win</span>
                                  <span className="sm:hidden">Home</span>
                                </button>
                                <button
                                  onClick={() => handleGameDataChange(gameIndex, { winner: null })}
                                  className={`py-2 px-2 sm:px-3 rounded-md font-medium text-xs sm:text-sm transition-all ${
                                    game.winner === null
                                      ? "bg-gray-400 text-white"
                                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  }`}
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => handleGameDataChange(gameIndex, { winner: "away" })}
                                  className={`py-2 px-2 sm:px-3 rounded-md font-medium text-xs sm:text-sm transition-all ${
                                    game.winner === "away"
                                      ? "bg-primary text-white shadow-md"
                                      : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                  }`}
                                >
                                  <span className="hidden sm:inline">Away Win</span>
                                  <span className="sm:hidden">Away</span>
                                </button>
                              </div>

                              {/* Bonuses */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={game.homeTableRun}
                                      onChange={() => handleGameDataChange(gameIndex, { homeTableRun: !game.homeTableRun })}
                                      className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                    />
                                    <span>Home Table Run</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={game.home8Ball}
                                      onChange={() => handleGameDataChange(gameIndex, { home8Ball: !game.home8Ball })}
                                      className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                    />
                                    <span>Home 8-Ball Break</span>
                                  </label>
                                </div>
                                <div className="space-y-1">
                                  <label className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={game.awayTableRun}
                                      onChange={() => handleGameDataChange(gameIndex, { awayTableRun: !game.awayTableRun })}
                                      className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                    />
                                    <span>Away Table Run</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={game.away8Ball}
                                      onChange={() => handleGameDataChange(gameIndex, { away8Ball: !game.away8Ball })}
                                      className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                    />
                                    <span>Away 8-Ball Break</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Table view
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Game</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">{homeTeam?.name}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">{awayTeam?.name}</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Winner</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Bonuses</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, gameIndex) => (
                    <tr key={gameIndex} className="border-b border-gray-200">
                      <td className="px-3 py-2 font-medium">{game.gameNumber}</td>
                      <td className="px-3 py-2">
                        <select
                          value={game.homePlayerId || ""}
                          onChange={(e) => handlePlayerChange(gameIndex, "home", Number(e.target.value) || null)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="">-</option>
                          {presentHomePlayers.map((p) => (
                            <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={game.awayPlayerId || ""}
                          onChange={(e) => handlePlayerChange(gameIndex, "away", Number(e.target.value) || null)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="">-</option>
                          {presentAwayPlayers.map((p) => (
                            <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleGameDataChange(gameIndex, { winner: "home" })}
                            className={`px-2 py-1 text-xs rounded ${
                              game.winner === "home" ? "bg-primary text-white" : "bg-gray-200"
                            }`}
                          >
                            H
                          </button>
                          <button
                            onClick={() => handleGameDataChange(gameIndex, { winner: "away" })}
                            className={`px-2 py-1 text-xs rounded ${
                              game.winner === "away" ? "bg-primary text-white" : "bg-gray-200"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-2 text-xs">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={game.homeTableRun}
                              onChange={() => handleGameDataChange(gameIndex, { homeTableRun: !game.homeTableRun })}
                              className="w-3 h-3"
                            />
                            TR
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={game.awayTableRun}
                              onChange={() => handleGameDataChange(gameIndex, { awayTableRun: !game.awayTableRun })}
                              className="w-3 h-3"
                            />
                            TR
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="bg-white rounded-lg shadow-md p-4 sticky bottom-4">
        <div className="flex flex-col gap-3">
          {/* Lineup submission buttons - show both when lineups not yet submitted */}
          {(lineupState === "not_started" ||
            lineupState === "awaiting_away_lineup" ||
            lineupState === "awaiting_home_lineup") && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSubmitLineupWithConfirm("away")}
                disabled={lineupState === "awaiting_home_lineup"}
                className={`flex-1 py-3 px-4 font-semibold rounded-md transition-colors ${
                  lineupState === "awaiting_home_lineup"
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {lineupState === "awaiting_home_lineup" ? "✓ Away Lineup Submitted" : "Submit Away Lineup"}
              </button>
              <button
                onClick={() => handleSubmitLineupWithConfirm("home")}
                disabled={lineupState === "not_started" || lineupState === "awaiting_away_lineup"}
                className={`flex-1 py-3 px-4 font-semibold rounded-md transition-colors ${
                  lineupState === "not_started" || lineupState === "awaiting_away_lineup"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Submit Home Lineup
              </button>
            </div>
          )}

          {/* Match control buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {lineupState === "ready_to_start" && (
              <button
                onClick={handleStartMatchWithConfirm}
                className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                Start Match
              </button>
            )}

            {(lineupState === "match_live" || lineupState === "awaiting_confirmation") && (
              <button
                onClick={handleFinalizeMatchWithConfirm}
                className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                Finalize Match ({homeScore} - {awayScore})
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                className="py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={cancelConfirmation}
        title={confirmModal.title}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 whitespace-pre-line">
              {confirmModal.message}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={cancelConfirmation}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={executeConfirmedAction}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors"
            >
              Yes, Proceed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OperatorMatchForm;
