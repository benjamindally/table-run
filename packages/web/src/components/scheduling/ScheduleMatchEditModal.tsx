import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeftRight, Trash2, Calendar } from "lucide-react";
import type { ScheduleMatch, Venue, SeasonParticipation } from "../../api";
import { SearchableSelect } from "./SearchableSelect";

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
  // For new matches: notified when the derived week changes (kept in sync with
  // the chosen date) so the parent can group the match into the right week.
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
  onWeekChange,
  seasonStartDate = "",
}) => {
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  // Tracks whether the operator has explicitly chosen a venue. Until they do,
  // the venue auto-follows the home team's home venue.
  const [venueTouched, setVenueTouched] = useState(false);
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
      // Existing matches already have a venue chosen — don't auto-override it.
      setVenueTouched(true);
      setDate(match.date || "");
      setIsBye(match.is_bye || false);
      setByeTeamId(match.bye_team_id || null);
    } else if (isNewMatch) {
      // Reset for new match. Pre-fill the date to match the selected week so the
      // week tile and the date start out in sync.
      setHomeTeamId(null);
      setAwayTeamId(null);
      setVenueId(null);
      setVenueTouched(false);
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

  // The home team hosts, so default the venue to that team's home venue. The
  // operator can still override it (which sets venueTouched and stops the
  // auto-follow).
  const handleHomeTeamChange = (id: number | null) => {
    setHomeTeamId(id);
    if (!venueTouched && id != null) {
      const participation = teams.find((t) => t.team === id);
      const homeVenue = participation?.venue;
      if (homeVenue != null) setVenueId(homeVenue);
    }
  };

  // Picking a date derives the week (so a date a week out lands in the next week).
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (isNewMatch && onWeekChange && seasonStartDate) {
      const wk = weekFromDate(newDate, seasonStartDate);
      if (wk) onWeekChange(wk);
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

  // For new matches the week is derived from the chosen date (the date is the
  // source of truth) when a season start date is available; otherwise it falls
  // back to the week passed in. The operator picks the date directly — there
  // is no separate week picker.
  const selectedWeek =
    (seasonStartDate && weekFromDate(date, seasonStartDate)) || weekNumber;

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
            {/* Date picker (top). The match date is the source of truth for
                which week a new match belongs to, so it leads the form. */}
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <label className="form-label flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                Match Date
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="date"
                  value={date}
                  min={seasonStartDate || undefined}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="form-input flex-1"
                />
                {date && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-700">
                    Week {selectedWeek}
                  </span>
                )}
              </div>
            </div>

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
                <SearchableSelect
                  options={teams.map((t) => ({
                    value: t.team,
                    label: t.team_detail?.name || `Team ${t.team}`,
                    sublabel: t.team_detail?.establishment,
                  }))}
                  value={byeTeamId}
                  onChange={setByeTeamId}
                  placeholder="Select team..."
                  searchPlaceholder="Search teams..."
                />
              </div>
            ) : (
              /* Regular match fields */
              <>
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
                {/* Away Team — listed first ("away at home"); the home team
                    hosts and is shown last. */}
                <div className="form-group">
                  <label className="form-label">Away Team</label>
                  <SearchableSelect
                    options={availableTeamsForAway.map((t) => ({
                      value: t.team,
                      label: t.team_detail?.name || `Team ${t.team}`,
                      sublabel: t.team_detail?.establishment,
                    }))}
                    value={awayTeamId}
                    onChange={setAwayTeamId}
                    placeholder="Select away team..."
                    searchPlaceholder="Search teams..."
                  />
                </div>

                {/* Home Team — hosts the match, listed last. */}
                <div className="form-group">
                  <label className="form-label">Home Team</label>
                  <SearchableSelect
                    options={availableTeamsForHome.map((t) => ({
                      value: t.team,
                      label: t.team_detail?.name || `Team ${t.team}`,
                      sublabel: t.team_detail?.establishment,
                    }))}
                    value={homeTeamId}
                    onChange={handleHomeTeamChange}
                    placeholder="Select home team..."
                    searchPlaceholder="Search teams..."
                  />
                </div>

                {/* Venue — defaults to the home team's venue, editable. */}
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  {venues.length === 0 ? (
                    <p className="text-sm text-dark-300">
                      No venues available.
                    </p>
                  ) : (
                    <SearchableSelect
                      options={venues.map((v) => ({
                        value: v.id,
                        label: v.name,
                        sublabel: v.address,
                      }))}
                      value={venueId}
                      onChange={(v) => {
                        setVenueId(v);
                        setVenueTouched(true);
                      }}
                      placeholder="Select venue..."
                      searchPlaceholder="Search venues..."
                    />
                  )}
                </div>
              </>
            )}

            {/* Validation error */}
            {!isBye &&
              homeTeamId &&
              awayTeamId &&
              homeTeamId === awayTeamId && (
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
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
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
