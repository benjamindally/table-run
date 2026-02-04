import React from "react";
import { AlertTriangle, X } from "lucide-react";
import type { ScheduleWarning } from "../../api/types";

interface ScheduleWarningsProps {
  warnings: ScheduleWarning[];
  onDismiss?: () => void;
}

const ScheduleWarnings: React.FC<ScheduleWarningsProps> = ({
  warnings,
  onDismiss,
}) => {
  if (!warnings || warnings.length === 0) return null;

  const getWarningColor = (type: ScheduleWarning["type"]) => {
    switch (type) {
      case "venue_conflict":
        return "text-orange-700";
      case "season_overflow":
        return "text-red-700";
      case "team_conflict":
        return "text-red-700";
      case "missing_venue":
        return "text-yellow-700";
      case "date_conflict":
        return "text-orange-700";
      default:
        return "text-yellow-700";
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">
              {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
            </h4>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li
                  key={index}
                  className={`text-sm ${getWarningColor(warning.type)}`}
                >
                  {warning.week_number && (
                    <span className="font-medium">Week {warning.week_number}: </span>
                  )}
                  {warning.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduleWarnings;
