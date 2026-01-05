import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, Flame, Award } from "lucide-react";

interface Player {
  player_id: number;
  player_name: string;
  team_name: string;
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_percentage: number;
  table_runs: number;
  eight_ball_breaks: number;
}

interface SeasonPlayerAnalyticsProps {
  playersData?: {
    players: Player[];
    player_count: number;
  };
  onViewPlayer?: (playerId: number) => void;
  initialLimit?: number;
}

const SeasonPlayerAnalytics: React.FC<SeasonPlayerAnalyticsProps> = ({
  playersData,
  onViewPlayer,
  initialLimit = 5,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">Player Analytics</h2>
        <div className="flex items-center space-x-3">
          {playersData && (
            <span className="text-sm text-dark-300">
              {playersData.player_count}{" "}
              {playersData.player_count === 1 ? "Player" : "Players"}
            </span>
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
          {playersData && playersData.players && playersData.players.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Player
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
                        Games
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Win %
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center justify-center">
                          <Trophy className="h-3 w-3 mr-1" />
                          Runs
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center justify-center">
                          <Flame className="h-3 w-3 mr-1" />
                          8-Breaks
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(expanded
                      ? playersData.players
                      : playersData.players.slice(0, initialLimit)
                    ).map((player, idx) => (
                      <tr
                        key={player.player_id}
                        className={idx < 3 ? "bg-orange-50" : ""}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {idx === 0 && (
                              <Award className="h-4 w-4 text-yellow-500 mr-1" />
                            )}
                            {idx === 1 && (
                              <Award className="h-4 w-4 text-gray-400 mr-1" />
                            )}
                            {idx === 2 && (
                              <Award className="h-4 w-4 text-orange-400 mr-1" />
                            )}
                            <span className="text-sm font-medium">{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {onViewPlayer ? (
                            <button
                              onClick={() => onViewPlayer(player.player_id)}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {player.player_name}
                            </button>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {player.player_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {player.team_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                          {player.total_wins}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                          {player.total_losses}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.total_games}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.win_percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.table_runs > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {player.table_runs}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.eight_ball_breaks > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {player.eight_ball_breaks}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!expanded && playersData.players.length > initialLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View More ({playersData.players.length - initialLimit} more)
                  </button>
                </div>
              )}
              {expanded && playersData.players.length > initialLimit && (
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
              No player data yet. Import CSV files to populate.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonPlayerAnalytics;
