import React, { useState, useEffect } from "react";
import { X, ArrowLeftRight, Trash2 } from "lucide-react";
import type { ScheduleMatch, Venue, SeasonParticipation } from "../../api/types";

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
}

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
}) => {
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [isBye, setIsBye] = useState(false);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && match) {
      setHomeTeamId(match.home_team_id);
      setAwayTeamId(match.away_team_id);
      setVenueId(match.venue_id || null);
      setDate(match.date || "");
      setIsBye(match.is_bye || false);
      setByeTeamId(match.bye_team_id || null);
    } else if (isOpen && isNewMatch) {
      // Reset for new match
      setHomeTeamId(null);
      setAwayTeamId(null);
      setVenueId(null);
      setDate("");
      setIsBye(false);
      setByeTeamId(null);
    }
  }, [isOpen, match, isNewMatch]);

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

  // Filter out teams that are already selected
  const availableTeamsForHome = teams.filter(
    (t) => t.team !== awayTeamId
  );
  const availableTeamsForAway = teams.filter(
    (t) => t.team !== homeTeamId
  );

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
          className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-dark">
              {isNewMatch ? "Add Match" : "Edit Match"} - Week {weekNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
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
                <select
                  value={byeTeamId || ""}
                  onChange={(e) => setByeTeamId(e.target.value ? parseInt(e.target.value) : null)}
                  className="form-input"
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.team} value={t.team}>
                      {t.team_detail?.name || `Team ${t.team}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Regular match fields */
              <>
                {/* Home Team */}
                <div className="form-group">
                  <label className="form-label">Home Team</label>
                  <select
                    value={homeTeamId || ""}
                    onChange={(e) => setHomeTeamId(e.target.value ? parseInt(e.target.value) : null)}
                    className="form-input"
                  >
                    <option value="">Select home team...</option>
                    {availableTeamsForHome.map((t) => (
                      <option key={t.team} value={t.team}>
                        {t.team_detail?.name || `Team ${t.team}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwapTeams}
                    className="p-2 rounded-full bg-cream-100 hover:bg-cream-200 transition-colors"
                    title="Swap home and away"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-dark-400" />
                  </button>
                </div>

                {/* Away Team */}
                <div className="form-group">
                  <label className="form-label">Away Team</label>
                  <select
                    value={awayTeamId || ""}
                    onChange={(e) => setAwayTeamId(e.target.value ? parseInt(e.target.value) : null)}
                    className="form-input"
                  >
                    <option value="">Select away team...</option>
                    {availableTeamsForAway.map((t) => (
                      <option key={t.team} value={t.team}>
                        {t.team_detail?.name || `Team ${t.team}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Venue */}
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <select
                    value={venueId || ""}
                    onChange={(e) => setVenueId(e.target.value ? parseInt(e.target.value) : null)}
                    className="form-input"
                  >
                    <option value="">Select venue...</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
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
