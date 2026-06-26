import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { useMatch } from "../hooks/useMatches";
import { useSeason } from "../hooks/useSeasons";
import { useCurrentTeams } from "../hooks/usePlayers";
import { useAuth } from "../contexts/AuthContext";
import { useMatchScoring } from "../contexts/MatchScoringContext";
import type { TeamSide } from "../types/websocket";
import MatchForm from "../components/matches/MatchForm";

/**
 * Public, login-required live match view. Any authenticated user can watch a
 * match in real time; captains/operators get the same edit access they have in
 * the admin scorecard, everyone else is read-only. Backend authorization
 * (consumers.check_permissions) is the source of truth for who may connect.
 */
const LiveMatchPage: React.FC = () => {
  const { matchId: matchIdParam } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const matchId = parseInt(matchIdParam || "0");

  const { isAuthenticated, isLoading: authLoading, leagueData } = useAuth();
  const { data: match, isLoading: matchLoading, error: matchError } = useMatch(matchId);
  const seasonId = match?.season || 0;
  const { data: season } = useSeason(seasonId);
  const { data: currentTeams } = useCurrentTeams();
  const { initializeMatch } = useMatchScoring();

  const isLeagueOperator = season?.league
    ? leagueData.isLeagueOperator(season.league)
    : false;

  const captainRole: TeamSide | null = useMemo(() => {
    if (!match || !currentTeams) return null;
    if (currentTeams.some((team) => team.id === match.home_team)) return "home";
    if (currentTeams.some((team) => team.id === match.away_team)) return "away";
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

  useEffect(() => {
    if (match && gamesCount !== null) {
      initializeMatch(match.id, gamesCount);
    }
  }, [match, gamesCount, initializeMatch]);

  // Watching requires a login (the live socket is authenticated).
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (matchLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Loading match...
        </div>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500">Match not found</div>
          <button onClick={() => navigate(-1)} className="mt-4 btn btn-outline">
            Back
          </button>
        </div>
      </div>
    );
  }

  const homeTeam = match.home_team_detail;
  const awayTeam = match.away_team_detail;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-dark-300 hover:text-dark transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-dark">
            {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
          </h1>
          {!canEdit && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              <Eye className="h-4 w-4" />
              View Only
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {gamesCount === null ? (
          <div className="p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">League Configuration Error</p>
            <p className="text-red-600 text-sm">
              This season's league is missing required configuration. Please contact
              your league operator.
            </p>
          </div>
        ) : (
          <MatchForm
            match={match}
            userTeamSide={userTeamSide}
            isLeagueOperator={isLeagueOperator}
            onSuccess={() => navigate(-1)}
            onCancel={() => navigate(-1)}
            showCancelButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default LiveMatchPage;
