import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { useMyLeagues } from '../../hooks/useLeagues';
import { useSeasons } from '../../hooks/useSeasons';

const SeasonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const { data: leaguesData } = useMyLeagues();
  const { data: seasonsData, isLoading, error } = useSeasons();

  const leagues = leaguesData?.results || [];
  const allSeasons = seasonsData?.results || [];

  // Filter seasons to only show those from leagues the user operates
  const mySeasons = useMemo(() => {
    const myLeagueIds = leagues.map(l => l.id);
    return allSeasons
      .filter(season => myLeagueIds.includes(season.league))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allSeasons, leagues]);

  const displayedSeasons = showAll ? mySeasons : mySeasons.slice(0, 9);
  const hasMore = mySeasons.length > 9;

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
                      <h3 className="text-lg font-semibold text-dark">{season.name}</h3>
                      <p className="text-sm text-dark-300 mt-1">
                        {season.league_detail?.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      season.is_active
                        ? 'bg-secondary-100 text-secondary-800'
                        : season.is_archived
                        ? 'bg-cream-400 text-dark-400'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {season.is_active ? 'Active' : season.is_archived ? 'Archived' : 'Inactive'}
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
                      <span className="font-semibold text-dark">{season.team_count || 0}</span>
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
            No seasons found. Create a season from the Leagues page to get started.
          </div>
          <button
            onClick={() => navigate('/admin/leagues')}
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
