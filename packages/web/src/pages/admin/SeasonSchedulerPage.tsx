import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, PenLine, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  useSeason,
  useSeasonTeams,
  useSeasonVenues,
  useSeasonMatches,
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
  ScheduleSaveReviewModal,
  analyzeSchedule,
  ParamModalType,
} from "../../components/scheduling";
import type { ScheduleAnomaly } from "../../components/scheduling";
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
  const { data: existingMatchesData, isLoading: isLoadingMatches } =
    useSeasonMatches(seasonId);

  // Mutations
  const generateScheduleMutation = useGenerateSchedule();
  const saveScheduleMutation = useSaveSchedule();
  const updateVenueMutation = useUpdateVenue();

  // Configuration state
  const [config, setConfig] = useState<ScheduleConfiguration>({
    start_date: "",
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
  // True once we've loaded an already-saved schedule from the server. In this
  // mode, saving appends the newly-added matches/byes instead of recreating
  // everything, so operators can build a schedule a few weeks at a time.
  const [hasSavedSchedule, setHasSavedSchedule] = useState(false);
  // Set when the operator regenerates from scratch over an existing saved
  // schedule, so the save replaces the old matches instead of appending.
  const [regenerateReplace, setRegenerateReplace] = useState(false);
  const [didLoadExisting, setDidLoadExisting] = useState(false);

  // Modal state
  const [activeParamModal, setActiveParamModal] = useState<ParamModalType | null>(null);
  const [editingMatch, setEditingMatch] = useState<{
    weekIndex: number;
    matchIndex: number;
  } | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [addMatchWeek, setAddMatchWeek] = useState(1);
  // Pre-save review dialog: advisory anomalies the operator confirms past.
  const [saveReview, setSaveReview] = useState<{
    open: boolean;
    anomalies: ScheduleAnomaly[];
  }>({ open: false, anomalies: [] });

  // Initialize config from season data when loaded
  React.useEffect(() => {
    if (season && !config.start_date) {
      setConfig((prev) => ({
        ...prev,
        start_date: season.start_date || "",
      }));
    }
  }, [season]);

  // Initialize selected teams when teams load (default to all selected).
  // selected_team_ids holds Team IDs (participation.team), NOT participation IDs,
  // because the backend generate-schedule endpoint matches on Team IDs.
  React.useEffect(() => {
    if (teams && teams.length > 0 && !config.selected_team_ids) {
      setConfig((prev) => ({
        ...prev,
        selected_team_ids: teams.map((t) => t.team),
      }));
    }
  }, [teams]);

  // Load any already-saved schedule so the operator can review it and append
  // more weeks. Group matches and byes by week so the preview renders them.
  React.useEffect(() => {
    if (didLoadExisting || schedule !== null) return;
    if (!existingMatchesData) return;

    const rawMatches = existingMatchesData.matches || [];
    const rawByes = existingMatchesData.byes || [];
    setDidLoadExisting(true);

    if (rawMatches.length === 0 && rawByes.length === 0) return;

    const weekMap = new Map<number, ScheduleWeek>();
    const ensureWeek = (weekNumber: number, date: string): ScheduleWeek => {
      let week = weekMap.get(weekNumber);
      if (!week) {
        week = { week_number: weekNumber, date, matches: [] };
        weekMap.set(weekNumber, week);
      }
      return week;
    };

    rawMatches.forEach((m) => {
      const weekNumber = m.week_number ?? 1;
      const week = ensureWeek(weekNumber, m.date);
      week.matches.push({
        id: m.id,
        home_team_id: m.home_team,
        home_team_name: m.home_team_detail?.name,
        away_team_id: m.away_team,
        away_team_name: m.away_team_detail?.name,
        venue_name: m.location,
        date: m.date,
        is_bye: false,
      });
    });

    rawByes.forEach((b) => {
      const week = ensureWeek(b.week_number, b.date);
      week.matches.push({
        id: b.id,
        home_team_id: null,
        away_team_id: null,
        date: b.date,
        is_bye: true,
        bye_team_id: b.team,
        bye_team_name: b.team_name,
      });
    });

    const loaded = Array.from(weekMap.values()).sort(
      (a, b) => a.week_number - b.week_number
    );
    setSchedule(loaded);
    setHasSavedSchedule(true);
    setIsManualMode(true); // enable the Add Match flow for appending
  }, [existingMatchesData, didLoadExisting, schedule]);

  // Initialize selected venues when venues load (default to all selected)
  React.useEffect(() => {
    if (venues && venues.length > 0 && !config.selected_venue_ids) {
      setConfig((prev) => ({
        ...prev,
        selected_venue_ids: venues.map((v) => v.id),
      }));
    }
  }, [venues]);

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

    // Regenerating over an already-saved schedule replaces it entirely.
    if (hasSavedSchedule) {
      const ok = window.confirm(
        "This season already has a saved schedule. Generating a new one will " +
          "replace all existing scheduled matches when you save. Continue?"
      );
      if (!ok) return;
      setRegenerateReplace(true);
    }

    try {
      const result = await generateScheduleMutation.mutateAsync({
        seasonId,
        config,
      });
      // Backend returns "weeks" instead of "schedule", and uses different field names
      const rawWeeks = (result as any).weeks || result.schedule || [];
      const transformedSchedule = rawWeeks.map((week: any) => {
        // Transform regular matches
        const transformedMatches = week.matches.map((match: any) => ({
          ...match,
          date: match.date || week.date,
          venue_name: match.venue_name || match.location,
        }));
        // Transform byes into match-like objects
        const byeMatches = (week.byes || []).map((bye: any) => ({
          is_bye: true,
          bye_team_id: bye.team_id,
          bye_team_name: bye.team_name,
          date: week.date,
        }));
        return {
          ...week,
          matches: [...transformedMatches, ...byeMatches],
        };
      });
      setSchedule(transformedSchedule);
      // Transform warnings from strings to objects if needed
      const rawWarnings = result.warnings || [];
      const transformedWarnings = rawWarnings.map((w: any) =>
        typeof w === 'string'
          ? { type: 'venue_conflict' as const, message: w }
          : w
      );
      setWarnings(transformedWarnings);
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

  // Build the save payload. When appending to a previously-saved schedule, only
  // persist matches/byes without a server id (the newly-added ones) so we don't
  // duplicate what's already saved. Regenerating replaces everything; a
  // brand-new schedule just creates.
  const buildSavePayload = () => {
    const appending = hasSavedSchedule && !regenerateReplace;
    const matches = (schedule || []).flatMap((week) =>
      week.matches
        .filter((m) => !m.is_bye)
        .filter((m) => !appending || m.id == null)
        .map((m) => ({
          week_number: week.week_number,
          date: m.date || week.date,
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          location: m.venue_name,
        }))
    );
    const byes = (schedule || []).flatMap((week) =>
      week.matches
        .filter((m) => m.is_bye)
        .filter((m) => !appending || m.id == null)
        .map((m) => ({
          week_number: week.week_number,
          date: m.date || week.date,
          team_id: m.bye_team_id,
        }))
    );
    return { appending, matches, byes };
  };

  // Commit the schedule (called directly when there's nothing to flag, or from
  // the review dialog's "Save Anyway").
  const doSave = async () => {
    const { appending, matches, byes } = buildSavePayload();
    try {
      await saveScheduleMutation.mutateAsync({
        seasonId,
        data: {
          matches,
          byes,
          replace_existing: regenerateReplace,
          append: appending,
          schedule_config: config,
        } as any,
      });
      setSaveReview({ open: false, anomalies: [] });
      toast.success(
        appending ? "New matches added to the schedule!" : "Schedule saved successfully!"
      );
      navigate(`/admin/seasons/${seasonId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save schedule");
    }
  };

  // Save entry point: surface any advisory anomalies for a confirm step first.
  // The operator always has final say — these never block, only inform.
  const handleSaveSchedule = () => {
    if (!schedule || schedule.length === 0) {
      toast.error("No schedule to save");
      return;
    }

    const { appending, matches, byes } = buildSavePayload();
    if (matches.length === 0 && byes.length === 0) {
      toast.info(
        appending
          ? "No new matches to save. Add matches before saving."
          : "No matches to save."
      );
      return;
    }

    const anomalies = analyzeSchedule(schedule, teams || [], season);
    if (anomalies.length > 0) {
      setSaveReview({ open: true, anomalies });
      return;
    }
    doSave();
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

  // Remove a match from the in-memory schedule (shared by the edit modal's
  // delete button and the inline ✕ on each card). Nothing is persisted until
  // Save Schedule, so this is pure client-side state.
  const removeMatchAt = (weekIndex: number, matchIndex: number) => {
    if (!schedule) return;

    const newSchedule = [...schedule];
    newSchedule[weekIndex] = {
      ...newSchedule[weekIndex],
      matches: newSchedule[weekIndex].matches.filter((_, i) => i !== matchIndex),
    };
    // Remove now-empty weeks (keep break weeks)
    setSchedule(
      newSchedule.filter((week) => week.matches.length > 0 || week.is_break_week)
    );
    setHasEdits(true);
  };

  // Delete match (from edit modal)
  const handleDeleteMatch = () => {
    if (!editingMatch) return;
    removeMatchAt(editingMatch.weekIndex, editingMatch.matchIndex);
    setEditingMatch(null);
  };

  // Add new match (manual mode)
  const handleAddMatch = () => {
    setIsAddingMatch(true);
    // Default to the most recent existing week so consecutive matches stay
    // grouped together. The user can switch weeks (or start a new one) via the
    // week tile selector in the modal.
    setAddMatchWeek(
      schedule && schedule.length > 0
        ? Math.max(...schedule.map((w) => w.week_number))
        : 1
    );
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

    // The match date is the source of truth for which week it belongs to:
    // derive the week from the date relative to the season start. Fall back to
    // the explicitly-selected week if no start date is available.
    const startDate = season?.start_date || config.start_date;
    let targetWeek = addMatchWeek;
    if (startDate && newMatch.date) {
      const start = new Date(startDate + "T00:00:00");
      const target = new Date(newMatch.date + "T00:00:00");
      if (!isNaN(start.getTime()) && !isNaN(target.getTime())) {
        const diffDays = Math.floor(
          (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        const derived = Math.floor(diffDays / 7) + 1;
        if (derived >= 1) targetWeek = derived;
      }
    }

    // Find or create the week
    const weekIndex = schedule.findIndex((w) => w.week_number === targetWeek);
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
        week_number: targetWeek,
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
  if (isLoadingSeason || isLoadingTeams || isLoadingVenues || isLoadingMatches) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-dark-400">Loading season data...</span>
        </div>
      </div>
    );
  }

  // Calculate season weeks estimate (n-1 weeks for n teams in single round-robin)
  const seasonWeeksEstimate = teams && teams.length > 1
    ? (teams.length - 1) * (config.times_play_each_other || 1)
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

        {/* Banner when a saved schedule was loaded for appending */}
        {hasSavedSchedule && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            This season already has a saved schedule, shown below. Use{" "}
            <span className="font-medium">Add Match</span> to append more weeks
            (only the new matches are saved), or regenerate to start over.
          </div>
        )}

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
            {hasSavedSchedule ? "Regenerate Schedule" : "Generate Schedule"}
          </button>
          {!hasSavedSchedule && (
            <button
              onClick={handleStartManualMode}
              disabled={generateScheduleMutation.isPending}
              className="btn btn-outline flex items-center"
            >
              <PenLine className="h-4 w-4 mr-2" />
              Manual Schedule
            </button>
          )}
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
            onRemoveMatch={removeMatchAt}
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
        onWeekChange={setAddMatchWeek}
        seasonStartDate={season?.start_date || config.start_date}
        onSave={handleSaveNewMatch}
        isNewMatch
      />

      {/* Pre-save review dialog (advisory, never blocks) */}
      <ScheduleSaveReviewModal
        isOpen={saveReview.open}
        anomalies={saveReview.anomalies}
        isSaving={saveScheduleMutation.isPending}
        onConfirm={doSave}
        onCancel={() => setSaveReview({ open: false, anomalies: [] })}
      />
    </div>
  );
};

export default SeasonSchedulerPage;
