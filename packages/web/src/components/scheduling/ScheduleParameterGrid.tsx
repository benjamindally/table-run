import React from "react";
import {
  Calendar,
  Users,
  Building2,
  LayoutGrid,
  Hash,
  Repeat,
  Home,
  TreePine,
} from "lucide-react";
import type { ScheduleConfiguration, Venue, SeasonParticipation } from "../../api";

export type ParamModalType =
  | "start_date"
  | "teams"
  | "establishments"
  | "tables_per_establishment"
  | "matches_per_week"
  | "times_play_each_other"
  | "alternating_home_away"
  | "break_weeks";

interface ParameterBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
}

const ParameterBox: React.FC<ParameterBoxProps> = ({
  icon,
  label,
  value,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
        ${
          disabled
            ? "bg-cream-100 border-cream-300 cursor-default opacity-75"
            : "bg-white border-cream-300 hover:border-primary-400 hover:shadow-md cursor-pointer"
        }
      `}
    >
      <div className={`mb-2 ${disabled ? "text-dark-300" : "text-primary-600"}`}>
        {icon}
      </div>
      <span className="text-xs text-dark-400 font-medium mb-1">{label}</span>
      <span className={`text-sm font-semibold ${disabled ? "text-dark-400" : "text-dark"}`}>
        {value}
      </span>
      {disabled && (
        <span className="text-[10px] text-dark-300 mt-1">(read-only)</span>
      )}
    </button>
  );
};

interface ScheduleParameterGridProps {
  config: ScheduleConfiguration;
  teams: SeasonParticipation[];
  venues: Venue[];
  onOpenModal: (type: ParamModalType) => void;
}

const ScheduleParameterGrid: React.FC<ScheduleParameterGridProps> = ({
  config,
  teams,
  venues,
  onOpenModal,
}) => {
  // Format display values
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select date...";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTotalTables = () => {
    if (venues.length === 0) return "No venues";
    const totalTables = venues.reduce((sum, v) => sum + (v.table_count || 1), 0);
    return `${totalTables} tables`;
  };

  const formatBreakWeeks = () => {
    if (!config.break_weeks || config.break_weeks.length === 0) {
      return "None set";
    }
    if (config.break_weeks.length === 1) {
      return `Week ${config.break_weeks[0]}`;
    }
    return `${config.break_weeks.length} weeks`;
  };

  const formatTimesPlayEachOther = () => {
    const times = config.times_play_each_other || 1;
    if (times === 1) return "1 time";
    return `${times} times`;
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Row 1 */}
      <ParameterBox
        icon={<Calendar className="h-6 w-6" />}
        label="Start Date"
        value={formatDate(config.start_date)}
        onClick={() => onOpenModal("start_date")}
      />
      <ParameterBox
        icon={<Users className="h-6 w-6" />}
        label="Teams"
        value={teams.length === 0 ? "None yet" : `${teams.length} teams`}
        onClick={() => onOpenModal("teams")}
      />
      <ParameterBox
        icon={<Building2 className="h-6 w-6" />}
        label="Venues"
        value={venues.length === 0 ? "None yet" : `${venues.length} venues`}
        onClick={() => onOpenModal("establishments")}
      />

      {/* Row 2 */}
      <ParameterBox
        icon={<LayoutGrid className="h-6 w-6" />}
        label="Adjust Tables"
        value={formatTotalTables()}
        onClick={() => onOpenModal("tables_per_establishment")}
      />
      <ParameterBox
        icon={<Hash className="h-6 w-6" />}
        label="Matches/Week"
        value={`${config.matches_per_week} matches`}
        onClick={() => onOpenModal("matches_per_week")}
      />
      <ParameterBox
        icon={<Repeat className="h-6 w-6" />}
        label="Play Each Other"
        value={formatTimesPlayEachOther()}
        onClick={() => onOpenModal("times_play_each_other")}
      />

      {/* Row 3 */}
      <ParameterBox
        icon={<Home className="h-6 w-6" />}
        label="Home/Away"
        value={config.alternating_home_away ? "Alternating" : "Fixed"}
        onClick={() => onOpenModal("alternating_home_away")}
      />
      <ParameterBox
        icon={<TreePine className="h-6 w-6" />}
        label="Break Weeks"
        value={formatBreakWeeks()}
        onClick={() => onOpenModal("break_weeks")}
      />
    </div>
  );
};

export default ScheduleParameterGrid;
