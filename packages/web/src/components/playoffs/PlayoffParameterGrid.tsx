import React from "react";
import {
  Users,
  Shield,
  Trophy,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { PlayoffConfiguration, TeamStanding } from "../../api";
import { ParameterBox } from "../scheduling";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type PlayoffParamModalType =
  | "team_count"
  | "teams"
  | "byes_for_top_seeds"
  | "consolation"
  | "consolation_count"
  | "consolation_byes"
  | "start_date"
  | "days_between_rounds"
  | "default_match_day";

interface PlayoffParameterGridProps {
  config: PlayoffConfiguration;
  standings: TeamStanding[];
  onOpenModal: (type: PlayoffParamModalType) => void;
}

const PlayoffParameterGrid: React.FC<PlayoffParameterGridProps> = ({
  config,
  standings,
  onOpenModal,
}) => {
  const selectedTeamCount = config.team_ids?.length ?? config.team_count;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <ParameterBox
        icon={<Users className="h-5 w-5" />}
        label="Team Count"
        value={`${config.team_count} teams`}
        onClick={() => onOpenModal("team_count")}
      />
      <ParameterBox
        icon={<Users className="h-5 w-5" />}
        label="Select Teams"
        value={
          standings.length === 0
            ? "Loading..."
            : `${selectedTeamCount} team${selectedTeamCount === 1 ? "" : "s"}`
        }
        onClick={() => onOpenModal("teams")}
        disabled={standings.length === 0}
      />
      <ParameterBox
        icon={<Shield className="h-5 w-5" />}
        label="First Round Byes"
        value={`Top ${config.byes_for_top_seeds}`}
        onClick={() => onOpenModal("byes_for_top_seeds")}
      />
      <ParameterBox
        icon={<Trophy className="h-5 w-5" />}
        label="Consolation"
        value={config.consolation ? "Yes" : "No"}
        onClick={() => onOpenModal("consolation")}
      />
      {config.consolation && (
        <>
          <ParameterBox
            icon={<Users className="h-5 w-5" />}
            label="Consolation Teams"
            value={`${config.consolation_count}`}
            onClick={() => onOpenModal("consolation_count")}
          />
          <ParameterBox
            icon={<Shield className="h-5 w-5" />}
            label="Consolation Byes"
            value={`Top ${config.consolation_byes}`}
            onClick={() => onOpenModal("consolation_byes")}
          />
        </>
      )}
      <ParameterBox
        icon={<CalendarDays className="h-5 w-5" />}
        label="Start Date"
        value={config.start_date || "Not set"}
        onClick={() => onOpenModal("start_date")}
      />
      <ParameterBox
        icon={<Clock className="h-5 w-5" />}
        label="Days Between"
        value={`${config.days_between_rounds} days`}
        onClick={() => onOpenModal("days_between_rounds")}
      />
      <ParameterBox
        icon={<CalendarDays className="h-5 w-5" />}
        label="Match Day"
        value={DAY_NAMES[config.default_match_day] ?? "Wednesday"}
        onClick={() => onOpenModal("default_match_day")}
      />
    </div>
  );
};

export default PlayoffParameterGrid;
