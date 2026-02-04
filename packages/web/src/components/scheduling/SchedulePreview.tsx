import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, TreePine } from "lucide-react";
import type { ScheduleWeek, ScheduleMatch } from "../../api";

interface SchedulePreviewProps {
  schedule: ScheduleWeek[];
  onEditMatch: (weekIndex: number, matchIndex: number) => void;
  onAddMatch?: () => void;
  initialWeeksToShow?: number;
  isManualMode?: boolean;
}

const SchedulePreview: React.FC<SchedulePreviewProps> = ({
  schedule,
  onEditMatch,
  onAddMatch,
  initialWeeksToShow = 4,
  isManualMode = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!schedule || schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Schedule Preview</h2>
          {isManualMode && onAddMatch && (
            <button
              onClick={onAddMatch}
              className="btn btn-primary btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Match
            </button>
          )}
        </div>
        <div className="text-center py-8 text-dark-300">
          {isManualMode
            ? "No matches added yet. Click 'Add Match' to start building your schedule."
            : "Generate a schedule to see the preview here."}
        </div>
      </div>
    );
  }

  const weeksToShow = expanded ? schedule : schedule.slice(0, initialWeeksToShow);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">
          Schedule Preview
          <span className="text-sm font-normal text-dark-400 ml-2">
            ({schedule.length} weeks, {schedule.reduce((sum, week) => sum + week.matches.length, 0)} matches)
          </span>
        </h2>
        <div className="flex items-center space-x-2">
          {isManualMode && onAddMatch && (
            <button
              onClick={onAddMatch}
              className="btn btn-outline btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Match
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
            {weeksToShow.map((week, weekIndex) => (
              <div
                key={week.week_number}
                className={`border rounded-lg p-4 ${
                  week.is_break_week
                    ? "border-red-200 bg-red-50"
                    : "border-cream-400 bg-cream-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-dark">
                    Week {week.week_number}
                    {week.is_break_week && (
                      <span className="ml-2 text-sm font-normal text-red-600 flex items-center inline-flex">
                        <TreePine className="h-4 w-4 mr-1" />
                        Break Week
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-dark-400">
                    {new Date(week.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {week.is_break_week ? (
                  <p className="text-sm text-red-600 text-center py-4">
                    No matches scheduled - Holiday/Break
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {week.matches.map((match, matchIndex) => (
                      <MatchCard
                        key={match.temp_id || match.id || matchIndex}
                        match={match}
                        onClick={() => onEditMatch(weekIndex, matchIndex)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!expanded && schedule.length > initialWeeksToShow && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Show All Weeks ({schedule.length - initialWeeksToShow} more)
              </button>
            </div>
          )}
          {expanded && schedule.length > initialWeeksToShow && (
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

interface MatchCardProps {
  match: ScheduleMatch;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  // Bye match card
  if (match.is_bye) {
    return (
      <div
        onClick={onClick}
        className="p-3 rounded-lg bg-yellow-50 border-2 border-yellow-200 hover:shadow-md cursor-pointer transition-shadow"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-dark">
              {match.bye_team_name || `Team ${match.bye_team_id}`}
            </p>
            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
              BYE
            </span>
          </div>
          <p className="text-xs text-dark-400">No opponent this week</p>
        </div>
      </div>
    );
  }

  // Regular match card
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg bg-white border border-cream-300 hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-dark truncate">
              {match.home_team_name || (match.home_team_id ? `Team ${match.home_team_id}` : "TBD")}
            </p>
            <p className="font-medium text-sm text-dark truncate">
              {match.away_team_name || (match.away_team_id ? `Team ${match.away_team_id}` : "TBD")}
            </p>
          </div>
          <span className="text-xs text-dark-300">vs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-dark-400">
          <span className="truncate">
            {match.venue_name || "Venue TBD"}
          </span>
          <span>
            {new Date(match.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SchedulePreview;
