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

  const displayedPlayers = expanded
    ? playersData?.players
    : playersData?.players?.slice(0, initialLimit);

  // Helper to render rank badge with trophy icons for top 3
  const getRankDisplay = (idx: number) => {
    if (idx === 0)
      return <Award className="h-5 w-5 text-yellow-500" />;
    if (idx === 1)
      return <Award className="h-5 w-5 text-gray-400" />;
    if (idx === 2)
      return <Award className="h-5 w-5 text-orange-400" />;
    return <span className="text-sm font-bold text-dark-400">{idx + 1}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-dark">Player Analytics</h2>
        <div className="flex items-center gap-2 sm:gap-3">
          {playersData && (
            <span className="text-xs sm:text-sm text-dark-300">
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
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {displayedPlayers?.map((player, idx) => (
                  <div
                    key={player.player_id}
                    className={`p-3 rounded-lg border ${
                      idx < 3
                        ? "bg-orange-50 border-orange-200"
                        : "bg-white border-cream-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left: Rank + Player Info */}
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0">
                          {getRankDisplay(idx)}
                        </div>
                        <div className="min-w-0 flex-1">
                          {onViewPlayer ? (
                            <button
                              onClick={() => onViewPlayer(player.player_id)}
                              className="font-medium text-sm text-primary-600 hover:text-primary-700 hover:underline truncate block text-left"
                            >
                              {player.player_name}
                            </button>
                          ) : (
                            <p className="font-medium text-sm text-dark truncate">
                              {player.player_name}
                            </p>
                          )}
                          <p className="text-xs text-dark-300 truncate">
                            {player.team_name}
                          </p>
                        </div>
                      </div>

                      {/* Right: W-L Record */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <span className="text-green-600">{player.total_wins}</span>
                          <span className="text-dark-300">-</span>
                          <span className="text-red-600">{player.total_losses}</span>
                        </div>
                        <p className="text-xs text-dark-300">
                          {player.win_percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Special stats if any */}
                    {(player.table_runs > 0 || player.eight_ball_breaks > 0) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cream-200">
                        {player.table_runs > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Trophy className="h-3 w-3" />
                            {player.table_runs} run{player.table_runs !== 1 ? "s" : ""}
                          </span>
                        )}
                        {player.eight_ball_breaks > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Flame className="h-3 w-3" />
                            {player.eight_ball_breaks} 8-break{player.eight_ball_breaks !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
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
                    {displayedPlayers?.map((player, idx) => (
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

              {/* View More / Show Less */}
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
