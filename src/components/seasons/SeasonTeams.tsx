import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TeamParticipation {
  id: number;
  team: number;
  team_detail?: {
    name: string;
    establishment?: string;
  };
}

interface SeasonTeamsProps {
  teams?: TeamParticipation[];
  editable?: boolean;
  onAddTeam?: () => void;
  onViewTeam?: (teamId: number) => void;
  initialLimit?: number;
}

const SeasonTeams: React.FC<SeasonTeamsProps> = ({
  teams,
  editable = false,
  onAddTeam,
  onViewTeam,
  initialLimit = 5,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">Teams</h2>
        <div className="flex items-center space-x-2">
          {editable && onAddTeam && (
            <button onClick={onAddTeam} className="btn btn-primary btn-sm">
              Add Team
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
          {teams && teams.length > 0 ? (
            <>
              <div className="space-y-2">
                {(expanded ? teams : teams.slice(0, initialLimit)).map(
                  (participation) => (
                    <div
                      key={participation.id}
                      className="flex items-center justify-between p-4 border border-cream-400 rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-dark">
                          {participation.team_detail?.name}
                        </h3>
                        <p className="text-sm text-dark-300">
                          {participation.team_detail?.establishment}
                        </p>
                      </div>
                      {onViewTeam && (
                        <button
                          onClick={() => onViewTeam(participation.team)}
                          className="btn btn-outline btn-sm"
                        >
                          View Team
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
              {!expanded && teams.length > initialLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View More ({teams.length - initialLimit} more)
                  </button>
                </div>
              )}
              {expanded && teams.length > initialLimit && (
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
          ) : (
            <div className="text-center py-8 text-dark-300">
              No teams yet. Add teams to get started.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonTeams;
