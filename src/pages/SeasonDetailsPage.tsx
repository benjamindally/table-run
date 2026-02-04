import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import {
  useSeason,
  useSeasonTeams,
  useSeasonMatches,
  useSeasonStandings,
  useSeasonPlayers,
} from "../hooks/useSeasons";
import { useCurrentTeams } from "../hooks/usePlayers";
import { useMyLeagues } from "../hooks/useLeagues";
import { useAuth } from "../contexts/AuthContext";
import SeasonOverview from "../components/seasons/SeasonOverview";
import SeasonStandings from "../components/seasons/SeasonStandings";
import SeasonTeams from "../components/seasons/SeasonTeams";
import SeasonMatches from "../components/seasons/SeasonMatches";
import SeasonPlayerAnalytics from "../components/seasons/SeasonPlayerAnalytics";
import MatchForm from "../components/matches/MatchForm";
import type { Match } from "../api/types";

const SeasonDetailsPage: React.FC = () => {
  const { seasonId: seasonIdParam } = useParams<{
    seasonId: string;
    leagueId: string;
  }>();
  const navigate = useNavigate();
  const seasonId = parseInt(seasonIdParam || "0");

  const { data: season, isLoading, error } = useSeason(seasonId);
  const { data: teams } = useSeasonTeams(seasonId);
  const { data: matches } = useSeasonMatches(seasonId);
  const { data: standings } = useSeasonStandings(seasonId);
  const { data: playersData } = useSeasonPlayers(seasonId);
  const { data: currentTeams } = useCurrentTeams();
  const { data: myLeaguesData } = useMyLeagues();
  const { player } = useAuth();

  // Edit match modal state
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);

  // Determine if user is a league operator
  const isLeagueOperator = (myLeaguesData?.results?.length ?? 0) > 0;

  // Get user's team IDs for permission checks
  const userTeamIds = useMemo(() => {
    return currentTeams?.map((team) => team.id) || [];
  }, [currentTeams]);

  // Determine if user can edit a specific match
  // - League operators can edit any match
  // - Captains can only edit non-completed matches involving their team
  const canEditMatch = useMemo(() => {
    return (match: Match): boolean => {
      if (!player) return false;
      if (isLeagueOperator) return true;

      // Captains cannot edit completed matches
      if (match.status === "completed") return false;

      // Check if user's team is involved in this match
      return (
        userTeamIds.includes(match.home_team) ||
        userTeamIds.includes(match.away_team)
      );
    };
  }, [player, isLeagueOperator, userTeamIds]);

  const openEditMatchModal = (match: Match) => {
    setMatchToEdit(match);
    setShowEditMatchModal(true);
  };

  const handleMatchFormSuccess = () => {
    setShowEditMatchModal(false);
    setMatchToEdit(null);
  };

  const handleMatchFormCancel = () => {
    setShowEditMatchModal(false);
    setMatchToEdit(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading season details...</div>
        </div>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load season details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with Back Button and Enter Scores Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate("/leagues")}
            className="btn btn-outline btn-sm flex items-center justify-center sm:justify-start w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leagues
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark">{season.name}</h1>
            <p className="text-sm text-dark-300 mt-1">
              {season.league_detail?.name}
            </p>
          </div>
        </div>

        {/* Enter Match Scores Button */}
        {/* <button
          onClick={() => navigate(`/score-entry/${seasonId}`)}
          className="btn btn-primary flex items-center"
        >
          <FileEdit className="h-4 w-4 mr-2" />
          Enter Match Scores
        </button> */}
      </div>

      {/* Overview Section - Read Only */}
      <SeasonOverview season={season} editable={false} />

      {/* Standings Section - Read Only */}
      <SeasonStandings
        standings={standings}
        onViewTeam={(teamId) => navigate(`/team/${teamId}/stats`)}
      />

      {/* Teams Section - Read Only */}
      <SeasonTeams teams={teams} editable={false} />

      {/* Matches Section - Editable based on authorization */}
      <SeasonMatches
        matches={matches}
        editable={canEditMatch}
        onEditMatch={openEditMatchModal}
        isUserTeamMatch={(match) =>
          userTeamIds.includes(match.home_team) ||
          userTeamIds.includes(match.away_team)
        }
      />

      {/* Player Analytics Section - Read Only */}
      <SeasonPlayerAnalytics playersData={playersData} />

      {/* Edit Match Modal */}
      {showEditMatchModal && matchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-cream-200 rounded-lg max-w-4xl w-full shadow-xl max-h-[95vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-primary text-white p-4 rounded-t-lg z-10 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">Edit Match</h3>
                  <p className="text-sm text-cream-200 mt-1">
                    {matchToEdit.home_team_detail?.name ||
                      `Team ${matchToEdit.home_team}`}{" "}
                    vs{" "}
                    {matchToEdit.away_team_detail?.name ||
                      `Team ${matchToEdit.away_team}`}
                  </p>
                </div>
                <button
                  onClick={handleMatchFormCancel}
                  className="text-white hover:text-cream-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <MatchForm
                match={matchToEdit}
                userTeamSide={
                  userTeamIds.includes(matchToEdit.home_team)
                    ? "home"
                    : userTeamIds.includes(matchToEdit.away_team)
                    ? "away"
                    : null
                }
                onSuccess={handleMatchFormSuccess}
                onCancel={handleMatchFormCancel}
                showCancelButton={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonDetailsPage;
