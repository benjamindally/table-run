import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Trophy, Target, Edit, Archive } from 'lucide-react';
import { useSeason, useSeasonTeams, useSeasonMatches } from '../../hooks/useSeasons';

const SeasonDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seasonId = parseInt(id || '0');

  const { data: season, isLoading, error } = useSeason(seasonId);
  const { data: teams } = useSeasonTeams(seasonId);
  const { data: matches } = useSeasonMatches(seasonId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading season details...</div>
        </div>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load season details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/leagues')}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leagues
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">{season.name}</h1>
            <p className="text-sm text-dark-300 mt-1">{season.league_detail?.name}</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark">Overview</h2>
          <div className="flex space-x-2">
            <button className="btn btn-outline btn-sm flex items-center">
              <Edit className="h-4 w-4 mr-1" />
              Edit Season
            </button>
            <button className="btn btn-outline btn-sm flex items-center">
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <p className="text-lg font-semibold text-dark">
              {new Date(season.start_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          {season.end_date && (
            <div>
              <div className="flex items-center text-dark-300 mb-2">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">End Date</span>
              </div>
              <p className="text-lg font-semibold text-dark">
                {new Date(season.end_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Teams</span>
            </div>
            <p className="text-lg font-semibold text-dark">{season.team_count || 0}</p>
          </div>

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Target className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Invite Code</span>
            </div>
            <p className="text-lg font-semibold text-dark font-mono">{season.invite_code}</p>
          </div>

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Trophy className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              season.is_active
                ? 'bg-secondary-100 text-secondary-800'
                : season.is_archived
                ? 'bg-cream-400 text-dark-400'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {season.is_active ? 'Active' : season.is_archived ? 'Archived' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Standings Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4">Standings</h2>
        <div className="text-center py-8 text-dark-300">
          Coming soon - Team standings will appear here
        </div>
      </div>

      {/* Teams Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Teams</h2>
          <button className="btn btn-primary btn-sm">
            Add Team
          </button>
        </div>
        {teams && teams.length > 0 ? (
          <div className="space-y-2">
            {teams.map((participation) => (
              <div key={participation.id} className="flex items-center justify-between p-4 border border-cream-400 rounded-lg">
                <div>
                  <h3 className="font-semibold text-dark">{participation.team_detail?.name}</h3>
                  <p className="text-sm text-dark-300">{participation.team_detail?.establishment}</p>
                </div>
                <button className="btn btn-outline btn-sm">View Team</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-300">
            No teams yet. Add teams to get started.
          </div>
        )}
      </div>

      {/* Matches Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Matches</h2>
          <button className="btn btn-primary btn-sm">
            Schedule Match
          </button>
        </div>
        {matches && matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map((match) => (
              <div key={match.id} className="p-4 border border-cream-400 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-dark">Match #{match.id}</p>
                    <p className="text-sm text-dark-300">
                      {new Date(match.match_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn btn-outline btn-sm">View Details</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-300">
            No matches scheduled yet.
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-dark mb-4">Player Analytics</h2>
        <div className="text-center py-8 text-dark-300">
          Coming soon - Player statistics and analytics will appear here
        </div>
      </div>
    </div>
  );
};

export default SeasonDetailsPage;
