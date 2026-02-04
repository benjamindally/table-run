/**
 * MatchForm Component - Reusable match score entry form with real-time collaboration
 * Uses MatchScoringContext and WebSocket for real-time updates between captains
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Clock,
  Users,
} from "lucide-react";
import type { Match, LineupState } from "../../api/types";
import { formatLocalDate } from "../../utils/dateUtils";
import { useMatchScoring } from "../../contexts/MatchScoringContext";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";
import { useAuth } from "../../contexts/AuthContext";
import type { IncomingMessage, TeamSide } from "../../types/websocket";

interface MatchFormProps {
  match: Match;
  userTeamSide: TeamSide | null; // Which team is this user captain of (null = viewer only)
  isLeagueOperator?: boolean; // League operators have full admin access to all match details
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const MatchForm: React.FC<MatchFormProps> = ({
  match,
  userTeamSide,
  isLeagueOperator = false,
  onSuccess,
  onCancel,
  showCancelButton = false,
}) => {
  // Get context state and actions
  const {
    state,
    initializeMatch,
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
    isAwayLineupComplete,
    isHomeLineupComplete,
  } = useMatchScoring();

  // Get auth token for API calls
  const { getAuthToken } = useAuth();

  // Local UI state - attendance collapsed by default when match is live
  const [attendanceCollapsed, setAttendanceCollapsed] = useState(
    match.lineup_state === "match_live" ||
      match.lineup_state === "awaiting_confirmation"
  );
  const [collapsedSets, setCollapsedSets] = useState<Set<number>>(new Set());
  const lineupFetchedRef = useRef(false);

  // Get state values with defaults
  const homeRoster = useMemo(() => state?.homeRoster || [], [state?.homeRoster]);
  const awayRoster = useMemo(() => state?.awayRoster || [], [state?.awayRoster]);
  const games = useMemo(() => state?.games || [], [state?.games]);
  const submittedBy = state?.submittedBy || null;

  // Get lineup state - prefer context (updated by WebSocket) over prop (stale after initial load)
  const lineupState: LineupState =
    state?.lineupState || match.lineup_state || "awaiting_away_lineup";

  // Derived states for UI control
  // 'not_started' should be treated the same as 'awaiting_away_lineup' since away team goes first
  const isAwayLineupPhase =
    lineupState === "awaiting_away_lineup" || lineupState === "not_started";
  const isHomeLineupPhase = lineupState === "awaiting_home_lineup";
  const isReadyToStart = lineupState === "ready_to_start";
  const isMatchLive =
    lineupState === "match_live" || lineupState === "awaiting_confirmation";
  const isMatchCompleted = lineupState === "completed";

  // Fetch rosters
  const { data: homeRosterData, isLoading: homeRosterLoading } = useTeamRoster(
    match.home_team
  );
  const { data: awayRosterData, isLoading: awayRosterLoading } = useTeamRoster(
    match.away_team
  );

  const homeTeam = match.home_team_detail;
  const awayTeam = match.away_team_detail;

  // Initialize match state when component mounts
  useEffect(() => {
    // TODO: Replace hardcoded 16 with dynamic games count from league config
    // Fix: Add `gamesCount` prop to MatchForm interface, calculated as:
    //   league.sets_per_match * league.games_per_set (see admin/MatchScorePage.tsx lines 44-48)
    // Then pass it here instead of 16. Also update error messages at lines ~663, 1650-1705
    // that reference "16 games" to use games.length instead.
    initializeMatch(match.id, 16, match.lineup_state);
  }, [match.id, match.lineup_state, initializeMatch]);

  // Auto-collapse attendance section when match goes live
  useEffect(() => {
    if (isMatchLive) {
      setAttendanceCollapsed(true);
    }
  }, [isMatchLive]);

  // Initialize rosters when data loads (only if empty)
  // Also check if any games already have players assigned (from match_state arriving first)
  useEffect(() => {
    if (homeRosterData && state?.homeRoster.length === 0) {
      // Check if any games already have home players assigned
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
      // Check if any games already have away players assigned
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

  // Fetch lineup data when captain needs to see the other team's lineup
  // - Home captain: fetches when entering home lineup phase (to see away lineup)
  // - Away captain: fetches when match is ready to start or live (to see home lineup)
  useEffect(() => {
    const fetchLineup = async () => {
      // Only fetch once per match
      if (lineupFetchedRef.current) return;

      // Determine when each captain should fetch
      const homeShouldFetch =
        userTeamSide === "home" &&
        (isHomeLineupPhase || isReadyToStart || isMatchLive);
      const awayShouldFetch =
        userTeamSide === "away" && (isReadyToStart || isMatchLive);

      if (!homeShouldFetch && !awayShouldFetch) return;

      const token = getAuthToken();
      if (!token) return;

      // Need rosters to be loaded first
      if (!state?.awayRoster || state.awayRoster.length === 0) return;
      if (!state?.homeRoster || state.homeRoster.length === 0) return;

      lineupFetchedRef.current = true;

      try {
        const lineupData = await matchesApi.getLineup(match.id, token);

        if (lineupData.games && lineupData.games.length > 0) {
          // Collect player IDs from the lineup
          const awayPlayerIds = new Set<number>();
          const homePlayerIds = new Set<number>();

          lineupData.games.forEach((game) => {
            if (game.away_player) {
              awayPlayerIds.add(game.away_player.id);
            }
            if (game.home_player) {
              homePlayerIds.add(game.home_player.id);
            }
          });

          // Mark away players as present
          if (awayPlayerIds.size > 0) {
            const updatedAwayRoster = state.awayRoster.map((player) => ({
              ...player,
              present: awayPlayerIds.has(player.playerId)
                ? true
                : player.present,
            }));
            setAwayRoster(updatedAwayRoster);
          }

          // Mark home players as present
          if (homePlayerIds.size > 0) {
            const updatedHomeRoster = state.homeRoster.map((player) => ({
              ...player,
              present: homePlayerIds.has(player.playerId)
                ? true
                : player.present,
            }));
            setHomeRoster(updatedHomeRoster);
          }

          // Update games with player assignments
          lineupData.games.forEach((game) => {
            if (game.away_player) {
              updateGame(game.game_number - 1, {
                awayPlayerId: game.away_player.id,
              });
            }
            if (game.home_player) {
              updateGame(game.game_number - 1, {
                homePlayerId: game.home_player.id,
              });
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch lineup:", error);
        lineupFetchedRef.current = false; // Allow retry on error
      }
    };

    fetchLineup();
  }, [
    match.id,
    userTeamSide,
    isHomeLineupPhase,
    isReadyToStart,
    isMatchLive,
    getAuthToken,
    updateGame,
    state?.awayRoster,
    state?.homeRoster,
    setAwayRoster,
    setHomeRoster,
  ]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      switch (message.type) {
        case "player_assignment":
          // Update player assignment
          updateGame(message.game_id - 1, {
            [message.team_side === "home" ? "homePlayerId" : "awayPlayerId"]:
              message.player_id,
          });
          break;

        case "game_update": {
          // Find the game by its actual database ID
          const gameIndex = games.findIndex((g) => g.id === message.game_id);
          if (gameIndex === -1) {
            break;
          }

          // Update game data - only update fields that are defined in the message
          // Last write wins - the most recent change from any captain takes effect
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
          // Other captain submitted
          setSubmittedBy(message.submitted_by);
          toast.info(
            `${
              message.submitted_by === "home" ? homeTeam?.name : awayTeam?.name
            } captain submitted scorecard (${message.home_score}-${
              message.away_score
            })`
          );
          break;

        case "match_finalized":
          // Match finalized by home captain
          if (message.success) {
            toast.success("Match finalized successfully!");
            if (onSuccess) onSuccess();
          }
          break;

        case "captain_presence":
          // Track captain presence - could update UI indicator
          break;

        case "away_lineup_submitted":
          setLineupState("awaiting_home_lineup");
          if (userTeamSide === "home") {
            toast.info(`${awayTeam?.name} has submitted their lineup!`);
            // Reset fetch flag so home captain fetches the lineup
            lineupFetchedRef.current = false;
          }
          break;

        case "home_lineup_submitted":
          setLineupState("ready_to_start");
          if (userTeamSide === "away") {
            toast.info(
              `${homeTeam?.name} has submitted their lineup! Match is ready to begin.`
            );
            // Reset fetch flag so away captain fetches the lineup
            lineupFetchedRef.current = false;
          }
          break;

        case "lineup_submitted": {
          // Handle echoed lineup_submitted message (in case backend reflects it directly)
          const lineupMsg = message as {
            type: "lineup_submitted";
            team_side: TeamSide;
          };
          if (lineupMsg.team_side === "away") {
            setLineupState("awaiting_home_lineup");
            if (userTeamSide === "home") {
              toast.info(`${awayTeam?.name} has submitted their lineup!`);
              // Reset fetch flag so home captain fetches the lineup
              lineupFetchedRef.current = false;
            }
          } else if (lineupMsg.team_side === "home") {
            setLineupState("ready_to_start");
            if (userTeamSide === "away") {
              toast.info(
                `${homeTeam?.name} has submitted their lineup! Match is ready to begin.`
              );
              // Reset fetch flag so away captain fetches the lineup
              lineupFetchedRef.current = false;
            }
          }
          break;
        }

        case "match_started":
        case "match_start":
          setLineupState("match_live");
          if (userTeamSide === "away") {
            toast.info("Match has begun! Score entry is now available.");
          }
          break;

        case "match_state": {
          // Initial state from backend on connection - populate game IDs
          // Backend sends: { type: 'match_state', data: { games: [...], lineup_state: ... }, ... }
          const { data: matchData } = message;
          if (matchData?.games && matchData.games.length > 0) {
            // Collect player IDs from games to update roster attendance
            const homePlayerIds = new Set<number>();
            const awayPlayerIds = new Set<number>();

            matchData.games.forEach((gameData) => {
              if (gameData.home_player?.id) homePlayerIds.add(gameData.home_player.id);
              if (gameData.away_player?.id) awayPlayerIds.add(gameData.away_player.id);

              // Update each game with its real ID and any existing data
              // Only update player IDs if the backend provides them - don't overwrite with null
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

              // Only include player IDs if backend provided them
              if (gameData.home_player?.id) {
                gameUpdate.homePlayerId = gameData.home_player.id;
              }
              if (gameData.away_player?.id) {
                gameUpdate.awayPlayerId = gameData.away_player.id;
              }

              updateGame(gameData.game_number - 1, gameUpdate);
            });

            // Update roster attendance if rosters are already loaded
            if (homeRoster.length > 0 && homePlayerIds.size > 0) {
              setHomeRoster(
                homeRoster.map((p) => ({
                  ...p,
                  present: homePlayerIds.has(p.playerId) ? true : p.present,
                }))
              );
            }
            if (awayRoster.length > 0 && awayPlayerIds.size > 0) {
              setAwayRoster(
                awayRoster.map((p) => ({
                  ...p,
                  present: awayPlayerIds.has(p.playerId) ? true : p.present,
                }))
              );
            }

            // Also update lineup state from backend
            if (matchData.lineup_state) {
              setLineupState(matchData.lineup_state as LineupState);
            }

            // Update submitted_by state from backend (or reset if not provided)
            // This ensures we have correct submission status on reconnect
            const submittedByFromBackend = (matchData as { submitted_by?: TeamSide | null }).submitted_by;
            if (submittedByFromBackend !== undefined) {
              setSubmittedBy(submittedByFromBackend);
            } else if (matchData.lineup_state === "match_live") {
              // Match is live but no submission info - reset to allow fresh submission
              setSubmittedBy(null);
            }
          }
          break;
        }

        default:
          // Unknown message type
          break;
      }
    },
    [
      games,
      updateGame,
      setSubmittedBy,
      setLineupState,
      homeTeam,
      awayTeam,
      userTeamSide,
      onSuccess,
      homeRoster,
      awayRoster,
      setHomeRoster,
      setAwayRoster,
    ]
  );

  // Initialize WebSocket connection
  const { send: sendWebSocket, status } = useMatchWebSocket({
    matchId: match.id,
    enabled: true,
    onMessage: handleWebSocketMessage,
  });

  // Determine if user is in read-only mode (viewer or match completed)
  // League operators have full access and are never read-only (except for completed matches)
  const isReadOnly = isMatchCompleted || (userTeamSide === null && !isLeagueOperator);

  // Determine submit button text and state
  const getSubmitButtonConfig = () => {
    // Viewers cannot submit
    if (isReadOnly) {
      return {
        text: "View Only - Captain Access Required",
        disabled: true,
        className: "bg-gray-400 text-white cursor-not-allowed",
        hidden: true, // Hide submit button for viewers
      };
    }

    // Check if all games have winners recorded (must be "home" or "away")
    const gamesWithWinners = games.filter(
      (g) => g.winner === "home" || g.winner === "away"
    ).length;
    const totalGames = games.length;
    const allGamesComplete = totalGames > 0 && gamesWithWinners === totalGames;

    if (!allGamesComplete) {
      return {
        text: `Record All Games First (${gamesWithWinners}/${totalGames})`,
        disabled: true,
        className: "bg-gray-400 text-white cursor-not-allowed",
        hidden: false,
      };
    }

    // League operators can finalize directly - they have final say
    if (isLeagueOperator && userTeamSide === null) {
      return {
        text: `Finalize Match (${homeScore} - ${awayScore})`,
        disabled: false,
        className: "bg-green-600 text-white hover:bg-green-700",
        hidden: false,
      };
    }

    if (userTeamSide === "away") {
      if (submittedBy === "away") {
        return {
          text: "Submitted - Waiting for Home Captain",
          disabled: true,
          className: "bg-gray-400 text-white cursor-not-allowed",
          hidden: false,
        };
      }
      return {
        text: `Submit Scorecard (${homeScore} - ${awayScore})`,
        disabled: false,
        className: "bg-blue-600 text-white hover:bg-blue-700",
        hidden: false,
      };
    }

    // Home captain or league operator acting as home
    if (submittedBy === "away") {
      return {
        text: `Confirm & Finalize Match (${homeScore} - ${awayScore})`,
        disabled: false,
        className: "bg-green-600 text-white hover:bg-green-700",
        hidden: false,
      };
    }

    return {
      text: `Finalize Match (${homeScore} - ${awayScore})`,
      disabled: false,
      className: "bg-green-600 text-white hover:bg-green-700",
      hidden: false,
    };
  };

  const submitConfig = getSubmitButtonConfig();

  // Check if a matchup has already been used
  const hasMatchupBeenUsed = (
    homePlayerId: number,
    awayPlayerId: number,
    excludeGameIndex: number
  ) => {
    return games.some(
      (game, idx) =>
        idx !== excludeGameIndex &&
        game.homePlayerId === homePlayerId &&
        game.awayPlayerId === awayPlayerId
    );
  };

  // Check if a player has already played in this set
  const hasPlayerPlayedInSet = (
    playerId: number,
    setNumber: number,
    excludeGameIndex: number,
    isHome: boolean
  ) => {
    const setStartIndex = (setNumber - 1) * 4;
    const setEndIndex = setStartIndex + 4;

    return games.some((game, idx) => {
      if (idx < setStartIndex || idx >= setEndIndex || idx === excludeGameIndex)
        return false;
      return isHome
        ? game.homePlayerId === playerId
        : game.awayPlayerId === playerId;
    });
  };

  // Wrapper functions that update context + send WebSocket messages
  const handlePlayerChange = useCallback(
    (gameIndex: number, teamSide: TeamSide, playerId: number | null) => {
      // Update context
      updateGame(gameIndex, {
        [teamSide === "home" ? "homePlayerId" : "awayPlayerId"]: playerId,
      });

      // Send WebSocket message
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

      // Update context locally
      updateGame(gameIndex, updates);

      // Need the real game ID from backend to send WebSocket message
      if (!gameId) {
        return;
      }

      // Build game_data with only defined fields to avoid overwriting other fields
      // Last write wins - whoever changes a field last, that's what everyone sees
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

      // Send WebSocket message to broadcast to other connected users
      sendWebSocket({
        type: "game_update" as const,
        game_id: gameId, // Use actual database ID, not game number
        game_data,
      });
    },
    [games, updateGame, sendWebSocket]
  );

  // Submit lineup (away or home team)
  // teamOverride allows league operators to submit on behalf of either team
  const handleSubmitLineup = useCallback(async (teamOverride?: TeamSide) => {
    const teamToSubmit = teamOverride || userTeamSide;
    const isAway = teamToSubmit === "away";
    const lineupComplete = isAway ? isAwayLineupComplete : isHomeLineupComplete;

    if (!lineupComplete) {
      toast.error("Please assign all 16 games before submitting");
      return;
    }

    const lineupGames = games.map((g) => ({
      game_number: g.gameNumber,
      player_id: isAway ? g.awayPlayerId! : g.homePlayerId!,
    }));

    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in to submit lineup");
      return;
    }

    try {
      await matchesApi.submitLineup(match.id, { games: lineupGames }, token);
      setLineupState(isAway ? "awaiting_home_lineup" : "ready_to_start");

      // Notify other captain via WebSocket
      sendWebSocket({
        type: "lineup_submitted",
        team_side: isAway ? "away" : "home",
      });

      toast.success(
        isAway
          ? "Lineup submitted! Waiting for home team."
          : "Lineup submitted! Ready to begin match."
      );
    } catch (error: any) {
      console.error("Failed to submit lineup:", error);
      toast.error(error.message || "Failed to submit lineup");
    }
  }, [
    userTeamSide,
    isAwayLineupComplete,
    isHomeLineupComplete,
    games,
    match.id,
    setLineupState,
    getAuthToken,
    sendWebSocket,
  ]);

  // Start the match (home captain only)
  const handleStartMatch = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in to start match");
      return;
    }

    try {
      await matchesApi.startMatch(match.id, token);
      setLineupState("match_live");

      // Notify other captain via WebSocket
      sendWebSocket({
        type: "match_start",
      });

      toast.success("Match started! Score entry is now available.");
    } catch (error: any) {
      console.error("Failed to start match:", error);
      toast.error(error.message || "Failed to start match");
    }
  }, [match.id, setLineupState, getAuthToken, sendWebSocket]);

  // Auto-assign players to games (works for single team during lineup phase)
  const autoAssignPlayers = useCallback(() => {
    // Determine which team we're assigning based on lineup phase
    // League operators can assign for either team based on current phase
    const isAwayAssigning = isAwayLineupPhase && (userTeamSide === "away" || isLeagueOperator);
    const isHomeAssigning = isHomeLineupPhase && (userTeamSide === "home" || isLeagueOperator);
    const isBothTeams = isMatchLive; // Legacy mode for both teams

    if (isBothTeams) {
      // Original logic for both teams (match already started)
      const homePlayers = presentHomePlayers.map((p) => p.playerId);
      const awayPlayers = presentAwayPlayers.map((p) => p.playerId);
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= 4; setNum++) {
        const setStartIndex = (setNum - 1) * 4;
        const availableHomePlayers = [...homePlayers];
        const availableAwayPlayers = [...awayPlayers];

        for (let gameInSet = 0; gameInSet < 4; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (
            availableHomePlayers.length === 0 ||
            availableAwayPlayers.length === 0
          )
            break;

          const homePlayerId = availableHomePlayers.shift()!;
          let awayPlayerId = null;

          for (let i = 0; i < availableAwayPlayers.length; i++) {
            const candidateAwayId = availableAwayPlayers[i];
            const matchupKey = `${homePlayerId}-${candidateAwayId}`;
            if (!usedMatchups.has(matchupKey)) {
              awayPlayerId = candidateAwayId;
              availableAwayPlayers.splice(i, 1);
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
    } else if (isAwayAssigning) {
      // Away team assignment - no opponent to check against yet
      const players = presentAwayPlayers.map((p) => p.playerId);

      for (let setNum = 1; setNum <= 4; setNum++) {
        const setStartIndex = (setNum - 1) * 4;
        const availablePlayers = [...players];

        for (let gameInSet = 0; gameInSet < 4; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (availablePlayers.length === 0) break;

          const playerId = availablePlayers.shift()!;
          handlePlayerChange(gameIndex, "away", playerId);
        }
      }
    } else if (isHomeAssigning) {
      // Home team assignment - must avoid matchup conflicts with away players
      const players = presentHomePlayers.map((p) => p.playerId);
      const usedMatchups = new Set<string>();

      for (let setNum = 1; setNum <= 4; setNum++) {
        const setStartIndex = (setNum - 1) * 4;
        const availablePlayers = [...players];

        for (let gameInSet = 0; gameInSet < 4; gameInSet++) {
          const gameIndex = setStartIndex + gameInSet;
          if (availablePlayers.length === 0) break;

          const awayPlayerId = games[gameIndex]?.awayPlayerId;

          // Find a home player that hasn't played this away player yet
          let assignedPlayerId: number | null = null;
          for (let i = 0; i < availablePlayers.length; i++) {
            const candidateId = availablePlayers[i];
            const matchupKey = `${candidateId}-${awayPlayerId}`;

            if (!awayPlayerId || !usedMatchups.has(matchupKey)) {
              assignedPlayerId = candidateId;
              availablePlayers.splice(i, 1);
              if (awayPlayerId) {
                usedMatchups.add(matchupKey);
              }
              break;
            }
          }

          if (assignedPlayerId) {
            handlePlayerChange(gameIndex, "home", assignedPlayerId);
          }
        }
      }
    }
  }, [
    isAwayLineupPhase,
    isHomeLineupPhase,
    isMatchLive,
    userTeamSide,
    presentHomePlayers,
    presentAwayPlayers,
    handlePlayerChange,
    games,
  ]);

  // Toggle set collapse state
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

  // Handle match submission
  const handleSubmit = async () => {
    // Away captain submits first
    if (userTeamSide === "away" && submittedBy === null) {
      // Away captain is submitting for the first time
      setSubmittedBy("away");
      toast.success(
        "Scorecard submitted! Waiting for home captain to confirm."
      );

      // Send WebSocket notification to home captain
      sendWebSocket({
        type: "scorecard_submitted",
        submitted_by: "away",
        home_score: homeScore,
        away_score: awayScore,
      });

      return;
    }

    // League operator (not a captain) can finalize directly
    if (isLeagueOperator && userTeamSide === null) {
      sendWebSocket({
        type: "scorecard_confirmed",
        home_score: homeScore,
        away_score: awayScore,
      });

      toast.info("Finalizing match as league operator...");
      return;
    }

    // Home captain confirms and finalizes
    if (userTeamSide === "home") {
      // If away hasn't submitted yet, show warning but allow submission
      if (submittedBy === null) {
        toast.warning(
          "The away team captain hasn't submitted their scorecard yet. You can still submit, but it's better to wait for both captains to agree."
        );
      }

      // Send confirmation via WebSocket - backend will finalize the match
      sendWebSocket({
        type: "scorecard_confirmed",
        home_score: homeScore,
        away_score: awayScore,
      });

      toast.info("Finalizing match...");
      // The match_finalized WebSocket message will trigger onSuccess
    }
  };

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
          {/* WebSocket Connection Status */}
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
      </div>

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">
              Viewing Match in Real-Time
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              You're viewing this match as it's being scored. Only team captains
              can enter or modify scores.
            </p>
          </div>
        </div>
      )}

      {/* Awaiting Visitors Lineup Banner - for home captain during away lineup phase */}
      {userTeamSide === "home" && isAwayLineupPhase && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">
              Awaiting Visitors Lineup
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              {awayTeam?.name} is setting up their lineup. You'll be able to set
              your lineup once they're done.
            </p>
          </div>
        </div>
      )}

      {/* Away Lineup Submitted Banner - for away captain after submitting */}
      {userTeamSide === "away" &&
        (isHomeLineupPhase || isReadyToStart || isMatchLive) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">
                {isMatchLive ? "Match in Progress" : "Lineup Submitted"}
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {isMatchLive
                  ? "The match has started. Watch the scores update in real-time below."
                  : "Your lineup has been submitted. Waiting for the home team to complete their lineup and start the match."}
              </p>
            </div>
          </div>
        )}

      {/* Match Completed Banner */}
      {isMatchCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Match Completed</h4>
            <p className="text-sm text-green-700 mt-1">
              This match has been finalized. Final score: {homeScore} - {awayScore}
            </p>
          </div>
        </div>
      )}

      {/* Fallback Begin Match Card - for home captain or league operator when both lineups ready */}
      {(userTeamSide === "home" || isLeagueOperator) && isReadyToStart && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <Users className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">
                Both Lineups Ready
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Both teams have submitted their lineups. Click below to begin
                the match and enable score entry.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartMatch}
            className="w-full py-3 rounded-md font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Begin Match
          </button>
        </div>
      )}

      {/* Section 1: Rosters - Conditional based on phase and user role */}
      {/* Show only during lineup phases for the appropriate team, or always for league operators */}
      {((userTeamSide === "away" && isAwayLineupPhase) ||
        (userTeamSide === "home" && isHomeLineupPhase) ||
        (isLeagueOperator && (isAwayLineupPhase || isHomeLineupPhase)) ||
        isMatchLive ||
        isReadOnly) && (
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => setAttendanceCollapsed(!attendanceCollapsed)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {((userTeamSide === "away" && presentAwayPlayers.length > 0) ||
                (userTeamSide === "home" && presentHomePlayers.length > 0) ||
                (isLeagueOperator && (presentHomePlayers.length > 0 || presentAwayPlayers.length > 0)) ||
                (isMatchLive &&
                  presentHomePlayers.length > 0 &&
                  presentAwayPlayers.length > 0)) && (
                <Check className="h-5 w-5 text-green-600" />
              )}
              <h2 className="text-lg font-bold">
                {isMatchLive ? "Team Rosters" : "Mark Attendance"}
              </h2>
            </div>
            {attendanceCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>

          {!attendanceCollapsed && (
            <div className="p-4 pt-0 space-y-6">
              {/* Away Team Roster - Show for away captain during their phase, league operators, or read-only after */}
              {(userTeamSide === "away" ||
                isLeagueOperator ||
                isHomeLineupPhase ||
                isMatchLive ||
                isReadOnly) && (
                <div>
                  <h3 className="font-medium text-dark-700 mb-3">
                    {awayTeam?.name} (Visiting)
                    {isHomeLineupPhase && userTeamSide === "home" && (
                      <span className="ml-2 text-sm text-green-600 font-normal">
                        - Lineup submitted
                      </span>
                    )}
                  </h3>
                  {awayRosterLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-12 bg-cream-200 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : awayRoster.length === 0 ? (
                    <p className="text-dark-400 italic">No players on roster</p>
                  ) : (
                    <div className="space-y-2">
                      {awayRoster.map((player) => {
                        const canEdit =
                          !isReadOnly &&
                          isAwayLineupPhase &&
                          (userTeamSide === "away" || isLeagueOperator);
                        return (
                          <button
                            key={player.playerId}
                            onClick={() =>
                              canEdit && toggleAwayAttendance(player.playerId)
                            }
                            disabled={!canEdit}
                            className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                              player.present
                                ? "border-primary bg-primary-50"
                                : "border-dark-200 bg-white hover:border-dark-300"
                            } ${!canEdit ? "cursor-default" : ""}`}
                          >
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                player.present
                                  ? "border-primary bg-primary"
                                  : "border-dark-300"
                              }`}
                            >
                              {player.present && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <span className="font-medium">
                              {player.playerName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Home Team Roster - Show for home captain during their phase, league operators, or read-only after */}
              {(userTeamSide === "home" || isLeagueOperator || isMatchLive || isReadOnly) &&
                !isAwayLineupPhase && (
                  <div>
                    <h3 className="font-medium text-dark-700 mb-3">
                      {homeTeam?.name} (Home)
                    </h3>
                    {homeRosterLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-cream-200 rounded animate-pulse"
                          ></div>
                        ))}
                      </div>
                    ) : homeRoster.length === 0 ? (
                      <p className="text-dark-400 italic">
                        No players on roster
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {homeRoster.map((player) => {
                          const canEdit =
                            !isReadOnly &&
                            isHomeLineupPhase &&
                            (userTeamSide === "home" || isLeagueOperator);
                          return (
                            <button
                              key={player.playerId}
                              onClick={() =>
                                canEdit && toggleHomeAttendance(player.playerId)
                              }
                              disabled={!canEdit}
                              className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                                player.present
                                  ? "border-primary bg-primary-50"
                                  : "border-dark-200 bg-white hover:border-dark-300"
                              } ${!canEdit ? "cursor-default" : ""}`}
                            >
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                  player.present
                                    ? "border-primary bg-primary"
                                    : "border-dark-300"
                                }`}
                              >
                                {player.present && (
                                  <Check className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <span className="font-medium">
                                {player.playerName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* Auto-assign and Manual assign buttons - only during active lineup phase */}
              {(((userTeamSide === "away" || isLeagueOperator) && isAwayLineupPhase) ||
                ((userTeamSide === "home" || isLeagueOperator) && isHomeLineupPhase)) && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={autoAssignPlayers}
                      disabled={
                        (isAwayLineupPhase && presentAwayPlayers.length < 4) ||
                        (isHomeLineupPhase && presentHomePlayers.length < 4)
                      }
                      className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 ${
                        (isAwayLineupPhase && presentAwayPlayers.length < 4) ||
                        (isHomeLineupPhase && presentHomePlayers.length < 4)
                          ? "bg-dark-200 text-dark-400 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-600"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Auto-Assign
                    </button>
                    <button
                      onClick={() => setAttendanceCollapsed(true)}
                      disabled={
                        (isAwayLineupPhase && presentAwayPlayers.length === 0) ||
                        (isHomeLineupPhase && presentHomePlayers.length === 0)
                      }
                      className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 ${
                        (isAwayLineupPhase && presentAwayPlayers.length === 0) ||
                        (isHomeLineupPhase && presentHomePlayers.length === 0)
                          ? "bg-dark-200 text-dark-400 cursor-not-allowed"
                          : "bg-dark-600 text-white hover:bg-dark-700"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Manual Assign
                    </button>
                  </div>
                  {((isAwayLineupPhase && presentAwayPlayers.length < 4) ||
                    (isHomeLineupPhase && presentHomePlayers.length < 4)) && (
                    <p className="text-xs text-dark-500 text-center">
                      Need at least 4 players for auto-assign (
                      {isAwayLineupPhase
                        ? `${presentAwayPlayers.length} present`
                        : `${presentHomePlayers.length} present`}
                      )
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Player Assignment / Score Entry */}
      {/* Show during lineup phases (for player assignment), match live (for scoring), or completed (read-only) */}
      {games.length > 0 &&
        (((userTeamSide === "away" || isLeagueOperator) &&
          isAwayLineupPhase &&
          presentAwayPlayers.length > 0) ||
          ((userTeamSide === "home" || isLeagueOperator) &&
            isHomeLineupPhase &&
            presentHomePlayers.length > 0) ||
          ((userTeamSide === "home" || isLeagueOperator) && isReadyToStart) ||
          (userTeamSide === "away" && isReadyToStart) ||
          isMatchLive ||
          isMatchCompleted ||
          (isReadOnly &&
            (isMatchLive || isHomeLineupPhase || isReadyToStart))) && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {isMatchCompleted
                  ? "Final Scores"
                  : isMatchLive
                  ? "Enter Scores"
                  : "Assign Players to Games"}
              </h2>
              {(isMatchLive || isMatchCompleted) && (
                <div className="text-2xl font-bold text-primary">
                  {homeScore} - {awayScore}
                </div>
              )}
            </div>

            {/* Game grid organized by sets */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((setNum) => {
                const setGames = games.slice((setNum - 1) * 4, setNum * 4);
                const setScore = {
                  home: setGames.filter((g) => g.winner === "home").length,
                  away: setGames.filter((g) => g.winner === "away").length,
                };
                const setComplete = setGames.every((g) => g.winner !== null);
                // For league operators, check based on current phase
                const setPlayersAssigned =
                  isAwayLineupPhase
                    ? setGames.every((g) => g.awayPlayerId !== null)
                    : isHomeLineupPhase
                    ? setGames.every((g) => g.homePlayerId !== null)
                    : userTeamSide === "away"
                    ? setGames.every((g) => g.awayPlayerId !== null)
                    : setGames.every((g) => g.homePlayerId !== null);

                return (
                  <div
                    key={setNum}
                    className="border border-dark-200 rounded-lg"
                  >
                    <button
                      onClick={() => toggleSetCollapse(setNum)}
                      className="w-full p-3 flex items-center justify-between hover:bg-cream-100 transition-colors rounded-t-lg"
                    >
                      <div className="flex items-center gap-2">
                        {((isMatchLive || isMatchCompleted) ? setComplete : setPlayersAssigned) && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        <h3 className="font-bold text-dark-700">
                          Set {setNum}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {(isMatchLive || isMatchCompleted) && (
                          <span className="text-sm font-semibold text-primary">
                            {setScore.home} - {setScore.away}
                          </span>
                        )}
                        {collapsedSets.has(setNum) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {!collapsedSets.has(setNum) && (
                      <div className="p-3 pt-0 space-y-3">
                        {[1, 2, 3, 4].map((gameInSet) => {
                          const gameIndex = (setNum - 1) * 4 + (gameInSet - 1);
                          const game = games[gameIndex];

                          // Determine which dropdowns are editable
                          // League operators can edit both teams during their respective phases or when match is live
                          const canEditHome =
                            !isReadOnly &&
                            (isHomeLineupPhase || (isLeagueOperator && isMatchLive)) &&
                            (userTeamSide === "home" || isLeagueOperator);
                          const canEditAway =
                            !isReadOnly &&
                            (isAwayLineupPhase || (isLeagueOperator && isMatchLive)) &&
                            (userTeamSide === "away" || isLeagueOperator);

                          return (
                            <div
                              key={gameIndex}
                              className="border border-dark-200 rounded-lg p-3"
                            >
                              <div className="text-xs font-medium text-dark-500 mb-3">
                                Game {game.gameNumber}
                              </div>

                              {/* Player selection */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {/* Home player - show during home lineup phase, ready to start, or match live */}
                                {(isHomeLineupPhase ||
                                  isReadyToStart ||
                                  isMatchLive ||
                                  isReadOnly) && (
                                  <div>
                                    <label className="text-xs text-dark-600 mb-1 block">
                                      {homeTeam?.name}
                                    </label>
                                    <select
                                      value={game.homePlayerId || ""}
                                      onChange={(e) => {
                                        const homePlayerId = Number(
                                          e.target.value
                                        );
                                        handlePlayerChange(
                                          gameIndex,
                                          "home",
                                          homePlayerId
                                        );
                                      }}
                                      disabled={!canEditHome}
                                      className={`w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                        !canEditHome
                                          ? "bg-gray-100 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      <option value="">Select player...</option>
                                      {presentHomePlayers.map((player) => {
                                        const usedInSet = hasPlayerPlayedInSet(
                                          player.playerId,
                                          setNum,
                                          gameIndex,
                                          true
                                        );
                                        const usedMatchup = game.awayPlayerId
                                          ? hasMatchupBeenUsed(
                                              player.playerId,
                                              game.awayPlayerId,
                                              gameIndex
                                            )
                                          : false;
                                        const disabled =
                                          usedInSet || usedMatchup;
                                        return (
                                          <option
                                            key={player.playerId}
                                            value={player.playerId}
                                            disabled={disabled}
                                          >
                                            {player.playerName}
                                            {usedInSet && " (played this set)"}
                                            {usedMatchup &&
                                              " (played this opponent)"}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                )}

                                {/* Placeholder for away captain during their phase */}
                                {isAwayLineupPhase &&
                                  userTeamSide === "away" && (
                                    <div>
                                      <label className="text-xs text-dark-600 mb-1 block">
                                        {homeTeam?.name}
                                      </label>
                                      <div className="w-full px-2 py-2 text-sm border border-dark-200 rounded-md bg-gray-50 text-dark-400">
                                        Awaiting home lineup
                                      </div>
                                    </div>
                                  )}

                                {/* Away player */}
                                <div>
                                  <label className="text-xs text-dark-600 mb-1 block">
                                    {awayTeam?.name}
                                  </label>
                                  <select
                                    value={game.awayPlayerId || ""}
                                    onChange={(e) => {
                                      const awayPlayerId = Number(
                                        e.target.value
                                      );
                                      handlePlayerChange(
                                        gameIndex,
                                        "away",
                                        awayPlayerId
                                      );
                                    }}
                                    disabled={!canEditAway}
                                    className={`w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                      !canEditAway
                                        ? "bg-gray-100 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    <option value="">Select player...</option>
                                    {presentAwayPlayers.map((player) => {
                                      const usedInSet = hasPlayerPlayedInSet(
                                        player.playerId,
                                        setNum,
                                        gameIndex,
                                        false
                                      );
                                      const usedMatchup = game.homePlayerId
                                        ? hasMatchupBeenUsed(
                                            game.homePlayerId,
                                            player.playerId,
                                            gameIndex
                                          )
                                        : false;
                                      const disabled = usedInSet || usedMatchup;
                                      return (
                                        <option
                                          key={player.playerId}
                                          value={player.playerId}
                                          disabled={disabled}
                                        >
                                          {player.playerName}
                                          {usedInSet && " (played this set)"}
                                          {usedMatchup &&
                                            " (played this opponent)"}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>

                              {/* Winner buttons - show during match_live or completed if both players selected */}
                              {(isMatchLive || isMatchCompleted) &&
                                game.homePlayerId &&
                                game.awayPlayerId && (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <button
                                        onClick={() =>
                                          !isReadOnly &&
                                          handleGameDataChange(gameIndex, {
                                            winner: "home",
                                          })
                                        }
                                        disabled={isReadOnly}
                                        className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                          game.winner === "home"
                                            ? "bg-primary text-white shadow-md"
                                            : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                        } ${
                                          isReadOnly
                                            ? "cursor-not-allowed opacity-60"
                                            : ""
                                        }`}
                                      >
                                        WIN
                                      </button>
                                      <button
                                        onClick={() =>
                                          !isReadOnly &&
                                          handleGameDataChange(gameIndex, {
                                            winner: "away",
                                          })
                                        }
                                        disabled={isReadOnly}
                                        className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                          game.winner === "away"
                                            ? "bg-primary text-white shadow-md"
                                            : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                        } ${
                                          isReadOnly
                                            ? "cursor-not-allowed opacity-60"
                                            : ""
                                        }`}
                                      >
                                        WIN
                                      </button>
                                    </div>

                                    {/* TR/8B checkboxes */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.homeTableRun}
                                            onChange={() =>
                                              !isReadOnly &&
                                              handleGameDataChange(gameIndex, {
                                                homeTableRun:
                                                  !game.homeTableRun,
                                              })
                                            }
                                            disabled={isReadOnly}
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                          />
                                          <span>Table Run</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.home8Ball}
                                            onChange={() =>
                                              !isReadOnly &&
                                              handleGameDataChange(gameIndex, {
                                                home8Ball: !game.home8Ball,
                                              })
                                            }
                                            disabled={isReadOnly}
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                          />
                                          <span>8-Ball break</span>
                                        </label>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.awayTableRun}
                                            onChange={() =>
                                              !isReadOnly &&
                                              handleGameDataChange(gameIndex, {
                                                awayTableRun:
                                                  !game.awayTableRun,
                                              })
                                            }
                                            disabled={isReadOnly}
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                          />
                                          <span>Table Run</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.away8Ball}
                                            onChange={() =>
                                              !isReadOnly &&
                                              handleGameDataChange(gameIndex, {
                                                away8Ball: !game.away8Ball,
                                              })
                                            }
                                            disabled={isReadOnly}
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                          />
                                          <span>8-Ball break</span>
                                        </label>
                                      </div>
                                    </div>
                                  </>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lineup Submission Button - Away Captain or League Operator */}
            {(userTeamSide === "away" || isLeagueOperator) && isAwayLineupPhase && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (presentAwayPlayers.length < 4) {
                      toast.error(
                        `Need at least 4 players present (currently ${presentAwayPlayers.length})`
                      );
                      return;
                    }
                    const assignedGames = games.filter(
                      (g) => g.awayPlayerId
                    ).length;
                    if (assignedGames < 16) {
                      toast.error(
                        `Please assign all 16 games (${assignedGames}/16 assigned)`
                      );
                      return;
                    }
                    handleSubmitLineup("away");
                  }}
                  className={`w-full py-4 rounded-md font-bold text-lg transition-colors ${
                    isAwayLineupComplete
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-white hover:bg-gray-500"
                  }`}
                >
                  {isAwayLineupComplete
                    ? "Submit Lineup"
                    : `Submit Lineup (${
                        games.filter((g) => g.awayPlayerId).length
                      }/16 assigned)`}
                </button>
              </div>
            )}

            {/* Lineup Submission Button - Home Captain or League Operator */}
            {(userTeamSide === "home" || isLeagueOperator) && isHomeLineupPhase && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (presentHomePlayers.length < 4) {
                      toast.error(
                        `Need at least 4 players present (currently ${presentHomePlayers.length})`
                      );
                      return;
                    }
                    const assignedGames = games.filter(
                      (g) => g.homePlayerId
                    ).length;
                    if (assignedGames < 16) {
                      toast.error(
                        `Please assign all 16 games (${assignedGames}/16 assigned)`
                      );
                      return;
                    }
                    handleSubmitLineup("home");
                  }}
                  className={`w-full py-4 rounded-md font-bold text-lg transition-colors ${
                    isHomeLineupComplete
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-white hover:bg-gray-500"
                  }`}
                >
                  {isHomeLineupComplete
                    ? "Submit Lineup"
                    : `Submit Lineup (${
                        games.filter((g) => g.homePlayerId).length
                      }/16 assigned)`}
                </button>
              </div>
            )}

            {/* Submission Status Banner - During scoring */}
            {isMatchLive &&
              submittedBy === "away" &&
              userTeamSide === "home" && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">
                      Away Team Submitted Scorecard
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {awayTeam?.name} captain has submitted their scorecard
                      showing {homeScore}-{awayScore}. Review the scores and
                      click confirm to finalize the match.
                    </p>
                  </div>
                </div>
              )}

            {/* Score Submit button - only during match_live, hidden for viewers */}
            {isMatchLive && !submitConfig.hidden && (
              <div className="flex gap-3 mt-6">
                {showCancelButton && onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-dark py-4 rounded-md font-bold text-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitConfig.disabled}
                  className={`${
                    showCancelButton ? "flex-1" : "w-full"
                  } py-4 rounded-md font-bold text-lg transition-colors ${
                    submitConfig.className
                  }`}
                >
                  {submitConfig.text}
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default MatchForm;
