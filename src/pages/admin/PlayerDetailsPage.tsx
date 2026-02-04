import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trophy,
  Flame,
  Calendar,
  Users,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import {
  usePlayer,
  usePlayerSeasonStats,
  usePlayerTeams,
  useUpdatePlayerSeasonStats,
  useUpdatePlayerWeekStats,
  useUpdatePlayer,
} from "../../hooks/usePlayers";
import { toast } from "react-toastify";
import {
  PlayerSeasonStatDetail,
  PlayerWeekStatDetail,
} from "../../api/players";

const PlayerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerId = parseInt(id || "0");

  const { data: player, isLoading, error } = usePlayer(playerId);
  const { data: seasonStats } = usePlayerSeasonStats(playerId);
  const { data: teams } = usePlayerTeams(playerId);

  const updateSeasonStatsMutation = useUpdatePlayerSeasonStats();
  const updateWeekStatsMutation = useUpdatePlayerWeekStats();
  const updatePlayerMutation = useUpdatePlayer();

  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(
    new Set()
  );
  const [editingSeasonStat, setEditingSeasonStat] =
    useState<PlayerSeasonStatDetail | null>(null);
  const [editingWeekStat, setEditingWeekStat] = useState<{
    season: PlayerSeasonStatDetail;
    week: PlayerWeekStatDetail;
  } | null>(null);
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);

  // Form state for editing season stats
  const [editTableRuns, setEditTableRuns] = useState<number>(0);
  const [editEightBallBreaks, setEditEightBallBreaks] = useState<number>(0);
  const [editSeasonWins, setEditSeasonWins] = useState<number>(0);
  const [editSeasonLosses, setEditSeasonLosses] = useState<number>(0);

  // Form state for editing week stats
  const [editWeekWins, setEditWeekWins] = useState<number>(0);
  const [editWeekLosses, setEditWeekLosses] = useState<number>(0);

  // Form state for editing player
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSkillLevel, setEditSkillLevel] = useState<number | null>(null);

  const toggleSeasonExpansion = (seasonId: number) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
    }
    setExpandedSeasons(newExpanded);
  };

  const handleEditSeasonStats = (season: PlayerSeasonStatDetail) => {
    setEditingSeasonStat(season);
    setEditTableRuns(season.table_runs);
    setEditEightBallBreaks(season.eight_ball_breaks);
    setEditSeasonWins(season.total_wins);
    setEditSeasonLosses(season.total_losses);
  };

  const handleSaveSeasonStats = async () => {
    if (!editingSeasonStat) return;

    try {
      await updateSeasonStatsMutation.mutateAsync({
        playerId,
        statsId: editingSeasonStat.id,
        data: {
          total_wins: editSeasonWins,
          total_losses: editSeasonLosses,
          table_runs: editTableRuns,
          eight_ball_breaks: editEightBallBreaks,
        },
      });
      toast.success("Season stats updated successfully!");
      setEditingSeasonStat(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update season stats");
    }
  };

  const handleEditWeekStats = (
    season: PlayerSeasonStatDetail,
    week: PlayerWeekStatDetail
  ) => {
    setEditingWeekStat({ season, week });
    setEditWeekWins(week.wins);
    setEditWeekLosses(week.losses);
  };

  const handleSaveWeekStats = async () => {
    if (!editingWeekStat) return;

    try {
      await updateWeekStatsMutation.mutateAsync({
        playerId,
        statsId: editingWeekStat.season.id,
        weekNumber: editingWeekStat.week.week,
        data: {
          wins: editWeekWins,
          losses: editWeekLosses,
        },
      });
      toast.success("Week stats updated successfully!");
      setEditingWeekStat(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update week stats");
    }
  };

  const handleEditPlayer = () => {
    if (player) {
      setEditFirstName(player.user.first_name);
      setEditLastName(player.user.last_name);
      setEditEmail(player.user.email);
      setEditPhone(player.phone);
      setEditSkillLevel(player.skill_level);
      setIsEditingPlayer(true);
    }
  };

  const handleSavePlayer = async () => {
    try {
      await updatePlayerMutation.mutateAsync({
        playerId,
        data: {
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          phone: editPhone,
          skill_level: editSkillLevel,
        },
      });
      toast.success("Player updated successfully!");
      setIsEditingPlayer(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update player");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading player details...</div>
        </div>
      </div>
    );
  }

  console.log("Player: ", player);
  if (error || !player) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load player details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline btn-sm flex items-center flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-dark truncate">{player.full_name}</h1>
            <p className="text-xs sm:text-sm text-dark-300 mt-1 truncate">
              {player.user ? player.user.email : ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleEditPlayer}
          className="btn btn-primary btn-sm flex items-center flex-shrink-0"
        >
          <Edit className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Edit Player</span>
        </button>
      </div>

      {/* Career Overview */}
      {seasonStats && seasonStats.career_totals && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-dark flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Career Statistics
            </h2>
            <span className="text-xs sm:text-sm text-dark-300 flex-shrink-0">
              {seasonStats.career_totals.seasons_played}{" "}
              {seasonStats.career_totals.seasons_played === 1
                ? "Season"
                : "Seasons"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {seasonStats.career_totals.total_wins}
              </div>
              <div className="text-xs text-dark-300 mt-1">Wins</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {seasonStats.career_totals.total_losses}
              </div>
              <div className="text-xs text-dark-300 mt-1">Losses</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-dark">
                {seasonStats.career_totals.total_games}
              </div>
              <div className="text-xs text-dark-300 mt-1">Games</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">
                {seasonStats.career_totals.win_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-dark-300 mt-1">Win %</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600 flex items-center justify-center">
                <Trophy className="h-5 w-5 mr-1" />
                {seasonStats.career_totals.table_runs}
              </div>
              <div className="text-xs text-dark-300 mt-1">Table Runs</div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 flex items-center justify-center">
                <Flame className="h-5 w-5 mr-1" />
                {seasonStats.career_totals.eight_ball_breaks}
              </div>
              <div className="text-xs text-dark-300 mt-1">8-Breaks</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Teams */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-dark mb-4 flex items-center">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Teams
        </h2>
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/admin/teams/${team.id}`)}
                className="p-5 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark">{team.name}</h3>
                    <p className="text-sm text-dark-300 mt-1">
                      {team.establishment}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      team.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {team.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {team.captains_detail && team.captains_detail.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-dark-300 mb-2">
                      Team Captain{team.captains_detail.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {team.captains_detail.map((captain) => (
                        <span
                          key={captain.id}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-800 text-xs font-medium"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {captain.player_detail?.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {team.player_count !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-dark-300">
                      {team.player_count}{" "}
                      {team.player_count === 1 ? "member" : "members"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-300">
            Not currently on any teams.
          </div>
        )}
      </div>

      {/* Season-by-Season Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-dark mb-4 flex items-center">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Season History
        </h2>
        {seasonStats &&
        seasonStats.seasons &&
        seasonStats.seasons.length > 0 ? (
          <div className="space-y-4">
            {seasonStats.seasons.map((season) => (
              <div
                key={season.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Season Header - Clickable to expand */}
                <div
                  className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSeasonExpansion(season.season_id)}
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-dark truncate">
                          {season.season_name}
                        </h3>
                        <p className="text-xs text-dark-300 mt-0.5">
                          {season.league_name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/teams/${season.team_id}`);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-0.5"
                        >
                          {season.team_name}
                        </button>
                      </div>
                      <button className="btn btn-outline btn-xs ml-2 flex-shrink-0">
                        {expandedSeasons.has(season.season_id) ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-green-600">
                          {season.total_wins}W
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          {season.total_losses}L
                        </span>
                        <span className="text-sm font-semibold text-dark">
                          {season.win_percentage.toFixed(1)}%
                        </span>
                        {season.table_runs > 0 && (
                          <span className="flex items-center space-x-0.5">
                            <Trophy className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-semibold">
                              {season.table_runs}
                            </span>
                          </span>
                        )}
                        {season.eight_ball_breaks > 0 && (
                          <span className="flex items-center space-x-0.5">
                            <Flame className="h-3 w-3 text-orange-600" />
                            <span className="text-xs font-semibold">
                              {season.eight_ball_breaks}
                            </span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSeasonStats(season);
                        }}
                        className="btn btn-outline btn-xs flex items-center"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-dark">
                          {season.season_name}
                        </h3>
                        <span className="text-sm text-dark-300">
                          {season.league_name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/teams/${season.team_id}`);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {season.team_name}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 lg:space-x-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-green-600">
                          {season.total_wins}W
                        </div>
                        <div className="text-xs text-dark-300">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-red-600">
                          {season.total_losses}L
                        </div>
                        <div className="text-xs text-dark-300">Losses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-dark">
                          {season.win_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-dark-300">Win %</div>
                      </div>
                      {season.table_runs > 0 && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-semibold">
                            {season.table_runs}
                          </span>
                        </div>
                      )}
                      {season.eight_ball_breaks > 0 && (
                        <div className="flex items-center space-x-1">
                          <Flame className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold">
                            {season.eight_ball_breaks}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSeasonStats(season);
                        }}
                        className="btn btn-outline btn-sm flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Stats
                      </button>
                      <button className="btn btn-outline btn-sm">
                        {expandedSeasons.has(season.season_id)
                          ? "Hide"
                          : "Show"}{" "}
                        Weeks
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weekly Breakdown - Expandable */}
                {expandedSeasons.has(season.season_id) &&
                  season.weeks &&
                  season.weeks.length > 0 && (
                    <div className="p-4 bg-white">
                      <h4 className="text-sm font-semibold text-dark mb-3">
                        Weekly Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3">
                        {season.weeks.map((week) => (
                          <div
                            key={week.week}
                            className="border border-gray-200 rounded p-3 text-center hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors group relative"
                            onClick={() => handleEditWeekStats(season, week)}
                          >
                            <div className="text-xs text-dark-300 mb-1">
                              Week {week.week}
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-sm font-semibold text-green-600">
                                {week.wins}
                              </span>
                              <span className="text-xs text-dark-300">-</span>
                              <span className="text-sm font-semibold text-red-600">
                                {week.losses}
                              </span>
                            </div>
                            <Edit className="h-3 w-3 absolute top-1 right-1 text-gray-400 group-hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-300">
            No season statistics available yet.
          </div>
        )}
      </div>

      {/* Edit Season Stats Modal */}
      {editingSeasonStat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full mx-2 sm:mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark">
                Edit Season Stats
              </h3>
              <button
                onClick={() => setEditingSeasonStat(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-dark-300 mb-4">
                {editingSeasonStat.season_name} - {editingSeasonStat.team_name}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Wins
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editSeasonWins}
                    onChange={(e) =>
                      setEditSeasonWins(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Losses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editSeasonLosses}
                    onChange={(e) =>
                      setEditSeasonLosses(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    <Trophy className="h-4 w-4 inline mr-1 text-yellow-600" />
                    Table Runs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTableRuns}
                    onChange={(e) =>
                      setEditTableRuns(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    <Flame className="h-4 w-4 inline mr-1 text-orange-600" />
                    8-Ball Breaks
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editEightBallBreaks}
                    onChange={(e) =>
                      setEditEightBallBreaks(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>Note:</strong> Updating wins/losses here will override
                calculated totals from weekly stats.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setEditingSeasonStat(null)}
                className="btn btn-outline btn-sm flex items-center"
                disabled={updateSeasonStatsMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSaveSeasonStats}
                className="btn btn-primary btn-sm flex items-center"
                disabled={updateSeasonStatsMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {updateSeasonStatsMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Week Stats Modal */}
      {editingWeekStat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full mx-2 sm:mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark">
                Edit Week Stats
              </h3>
              <button
                onClick={() => setEditingWeekStat(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-dark-300 mb-4">
                {editingWeekStat.season.season_name} - Week{" "}
                {editingWeekStat.week.week}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Wins
                </label>
                <input
                  type="number"
                  min="0"
                  value={editWeekWins}
                  onChange={(e) =>
                    setEditWeekWins(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Losses
                </label>
                <input
                  type="number"
                  min="0"
                  value={editWeekLosses}
                  onChange={(e) =>
                    setEditWeekLosses(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>Note:</strong> Updating week stats will automatically
                recalculate season totals.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setEditingWeekStat(null)}
                className="btn btn-outline btn-sm flex items-center"
                disabled={updateWeekStatsMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSaveWeekStats}
                className="btn btn-primary btn-sm flex items-center"
                disabled={updateWeekStatsMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {updateWeekStatsMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {isEditingPlayer && player && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full mx-2 sm:mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark">Edit Player</h3>
              <button
                onClick={() => setIsEditingPlayer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="player@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Skill Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={editSkillLevel || ""}
                  onChange={(e) =>
                    setEditSkillLevel(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1-9"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Player skill level (1-9)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsEditingPlayer(false)}
                className="btn btn-outline btn-sm flex items-center"
                disabled={updatePlayerMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSavePlayer}
                className="btn btn-primary btn-sm flex items-center"
                disabled={updatePlayerMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                {updatePlayerMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetailsPage;
