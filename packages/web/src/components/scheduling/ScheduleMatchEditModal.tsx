import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeftRight, Trash2, Plus } from "lucide-react";
import type { ScheduleMatch, Venue, SeasonParticipation } from "../../api";

interface ScheduleMatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: ScheduleMatch | null;
  teams: SeasonParticipation[];
  venues: Venue[];
  weekNumber: number;
  onSave: (updatedMatch: ScheduleMatch) => void;
  onDelete?: () => void;
  isNewMatch?: boolean;
  // For new matches: the weeks that already exist so the user can pick one
  // (or start a new week) via tile selector instead of being forced into a new week.
  existingWeeks?: number[];
  onWeekChange?: (week: number) => void;
  // Season start date (YYYY-MM-DD) — lets the modal keep the week and the match
  // date in sync: picking a date derives the week, and picking a week fills the date.
  seasonStartDate?: string;
}

// Derive a 1-based week number from a date relative to the season start date.
const weekFromDate = (dateStr: string, startDate: string): number | null => {
  if (!dateStr || !startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(target.getTime())) return null;
  const diffDays = Math.floor(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
};

// Derive the (week-aligned) date for a given week number from the season start.
const dateForWeek = (week: number, startDate: string): string => {
  if (!startDate) return "";
  const start = new Date(startDate + "T00:00:00");
  if (isNaN(start.getTime())) return "";
  start.setDate(start.getDate() + (week - 1) * 7);
  return start.toISOString().split("T")[0];
};

const ScheduleMatchEditModal: React.FC<ScheduleMatchEditModalProps> = ({
  isOpen,
  onClose,
  match,
  teams,
  venues,
  weekNumber,
  onSave,
  onDelete,
  isNewMatch = false,
  existingWeeks = [],
  onWeekChange,
  seasonStartDate = "",
}) => {
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [isBye, setIsBye] = useState(false);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);

  // Initialize the form only when the modal transitions to open. Initializing on
  // every render (or on weekNumber changes) would wipe the user's team/venue
  // selections when changing the date bumps the derived week.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (!justOpened) return;

    if (match) {
      setHomeTeamId(match.home_team_id);
      setAwayTeamId(match.away_team_id);
      setVenueId(match.venue_id || null);
      setDate(match.date || "");
      setIsBye(match.is_bye || false);
      setByeTeamId(match.bye_team_id || null);
    } else if (isNewMatch) {
      // Reset for new match. Pre-fill the date to match the selected week so the
      // week tile and the date start out in sync.
      setHomeTeamId(null);
      setAwayTeamId(null);
      setVenueId(null);
      setDate(seasonStartDate ? dateForWeek(weekNumber, seasonStartDate) : "");
      setIsBye(false);
      setByeTeamId(null);
    }
  }, [isOpen, match, isNewMatch, weekNumber, seasonStartDate]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSwapTeams = () => {
    const temp = homeTeamId;
    setHomeTeamId(awayTeamId);
    setAwayTeamId(temp);
  };

  // Picking a date derives the week (so a date a week out lands in the next week).
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (isNewMatch && onWeekChange && seasonStartDate) {
      const wk = weekFromDate(newDate, seasonStartDate);
      if (wk) onWeekChange(wk);
    }
  };

  // Picking a week tile fills in that week's date, keeping the two in sync.
  const handleWeekSelect = (week: number) => {
    if (onWeekChange) onWeekChange(week);
    if (seasonStartDate) {
      const d = dateForWeek(week, seasonStartDate);
      if (d) setDate(d);
    }
  };

  const handleSave = () => {
    const homeTeam = teams.find((t) => t.team === homeTeamId);
    const awayTeam = teams.find((t) => t.team === awayTeamId);
    const byeTeam = teams.find((t) => t.team === byeTeamId);
    const venue = venues.find((v) => v.id === venueId);

    const updatedMatch: ScheduleMatch = {
      ...match,
      temp_id: match?.temp_id || `new-${Date.now()}`,
      home_team_id: isBye ? null : homeTeamId,
      home_team_name: isBye ? undefined : homeTeam?.team_detail?.name,
      away_team_id: isBye ? null : awayTeamId,
      away_team_name: isBye ? undefined : awayTeam?.team_detail?.name,
      venue_id: isBye ? null : venueId,
      venue_name: isBye ? undefined : venue?.name,
      date: date,
      is_bye: isBye,
      bye_team_id: isBye ? byeTeamId || undefined : undefined,
      bye_team_name: isBye ? byeTeam?.team_detail?.name : undefined,
    };

    onSave(updatedMatch);
    onClose();
  };

  const isValid = isBye
    ? !!byeTeamId && !!date
    : !!homeTeamId && !!awayTeamId && homeTeamId !== awayTeamId && !!date;

  // Filter out teams that are already selected for the other side
  const availableTeamsForHome = teams.filter((t) => t.team !== awayTeamId);
  const availableTeamsForAway = teams.filter((t) => t.team !== homeTeamId);

  // Week selection (new matches only). The currently-selected week is derived
  // from the chosen date when a season start date is available (date is the
  // source of truth); otherwise it falls back to the week passed in.
  const sortedWeeks = [...existingWeeks].sort((a, b) => a - b);
  const nextNewWeek =
    sortedWeeks.length > 0 ? Math.max(...sortedWeeks) + 1 : 1;
  const selectedWeek =
    (seasonStartDate && weekFromDate(date, seasonStartDate)) || weekNumber;
  const isNewWeekSelected = !sortedWeeks.includes(selectedWeek);

  // Reusable tile classes
  const tileClass = (selected: boolean) =>
    `p-3 rounded-lg border-2 text-left transition-all ${
      selected
        ? "border-primary bg-primary-50"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-dark">
              {isNewMatch ? "Add Match" : "Edit Match"} - Week{" "}
              {isNewMatch ? selectedWeek : weekNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Week selector (new matches only) */}
            {isNewMatch && onWeekChange && (
              <div className="form-group">
                <label className="form-label">Week</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {sortedWeeks.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWeekSelect(w)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedWeek === w
                          ? "border-primary bg-primary-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-dark text-sm">
                        Week {w}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleWeekSelect(nextNewWeek)}
                    className={`p-3 rounded-lg border-2 border-dashed text-center transition-all ${
                      isNewWeekSelected
                        ? "border-primary bg-primary-50"
                        : "border-gray-300 bg-gray-50 hover:border-primary"
                    }`}
                  >
                    <span className="font-medium text-sm text-dark-300 flex items-center justify-center gap-1">
                      <Plus className="h-4 w-4" />
                      Week {isNewWeekSelected ? selectedWeek : nextNewWeek}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Bye toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBye}
                  onChange={(e) => setIsBye(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-cream-300 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-dark">
                  Mark as Bye (team not playing this week)
                </span>
              </label>
            </div>

            {isBye ? (
              /* Bye team selection */
              <div className="form-group">
                <label className="form-label">Team with Bye</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                  {teams.map((t) => (
                    <button
                      key={t.team}
                      type="button"
                      onClick={() => setByeTeamId(t.team)}
                      className={tileClass(byeTeamId === t.team)}
                    >
                      <p className="font-medium text-dark text-sm truncate">
                        {t.team_detail?.name || `Team ${t.team}`}
                      </p>
                      {t.team_detail?.establishment && (
                        <p className="text-xs text-dark-300 truncate mt-1">
                          {t.team_detail.establishment}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Regular match fields */
              <>
                {/* Home Team */}
                <div className="form-group">
                  <label className="form-label">Home Team</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {availableTeamsForHome.map((t) => (
                      <button
                        key={t.team}
                        type="button"
                        onClick={() => setHomeTeamId(t.team)}
                        className={tileClass(homeTeamId === t.team)}
                      >
                        <p className="font-medium text-dark text-sm truncate">
                          {t.team_detail?.name || `Team ${t.team}`}
                        </p>
                        {t.team_detail?.establishment && (
                          <p className="text-xs text-dark-300 truncate mt-1">
                            {t.team_detail.establishment}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Swap button */}
                {homeTeamId && awayTeamId && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleSwapTeams}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-cream-100 hover:bg-cream-200 transition-colors text-sm text-dark-400"
                      title="Swap home and away"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Swap Home / Away
                    </button>
                  </div>
                )}

                {/* Away Team */}
                <div className="form-group">
                  <label className="form-label">Away Team</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {availableTeamsForAway.map((t) => (
                      <button
                        key={t.team}
                        type="button"
                        onClick={() => setAwayTeamId(t.team)}
                        className={tileClass(awayTeamId === t.team)}
                      >
                        <p className="font-medium text-dark text-sm truncate">
                          {t.team_detail?.name || `Team ${t.team}`}
                        </p>
                        {t.team_detail?.establishment && (
                          <p className="text-xs text-dark-300 truncate mt-1">
                            {t.team_detail.establishment}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Venue */}
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  {venues.length === 0 ? (
                    <p className="text-sm text-dark-300">
                      No venues available.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                      {venues.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVenueId(v.id)}
                          className={tileClass(venueId === v.id)}
                        >
                          <p className="font-medium text-dark text-sm truncate">
                            {v.name}
                          </p>
                          {v.address && (
                            <p className="text-xs text-dark-300 truncate mt-1">
                              {v.address}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="form-input"
              />
              {isNewMatch && seasonStartDate && date && (
                <p className="text-xs text-dark-300 mt-1">
                  This match falls in Week {selectedWeek}.
                </p>
              )}
            </div>

            {/* Validation error */}
            {!isBye && homeTeamId && awayTeamId && homeTeamId === awayTeamId && (
              <p className="text-red-500 text-sm">
                Home and away teams must be different.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-cream-50">
            <div>
              {onDelete && !isNewMatch && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNewMatch ? "Add Match" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMatchEditModal;
