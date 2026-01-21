import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";

const SeasonsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    seasons,
    isLoading,
    error,
    currentSeasonId,
    setLeagueAndSeason,
  } = useLeagueSeason();

  const [showAll, setShowAll] = useState(false);

  const displayedSeasons = showAll ? seasons : seasons.slice(0, 9);
  const hasMore = seasons.length > 9;

  // Auto-expand if selected season is outside the initial slice
  useEffect(() => {
    if (currentSeasonId && seasons.length > 9) {
      const selectedIndex = seasons.findIndex((s) => s.id === currentSeasonId);
      if (selectedIndex >= 9) {
        setShowAll(true);
      }
    }
  }, [currentSeasonId, seasons]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Seasons</h1>
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
        <h1 className="text-2xl font-bold text-dark">Seasons</h1>
        <p className="text-sm text-dark-300 mt-1">Manage your league seasons</p>
      </div>

      {/* Seasons Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading seasons...</div>
        </div>
      ) : seasons.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSeasons.map((season) => (
              <div
                key={season.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  currentSeasonId === season.id ? "ring-2 ring-primary-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark">
                        {season.name}
                      </h3>
                      <p className="text-sm text-dark-300 mt-1">
                        {season.league_name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        season.is_active
                          ? "bg-secondary-100 text-secondary-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {season.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-dark-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Start Date</span>
                      </div>
                      <span className="font-semibold text-dark">
                        {new Date(season.start_date).toLocaleDateString()}
                      </span>
                    </div>

                    {season.end_date && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-dark-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>End Date</span>
                        </div>
                        <span className="font-semibold text-dark">
                          {new Date(season.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setLeagueAndSeason(season.league_id, season.id);
                      navigate(`/admin/seasons/${season.id}`);
                    }}
                    className="btn btn-outline w-full text-sm flex items-center justify-center"
                  >
                    View Season
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          {hasMore && !showAll && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="btn btn-outline flex items-center"
              >
                View More
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}
        </>
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
