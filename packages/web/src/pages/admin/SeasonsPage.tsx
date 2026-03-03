import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { formatDateDisplay } from "@league-genius/shared";
// TODO: Uncomment when backend supports favorites
// import { Star } from "lucide-react";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";
// TODO: Uncomment when backend supports favorites
// import { useToggleFavorite } from "../../hooks/useSeasons";
// import { toast } from "react-toastify";
import type { MeSeason } from "../../api";

interface SeasonCardProps {
  season: MeSeason;
  isSelected: boolean;
  onView: () => void;
  // TODO: Uncomment when backend supports favorites
  // onToggleFavorite: (seasonId: number) => void;
  // isFavoriting: boolean;
}

const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  isSelected,
  onView,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-primary-500" : ""
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base sm:text-lg font-semibold text-dark truncate">
              {season.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* TODO: Uncomment when backend supports favorites
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(season.id);
              }}
              disabled={isFavoriting}
              className={`p-1.5 rounded-full transition-colors ${
                season.is_favorite
                  ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
              }`}
              title={season.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={`h-4 w-4 ${season.is_favorite ? "fill-current" : ""}`}
              />
            </button>
            */}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                season.is_active
                  ? "bg-secondary-100 text-secondary-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {season.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-dark-300">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Start Date</span>
            </div>
            <span className="font-semibold text-dark">
              {formatDateDisplay(season.start_date)}
            </span>
          </div>

          {season.end_date && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-dark-300">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>End Date</span>
              </div>
              <span className="font-semibold text-dark">
                {formatDateDisplay(season.end_date)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onView}
          className="btn btn-outline w-full text-sm flex items-center justify-center"
        >
          View Season
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

interface LeagueGroupProps {
  leagueName: string;
  leagueId: number;
  seasons: MeSeason[];
  currentSeasonId: number | null;
  onViewSeason: (season: MeSeason) => void;
  // TODO: Uncomment when backend supports favorites
  // onToggleFavorite: (seasonId: number) => void;
  // isFavoriting: boolean;
  defaultExpanded?: boolean;
}

const LeagueGroup: React.FC<LeagueGroupProps> = ({
  leagueName,
  seasons,
  currentSeasonId,
  onViewSeason,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sort seasons: active first, then by start date descending
  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      // Active seasons first
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      // Then by start date descending (newest first)
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  }, [seasons]);

  const activeCount = seasons.filter((s) => s.is_active).length;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <h2 className="text-lg font-semibold text-dark">{leagueName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-800">
              {activeCount} active
            </span>
          )}
          <span className="text-sm text-dark-300">
            {seasons.length} season{seasons.length !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSeasons.map((season) => (
              <SeasonCard
                key={season.id}
                season={season}
                isSelected={currentSeasonId === season.id}
                onView={() => onViewSeason(season)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SeasonsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    seasons,
    isLoading,
    error,
    currentSeasonId,
    setLeagueAndSeason,
  } = useLeagueSeason();

  // TODO: Uncomment when backend supports favorites
  // const toggleFavoriteMutation = useToggleFavorite();

  // Group seasons by league
  const seasonsByLeague = useMemo(() => {
    const byLeague: Record<number, { name: string; seasons: MeSeason[] }> = {};

    for (const season of seasons) {
      // Group by league
      if (!byLeague[season.league_id]) {
        byLeague[season.league_id] = {
          name: season.league_name,
          seasons: [],
        };
      }
      byLeague[season.league_id].seasons.push(season);
    }

    // Sort leagues by name
    const sortedLeagues = Object.entries(byLeague)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([id, data]) => ({ id: Number(id), ...data }));

    return sortedLeagues;
  }, [seasons]);

  const handleViewSeason = (season: MeSeason) => {
    setLeagueAndSeason(season.league_id, season.id);
    navigate(`/admin/seasons/${season.id}`);
  };

  // TODO: Uncomment when backend supports favorites
  // const handleToggleFavorite = async (seasonId: number) => {
  //   try {
  //     await toggleFavoriteMutation.mutateAsync(seasonId);
  //   } catch (error) {
  //     toast.info("Favorites will be available soon!");
  //   }
  // };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark">Seasons</h1>
          <p className="text-sm text-dark-300 mt-1">Season Management</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load seasons. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Seasons</h1>
        <p className="text-sm text-dark-300 mt-1">Manage your league seasons</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading seasons...</div>
        </div>
      ) : seasons.length > 0 ? (
        <div className="space-y-6">
          {/* TODO: Uncomment Favorites Section when backend supports it
          {favoriteSeasons.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm overflow-hidden border border-amber-200">
              <div className="px-4 sm:px-6 py-4 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-current" />
                  <h2 className="text-lg font-semibold text-dark">Favorites</h2>
                  <span className="text-sm text-dark-300">
                    ({favoriteSeasons.length})
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteSeasons.map((season) => (
                    <SeasonCard
                      key={`fav-${season.id}`}
                      season={season}
                      isSelected={currentSeasonId === season.id}
                      onView={() => handleViewSeason(season)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          */}

          {/* Leagues Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark px-1">By League</h2>
            {seasonsByLeague.map((league) => (
              <LeagueGroup
                key={league.id}
                leagueId={league.id}
                leagueName={league.name}
                seasons={league.seasons}
                currentSeasonId={currentSeasonId}
                onViewSeason={handleViewSeason}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-4">
            No seasons found. Create a League to get started.
          </div>
          <button
            onClick={() => navigate("/admin/leagues")}
            className="btn btn-primary flex items-center mx-auto"
          >
            Go to Leagues
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SeasonsPage;
