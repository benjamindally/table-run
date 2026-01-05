import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import {
  useSeason,
  useSeasonTeams,
  useSeasonMatches,
  useSeasonStandings,
  useSeasonPlayers,
  useImportSeasonCSV,
  useImportSchedule,
  useUpdateSeason,
} from "../../hooks/useSeasons";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";
import SeasonOverview from "../../components/seasons/SeasonOverview";
import SeasonStandings from "../../components/seasons/SeasonStandings";
import SeasonTeams from "../../components/seasons/SeasonTeams";
import SeasonMatches from "../../components/seasons/SeasonMatches";
import SeasonPlayerAnalytics from "../../components/seasons/SeasonPlayerAnalytics";

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
  const importScheduleMutation = useImportSchedule();
  const updateSeasonMutation = useUpdateSeason();

  const [teamStandingsFile, setTeamStandingsFile] = useState<File | null>(null);
  const [individualStandingsFile, setIndividualStandingsFile] =
    useState<File | null>(null);
  const [weeklyStandingsFile, setWeeklyStandingsFile] = useState<File | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Schedule import state
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [scheduleStandingsFile, setScheduleStandingsFile] =
    useState<File | null>(null);
  const [showScheduleImportModal, setShowScheduleImportModal] = useState(false);

  // Edit match modal state
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    homeScore: null as number | null,
    awayScore: null as number | null,
    weekNumber: null as number | null,
    status: "" as "scheduled" | "completed" | "cancelled",
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Edit season modal state
  const [showEditSeasonModal, setShowEditSeasonModal] = useState(false);
  const [seasonFormData, setSeasonFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
    is_archived: false,
  });


  const teamStandingsInputRef = useRef<HTMLInputElement>(null);
  const individualStandingsInputRef = useRef<HTMLInputElement>(null);
  const weeklyStandingsInputRef = useRef<HTMLInputElement>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const scheduleStandingsInputRef = useRef<HTMLInputElement>(null);

  const handleImportSchedule = async () => {
    if (!scheduleFile || !scheduleStandingsFile) {
      toast.error("Please select both CSV files");
      return;
    }

    try {
      await importScheduleMutation.mutateAsync({
        seasonId,
        files: {
          schedule: scheduleFile,
          standings: scheduleStandingsFile,
        },
      });
      toast.success("Schedule and match results imported successfully!");
      setShowScheduleImportModal(false);
      setScheduleFile(null);
      setScheduleStandingsFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import schedule",
        { autoClose: 8000 }
      );
    }
  };

  const openEditMatchModal = (match: any) => {
    setMatchToEdit(match);
    setEditFormData({
      date: match.date,
      homeScore: match.home_score,
      awayScore: match.away_score,
      weekNumber: match.week_number,
      status: match.status,
    });
    setShowEditMatchModal(true);
  };

  const handleEditFormChange = (
    field: keyof typeof editFormData,
    value: string | number | null
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveMatchEdit = async () => {
    if (!matchToEdit) return;

    // TODO: Implement API call to update match
    // For now, just show a toast
    toast.success("Match updated successfully!");
    setShowEditMatchModal(false);
    setMatchToEdit(null);
    setShowDeleteConfirmation(false);
  };

  const handleDeleteMatch = async () => {
    if (!matchToEdit) return;

    // TODO: Implement API call to delete match
    // For now, just show a toast
    toast.success("Match deleted successfully!");
    setShowEditMatchModal(false);
    setShowDeleteConfirmation(false);
    setMatchToEdit(null);
  };

  const openEditSeasonModal = () => {
    if (!season) return;
    setSeasonFormData({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date || "",
      is_active: season.is_active,
      is_archived: season.is_archived,
    });
    setShowEditSeasonModal(true);
  };

  const handleSeasonFormChange = (
    field: keyof typeof seasonFormData,
    value: string | boolean
  ) => {
    setSeasonFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSeasonEdit = async () => {
    try {
      await updateSeasonMutation.mutateAsync({
        id: seasonId,
        data: seasonFormData,
      });
      toast.success("Season updated successfully!");
      setShowEditSeasonModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update season"
      );
    }
  };

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
      <SeasonOverview
        season={season}
        editable={true}
        onEditSeason={openEditSeasonModal}
        onArchive={() => {
          // TODO: Implement archive functionality
        }}
        onImportCSV={() => setShowUploadModal(true)}
      />

      {/* Standings Section */}
      <SeasonStandings
        standings={standings}
        onViewTeam={(teamId) => navigate(`/team/${teamId}/stats`)}
      />

      {/* Teams Section */}
      <SeasonTeams
        teams={teams}
        editable={true}
        onAddTeam={() => {
          // TODO: Implement add team functionality
        }}
        onViewTeam={(teamId) => navigate(`/admin/teams/${teamId}`)}
      />

      {/* Matches Section */}
      <SeasonMatches
        matches={matches}
        editable={true}
        onScheduleMatch={() => {
          // TODO: Implement schedule match functionality
        }}
        onImportSchedule={() => setShowScheduleImportModal(true)}
        onEditMatch={openEditMatchModal}
      />

      {/* Player Analytics Section */}
      <SeasonPlayerAnalytics
        playersData={playersData}
        onViewPlayer={(playerId) => navigate(`/admin/players/${playerId}`)}
      />

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

      {/* Schedule Import Modal */}
      <Modal
        isOpen={showScheduleImportModal}
        onClose={() => setShowScheduleImportModal(false)}
        title="Import Schedule & Match Results"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-dark-300 text-sm">
            Upload your schedule and standings worksheet CSV files to import the
            season schedule and match results. This will create or update match
            records with scores and player statistics.
          </p>

          {/* Schedule File */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Schedule Worksheet CSV
            </label>
            <input
              ref={scheduleInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setScheduleFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-dark-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                cursor-pointer"
            />
            {scheduleFile && (
              <p className="text-sm text-dark-300 mt-1">
                Selected: {scheduleFile.name}
              </p>
            )}
          </div>

          {/* Standings File */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Standings Worksheet CSV
            </label>
            <input
              ref={scheduleStandingsInputRef}
              type="file"
              accept=".csv"
              onChange={(e) =>
                setScheduleStandingsFile(e.target.files?.[0] || null)
              }
              className="block w-full text-sm text-dark-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-100 file:text-primary-700
                hover:file:bg-primary-200
                cursor-pointer"
            />
            {scheduleStandingsFile && (
              <p className="text-sm text-dark-300 mt-1">
                Selected: {scheduleStandingsFile.name}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The schedule worksheet defines matchups by
              week, while the standings worksheet contains actual game results.
              Both files are needed to create complete match records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowScheduleImportModal(false)}
              className="btn btn-outline"
              disabled={importScheduleMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleImportSchedule}
              className="btn btn-primary flex items-center"
              disabled={
                !scheduleFile ||
                !scheduleStandingsFile ||
                importScheduleMutation.isPending
              }
            >
              {importScheduleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Match Modal */}
      {showEditMatchModal && matchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Edit Match</h3>
              <button
                onClick={() => setShowEditMatchModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Match Info (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Team
                    </label>
                    <p className="text-gray-900 font-medium">
                      {matchToEdit.home_team_detail?.name ||
                        `Team ${matchToEdit.home_team}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Away Team
                    </label>
                    <p className="text-gray-900 font-medium">
                      {matchToEdit.away_team_detail?.name ||
                        `Team ${matchToEdit.away_team}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Match Date
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    className="form-input w-full"
                    value={editFormData.date}
                    onChange={(e) =>
                      handleEditFormChange("date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-week"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Week Number
                  </label>
                  <input
                    type="number"
                    id="edit-week"
                    className="form-input w-full"
                    min="1"
                    value={editFormData.weekNumber || ""}
                    onChange={(e) =>
                      handleEditFormChange(
                        "weekNumber",
                        parseInt(e.target.value) || null
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="edit-home-score"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Home Score
                  </label>
                  <input
                    type="number"
                    id="edit-home-score"
                    className="form-input w-full"
                    min="0"
                    value={editFormData.homeScore ?? ""}
                    onChange={(e) =>
                      handleEditFormChange(
                        "homeScore",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-away-score"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Away Score
                  </label>
                  <input
                    type="number"
                    id="edit-away-score"
                    className="form-input w-full"
                    min="0"
                    value={editFormData.awayScore ?? ""}
                    onChange={(e) =>
                      handleEditFormChange(
                        "awayScore",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="form-input w-full"
                    value={editFormData.status}
                    onChange={(e) =>
                      handleEditFormChange(
                        "status",
                        e.target.value as
                          | "scheduled"
                          | "completed"
                          | "cancelled"
                      )
                    }
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              {/* Delete button on the left */}
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
              </button>

              {/* Cancel and Save on the right */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditMatchModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button onClick={saveMatchEdit} className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <Trash2 className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Delete Match
                      </h3>
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this match between{" "}
                        <strong>
                          {matchToEdit.home_team_detail?.name ||
                            `Team ${matchToEdit.home_team}`}
                        </strong>{" "}
                        and{" "}
                        <strong>
                          {matchToEdit.away_team_detail?.name ||
                            `Team ${matchToEdit.away_team}`}
                        </strong>
                        ?
                      </p>
                      <p className="text-sm text-red-600 mt-2">
                        This action cannot be undone. All match data will be
                        permanently removed.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowDeleteConfirmation(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteMatch}
                      className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Match
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Season Modal */}
      {showEditSeasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Edit Season</h3>
              <button
                onClick={() => setShowEditSeasonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Season Name */}
              <div>
                <label
                  htmlFor="season-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Season Name
                </label>
                <input
                  type="text"
                  id="season-name"
                  className="form-input w-full"
                  value={seasonFormData.name}
                  onChange={(e) =>
                    handleSeasonFormChange("name", e.target.value)
                  }
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="season-start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="season-start-date"
                    className="form-input w-full"
                    value={seasonFormData.start_date}
                    onChange={(e) =>
                      handleSeasonFormChange("start_date", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="season-end-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="season-end-date"
                    className="form-input w-full"
                    value={seasonFormData.end_date}
                    onChange={(e) =>
                      handleSeasonFormChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Status Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season Status
                </label>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    seasonFormData.is_active
                      ? "bg-secondary-100 text-secondary-800"
                      : seasonFormData.is_archived
                      ? "bg-cream-400 text-dark-400"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {seasonFormData.is_active
                    ? "Active"
                    : seasonFormData.is_archived
                    ? "Archived"
                    : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditSeasonModal(false)}
                className="btn btn-outline"
                disabled={updateSeasonMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={saveSeasonEdit}
                className="btn btn-primary flex items-center"
                disabled={updateSeasonMutation.isPending}
              >
                {updateSeasonMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonDetailsPage;
