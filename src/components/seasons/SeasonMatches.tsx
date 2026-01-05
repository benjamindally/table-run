import React, { useState } from "react";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";

interface Match {
  id: number;
  home_team: number;
  away_team: number;
  home_team_detail?: {
    name: string;
  };
  away_team_detail?: {
    name: string;
  };
  date: string;
  week_number?: number | null;
  status: "scheduled" | "completed" | "cancelled";
  home_score?: number | null;
  away_score?: number | null;
}

interface SeasonMatchesProps {
  matches?: Match[];
  editable?: boolean;
  onScheduleMatch?: () => void;
  onImportSchedule?: () => void;
  onEditMatch?: (match: Match) => void;
  initialWeeksToShow?: number;
}

const SeasonMatches: React.FC<SeasonMatchesProps> = ({
  matches,
  editable = false,
  onScheduleMatch,
  onImportSchedule,
  onEditMatch,
  initialWeeksToShow = 3,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Matches</h2>
          <div className="flex items-center space-x-2">
            {editable && onImportSchedule && (
              <button
                onClick={onImportSchedule}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import Schedule
              </button>
            )}
            {editable && onScheduleMatch && (
              <button onClick={onScheduleMatch} className="btn btn-primary btn-sm">
                Schedule Match
              </button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="text-center py-8 text-dark-300">
            No matches scheduled yet.
          </div>
        )}
      </div>
    );
  }

  // Group matches by week_number
  const matchesByWeek = matches.reduce((acc, match) => {
    const week = match.week_number || 0;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  // Sort weeks
  const sortedWeeks = Object.keys(matchesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Determine which weeks to show
  const weeksToShow = expanded
    ? sortedWeeks
    : sortedWeeks.slice(0, initialWeeksToShow);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">Matches</h2>
        <div className="flex items-center space-x-2">
          {editable && onImportSchedule && (
            <button
              onClick={onImportSchedule}
              className="btn btn-outline btn-sm flex items-center"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import Schedule
            </button>
          )}
          {editable && onScheduleMatch && (
            <button onClick={onScheduleMatch} className="btn btn-primary btn-sm">
              Schedule Match
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-dark-300 hover:text-dark transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="space-y-6">
            {weeksToShow.map((weekNum) => (
              <div
                key={weekNum}
                className="border border-cream-400 rounded-lg p-4 bg-cream-50"
              >
                <h3 className="font-semibold text-lg text-dark mb-3">
                  {weekNum === 0 ? "Unscheduled" : `Week ${weekNum}`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchesByWeek[weekNum].map((match) => (
                    <div
                      key={match.id}
                      className={`p-3 bg-white border border-cream-300 rounded-lg transition-shadow ${
                        editable && onEditMatch
                          ? "hover:shadow-md cursor-pointer"
                          : ""
                      }`}
                      onClick={
                        editable && onEditMatch
                          ? () => onEditMatch(match)
                          : undefined
                      }
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-dark truncate">
                              {match.home_team_detail?.name ||
                                `Team ${match.home_team}`}
                            </p>
                            <p className="font-medium text-sm text-dark truncate">
                              {match.away_team_detail?.name ||
                                `Team ${match.away_team}`}
                            </p>
                          </div>
                          {match.status === "completed" &&
                          match.home_score !== null &&
                          match.away_score !== null ? (
                            <div className="text-right">
                              <p className="text-lg font-bold text-dark">
                                {match.home_score}
                              </p>
                              <p className="text-lg font-bold text-dark">
                                {match.away_score}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-dark-300">vs</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-dark-300">
                          <span>
                            {new Date(
                              match.date + "T00:00:00"
                            ).toLocaleDateString()}
                          </span>
                          {match.status === "completed" && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                              ✓
                            </span>
                          )}
                          {match.status === "scheduled" && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!expanded && sortedWeeks.length > initialWeeksToShow && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Show All Weeks ({sortedWeeks.length - initialWeeksToShow} more)
              </button>
            </div>
          )}
          {expanded && sortedWeeks.length > initialWeeksToShow && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Show Less
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonMatches;
