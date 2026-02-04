import React from "react";
import { Calendar, Users, Trophy, Target, Edit, Archive, Upload } from "lucide-react";

interface SeasonOverviewProps {
  season: {
    name: string;
    start_date: string;
    end_date?: string | null;
    team_count?: number;
    invite_code?: string;
    is_active: boolean;
    is_archived: boolean;
    league_detail?: {
      name: string;
    };
  };
  editable?: boolean;
  onEditSeason?: () => void;
  onArchive?: () => void;
  onImportCSV?: () => void;
}

const SeasonOverview: React.FC<SeasonOverviewProps> = ({
  season,
  editable = false,
  onEditSeason,
  onArchive,
  onImportCSV,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-dark">Overview</h2>
        {editable && (
          <div className="flex flex-wrap gap-2">
            {onImportCSV && (
              <button
                onClick={onImportCSV}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Upload className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
            )}
            {onEditSeason && (
              <button
                onClick={onEditSeason}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Edit className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Edit Season</span>
              </button>
            )}
            {onArchive && (
              <button
                onClick={onArchive}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Archive className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Archive</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center text-dark-300 mb-2">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Start Date</span>
          </div>
          <p className="text-lg font-semibold text-dark">
            {new Date(season.start_date + "T00:00:00").toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
          </p>
        </div>

        {season.end_date && (
          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">End Date</span>
            </div>
            <p className="text-lg font-semibold text-dark">
              {new Date(season.end_date + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center text-dark-300 mb-2">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Teams</span>
          </div>
          <p className="text-lg font-semibold text-dark">
            {season.team_count || 0}
          </p>
        </div>

        {season.invite_code && (
          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Target className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Invite Code</span>
            </div>
            <p className="text-lg font-semibold text-dark font-mono">
              {season.invite_code}
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center text-dark-300 mb-2">
            <Trophy className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <span
            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
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
      </div>
    </div>
  );
};

export default SeasonOverview;
