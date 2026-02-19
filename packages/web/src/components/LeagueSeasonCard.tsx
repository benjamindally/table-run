import React from 'react';
import { Building2, Calendar, Pencil, AlertCircle } from 'lucide-react';
import type { MeLeague, MeSeason } from '../api';

interface LeagueSeasonCardProps {
  currentLeague: MeLeague | null;
  currentSeason: MeSeason | null;
  onEditClick: () => void;
  isLoading?: boolean;
}

const LeagueSeasonCard: React.FC<LeagueSeasonCardProps> = ({
  currentLeague,
  currentSeason,
  onEditClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 p-2 rounded-lg w-9 h-9"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const hasSelection = currentLeague && currentSeason;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            {hasSelection ? (
              <>
                <h3 className="font-semibold text-dark truncate">
                  {currentLeague.name}
                </h3>
                <div className="flex items-center text-sm text-dark-300">
                  <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span className="truncate">{currentSeason.name}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center text-dark-300">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>No league/season selected</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onEditClick}
          className="btn btn-outline btn-sm flex items-center gap-1 flex-shrink-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Change</span>
        </button>
      </div>
    </div>
  );
};

export default LeagueSeasonCard;
