/**
 * OperatorMatchPage - League Operator Match Management Interface
 * Provides full control over match data without sequential captain workflow
 */

import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useMatch } from "../../hooks/useMatches";
import { useSeason } from "../../hooks/useSeasons";
import { useAuth } from "../../contexts/AuthContext";
import { useMatchScoring } from "../../contexts/MatchScoringContext";
import OperatorMatchForm from "../../components/matches/OperatorMatchForm";

const OperatorMatchPage: React.FC = () => {
  const { matchId: matchIdParam } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const matchId = parseInt(matchIdParam || "0");

  const { data: match, isLoading: matchLoading, error: matchError } = useMatch(matchId);
  const seasonId = match?.season || 0;
  const { data: season } = useSeason(seasonId);
  const { leagueData } = useAuth();
  const { initializeMatch } = useMatchScoring();

  const isLeagueOperator = season?.league ? leagueData.isLeagueOperator(season.league) : false;

  const gamesCount = useMemo(() => {
    const league = season?.league_detail;
    if (!league?.sets_per_match || !league?.games_per_set) return null;
    return league.sets_per_match * league.games_per_set;
  }, [season]);

  // Initialize match state when component mounts
  useEffect(() => {
    if (match && gamesCount !== null) {
      initializeMatch(match.id, gamesCount, match.lineup_state);
    }
  }, [match, gamesCount, initializeMatch]);

  // Redirect non-operators to regular score page
  useEffect(() => {
    if (!matchLoading && !isLeagueOperator && match) {
      navigate(`/admin/matches/${matchId}/score`, { replace: true });
    }
  }, [matchLoading, isLeagueOperator, match, matchId, navigate]);

  const handleSuccess = () => {
    navigate("/admin/matches");
  };

  const handleCancel = () => {
    navigate("/admin/matches");
  };

  if (matchLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Operator Match Management</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <div className="text-gray-500 mt-4">Loading match...</div>
        </div>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Operator Match Management</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500">Match not found</div>
          <button onClick={() => navigate("/admin/matches")} className="mt-4 btn btn-outline">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (!isLeagueOperator) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Operator Match Management</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500">Access denied. League Operator privileges required.</div>
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-dark truncate">
              {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
            </h1>
            <p className="text-sm text-dark-300 mt-1">
              League Operator Mode - Full match control
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full self-start sm:self-auto flex-shrink-0">
            <Shield className="h-4 w-4" />
            Operator
          </span>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="text-sm text-purple-800">
          <p>
            <strong>League Operator Mode:</strong> You have full control over this match.
            All sections are editable regardless of match phase. Changes are synced in real-time
            with any connected captains or viewers.
          </p>
        </div>
      </div>

      {gamesCount === null ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">League Configuration Error</p>
          <p className="text-red-600 text-sm">
            This season's league is missing required configuration (sets per match and games per set).
            Please configure the league settings before managing match scores.
          </p>
        </div>
      ) : (
        <OperatorMatchForm
          match={match}
          gamesCount={gamesCount}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default OperatorMatchPage;
