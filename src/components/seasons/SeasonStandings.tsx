import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";

interface Standing {
  team_id: number;
  team_name: string;
  establishment?: string;
  place: number;
  wins: number;
  losses: number;
  win_percentage?: number;
  games_behind?: number | string;
}

interface SeasonStandingsProps {
  standings?: {
    standings: Standing[];
  };
  initialLimit?: number;
  onViewTeam?: (teamId: number) => void;
}

const SeasonStandings: React.FC<SeasonStandingsProps> = ({
  standings,
  initialLimit = 5,
  onViewTeam,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">Standings</h2>
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
      {!collapsed && (
        <>
          {standings && standings.standings && standings.standings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        W
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        L
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Win %
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        GB
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(expanded
                      ? standings.standings
                      : standings.standings.slice(0, initialLimit)
                    ).map((standing, idx) => (
                      <tr
                        key={standing.team_id}
                        className={`${idx < 3 ? "bg-orange-50" : ""} ${
                          onViewTeam ? "hover:bg-gray-50 cursor-pointer" : ""
                        }`}
                        onClick={
                          onViewTeam
                            ? () => onViewTeam(standing.team_id)
                            : undefined
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {idx === 0 && (
                              <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                            )}
                            {idx === 1 && (
                              <Trophy className="h-4 w-4 text-gray-400 mr-1" />
                            )}
                            {idx === 2 && (
                              <Trophy className="h-4 w-4 text-orange-400 mr-1" />
                            )}
                            <span className="text-sm font-medium">
                              {standing.place}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                onViewTeam
                                  ? "text-primary-600 hover:text-primary-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {standing.team_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {standing.establishment}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                          {standing.wins}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                          {standing.losses}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {standing.win_percentage?.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {standing.games_behind || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!expanded && standings.standings.length > initialLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View More ({standings.standings.length - initialLimit} more)
                  </button>
                </div>
              )}
              {expanded && standings.standings.length > initialLimit && (
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
              No standings data yet. Import CSV files to populate.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonStandings;
