import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  useSeason,
  useSeasonTeams,
  useSeasonMatches,
  useSeasonStandings,
  useSeasonPlayers,
} from "../hooks/useSeasons";
import SeasonOverview from "../components/seasons/SeasonOverview";
import SeasonStandings from "../components/seasons/SeasonStandings";
import SeasonTeams from "../components/seasons/SeasonTeams";
import SeasonMatches from "../components/seasons/SeasonMatches";
import SeasonPlayerAnalytics from "../components/seasons/SeasonPlayerAnalytics";

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
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/leagues")}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leagues
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">{season.name}</h1>
            <p className="text-sm text-dark-300 mt-1">
              {season.league_detail?.name}
            </p>
          </div>
        </div>
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

      {/* Matches Section - Read Only */}
      <SeasonMatches matches={matches} editable={false} />

      {/* Player Analytics Section - Read Only */}
      <SeasonPlayerAnalytics playersData={playersData} />
    </div>
  );
};

export default SeasonDetailsPage;
