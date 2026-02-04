/**
 * MVP Score Entry Page - Mobile-first score sheet entry
 * Single-page flow that progressively reveals sections
 * Now with WebSocket support for real-time collaborative scoring
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeasonMatches, useSeason } from "../hooks/useSeasons";
import { useCurrentTeams } from "../hooks/usePlayers";
import { useAuth } from "../contexts/AuthContext";
import { useMatchScoring } from "../contexts/MatchScoringContext";
import { useMatchWebSocket } from "../hooks/useMatchWebSocket";
import { X, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import type { Match } from "../api/types";
import type { IncomingMessage, TeamSide } from "../types/websocket";
import SeasonMatches from "../components/seasons/SeasonMatches";
import MatchForm from "../components/matches/MatchForm";

const ScoreEntryPage: React.FC = () => {
  const { seasonId: seasonIdParam } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const seasonId = parseInt(seasonIdParam || "0");

  // Selected match from the list
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Fetch season data and matches for this season
  const { data: season } = useSeason(seasonId);
  const { data: matchesData, isLoading: matchesLoading } = useSeasonMatches(seasonId);
  const { data: currentTeams } = useCurrentTeams();
  const { leagueData, player } = useAuth();

  // Match scoring context
  const { initializeMatch } = useMatchScoring();

  // Determine captain role (home or away)
  const captainRole: TeamSide | null = useMemo(() => {
    if (!selectedMatch || !currentTeams) return null;

    // Check if user's player is a captain of either team
    const isHomeCaptain = currentTeams.some(
      (team) => team.id === selectedMatch.home_team
    );
    const isAwayCaptain = currentTeams.some(
      (team) => team.id === selectedMatch.away_team
    );

    if (isHomeCaptain) return 'home';
    if (isAwayCaptain) return 'away';
    return null;
  }, [selectedMatch, currentTeams]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: IncomingMessage) => {
    console.log('WebSocket message received:', message);
    // Message handling will be implemented in MatchForm
  }, []);

  // Get games count from league settings
  const gamesCount = useMemo(() => {
    const league = season?.league_detail;
    if (!league?.sets_per_match || !league?.games_per_set) return null;
    return league.sets_per_match * league.games_per_set;
  }, [season]);

  // WebSocket connection (only enable if we have valid game configuration)
  const { status: wsStatus, isConnected } = useMatchWebSocket({
    matchId: selectedMatch?.id || 0,
    enabled: !!selectedMatch && gamesCount !== null,
    onMessage: handleWebSocketMessage,
  });

  // Initialize match state when match is selected
  useEffect(() => {
    if (selectedMatch && gamesCount !== null) {
      initializeMatch(selectedMatch.id, gamesCount);
    }
  }, [selectedMatch, gamesCount, initializeMatch]);

  // Determine if user is a league operator for this season's league
  const isLeagueOperator = season?.league ? leagueData.isLeagueOperator(season.league) : false;

  // Filter matches to show only relevant unscored matches
  const availableMatches = useMemo(() => {
    if (!matchesData) return [];

    // Filter to only scheduled matches (not completed or cancelled)
    let filteredMatches = matchesData.filter((match: Match) => match.status === 'scheduled');

    // If not a league operator, filter by user's teams
    if (!isLeagueOperator && currentTeams) {
      const userTeamIds = currentTeams.map(team => team.id);
      filteredMatches = filteredMatches.filter(
        (match: Match) => userTeamIds.includes(match.home_team) || userTeamIds.includes(match.away_team)
      );
    }

    // Sort by date (upcoming first)
    return filteredMatches.sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matchesData, currentTeams, isLeagueOperator]);

  const homeTeam = selectedMatch?.home_team_detail;
  const awayTeam = selectedMatch?.away_team_detail;

  // Handle match selection
  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
  };

  // Handle successful submission
  const handleSuccess = () => {
    setSelectedMatch(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedMatch(null);
  };

  // If no match is selected, show the match selection grid (wide layout)
  if (!selectedMatch) {
    return (
      <div className="min-h-screen bg-cream-200 pb-20">
        {/* Header */}
        <div className="bg-primary text-white p-6">
          <div className="container mx-auto max-w-7xl">
            <button
              onClick={() => season && navigate(`/leagues/${season.league}/seasons/${seasonId}`)}
              className="flex items-center text-white hover:text-cream-200 transition-colors mb-4"
              disabled={!season}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Season
            </button>
            <h1 className="text-2xl font-bold">
              {season ? `${season.league_detail?.name} - ${season.name}` : 'Score Sheet Entry'}
            </h1>
            <p className="text-sm text-cream-200 mt-1">
              Select a match to enter scores
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {matchesLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-dark-300">Loading matches...</div>
            </div>
          ) : availableMatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-dark-500">No matches available to score.</p>
              {!isLeagueOperator && (
                <p className="text-sm text-dark-300 mt-2">
                  You can only score matches for your teams.
                </p>
              )}
            </div>
          ) : (
            <SeasonMatches
              matches={availableMatches}
              editable={(match: Match) => leagueData.canEditMatch(match, season?.league)}
              onEditMatch={handleMatchSelect}
              initialWeeksToShow={4}
            />
          )}
        </div>
      </div>
    );
  }

  // If match is selected, show the score entry form (narrower layout with overlay)
  return (
    <div className="min-h-screen bg-cream-200 pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">Score Sheet Entry</h1>
              {isConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                  <Wifi className="h-3 w-3" />
                  LIVE
                </span>
              )}
              {!isConnected && selectedMatch && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                  <WifiOff className="h-3 w-3" />
                  {wsStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
                </span>
              )}
            </div>
            <p className="text-sm text-cream-200">
              {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
            </p>
            {captainRole && (
              <p className="text-xs text-cream-300 mt-0.5">
                You are the {captainRole} captain
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-white hover:text-cream-200 transition-colors ml-4"
            title="Change match"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {gamesCount === null ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">
              League Configuration Error
            </p>
            <p className="text-red-600 text-sm">
              This season's league is missing required configuration (sets per match and games per set).
              Please contact your league operator to fix this before entering scores.
            </p>
          </div>
        ) : (
          <MatchForm
            match={selectedMatch}
            userTeamSide={captainRole}
            isLeagueOperator={isLeagueOperator}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            showCancelButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default ScoreEntryPage;
