/**
 * SeasonDetailsPage - Admin page for viewing and managing a single season
 *
 * This page displays comprehensive season information including:
 * - Season overview (name, dates, status)
 * - Team standings
 * - Teams participating in the season
 * - Match schedule and results
 * - Player analytics
 *
 * It also provides functionality to:
 * - Edit season details (name, dates)
 * - Import season data via CSV files
 * - Import match schedules
 * - Edit individual match details
 */

import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
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
import MatchForm from "../../components/matches/MatchForm";
import NextMatchCard from "../../components/NextMatchCard";
import { useCurrentTeams } from "../../hooks/usePlayers";
import type { Match } from "../../api/types";

const SeasonDetailsPage: React.FC = () => {
  // ============================================================================
  // ROUTING & NAVIGATION
  // ============================================================================
  const { id } = useParams<{ id: string }>(); // Get season ID from URL params
  const navigate = useNavigate();
  const seasonId = parseInt(id || "0");

  // ============================================================================
  // DATA FETCHING HOOKS
  // Fetches all season-related data from the API using React Query hooks
  // ============================================================================
  const { data: season, isLoading, error } = useSeason(seasonId); // Core season info
  const { data: teams } = useSeasonTeams(seasonId); // Teams in this season
  const { data: matches } = useSeasonMatches(seasonId); // All matches for season
  const { data: standings } = useSeasonStandings(seasonId); // Team standings/rankings
  const { data: playersData } = useSeasonPlayers(seasonId); // Player stats for season
  const { data: currentTeams } = useCurrentTeams(); // User's teams for Next Match card

  // Get user's team IDs for Next Match card
  const userTeamIds = currentTeams?.map((team) => team.id) || [];

  // ============================================================================
  // MUTATION HOOKS
  // Handles data modifications (imports, updates)
  // ============================================================================
  const importCSVMutation = useImportSeasonCSV(); // Import team/individual/weekly standings
  const importScheduleMutation = useImportSchedule(); // Import match schedule
  const updateSeasonMutation = useUpdateSeason(); // Update season details

  // ============================================================================
  // CSV IMPORT MODAL STATE
  // For importing team standings, individual standings, and weekly standings
  // ============================================================================
  const [teamStandingsFile, setTeamStandingsFile] = useState<File | null>(null);
  const [individualStandingsFile, setIndividualStandingsFile] =
    useState<File | null>(null);
  const [weeklyStandingsFile, setWeeklyStandingsFile] = useState<File | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ============================================================================
  // SCHEDULE IMPORT MODAL STATE
  // For importing match schedules with a separate schedule + standings file
  // ============================================================================
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [scheduleStandingsFile, setScheduleStandingsFile] =
    useState<File | null>(null);
  const [showScheduleImportModal, setShowScheduleImportModal] = useState(false);

  // ============================================================================
  // EDIT MATCH MODAL STATE
  // For editing individual match details (scores, players, etc.)
  // ============================================================================
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);

  // ============================================================================
  // EDIT SEASON MODAL STATE
  // For editing season name, dates, and viewing status
  // ============================================================================
  const [showEditSeasonModal, setShowEditSeasonModal] = useState(false);
  const [seasonFormData, setSeasonFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
    is_archived: false,
  });

  // ============================================================================
  // FILE INPUT REFS
  // References to file inputs (currently unused but available for programmatic access)
  // ============================================================================
  const teamStandingsInputRef = useRef<HTMLInputElement>(null);
  const individualStandingsInputRef = useRef<HTMLInputElement>(null);
  const weeklyStandingsInputRef = useRef<HTMLInputElement>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const scheduleStandingsInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // HANDLER FUNCTIONS
  // ============================================================================

  /**
   * Handles importing schedule and match results from CSV files
   * Requires both schedule worksheet and standings worksheet files
   */
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
      // Reset modal and file state on success
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

  /**
   * Opens the edit match modal with the selected match data
   */
  const openEditMatchModal = (match: Match) => {
    setMatchToEdit(match);
    setShowEditMatchModal(true);
  };

  /**
   * Callback when match form is successfully submitted - closes modal and clears state
   */
  const handleMatchFormSuccess = () => {
    setShowEditMatchModal(false);
    setMatchToEdit(null);
  };

  /**
   * Callback when match form is cancelled - closes modal and clears state
   */
  const handleMatchFormCancel = () => {
    setShowEditMatchModal(false);
    setMatchToEdit(null);
  };

  /**
   * Opens the edit season modal and populates form with current season data
   */
  const openEditSeasonModal = () => {
    if (!season) return;
    // Pre-populate form with existing season data
    setSeasonFormData({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date || "",
      is_active: season.is_active,
      is_archived: season.is_archived,
    });
    setShowEditSeasonModal(true);
  };

  /**
   * Generic handler for season form field changes
   * Updates the corresponding field in seasonFormData state
   */
  const handleSeasonFormChange = (
    field: keyof typeof seasonFormData,
    value: string | boolean
  ) => {
    setSeasonFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Saves the edited season data to the API
   */
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

  /**
   * Handles importing season data from three CSV files:
   * - Team standings (team rankings, wins/losses)
   * - Individual standings (player stats)
   * - Weekly standings (per-week breakdowns)
   *
   * Note: The `files` object built incrementally below is unused -
   * the actual mutation uses the three files directly
   */
  const handleImportCSV = async () => {
    // Validate all three files are selected
    if (
      !teamStandingsFile ||
      !individualStandingsFile ||
      !weeklyStandingsFile
    ) {
      toast.error("Please select all three CSV files");
      return;
    }

    // Note: This files object construction is redundant - could be removed
    // The mutation below constructs its own object with all three files
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
      // Reset modal and file state on success
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

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-500">Loading season details...</div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================
  if (error || !season) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load season details. Please try again later.
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN CONTENT
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* =====================================================================
          HEADER SECTION
          Contains back navigation button, season name, and league name
          ===================================================================== */}
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

      {/* =====================================================================
          SEASON OVERVIEW SECTION
          Displays season info card with edit, archive, and import buttons
          ===================================================================== */}
      <SeasonOverview
        season={season}
        editable={true}
        onEditSeason={openEditSeasonModal}
        onArchive={() => {
          // TODO: Implement archive functionality
        }}
        onImportCSV={() => setShowUploadModal(true)}
      />

      {/* =====================================================================
          NEXT MATCH CARD
          Shows user's next upcoming match (only if user is on a team)
          ===================================================================== */}
      <NextMatchCard matches={matches} userTeamIds={userTeamIds} />

      {/* =====================================================================
          STANDINGS SECTION
          Shows team rankings table with W/L records
          ===================================================================== */}
      <SeasonStandings
        standings={standings}
        onViewTeam={(teamId) => navigate(`/admin/teams/${teamId}`)}
      />

      {/* =====================================================================
          TEAMS SECTION
          Lists all teams participating in this season
          ===================================================================== */}
      <SeasonTeams
        teams={teams}
        editable={true}
        onAddTeam={() => {
          // TODO: Implement add team functionality
        }}
        onViewTeam={(teamId) => navigate(`/admin/teams/${teamId}`)}
      />

      {/* =====================================================================
          MATCHES SECTION
          Shows all matches for the season with edit/import capabilities
          ===================================================================== */}
      <SeasonMatches
        matches={matches}
        editable={true}
        onScheduleMatch={() => {
          // TODO: Implement schedule match functionality
        }}
        onImportSchedule={() => setShowScheduleImportModal(true)}
        onEditMatch={openEditMatchModal}
      />

      {/* =====================================================================
          PLAYER ANALYTICS SECTION
          Shows individual player statistics for the season
          ===================================================================== */}
      <SeasonPlayerAnalytics
        playersData={playersData}
        onViewPlayer={(playerId) => navigate(`/admin/players/${playerId}`)}
      />

      {/* =====================================================================
          MODAL: CSV UPLOAD
          Allows importing three CSV files to populate season data:
          1. Team Standings - team rankings and W/L records
          2. Individual Standings - player statistics
          3. Weekly Standings - per-week breakdowns
          ===================================================================== */}
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

          {/* File Input: Team Standings */}
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

          {/* File Input: Individual Standings */}
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

          {/* File Input: Weekly Standings */}
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

          {/* Modal Action Buttons */}
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

      {/* =====================================================================
          MODAL: SCHEDULE IMPORT
          Allows importing match schedule and results from two CSV files:
          1. Schedule Worksheet - defines weekly matchups (who plays whom)
          2. Standings Worksheet - contains actual game results/scores
          Both are required to create complete match records
          ===================================================================== */}
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

          {/* File Input: Schedule Worksheet (weekly matchups) */}
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

          {/* File Input: Standings Worksheet (game results) */}
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

          {/* Info Box explaining the two-file requirement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The schedule worksheet defines matchups by
              week, while the standings worksheet contains actual game results.
              Both files are needed to create complete match records.
            </p>
          </div>

          {/* Modal Action Buttons */}
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

      {/* =====================================================================
          MODAL: EDIT MATCH
          Custom modal (not using Modal component) for editing match details
          Uses the MatchForm component which handles:
          - Match date/time
          - Venue
          - Scores
          - Player lineups and individual game results
          ===================================================================== */}
      {showEditMatchModal && matchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-cream-200 rounded-lg max-w-4xl w-full shadow-xl max-h-[95vh] overflow-y-auto my-4">
            {/* Sticky header with match info */}
            <div className="sticky top-0 bg-primary text-white p-4 rounded-t-lg z-10 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">Edit Match</h3>
                  <p className="text-sm text-cream-200 mt-1">
                    {matchToEdit.home_team_detail?.name ||
                      `Team ${matchToEdit.home_team}`}{" "}
                    vs{" "}
                    {matchToEdit.away_team_detail?.name ||
                      `Team ${matchToEdit.away_team}`}
                  </p>
                </div>
                <button
                  onClick={handleMatchFormCancel}
                  className="text-white hover:text-cream-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Match form body */}
            <div className="p-6">
              <MatchForm
                match={matchToEdit}
                onSuccess={handleMatchFormSuccess}
                onCancel={handleMatchFormCancel}
                showCancelButton={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT SEASON
          Custom modal for editing basic season information:
          - Season name
          - Start and end dates
          - Status display (read-only - Active/Archived/Inactive)

          Note: Status cannot be directly edited here - use archive functionality
          ===================================================================== */}
      {showEditSeasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Edit Season</h3>
              <button
                onClick={() => setShowEditSeasonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              {/* Field: Season Name */}
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

              {/* Fields: Start Date and End Date (side by side) */}
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

              {/* Display: Season Status (read-only badge) */}
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

            {/* Modal Action Buttons */}
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
