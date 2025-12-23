import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Trophy,
  Target,
  Edit,
  Archive,
  Upload,
  Award,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useSeason,
  useSeasonTeams,
  useSeasonMatches,
  useSeasonStandings,
  useSeasonPlayers,
  useImportSeasonCSV,
} from "../../hooks/useSeasons";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";

const SeasonDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seasonId = parseInt(id || "0");

  const { data: season, isLoading, error } = useSeason(seasonId);
  const { data: teams } = useSeasonTeams(seasonId);
  const { data: matches } = useSeasonMatches(seasonId);
  const { data: standings } = useSeasonStandings(seasonId);
  const { data: playersData } = useSeasonPlayers(seasonId);
  const importCSVMutation = useImportSeasonCSV();

  const [teamStandingsFile, setTeamStandingsFile] = useState<File | null>(null);
  const [individualStandingsFile, setIndividualStandingsFile] =
    useState<File | null>(null);
  const [weeklyStandingsFile, setWeeklyStandingsFile] = useState<File | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  // State for collapsible sections
  const [standingsCollapsed, setStandingsCollapsed] = useState(false);
  const [teamsCollapsed, setTeamsCollapsed] = useState(false);
  const [matchesCollapsed, setMatchesCollapsed] = useState(false);
  const [playersCollapsed, setPlayersCollapsed] = useState(false);

  // State for expanded sections (showing all items)
  const [standingsExpanded, setStandingsExpanded] = useState(false);
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [matchesExpanded, setMatchesExpanded] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);

  const teamStandingsInputRef = useRef<HTMLInputElement>(null);
  const individualStandingsInputRef = useRef<HTMLInputElement>(null);
  const weeklyStandingsInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async () => {
    if (
      !teamStandingsFile ||
      !individualStandingsFile ||
      !weeklyStandingsFile
    ) {
      toast.error("Please select all three CSV files");
      return;
    }

    let files = {};

    if (teamStandingsFile) {
      files = { teamStandings: teamStandingsFile };
    }
    if (individualStandingsFile) {
      files = { ...files, individualStandings: individualStandingsFile };
    }

    if (weeklyStandingsFile) {
      files = { ...files, weeklyStandings: weeklyStandingsFile };
    }

    try {
      await importCSVMutation.mutateAsync({
        seasonId,
        files: {
          teamStandings: teamStandingsFile,
          individualStandings: individualStandingsFile,
          weeklyStandings: weeklyStandingsFile,
        },
      });
      toast.success("CSV files imported successfully!");
      setShowUploadModal(false);
      setTeamStandingsFile(null);
      setIndividualStandingsFile(null);
      setWeeklyStandingsFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import CSV files",
        { autoClose: 8000 }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading season details...</div>
        </div>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load season details. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin/leagues")}
            className="btn btn-outline btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Leagues
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">{season.name}</h1>
            <p className="text-sm text-dark-300 mt-1">
              {season.league_detail?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-dark">Overview</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-outline btn-sm flex items-center"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import CSV
            </button>
            <button className="btn btn-outline btn-sm flex items-center">
              <Edit className="h-4 w-4 mr-1" />
              Edit Season
            </button>
            <button className="btn btn-outline btn-sm flex items-center">
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <p className="text-lg font-semibold text-dark">
              {new Date(season.start_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {season.end_date && (
            <div>
              <div className="flex items-center text-dark-300 mb-2">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">End Date</span>
              </div>
              <p className="text-lg font-semibold text-dark">
                {new Date(season.end_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Teams</span>
            </div>
            <p className="text-lg font-semibold text-dark">
              {season.team_count || 0}
            </p>
          </div>

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Target className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Invite Code</span>
            </div>
            <p className="text-lg font-semibold text-dark font-mono">
              {season.invite_code}
            </p>
          </div>

          <div>
            <div className="flex items-center text-dark-300 mb-2">
              <Trophy className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                season.is_active
                  ? "bg-secondary-100 text-secondary-800"
                  : season.is_archived
                  ? "bg-cream-400 text-dark-400"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {season.is_active
                ? "Active"
                : season.is_archived
                ? "Archived"
                : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Standings Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Standings</h2>
          <button
            onClick={() => setStandingsCollapsed(!standingsCollapsed)}
            className="text-dark-300 hover:text-dark transition-colors"
          >
            {standingsCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
        {!standingsCollapsed && (
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
                      {(standingsExpanded
                        ? standings.standings
                        : standings.standings.slice(0, 5)
                      ).map((standing, idx) => (
                        <tr
                          key={standing.team_id}
                          className={idx < 3 ? "bg-orange-50" : ""}
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
                              <div className="text-sm font-medium text-gray-900">
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
                {!standingsExpanded && standings.standings.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setStandingsExpanded(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View More ({standings.standings.length - 5} more)
                    </button>
                  </div>
                )}
                {standingsExpanded && standings.standings.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setStandingsExpanded(false)}
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

      {/* Teams Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Teams</h2>
          <div className="flex items-center space-x-2">
            <button className="btn btn-primary btn-sm">Add Team</button>
            <button
              onClick={() => setTeamsCollapsed(!teamsCollapsed)}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              {teamsCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {!teamsCollapsed && (
          <>
            {teams && teams.length > 0 ? (
              <>
                <div className="space-y-2">
                  {(teamsExpanded ? teams : teams.slice(0, 5)).map(
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
                        <button
                          onClick={() =>
                            navigate(`/admin/teams/${participation.team}`)
                          }
                          className="btn btn-outline btn-sm"
                        >
                          View Team
                        </button>
                      </div>
                    )
                  )}
                </div>
                {!teamsExpanded && teams.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setTeamsExpanded(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View More ({teams.length - 5} more)
                    </button>
                  </div>
                )}
                {teamsExpanded && teams.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setTeamsExpanded(false)}
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

      {/* Matches Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark">Matches</h2>
          <div className="flex items-center space-x-2">
            <button className="btn btn-primary btn-sm">Schedule Match</button>
            <button
              onClick={() => setMatchesCollapsed(!matchesCollapsed)}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              {matchesCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {!matchesCollapsed && (
          <>
            {matches && matches.length > 0 ? (
              <>
                <div className="space-y-2">
                  {(matchesExpanded ? matches : matches.slice(0, 5)).map(
                    (match) => (
                      <div
                        key={match.id}
                        className="p-4 border border-cream-400 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-dark">
                              Match #{match.id}
                            </p>
                            <p className="text-sm text-dark-300">
                              {new Date(match.date).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="btn btn-outline btn-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                {!matchesExpanded && matches.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setMatchesExpanded(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View More ({matches.length - 5} more)
                    </button>
                  </div>
                )}
                {matchesExpanded && matches.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setMatchesExpanded(false)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-dark-300">
                No matches scheduled yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* Player Analytics Section */}
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
              onClick={() => setPlayersCollapsed(!playersCollapsed)}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              {playersCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {!playersCollapsed && (
          <>
            {playersData &&
            playersData.players &&
            playersData.players.length > 0 ? (
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
                      {(playersExpanded
                        ? playersData.players
                        : playersData.players.slice(0, 5)
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
                              <span className="text-sm font-medium">
                                {idx + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                navigate(`/admin/players/${player.player_id}`)
                              }
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {player.player_name}
                            </button>
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
                {!playersExpanded && playersData.players.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setPlayersExpanded(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View More ({playersData.players.length - 5} more)
                    </button>
                  </div>
                )}
                {playersExpanded && playersData.players.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setPlayersExpanded(false)}
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

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Import Season Data from CSV"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-dark-300 text-sm">
            Upload your team standings, individual standings, and weekly
            standings worksheet CSV files to populate this season with teams,
            players, and weekly statistics.
          </p>

          {/* Team Standings File */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Team Standings CSV
            </label>
            <input
              ref={teamStandingsInputRef}
              type="file"
              accept=".csv"
              onChange={(e) =>
                setTeamStandingsFile(e.target.files?.[0] || null)
              }
              className="block w-full text-sm text-dark-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                cursor-pointer"
            />
            {teamStandingsFile && (
              <p className="text-sm text-dark-300 mt-1">
                Selected: {teamStandingsFile.name}
              </p>
            )}
          </div>

          {/* Individual Standings File */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Individual Standings CSV
            </label>
            <input
              ref={individualStandingsInputRef}
              type="file"
              accept=".csv"
              onChange={(e) =>
                setIndividualStandingsFile(e.target.files?.[0] || null)
              }
              className="block w-full text-sm text-dark-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                cursor-pointer"
            />
            {individualStandingsFile && (
              <p className="text-sm text-dark-300 mt-1">
                Selected: {individualStandingsFile.name}
              </p>
            )}
          </div>

          {/* Weekly Standings File */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Weekly Standings Worksheet CSV
            </label>
            <input
              ref={weeklyStandingsInputRef}
              type="file"
              accept=".csv"
              onChange={(e) =>
                setWeeklyStandingsFile(e.target.files?.[0] || null)
              }
              className="block w-full text-sm text-dark-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                cursor-pointer"
            />
            {weeklyStandingsFile && (
              <p className="text-sm text-dark-300 mt-1">
                Selected: {weeklyStandingsFile.name}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="btn btn-outline"
              disabled={importCSVMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleImportCSV}
              className="btn btn-primary flex items-center"
              disabled={
                !teamStandingsFile ||
                !individualStandingsFile ||
                !weeklyStandingsFile ||
                importCSVMutation.isPending
              }
            >
              {importCSVMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV Files
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SeasonDetailsPage;
