import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  Trophy,
  Calendar,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useMyLeagues } from "../../hooks/useLeagues";
import { useSeasons } from "../../hooks/useSeasons";
import CreateSeasonModal from "../../components/CreateSeasonModal";
import CreateLeagueModal from "../../components/CreateLeagueModal";

const LeaguesPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [selectedLeagueForSeason, setSelectedLeagueForSeason] = useState<
    number | null
  >(null);
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState(false);

  // Fetch leagues where current user is an operator
  const { data: leaguesData, isLoading, error } = useMyLeagues();
  const { data: seasonsData, isLoading: seasonsLoading } = useSeasons();

  const leagues = leaguesData?.results || [];
  const allSeasons = seasonsData?.results || [];

  // Filter seasons to only show those from leagues the user operates
  const mySeasons = useMemo(() => {
    const myLeagueIds = leagues.map((l) => l.id);
    return allSeasons
      .filter((season) => myLeagueIds.includes(season.league))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [allSeasons, leagues]);

  // Show only the 3 most recent leagues by default
  const displayedLeagues = showAllLeagues ? leagues : leagues.slice(0, 3);
  const hasMoreLeagues = leagues.length > 3;

  // Show only the 3 most recent seasons by default
  const displayedSeasons = showAllSeasons ? mySeasons : mySeasons.slice(0, 3);
  const hasMoreSeasons = mySeasons.length > 3;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Leagues</h1>
          <p className="text-sm text-dark-300 mt-1">League Management</p>
        </div>
        <button
          onClick={() => setShowCreateLeagueModal(true)}
          className="btn btn-primary flex items-center"
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
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        league.is_active
                          ? "bg-secondary-100 text-secondary-800"
                          : "bg-cream-400 text-dark-400"
                      }`}
                    >
                      {league.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {league.description && (
                    <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                      {league.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-dark-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Seasons</span>
                      </div>
                      <span className="font-semibold text-dark">
                        {league.season_count || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-dark-300">
                        <Trophy className="h-4 w-4 mr-2" />
                        <span>Games per Match</span>
                      </div>
                      <span className="font-semibold text-dark">
                        {league.total_games || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-dark-300">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Sets per Match</span>
                      </div>
                      <span className="font-semibold text-dark">
                        {league.sets_per_match}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedLeagueForSeason(league.id)}
                      className="btn btn-primary text-sm flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Season
                    </button>
                    <button
                      onClick={() => navigate(`/admin/leagues/${league.id}`)}
                      className="btn btn-outline text-sm flex items-center justify-center"
                    >
                      Edit League
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
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
      {leagues.length > 0 && (
        <>
          <div className="pt-6 border-t">
            <h2 className="text-xl font-bold text-dark mb-4">Seasons</h2>
          </div>

          {seasonsLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">Loading seasons...</div>
            </div>
          ) : mySeasons.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedSeasons.map((season) => (
                  <div
                    key={season.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-dark">
                            {season.name}
                          </h3>
                          <p className="text-sm text-dark-300 mt-1">
                            {season.league_detail?.name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            season.is_active
                              ? "bg-secondary-100 text-secondary-800"
                              : season.is_archived
                              ? "bg-cream-400 text-dark-400"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {season.is_active
                            ? "Active"
                            : season.is_archived
                            ? "Archived"
                            : "Inactive"}
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

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-dark-300">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Teams</span>
                          </div>
                          <span className="font-semibold text-dark">
                            {season.team_count || 0}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/seasons/${season.id}`)}
                        className="btn btn-outline w-full text-sm flex items-center justify-center"
                      >
                        View Season
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View More Seasons Button */}
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
      )}

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
