import React, { useState } from 'react';
import { Search, Plus, Info, Users, Trophy, Calendar, Copy } from 'lucide-react';
import { useSeasons, useSeasonTeams } from '../../hooks/useSeasons';
import { Season } from '../../api/types';
import { toast } from 'react-toastify';

const SeasonsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Fetch all seasons using React Query
  const { data: seasonsData, isLoading, error } = useSeasons();

  // Fetch teams for selected season (only when a season is selected)
  const { data: seasonTeams, isLoading: loadingTeams } = useSeasonTeams(selectedSeason?.id || 0);

  const seasons = seasonsData?.results || [];

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied to clipboard!');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleActiveFilter = (value: boolean | null) => {
    setActiveFilter(value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilter(null);
  };

  // Apply filters
  const filteredSeasons = seasons.filter(season => {
    const matchesSearch =
      season.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (season.league_detail?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      season.invite_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive = activeFilter === null || season.is_active === activeFilter;

    return matchesSearch && matchesActive;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Season Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load seasons. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark">Season Management</h1>
        <button className="btn btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-1" /> Create New Season
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search seasons..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Active filter */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">Status</label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFilter === null
                    ? 'bg-dark text-cream'
                    : 'bg-cream-300 text-dark hover:bg-cream-400'
                }`}
                onClick={() => handleActiveFilter(null)}
              >
                All
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFilter === true
                    ? 'bg-secondary text-white'
                    : 'bg-cream-300 text-dark hover:bg-cream-400'
                }`}
                onClick={() => handleActiveFilter(true)}
              >
                Active
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFilter === false
                    ? 'bg-red-600 text-white'
                    : 'bg-cream-300 text-dark hover:bg-cream-400'
                }`}
                onClick={() => handleActiveFilter(false)}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <button
              onClick={resetFilters}
              className="btn btn-outline px-3 py-2"
              disabled={!searchTerm && activeFilter === null}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Seasons grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading seasons...</div>
        </div>
      ) : filteredSeasons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeasons.map((season) => (
            <div key={season.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-dark">{season.name}</h3>
                    <p className="text-sm text-dark-300">{season.league_detail?.name || 'League'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    season.is_active
                      ? 'bg-secondary-100 text-secondary-800'
                      : 'bg-cream-400 text-dark-400'
                  }`}>
                    {season.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-dark-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(season.start_date)}</span>
                    {season.end_date && (
                      <>
                        <span className="mx-2">-</span>
                        <span>{formatDate(season.end_date)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-dark-300">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{season.team_count || 0} teams registered</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-accent-50 rounded border border-accent-200">
                    <div className="flex items-center text-sm">
                      <Trophy className="h-4 w-4 mr-2 text-accent-600" />
                      <span className="font-mono font-medium text-dark">{season.invite_code}</span>
                    </div>
                    <button
                      onClick={() => copyInviteCode(season.invite_code)}
                      className="text-primary hover:text-primary-600 transition-colors"
                      title="Copy invite code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSeason(season)}
                  className="w-full btn btn-outline text-sm flex items-center justify-center"
                >
                  <Info className="h-4 w-4 mr-1" />
                  View Standings
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No seasons found matching your filters.
        </div>
      )}

      {/* Season details modal */}
      {selectedSeason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-start p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold">{selectedSeason.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedSeason.league_detail?.name || 'League'}</p>
              </div>
              <button
                onClick={() => setSelectedSeason(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-4">Season Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-300">Start Date:</span>
                    <span className="ml-2 font-medium text-dark">{formatDate(selectedSeason.start_date)}</span>
                  </div>
                  {selectedSeason.end_date && (
                    <div>
                      <span className="text-dark-300">End Date:</span>
                      <span className="ml-2 font-medium text-dark">{formatDate(selectedSeason.end_date)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-dark-300">Invite Code:</span>
                    <span className="ml-2 font-mono font-medium text-dark">{selectedSeason.invite_code}</span>
                  </div>
                  <div>
                    <span className="text-dark-300">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedSeason.is_active
                        ? 'bg-secondary-100 text-secondary-800'
                        : 'bg-cream-400 text-dark-400'
                    }`}>
                      {selectedSeason.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-medium mb-4">Standings</h4>
              {loadingTeams ? (
                <div className="text-center py-8 text-dark-300">Loading standings...</div>
              ) : seasonTeams && seasonTeams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-cream-400">
                    <thead className="bg-cream-300">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Wins
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Losses
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-dark-400 uppercase tracking-wider">
                          Win %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-cream-300">
                      {seasonTeams.map((participation, index) => (
                        <tr key={participation.id} className="hover:bg-cream-200 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-dark">{participation.team_detail?.name}</div>
                            <div className="text-sm text-dark-300">{participation.team_detail?.establishment}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-secondary-600">
                            {participation.wins}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-red-600">
                            {participation.losses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-dark">
                            {participation.win_percentage?.toFixed(1) || '0.0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-dark-300">
                  No teams have joined this season yet.
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setSelectedSeason(null)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonsPage;
