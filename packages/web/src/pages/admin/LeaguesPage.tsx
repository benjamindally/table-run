import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Calendar, Plus, ArrowRight } from "lucide-react";
import { useLeagueSeason } from "../../contexts/LeagueSeasonContext";
import CreateSeasonModal from "../../components/CreateSeasonModal";
import CreateLeagueModal from "../../components/CreateLeagueModal";

const LeaguesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    leagues,
    seasons,
    isLoading,
    error,
    currentLeagueId,
    currentSeasonId,
    setCurrentLeague,
    setLeagueAndSeason,
  } = useLeagueSeason();

  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [selectedLeagueForSeason, setSelectedLeagueForSeason] = useState<
    number | null
  >(null);
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState(false);

  // Show only the 3 most recent leagues by default
  const displayedLeagues = showAllLeagues ? leagues : leagues.slice(0, 3);
  const hasMoreLeagues = leagues.length > 3;

  // Show only the 3 most recent seasons by default
  const displayedSeasons = showAllSeasons ? seasons : seasons.slice(0, 3);
  const hasMoreSeasons = seasons.length > 3;

  // Auto-expand if selected league/season is outside the initial slice
  useEffect(() => {
    if (currentLeagueId && leagues.length > 3) {
      const selectedIndex = leagues.findIndex((l) => l.id === currentLeagueId);
      if (selectedIndex >= 3) {
        setShowAllLeagues(true);
      }
    }
  }, [currentLeagueId, leagues]);

  useEffect(() => {
    if (currentSeasonId && seasons.length > 3) {
      const selectedIndex = seasons.findIndex((s) => s.id === currentSeasonId);
      if (selectedIndex >= 3) {
        setShowAllSeasons(true);
      }
    }
  }, [currentSeasonId, seasons]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Leagues</h1>
          <p className="text-sm text-dark-300 mt-1">League Management</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load leagues. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Leagues</h1>
          <p className="text-sm text-dark-300 mt-1">League Management</p>
        </div>
        <button
          onClick={() => setShowCreateLeagueModal(true)}
          className="btn btn-primary flex items-center justify-center sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-1" /> Create League
        </button>
      </div>

      {/* Leagues Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading leagues...</div>
        </div>
      ) : leagues.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLeagues.map((league) => (
              <div
                key={league.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  currentLeagueId === league.id ? "ring-2 ring-primary-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <Building2 className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-dark">
                          {league.name}
                        </h3>
                        <div className="flex items-center text-sm text-dark-300 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {league.city}, {league.state}
                        </div>
                      </div>
                    </div>
                    {league.role && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                        {league.role}
                      </span>
                    )}
                  </div>

                  {league.is_operator ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedLeagueForSeason(league.id)}
                        className="btn btn-primary text-sm flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Season
                      </button>
                      <button
                        onClick={() => {
                          setCurrentLeague(league.id);
                          navigate(`/admin/leagues/${league.id}`);
                        }}
                        className="btn btn-outline text-sm flex items-center justify-center"
                      >
                        Edit League
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentLeague(league.id);
                        navigate(`/admin/leagues/${league.id}`);
                      }}
                      className="btn btn-outline w-full text-sm flex items-center justify-center"
                    >
                      View League
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          {hasMoreLeagues && !showAllLeagues && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllLeagues(true)}
                className="btn btn-outline flex items-center"
              >
                View More Leagues
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-4">
            No leagues found. Create your first league to get started.
          </div>
          <button
            onClick={() => setShowCreateLeagueModal(true)}
            className="btn btn-primary flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-1" /> Create League
          </button>
        </div>
      )}

      {/* Seasons Section */}
      {/* {leagues.length > 0 && (
        <>
          <div className="pt-6 border-t">
            <h2 className="text-xl font-bold text-dark mb-4">Seasons</h2>
          </div>

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
                      currentSeasonId === season.id
                        ? "ring-2 ring-primary-500"
                        : ""
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

              {hasMoreSeasons && !showAllSeasons && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowAllSeasons(true)}
                    className="btn btn-outline flex items-center"
                  >
                    View More Seasons
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">
                No seasons yet. Add a season to one of your leagues to get
                started.
              </div>
            </div>
          )}
        </>
      )} */}

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={showCreateLeagueModal}
        onClose={() => setShowCreateLeagueModal(false)}
      />

      {/* Create Season Modal */}
      {selectedLeagueForSeason && (
        <CreateSeasonModal
          isOpen={selectedLeagueForSeason !== null}
          onClose={() => setSelectedLeagueForSeason(null)}
          leagueId={selectedLeagueForSeason}
        />
      )}
    </div>
  );
};

export default LeaguesPage;
