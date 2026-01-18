/**
 * MatchForm Component - Reusable match score entry form with real-time collaboration
 * Uses MatchScoringContext and WebSocket for real-time updates between captains
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTeamRoster } from "../../hooks/useTeams";
import { matchesApi } from "../../api";
import { toast } from "react-toastify";
import { Calendar, MapPin, Check, ChevronDown, ChevronUp, Wifi, WifiOff, AlertCircle } from "lucide-react";
import type { Match } from "../../api/types";
import { formatLocalDate } from "../../utils/dateUtils";
import { useMatchScoring } from "../../contexts/MatchScoringContext";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";
import type { IncomingMessage, TeamSide } from "../../types/websocket";

interface MatchFormProps {
  match: Match;
  userTeamSide: TeamSide | null; // Which team is this user captain of (null = viewer only)
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const MatchForm: React.FC<MatchFormProps> = ({
  match,
  userTeamSide,
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
    homeScore,
    awayScore,
    presentHomePlayers,
    presentAwayPlayers,
  } = useMatchScoring();

  // Local UI state
  const [attendanceCollapsed, setAttendanceCollapsed] = useState(false);
  const [collapsedSets, setCollapsedSets] = useState<Set<number>>(new Set());

  // Get state values with defaults
  const homeRoster = state?.homeRoster || [];
  const awayRoster = state?.awayRoster || [];
  const games = state?.games || [];
  const submittedBy = state?.submittedBy || null;

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
    // TODO: Get games count from backend match format instead of hardcoding 16
    initializeMatch(match.id, 16);
  }, [match.id, initializeMatch]);

  // Initialize rosters when data loads (only if empty)
  useEffect(() => {
    if (homeRosterData && state?.homeRoster.length === 0) {
      setHomeRoster(
        homeRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: false,
        }))
      );
    }
  }, [homeRosterData, setHomeRoster, state?.homeRoster.length]);

  useEffect(() => {
    if (awayRosterData && state?.awayRoster.length === 0) {
      setAwayRoster(
        awayRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: false,
        }))
      );
    }
  }, [awayRosterData, setAwayRoster, state?.awayRoster.length]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: IncomingMessage) => {
      console.log("Received WebSocket message:", message);

      switch (message.type) {
        case "player_assignment":
          // Update player assignment
          updateGame(message.game_id - 1, {
            [message.team_side === "home" ? "homePlayerId" : "awayPlayerId"]:
              message.player_id,
          });
          break;

        case "game_update":
          // Update game data
          updateGame(message.game_id - 1, {
            winner: message.game_data.winner,
            homeTableRun: message.game_data.home_table_run,
            awayTableRun: message.game_data.away_table_run,
            home8Ball: message.game_data.home_8ball_break,
            away8Ball: message.game_data.away_8ball_break,
          });
          break;

        case "scorecard_submitted":
          // Other captain submitted
          setSubmittedBy(message.submitted_by);
          toast.info(
            `${message.submitted_by === "home" ? homeTeam?.name : awayTeam?.name} captain submitted scorecard (${message.home_score}-${message.away_score})`
          );
          break;

        case "match_finalized":
          // Match finalized by home captain
          if (message.success) {
            toast.success("Match finalized successfully!");
            if (onSuccess) onSuccess();
          }
          break;

        default:
          console.warn("Unknown WebSocket message type:", message);
      }
    },
    [updateGame, setSubmittedBy, homeTeam, awayTeam, onSuccess]
  );

  // Initialize WebSocket connection
  const { send: sendWebSocket, status } = useMatchWebSocket({
    matchId: match.id,
    enabled: true,
    onMessage: handleWebSocketMessage,
  });

  // Determine if user is in read-only mode
  const isReadOnly = userTeamSide === null;

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

    // Home captain
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
      // Update context
      updateGame(gameIndex, updates);

      // Send WebSocket message
      sendWebSocket({
        type: "game_update",
        game_id: gameIndex + 1,
        game_data: {
          winner: updates.winner,
          home_table_run: updates.homeTableRun,
          away_table_run: updates.awayTableRun,
          home_8ball_break: updates.home8Ball,
          away_8ball_break: updates.away8Ball,
        },
      });
    },
    [updateGame, sendWebSocket]
  );

  // Auto-assign players to games
  const autoAssignPlayers = () => {
    const homePlayers = presentHomePlayers.map((p) => p.playerId);
    const awayPlayers = presentAwayPlayers.map((p) => p.playerId);

    // Track which matchups have been used
    const usedMatchups = new Set<string>();

    for (let setNum = 1; setNum <= 4; setNum++) {
      const setStartIndex = (setNum - 1) * 4;
      const availableHomePlayers = [...homePlayers];
      const availableAwayPlayers = [...awayPlayers];

      for (let gameInSet = 0; gameInSet < 4; gameInSet++) {
        const gameIndex = setStartIndex + gameInSet;

        // Skip if we don't have enough players
        if (
          availableHomePlayers.length === 0 ||
          availableAwayPlayers.length === 0
        )
          break;

        // Pick first available home player
        const homePlayerId = availableHomePlayers[0];
        availableHomePlayers.shift();

        // Find first available away player that hasn't played this home player
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

        // If we found a valid matchup, assign it
        if (awayPlayerId) {
          handlePlayerChange(gameIndex, "home", homePlayerId);
          handlePlayerChange(gameIndex, "away", awayPlayerId);
        }
      }
    }
  };

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
      toast.success("Scorecard submitted! Waiting for home captain to confirm.");

      // Send WebSocket notification to home captain
      sendWebSocket({
        type: "score_update",
        home_score: homeScore,
        away_score: awayScore,
      });

      return;
    }

    // Home captain confirms and finalizes
    if (userTeamSide === "home") {
      // If away hasn't submitted yet, show warning
      if (submittedBy === null) {
        toast.warning(
          "The away team captain hasn't submitted their scorecard yet. You can still submit, but it's better to wait for both captains to agree."
        );
      }

      // Transform games data to match API format
      const gamesData = games.map((game) => ({
        game_number: game.gameNumber,
        home_player_id: game.homePlayerId,
        away_player_id: game.awayPlayerId,
        winner: game.winner,
        home_table_run: game.homeTableRun,
        away_table_run: game.awayTableRun,
        home_8ball_break: game.home8Ball,
        away_8ball_break: game.away8Ball,
      }));

      const payload = {
        date: match.date,
        home_team_id: match.home_team,
        away_team_id: match.away_team,
        games: gamesData,
      };

      try {
        await matchesApi.submitMatch(payload);
        toast.success(
          `Match finalized! Final score: ${homeScore} - ${awayScore}`
        );

        // Notify via WebSocket
        sendWebSocket({
          type: "score_update",
          home_score: homeScore,
          away_score: awayScore,
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        console.error("Failed to submit match:", error);
        toast.error(error.response?.data?.error || "Failed to submit match");
      }
    }
  };

  const attendanceComplete =
    presentHomePlayers.length > 0 && presentAwayPlayers.length > 0;

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
            <h4 className="font-semibold text-blue-900">Viewing Match in Real-Time</h4>
            <p className="text-sm text-blue-700 mt-1">
              You're viewing this match as it's being scored. Only team captains can enter or modify scores.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Rosters */}
      <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setAttendanceCollapsed(!attendanceCollapsed)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {attendanceComplete && <Check className="h-5 w-5 text-green-600" />}
            <h2 className="text-lg font-bold">Mark Attendance</h2>
          </div>
          {attendanceCollapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>

        {!attendanceCollapsed && (
          <div className="p-4 pt-0 space-y-6">
            {/* Home Team Roster */}
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
                <p className="text-dark-400 italic">No players on roster</p>
              ) : (
                <div className="space-y-2">
                  {homeRoster.map((player) => (
                    <button
                      key={player.playerId}
                      onClick={() => !isReadOnly && toggleHomeAttendance(player.playerId)}
                      disabled={isReadOnly}
                      className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                        player.present
                          ? "border-primary bg-primary-50"
                          : "border-dark-200 bg-white hover:border-dark-300"
                      } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
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
                      <span className="font-medium">{player.playerName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Away Team Roster */}
            <div>
              <h3 className="font-medium text-dark-700 mb-3">
                {awayTeam?.name} (Visiting)
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
                  {awayRoster.map((player) => (
                    <button
                      key={player.playerId}
                      onClick={() => !isReadOnly && toggleAwayAttendance(player.playerId)}
                      disabled={isReadOnly}
                      className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                        player.present
                          ? "border-primary bg-primary-50"
                          : "border-dark-200 bg-white hover:border-dark-300"
                      } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
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
                      <span className="font-medium">{player.playerName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-assign button */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={autoAssignPlayers}
                disabled={
                  isReadOnly ||
                  presentHomePlayers.length < 4 ||
                  presentAwayPlayers.length < 4
                }
                className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 ${
                  isReadOnly ||
                  presentHomePlayers.length < 4 ||
                  presentAwayPlayers.length < 4
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
                Auto-Assign Players
              </button>
              {(presentHomePlayers.length < 4 ||
                presentAwayPlayers.length < 4) && (
                <p className="text-xs text-dark-500 text-center">
                  Need at least 4 players from each team (
                  {presentHomePlayers.length} home, {presentAwayPlayers.length}{" "}
                  away)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Score Entry */}
      {homeRoster.some((p) => p.present) &&
        awayRoster.some((p) => p.present) && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Enter Scores</h2>
              <div className="text-2xl font-bold text-primary">
                {homeScore} - {awayScore}
              </div>
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
                        {setComplete && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        <h3 className="font-bold text-dark-700">
                          Set {setNum}
                        </h3>
                      </div>
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
                        {[1, 2, 3, 4].map((gameInSet) => {
                          const gameIndex = (setNum - 1) * 4 + (gameInSet - 1);
                          const game = games[gameIndex];

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
                                {/* Home player */}
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
                                      handlePlayerChange(gameIndex, "home", homePlayerId);
                                    }}
                                    disabled={isReadOnly}
                                    className={`w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                      isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
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
                                      handlePlayerChange(gameIndex, "away", awayPlayerId);
                                    }}
                                    disabled={isReadOnly}
                                    className={`w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                                      isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
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

                              {/* Winner buttons - only show if both players selected */}
                              {game.homePlayerId && game.awayPlayerId && (
                                <>
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                      onClick={() =>
                                        !isReadOnly && handleGameDataChange(gameIndex, { winner: "home" })
                                      }
                                      disabled={isReadOnly}
                                      className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                        game.winner === "home"
                                          ? "bg-primary text-white shadow-md"
                                          : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                      } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                                    >
                                      WIN
                                    </button>
                                    <button
                                      onClick={() =>
                                        !isReadOnly && handleGameDataChange(gameIndex, { winner: "away" })
                                      }
                                      disabled={isReadOnly}
                                      className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                        game.winner === "away"
                                          ? "bg-primary text-white shadow-md"
                                          : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                      } ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
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
                                              homeTableRun: !game.homeTableRun,
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
                                              awayTableRun: !game.awayTableRun,
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

            {/* Submission Status Banner */}
            {submittedBy === "away" && userTeamSide === "home" && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900">
                    Away Team Submitted Scorecard
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {awayTeam?.name} captain has submitted their scorecard showing{" "}
                    {homeScore}-{awayScore}. Review the scores and click confirm to
                    finalize the match.
                  </p>
                </div>
              </div>
            )}

            {/* Submit button - hidden for viewers */}
            {!submitConfig.hidden && (
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
