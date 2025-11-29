/**
 * MVP Score Entry Page - Mobile-first score sheet entry
 * Single-page flow that progressively reveals sections
 */

import React, { useState } from "react";
import { useTeams, useTeamRoster } from "../hooks/useTeams";
import { matchesApi } from "../api";
import { toast } from "react-toastify";
import { Calendar, MapPin, Check, ChevronDown, ChevronUp } from "lucide-react";

interface MatchSetup {
  date: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
}

interface PlayerAttendance {
  playerId: number;
  playerName: string;
  present: boolean;
}

interface GameResult {
  gameNumber: number;
  homePlayerId: number | null;
  awayPlayerId: number | null;
  winner: "home" | "away" | null;
  homeTableRun: boolean;
  awayTableRun: boolean;
  home8Ball: boolean;
  away8Ball: boolean;
}

const ScoreEntryPage: React.FC = () => {
  const [matchSetup, setMatchSetup] = useState<MatchSetup>({
    date: new Date().toISOString().split("T")[0],
    homeTeamId: null,
    awayTeamId: null,
  });

  const [homeRoster, setHomeRoster] = useState<PlayerAttendance[]>([]);
  const [awayRoster, setAwayRoster] = useState<PlayerAttendance[]>([]);
  const [setupCollapsed, setSetupCollapsed] = useState(false);
  const [attendanceCollapsed, setAttendanceCollapsed] = useState(false);
  const [collapsedSets, setCollapsedSets] = useState<Set<number>>(new Set());

  // Initialize 16 games (4 sets × 4 games)
  const [games, setGames] = useState<GameResult[]>(
    Array.from({ length: 16 }, (_, i) => ({
      gameNumber: i + 1,
      homePlayerId: null,
      awayPlayerId: null,
      winner: null,
      homeTableRun: false,
      awayTableRun: false,
      home8Ball: false,
      away8Ball: false,
    }))
  );

  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const teams = teamsData?.results || [];

  // Fetch rosters when teams are selected
  const { data: homeRosterData, isLoading: homeRosterLoading } = useTeamRoster(
    matchSetup.homeTeamId || 0
  );
  const { data: awayRosterData, isLoading: awayRosterLoading } = useTeamRoster(
    matchSetup.awayTeamId || 0
  );

  const homeTeam = teams.find((t) => t.id === matchSetup.homeTeamId);
  const awayTeam = teams.find((t) => t.id === matchSetup.awayTeamId);

  const setupComplete =
    matchSetup.homeTeamId &&
    matchSetup.awayTeamId &&
    matchSetup.homeTeamId !== matchSetup.awayTeamId;

  // Initialize rosters when data loads
  React.useEffect(() => {
    if (homeRosterData) {
      setHomeRoster(
        homeRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: false,
        }))
      );
    }
  }, [homeRosterData]);

  React.useEffect(() => {
    if (awayRosterData) {
      setAwayRoster(
        awayRosterData.map((member) => ({
          playerId: member.player,
          playerName: member.player_detail?.full_name || "Unknown",
          present: false,
        }))
      );
    }
  }, [awayRosterData]);

  const toggleHomeAttendance = (playerId: number) => {
    setHomeRoster((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      )
    );
  };

  const toggleAwayAttendance = (playerId: number) => {
    setAwayRoster((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      )
    );
  };

  const updateGame = (gameIndex: number, updates: Partial<GameResult>) => {
    setGames((prev) =>
      prev.map((game, idx) =>
        idx === gameIndex ? { ...game, ...updates } : game
      )
    );
  };

  const setWinner = (gameIndex: number, winner: "home" | "away") => {
    updateGame(gameIndex, { winner });
  };

  const toggleTableRun = (gameIndex: number, team: "home" | "away") => {
    const game = games[gameIndex];
    if (team === "home") {
      updateGame(gameIndex, { homeTableRun: !game.homeTableRun });
    } else {
      updateGame(gameIndex, { awayTableRun: !game.awayTableRun });
    }
  };

  const toggle8Ball = (gameIndex: number, team: "home" | "away") => {
    const game = games[gameIndex];
    if (team === "home") {
      updateGame(gameIndex, { home8Ball: !game.home8Ball });
    } else {
      updateGame(gameIndex, { away8Ball: !game.away8Ball });
    }
  };

  const setGamePlayers = (
    gameIndex: number,
    homePlayerId: number,
    awayPlayerId: number
  ) => {
    updateGame(gameIndex, { homePlayerId, awayPlayerId });
  };

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

  // Auto-assign players to games
  const autoAssignPlayers = () => {
    const newGames = [...games];
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
          newGames[gameIndex] = {
            ...newGames[gameIndex],
            homePlayerId,
            awayPlayerId,
          };
        }
      }
    }

    setGames(newGames);
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
    if (!matchSetup.homeTeamId || !matchSetup.awayTeamId) {
      toast.error("Please select both teams");
      return;
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
      date: matchSetup.date,
      home_team_id: matchSetup.homeTeamId,
      away_team_id: matchSetup.awayTeamId,
      games: gamesData,
    };

    try {
      await matchesApi.submitMatch(payload);
      toast.success(
        `Match submitted! Final score: ${homeScore} - ${awayScore}`
      );

      // Reset the form
      setMatchSetup({
        date: new Date().toISOString().split("T")[0],
        homeTeamId: null,
        awayTeamId: null,
      });
      setHomeRoster([]);
      setAwayRoster([]);
      setGames(
        Array.from({ length: 16 }, (_, i) => ({
          gameNumber: i + 1,
          homePlayerId: null,
          awayPlayerId: null,
          winner: null,
          homeTableRun: false,
          awayTableRun: false,
          home8Ball: false,
          away8Ball: false,
        }))
      );
      setSetupCollapsed(false);
      setAttendanceCollapsed(false);
    } catch (error: any) {
      console.error("Failed to submit match:", error);
      toast.error(error.response?.data?.error || "Failed to submit match");
    }
  };

  // Calculate scores
  const presentHomePlayers = homeRoster.filter((p) => p.present);
  const presentAwayPlayers = awayRoster.filter((p) => p.present);
  const homeScore = games.filter((g) => g.winner === "home").length;
  const awayScore = games.filter((g) => g.winner === "away").length;
  const attendanceComplete =
    presentHomePlayers.length > 0 && presentAwayPlayers.length > 0;

  return (
    <div className="min-h-screen bg-cream-200 pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Score Sheet Entry</h1>
        <p className="text-sm text-cream-200 mt-1">
          {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
        </p>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Section 1: Match Setup */}
        <div className="bg-white rounded-lg shadow-md">
          <button
            onClick={() => setSetupCollapsed(!setupCollapsed)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {setupComplete && <Check className="h-5 w-5 text-green-600" />}
              <h2 className="text-lg font-bold">Match Setup</h2>
            </div>
            {setupCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>

          {!setupCollapsed && (
            <div className="p-4 pt-0 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Match Date
                </label>
                <input
                  type="date"
                  value={matchSetup.date}
                  onChange={(e) =>
                    setMatchSetup({ ...matchSetup, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                />
              </div>

              {/* Home Team */}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Home Team
                </label>
                {teamsLoading ? (
                  <div className="h-12 bg-cream-200 rounded animate-pulse"></div>
                ) : (
                  <select
                    value={matchSetup.homeTeamId || ""}
                    onChange={(e) =>
                      setMatchSetup({
                        ...matchSetup,
                        homeTeamId: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                  >
                    <option value="">Select home team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
                {homeTeam && (
                  <p className="text-sm text-dark-500 mt-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {homeTeam.establishment}
                  </p>
                )}
              </div>

              {/* Away Team */}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Visiting Team
                </label>
                {teamsLoading ? (
                  <div className="h-12 bg-cream-200 rounded animate-pulse"></div>
                ) : (
                  <select
                    value={matchSetup.awayTeamId || ""}
                    onChange={(e) =>
                      setMatchSetup({
                        ...matchSetup,
                        awayTeamId: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                  >
                    <option value="">Select visiting team...</option>
                    {teams.map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                        disabled={team.id === matchSetup.homeTeamId}
                      >
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
                {awayTeam && (
                  <p className="text-sm text-dark-500 mt-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {awayTeam.establishment}
                  </p>
                )}
              </div>

              {setupComplete && (
                <button
                  onClick={() => setSetupCollapsed(true)}
                  className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-600"
                >
                  Continue
                </button>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Rosters - Only show if setup is complete */}
        {setupComplete && (
          <div className="bg-white rounded-lg shadow-md">
            <button
              onClick={() => setAttendanceCollapsed(!attendanceCollapsed)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {attendanceComplete && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
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
                          onClick={() => toggleHomeAttendance(player.playerId)}
                          className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                            player.present
                              ? "border-primary bg-primary-50"
                              : "border-dark-200 bg-white hover:border-dark-300"
                          }`}
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
                          onClick={() => toggleAwayAttendance(player.playerId)}
                          className={`w-full p-3 rounded-md border-2 transition-all text-left flex items-center gap-3 ${
                            player.present
                              ? "border-primary bg-primary-50"
                              : "border-dark-200 bg-white hover:border-dark-300"
                          }`}
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
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-assign button */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    onClick={autoAssignPlayers}
                    disabled={
                      presentHomePlayers.length < 4 ||
                      presentAwayPlayers.length < 4
                    }
                    className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 ${
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
                      {presentHomePlayers.length} home,{" "}
                      {presentAwayPlayers.length} away)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Score Entry */}
        {setupComplete &&
          homeRoster.some((p) => p.present) &&
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
                            const gameIndex =
                              (setNum - 1) * 4 + (gameInSet - 1);
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
                                        if (game.awayPlayerId) {
                                          setGamePlayers(
                                            gameIndex,
                                            homePlayerId,
                                            game.awayPlayerId
                                          );
                                        } else {
                                          updateGame(gameIndex, {
                                            homePlayerId,
                                          });
                                        }
                                      }}
                                      className="w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                                        if (game.homePlayerId) {
                                          setGamePlayers(
                                            gameIndex,
                                            game.homePlayerId,
                                            awayPlayerId
                                          );
                                        } else {
                                          updateGame(gameIndex, {
                                            awayPlayerId,
                                          });
                                        }
                                      }}
                                      className="w-full px-2 py-2 text-sm border border-dark-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                                </div>

                                {/* Winner buttons - only show if both players selected */}
                                {game.homePlayerId && game.awayPlayerId && (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <button
                                        onClick={() =>
                                          setWinner(gameIndex, "home")
                                        }
                                        className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                          game.winner === "home"
                                            ? "bg-primary text-white shadow-md"
                                            : "bg-cream-200 text-dark-700 hover:bg-cream-300"
                                        }`}
                                      >
                                        WIN
                                      </button>
                                      <button
                                        onClick={() =>
                                          setWinner(gameIndex, "away")
                                        }
                                        className={`py-2 px-3 rounded-md font-medium text-sm transition-all ${
                                          game.winner === "away"
                                            ? "bg-primary text-white shadow-md"
                                            : "bg-cream-200 text-dark-700 hover:bg-cream-300"
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
                                              toggleTableRun(gameIndex, "home")
                                            }
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                          />
                                          <span>Table Run</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.home8Ball}
                                            onChange={() =>
                                              toggle8Ball(gameIndex, "home")
                                            }
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
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
                                              toggleTableRun(gameIndex, "away")
                                            }
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
                                          />
                                          <span>Table Run</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={game.away8Ball}
                                            onChange={() =>
                                              toggle8Ball(gameIndex, "away")
                                            }
                                            className="w-4 h-4 rounded border-dark-300 text-primary focus:ring-primary"
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

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="w-full mt-6 bg-green-600 text-white py-4 rounded-md font-bold text-lg hover:bg-green-700 transition-colors"
              >
                Submit Match ({homeScore} - {awayScore})
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default ScoreEntryPage;
