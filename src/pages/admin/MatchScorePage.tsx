import React, { useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, Eye } from "lucide-react";
import { useMatch } from "../../hooks/useMatches";
import { useSeason } from "../../hooks/useSeasons";
import { useCurrentTeams } from "../../hooks/usePlayers";
import { useAuth } from "../../contexts/AuthContext";
import { useMatchScoring } from "../../contexts/MatchScoringContext";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";
import type { IncomingMessage, TeamSide } from "../../types/websocket";
import MatchForm from "../../components/matches/MatchForm";

const MatchScorePage: React.FC = () => {
  const { matchId: matchIdParam } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const matchId = parseInt(matchIdParam || "0");

  const { data: match, isLoading: matchLoading, error: matchError } = useMatch(matchId);
  const seasonId = match?.season || 0;
  const { data: season } = useSeason(seasonId);
  const { data: currentTeams } = useCurrentTeams();
  const { leagueData } = useAuth();
  const { initializeMatch } = useMatchScoring();

  const isLeagueOperator = season?.league ? leagueData.isLeagueOperator(season.league) : false;

  const captainRole: TeamSide | null = useMemo(() => {
    if (!match || !currentTeams) return null;
    const isHomeCaptain = currentTeams.some((team) => team.id === match.home_team);
    const isAwayCaptain = currentTeams.some((team) => team.id === match.away_team);
    if (isHomeCaptain) return "home";
    if (isAwayCaptain) return "away";
    return null;
  }, [match, currentTeams]);

  const canEdit = captainRole !== null || isLeagueOperator;

  const userTeamSide: TeamSide | null = useMemo(() => {
    if (captainRole) return captainRole;
    if (isLeagueOperator) return "home";
    return null;
  }, [captainRole, isLeagueOperator]);

  const gamesCount = useMemo(() => {
    const league = season?.league_detail;
    if (!league?.sets_per_match || !league?.games_per_set) return null;
    return league.sets_per_match * league.games_per_set;
  }, [season]);

  const handleWebSocketMessage = useCallback((message: IncomingMessage) => {
    console.log("WebSocket message received:", message);
  }, []);

  const { status: wsStatus, isConnected } = useMatchWebSocket({
    matchId: match?.id || 0,
    enabled: !!match && gamesCount !== null,
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    if (match && gamesCount !== null) {
      initializeMatch(match.id, gamesCount);
    }
  }, [match, gamesCount, initializeMatch]);

  const handleSuccess = () => {
    navigate("/admin/matches");
  };

  const handleCancel = () => {
    navigate("/admin/matches");
  };

  if (matchLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Match Score Entry</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading match...</div>
        </div>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark">Match Score Entry</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500">Match not found</div>
          <button onClick={() => navigate("/admin/matches")} className="mt-4 btn btn-outline">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const homeTeam = match.home_team_detail;
  const awayTeam = match.away_team_detail;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={handleCancel}
          className="flex items-center text-dark-300 hover:text-dark transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Matches
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark">
              {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
            </h1>
            <p className="text-sm text-dark-300 mt-1">
              {canEdit ? "Enter match scores" : "Viewing match scores (read-only)"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <Wifi className="h-4 w-4" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                <WifiOff className="h-4 w-4" />
                {wsStatus === "connecting" ? "Connecting..." : "Offline"}
              </span>
            )}

            {!canEdit && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                <Eye className="h-4 w-4" />
                View Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          {isLeagueOperator ? (
            <p><strong>League Operator:</strong> You can enter and modify scores for this match.</p>
          ) : captainRole ? (
            <p><strong>{captainRole === "home" ? "Home" : "Away"} Team Captain:</strong> You can enter scores for this match.</p>
          ) : (
            <p><strong>Viewer:</strong> You're watching this match in real-time. Only team captains or league operators can enter scores.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {gamesCount === null ? (
          <div className="p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">League Configuration Error</p>
            <p className="text-red-600 text-sm">
              This season's league is missing required configuration (sets per match and games per set).
              Please contact your league operator to fix this before entering scores.
            </p>
          </div>
        ) : (
          <MatchForm
            match={match}
            userTeamSide={userTeamSide}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            showCancelButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default MatchScorePage;
