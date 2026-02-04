import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, PenLine, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  useSeason,
  useSeasonTeams,
  useSeasonVenues,
  useGenerateSchedule,
  useSaveSchedule,
  useUpdateVenue,
} from "../../hooks/useSeasons";
import {
  ScheduleParameterGrid,
  ScheduleParameterModal,
  ScheduleWarnings,
  SchedulePreview,
  ScheduleMatchEditModal,
  ParamModalType,
} from "../../components/scheduling";
import type {
  ScheduleConfiguration,
  ScheduleWeek,
  ScheduleMatch,
  ScheduleWarning,
} from "../../api";

const SeasonSchedulerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seasonId = parseInt(id || "0");

  // Data hooks
  const { data: season, isLoading: isLoadingSeason } = useSeason(seasonId);
  const { data: teams, isLoading: isLoadingTeams } = useSeasonTeams(seasonId);
  const { data: venues, isLoading: isLoadingVenues } = useSeasonVenues(seasonId);

  // Mutations
  const generateScheduleMutation = useGenerateSchedule();
  const saveScheduleMutation = useSaveSchedule();
  const updateVenueMutation = useUpdateVenue();

  // Configuration state
  const [config, setConfig] = useState<ScheduleConfiguration>({
    start_date: "",
    matches_per_week: 4,
    break_weeks: [],
    bye_weeks: [],
    alternating_home_away: true,
    times_play_each_other: 1,
    tables_per_establishment: {},
  });

  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleWeek[] | null>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);
  const [hasEdits, setHasEdits] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Modal state
  const [activeParamModal, setActiveParamModal] = useState<ParamModalType | null>(null);
  const [editingMatch, setEditingMatch] = useState<{
    weekIndex: number;
    matchIndex: number;
  } | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [addMatchWeek, setAddMatchWeek] = useState(1);

  // Initialize config from season data when loaded
  React.useEffect(() => {
    if (season && !config.start_date) {
      setConfig((prev) => ({
        ...prev,
        start_date: season.start_date || "",
      }));
    }
  }, [season]);

  React.useEffect(() => {
    if (teams && teams.length > 0) {
      setConfig((prev) => ({
        ...prev,
        matches_per_week: Math.floor(teams.length / 2),
      }));
    }
  }, [teams]);

  // Update config
  const handleUpdateConfig = useCallback((updates: Partial<ScheduleConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    // Clear generated schedule when config changes
    if (schedule && !isManualMode) {
      setSchedule(null);
      setWarnings([]);
    }
  }, [schedule, isManualMode]);

  // Generate schedule
  const handleGenerateSchedule = async () => {
    if (!teams || teams.length < 2) {
      toast.error("Need at least 2 teams to generate a schedule");
      return;
    }

    if (!config.start_date) {
      toast.error("Please set a start date");
      return;
    }

    try {
      const result = await generateScheduleMutation.mutateAsync({
        seasonId,
        config,
      });
      setSchedule(result.schedule);
      setWarnings(result.warnings || []);
      setIsManualMode(false);
      setHasEdits(false);
      toast.success("Schedule generated! Review and save when ready.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate schedule");
    }
  };

  // Start manual mode
  const handleStartManualMode = () => {
    setIsManualMode(true);
    setSchedule([]);
    setWarnings([]);
    setHasEdits(false);
    toast.info("Manual mode started. Add matches one by one.");
  };

  // Save schedule
  const handleSaveSchedule = async () => {
    if (!schedule || schedule.length === 0) {
      toast.error("No schedule to save");
      return;
    }

    try {
      await saveScheduleMutation.mutateAsync({
        seasonId,
        data: {
          schedule,
          configuration: config,
          is_manual: isManualMode,
        },
      });
      toast.success("Schedule saved successfully!");
      navigate(`/admin/seasons/${seasonId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save schedule");
    }
  };

  // Edit match
  const handleEditMatch = (weekIndex: number, matchIndex: number) => {
    setEditingMatch({ weekIndex, matchIndex });
  };

  // Save match edit
  const handleSaveMatch = (updatedMatch: ScheduleMatch) => {
    if (!schedule || !editingMatch) return;

    const newSchedule = [...schedule];
    newSchedule[editingMatch.weekIndex] = {
      ...newSchedule[editingMatch.weekIndex],
      matches: newSchedule[editingMatch.weekIndex].matches.map((m, i) =>
        i === editingMatch.matchIndex ? updatedMatch : m
      ),
    };
    setSchedule(newSchedule);
    setHasEdits(true);
  };

  // Delete match
  const handleDeleteMatch = () => {
    if (!schedule || !editingMatch) return;

    const newSchedule = [...schedule];
    newSchedule[editingMatch.weekIndex] = {
      ...newSchedule[editingMatch.weekIndex],
      matches: newSchedule[editingMatch.weekIndex].matches.filter(
        (_, i) => i !== editingMatch.matchIndex
      ),
    };
    // Remove empty weeks
    setSchedule(newSchedule.filter((week) => week.matches.length > 0 || week.is_break_week));
    setHasEdits(true);
    setEditingMatch(null);
  };

  // Add new match (manual mode)
  const handleAddMatch = () => {
    setIsAddingMatch(true);
    // Default to next week or week 1
    setAddMatchWeek(schedule && schedule.length > 0 ? schedule.length + 1 : 1);
  };

  // Update venue table counts
  const handleUpdateVenueTables = async (
    updates: { venueId: number; tableCount: number }[]
  ) => {
    for (const { venueId, tableCount } of updates) {
      await updateVenueMutation.mutateAsync({
        venueId,
        data: { table_count: tableCount },
      });
    }
    toast.success("Venue table counts updated!");
  };

  // Save new match
  const handleSaveNewMatch = (newMatch: ScheduleMatch) => {
    if (!schedule) return;

    // Find or create the week
    const weekIndex = schedule.findIndex((w) => w.week_number === addMatchWeek);
    let newSchedule = [...schedule];

    if (weekIndex >= 0) {
      // Add to existing week
      newSchedule[weekIndex] = {
        ...newSchedule[weekIndex],
        matches: [...newSchedule[weekIndex].matches, newMatch],
      };
    } else {
      // Create new week
      const newWeek: ScheduleWeek = {
        week_number: addMatchWeek,
        date: newMatch.date,
        matches: [newMatch],
      };
      newSchedule = [...newSchedule, newWeek].sort(
        (a, b) => a.week_number - b.week_number
      );
    }

    setSchedule(newSchedule);
    setHasEdits(true);
    setIsAddingMatch(false);
  };

  // Loading state
  if (isLoadingSeason || isLoadingTeams || isLoadingVenues) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-dark-400">Loading season data...</span>
        </div>
      </div>
    );
  }

  // Calculate season weeks estimate
  const seasonWeeksEstimate = teams
    ? Math.ceil(
        (teams.length * (teams.length - 1) * (config.times_play_each_other || 1)) /
          2 /
          (config.matches_per_week || 1)
      )
    : 14;

  const currentEditingMatch = editingMatch && schedule
    ? schedule[editingMatch.weekIndex]?.matches[editingMatch.matchIndex]
    : null;

  const currentEditingWeek = editingMatch && schedule
    ? schedule[editingMatch.weekIndex]?.week_number
    : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/seasons/${seasonId}`)}
          className="p-2 rounded-lg hover:bg-cream-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-dark-400" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark">Schedule Season</h1>
          <p className="text-dark-400">
            {season?.name} - {season?.league_detail?.name}
          </p>
        </div>
      </div>

      {/* Parameter Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">
          Schedule Parameters
        </h2>
        <ScheduleParameterGrid
          config={config}
          teams={teams || []}
          venues={venues || []}
          onOpenModal={setActiveParamModal}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-cream-200">
          <button
            onClick={handleGenerateSchedule}
            disabled={generateScheduleMutation.isPending || !config.start_date}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            {generateScheduleMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate Schedule
          </button>
          <button
            onClick={handleStartManualMode}
            disabled={generateScheduleMutation.isPending}
            className="btn btn-outline flex items-center"
          >
            <PenLine className="h-4 w-4 mr-2" />
            Manual Schedule
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <ScheduleWarnings
          warnings={warnings}
          onDismiss={() => setWarnings([])}
        />
      )}

      {/* Schedule Preview */}
      {(schedule !== null || isManualMode) && (
        <>
          <SchedulePreview
            schedule={schedule || []}
            onEditMatch={handleEditMatch}
            onAddMatch={isManualMode ? handleAddMatch : undefined}
            isManualMode={isManualMode}
          />

          {/* Save button */}
          {schedule && schedule.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveSchedule}
                disabled={saveScheduleMutation.isPending}
                className="btn btn-primary flex items-center"
              >
                {saveScheduleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Schedule
                {hasEdits && <span className="ml-1 text-xs">(edited)</span>}
              </button>
            </div>
          )}
        </>
      )}

      {/* Parameter Modal */}
      <ScheduleParameterModal
        isOpen={activeParamModal !== null}
        onClose={() => setActiveParamModal(null)}
        type={activeParamModal}
        config={config}
        teams={teams || []}
        venues={venues || []}
        onUpdateConfig={handleUpdateConfig}
        onUpdateVenueTables={handleUpdateVenueTables}
        seasonWeeksEstimate={seasonWeeksEstimate}
        seasonId={seasonId}
      />

      {/* Match Edit Modal */}
      <ScheduleMatchEditModal
        isOpen={editingMatch !== null}
        onClose={() => setEditingMatch(null)}
        match={currentEditingMatch}
        teams={teams || []}
        venues={venues || []}
        weekNumber={currentEditingWeek}
        onSave={handleSaveMatch}
        onDelete={handleDeleteMatch}
      />

      {/* Add Match Modal (manual mode) */}
      <ScheduleMatchEditModal
        isOpen={isAddingMatch}
        onClose={() => setIsAddingMatch(false)}
        match={null}
        teams={teams || []}
        venues={venues || []}
        weekNumber={addMatchWeek}
        onSave={handleSaveNewMatch}
        isNewMatch
      />
    </div>
  );
};

export default SeasonSchedulerPage;
