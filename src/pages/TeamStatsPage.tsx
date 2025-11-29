import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Trophy, Flame, Target, ChevronDown, ChevronRight } from "lucide-react";
import { teamsApi, seasonsApi, TeamSeasonStats, Season } from "../api";
import { toast } from "react-toastify";

export default function TeamStatsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [stats, setStats] = useState<TeamSeasonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);

  // Load seasons on mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const response = await seasonsApi.getAll();
        const activeSeasons = response.results.filter(
          (s) => s.is_active && !s.is_archived
        );
        setSeasons(activeSeasons);

        // Check for season in URL params, otherwise use first active season
        const seasonParam = searchParams.get("season");
        if (seasonParam) {
          setSelectedSeasonId(Number(seasonParam));
        } else if (activeSeasons.length > 0) {
          setSelectedSeasonId(activeSeasons[0].id);
          setSearchParams({ season: activeSeasons[0].id.toString() });
        }
      } catch (error) {
        console.error("Failed to load seasons:", error);
        toast.error("Failed to load seasons");
      }
    };

    loadSeasons();
  }, [searchParams, setSearchParams]);

  // Load team stats when season changes
  useEffect(() => {
    if (!teamId || !selectedSeasonId) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await teamsApi.getSeasonStats(
          Number(teamId),
          selectedSeasonId
        );
        setStats(data);
      } catch (error) {
        console.error("Failed to load team stats:", error);
        toast.error("Failed to load team statistics");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [teamId, selectedSeasonId]);

  const handleSeasonChange = (newSeasonId: number) => {
    setSelectedSeasonId(newSeasonId);
    setSearchParams({ season: newSeasonId.toString() });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    );
  }

  // Calculate max weeks to display
  const maxWeek = Math.max(
    ...stats.players.flatMap((p) => p.weeks.map((w) => w.week)),
    0
  );
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => {
            // Get league ID from the selected season
            const currentSeason = seasons.find((s) => s.id === selectedSeasonId);
            if (currentSeason?.league) {
              navigate(`/leagues/${currentSeason.league}/standings`);
            } else {
              navigate("/standings");
            }
          }}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Standings
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {stats.team_name}
            </h1>
            <p className="text-gray-600 mt-1">{stats.season_name}</p>
          </div>

          {/* Season Selector */}
          {seasons.length > 1 && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="season-select"
                className="text-sm font-medium text-gray-700"
              >
                Season:
              </label>
              <select
                id="season-select"
                value={selectedSeasonId || ""}
                onChange={(e) => handleSeasonChange(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Player Statistics */}
      {stats.players.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">
            No player data available for this season.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-4">
            {stats.players.map((player) => {
              const weekStatsMap = new Map(
                player.weeks.map((w) => [w.week, w])
              );

              return (
                <div
                  key={player.player_id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {player.player_name}
                  </h3>

                  {/* Season Totals */}
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 uppercase mb-2">
                      Season Totals
                    </div>
                    <div className="flex items-center justify-around">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Wins</div>
                        <div className="text-2xl font-bold text-green-600">
                          {player.total_wins}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Losses</div>
                        <div className="text-2xl font-bold text-red-600">
                          {player.total_losses}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  {(player.table_runs > 0 || player.eight_ball_breaks > 0) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 uppercase mb-2">
                        Achievements
                      </div>
                      <div className="flex items-center justify-around">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          <span className="text-lg font-semibold">
                            {player.table_runs}
                          </span>
                          <span className="text-sm text-gray-600">
                            Table Runs
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          <span className="text-lg font-semibold">
                            {player.eight_ball_breaks}
                          </span>
                          <span className="text-sm text-gray-600">8-Ball</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weekly Breakdown */}
                  {weeks.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 uppercase mb-2">
                        Weekly Performance
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {weeks.map((week) => {
                          const weekStats = weekStatsMap.get(week);
                          const hasData =
                            weekStats &&
                            (weekStats.wins > 0 || weekStats.losses > 0);

                          return (
                            <div
                              key={week}
                              className={`p-2 rounded text-center ${
                                hasData ? "bg-gray-100" : "bg-gray-50"
                              }`}
                            >
                              <div className="text-xs text-gray-500 mb-1">
                                W{week}
                              </div>
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <span
                                  className={
                                    hasData
                                      ? "font-semibold text-green-600"
                                      : "text-gray-300"
                                  }
                                >
                                  {weekStats?.wins || "-"}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span
                                  className={
                                    hasData
                                      ? "font-semibold text-red-600"
                                      : "text-gray-300"
                                  }
                                >
                                  {weekStats?.losses || "-"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: Expandable Summary Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achievements
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* Expand icon column */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.players.map((player, idx) => {
                  const isExpanded = expandedPlayerId === player.player_id;
                  const weekStatsMap = new Map(
                    player.weeks.map((w) => [w.week, w])
                  );
                  const totalGames = player.total_wins + player.total_losses;
                  const winPercentage = totalGames > 0
                    ? ((player.total_wins / totalGames) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <>
                      {/* Summary Row */}
                      <tr
                        key={player.player_id}
                        onClick={() =>
                          setExpandedPlayerId(
                            isExpanded ? null : player.player_id
                          )
                        }
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {player.player_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span className="font-bold text-green-600">
                            {player.total_wins}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span className="font-bold text-red-600">
                            {player.total_losses}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {winPercentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-3">
                            {player.table_runs > 0 && (
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span className="font-semibold">
                                  {player.table_runs}
                                </span>
                              </div>
                            )}
                            {player.eight_ball_breaks > 0 && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="font-semibold">
                                  {player.eight_ball_breaks}
                                </span>
                              </div>
                            )}
                            {player.table_runs === 0 &&
                              player.eight_ball_breaks === 0 && (
                                <span className="text-gray-300">-</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 mx-auto" />
                          ) : (
                            <ChevronRight className="h-5 w-5 mx-auto" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Weekly Breakdown */}
                      {isExpanded && weeks.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="text-xs font-medium text-gray-600 uppercase mb-3">
                              Weekly Performance
                            </div>
                            <div className="grid grid-cols-6 gap-3">
                              {weeks.map((week) => {
                                const weekStats = weekStatsMap.get(week);
                                const hasData =
                                  weekStats &&
                                  (weekStats.wins > 0 || weekStats.losses > 0);

                                return (
                                  <div
                                    key={week}
                                    className={`p-3 rounded-lg text-center ${
                                      hasData ? "bg-white shadow-sm" : "bg-gray-100"
                                    }`}
                                  >
                                    <div className="text-xs text-gray-500 mb-2">
                                      Week {week}
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="text-center">
                                        <div className="text-xs text-gray-500">W</div>
                                        <div
                                          className={`text-lg font-semibold ${
                                            hasData
                                              ? "text-green-600"
                                              : "text-gray-300"
                                          }`}
                                        >
                                          {weekStats?.wins || "-"}
                                        </div>
                                      </div>
                                      <div className="text-gray-400">/</div>
                                      <div className="text-center">
                                        <div className="text-xs text-gray-500">L</div>
                                        <div
                                          className={`text-lg font-semibold ${
                                            hasData
                                              ? "text-red-600"
                                              : "text-gray-300"
                                          }`}
                                        >
                                          {weekStats?.losses || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>Table Runs</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          <span>8-Ball breaks</span>
        </div>
      </div>
    </div>
  );
}
