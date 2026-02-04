import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Info, Plus, Minus, Trash2, Calendar } from "lucide-react";
import type { ScheduleConfiguration, Venue, SeasonParticipation } from "../../api/types";
import type { ParamModalType } from "./ScheduleParameterGrid";

// Break week entry with both date and calculated week number
interface BreakWeekEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  weekNumber: number; // Calculated week number based on start_date
}

interface VenueTableUpdate {
  venueId: number;
  tableCount: number;
}

interface ScheduleParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ParamModalType | null;
  config: ScheduleConfiguration;
  teams: SeasonParticipation[];
  venues: Venue[];
  onUpdateConfig: (updates: Partial<ScheduleConfiguration>) => void;
  onUpdateVenueTables?: (updates: VenueTableUpdate[]) => Promise<void>;
  seasonWeeksEstimate?: number; // Estimated number of weeks based on teams and times_play_each_other
  seasonId: number;
}

const ScheduleParameterModal: React.FC<ScheduleParameterModalProps> = ({
  isOpen,
  onClose,
  type,
  config,
  teams,
  venues,
  onUpdateConfig,
  onUpdateVenueTables,
  seasonWeeksEstimate = 14,
  seasonId,
}) => {
  const navigate = useNavigate();

  // Local state for editing
  const [localValue, setLocalValue] = useState<any>(null);

  // Break weeks specific state
  const [isAddingBreakWeek, setIsAddingBreakWeek] = useState(false);
  const [newBreakWeekDate, setNewBreakWeekDate] = useState("");

  // Venue tables specific state
  const [editingVenueTableCounts, setEditingVenueTableCounts] = useState<Record<number, number>>({});
  const [isSavingVenues, setIsSavingVenues] = useState(false);

  // Helper: Calculate week number from a date based on start_date
  const calculateWeekNumber = (date: string, startDate: string): number => {
    const start = new Date(startDate + "T00:00:00");
    const target = new Date(date + "T00:00:00");
    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  // Helper: Format date for display
  const formatDisplayDate = (dateStr: string): string => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper: Add a break week
  const handleAddBreakWeek = () => {
    if (!newBreakWeekDate || !config.start_date) return;

    const weekNumber = calculateWeekNumber(newBreakWeekDate, config.start_date);

    if (weekNumber < 1) {
      return; // Date is before season start
    }

    const newEntry: BreakWeekEntry = { date: newBreakWeekDate, weekNumber };
    const currentList = (localValue as BreakWeekEntry[]) || [];

    // Check for duplicate week numbers
    if (currentList.some((e) => e.weekNumber === weekNumber)) {
      return; // Already have a break for this week
    }

    setLocalValue(
      [...currentList, newEntry].sort((a, b) => a.weekNumber - b.weekNumber)
    );
    setNewBreakWeekDate("");
    setIsAddingBreakWeek(false);
  };

  // Helper: Remove a break week
  const removeBreakWeek = (index: number) => {
    const currentList = (localValue as BreakWeekEntry[]) || [];
    setLocalValue(currentList.filter((_, i) => i !== index));
  };

  // Helper: Increment table count for a venue
  const handleIncrementTables = (venueId: number) => {
    setEditingVenueTableCounts((prev) => ({
      ...prev,
      [venueId]: Math.min((prev[venueId] || 1) + 1, 20),
    }));
  };

  // Helper: Decrement table count for a venue
  const handleDecrementTables = (venueId: number) => {
    setEditingVenueTableCounts((prev) => ({
      ...prev,
      [venueId]: Math.max((prev[venueId] || 1) - 1, 1),
    }));
  };

  // Calculate venues with pending changes
  const pendingVenueChanges = venues.filter(
    (v) => editingVenueTableCounts[v.id] !== (v.table_count || 1)
  );

  // Reset local value when modal opens with new type
  useEffect(() => {
    if (isOpen && type) {
      switch (type) {
        case "start_date":
          setLocalValue(config.start_date || "");
          break;
        case "tables_per_establishment":
          // Initialize editing state from venue table_count values
          const counts: Record<number, number> = {};
          venues.forEach((v) => {
            counts[v.id] = v.table_count || 1;
          });
          setEditingVenueTableCounts(counts);
          setLocalValue(null); // Not used for this type
          break;
        case "matches_per_week":
          setLocalValue(config.matches_per_week || 2);
          break;
        case "times_play_each_other":
          setLocalValue(config.times_play_each_other || 1);
          break;
        case "alternating_home_away":
          setLocalValue(config.alternating_home_away ?? true);
          break;
        case "break_weeks":
          // Convert existing week numbers to BreakWeekEntry format
          const existingWeeks = config.break_weeks || [];
          if (config.start_date && existingWeeks.length > 0) {
            const entries: BreakWeekEntry[] = existingWeeks.map((weekNum) => {
              // Calculate the date for this week number (start of that week)
              const start = new Date(config.start_date + "T00:00:00");
              start.setDate(start.getDate() + (weekNum - 1) * 7);
              return {
                weekNumber: weekNum,
                date: start.toISOString().split("T")[0],
              };
            });
            setLocalValue(entries);
          } else {
            setLocalValue([]);
          }
          // Reset break week form state
          setIsAddingBreakWeek(false);
          setNewBreakWeekDate("");
          break;
        default:
          setLocalValue(null);
      }
    }
  }, [isOpen, type, config]);

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

  if (!isOpen || !type) return null;

  const handleSave = async () => {
    switch (type) {
      case "start_date":
        onUpdateConfig({ start_date: localValue });
        break;
      case "tables_per_establishment":
        // Save venue table counts via API
        if (onUpdateVenueTables && pendingVenueChanges.length > 0) {
          setIsSavingVenues(true);
          try {
            const updates = pendingVenueChanges.map((venue) => ({
              venueId: venue.id,
              tableCount: editingVenueTableCounts[venue.id],
            }));
            await onUpdateVenueTables(updates);
          } finally {
            setIsSavingVenues(false);
          }
        }
        break;
      case "matches_per_week":
        onUpdateConfig({ matches_per_week: localValue });
        break;
      case "times_play_each_other":
        onUpdateConfig({ times_play_each_other: localValue });
        break;
      case "alternating_home_away":
        onUpdateConfig({ alternating_home_away: localValue });
        break;
      case "break_weeks":
        // Extract just the week numbers from BreakWeekEntry array
        const entries = (localValue as BreakWeekEntry[]) || [];
        onUpdateConfig({ break_weeks: entries.map((e) => e.weekNumber) });
        break;
    }
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case "start_date":
        return "Start Date";
      case "teams":
        return "Teams";
      case "establishments":
        return "Establishments";
      case "tables_per_establishment":
        return "Adjust Tables";
      case "matches_per_week":
        return "Matches per Week";
      case "times_play_each_other":
        return "Times Teams Play Each Other";
      case "alternating_home_away":
        return "Home/Away Assignment";
      case "break_weeks":
        return "Break Weeks (Holidays)";
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (type) {
      case "start_date":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Select the date when the first week of matches will begin.
            </p>
            <input
              type="date"
              value={localValue || ""}
              onChange={(e) => setLocalValue(e.target.value)}
              className="form-input w-full"
            />
          </div>
        );

      case "teams":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Teams participating in this season. This is determined by team registrations.
            </p>
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 mb-4">No teams registered yet.</p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/seasons/${seasonId}/teams`)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Teams
                </button>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {teams.map((participation) => (
                  <div
                    key={participation.id}
                    className="p-3 bg-cream-50 rounded-lg border border-cream-200"
                  >
                    <p className="font-medium text-dark">
                      {participation.team_detail?.name || `Team ${participation.team}`}
                    </p>
                    <p className="text-sm text-dark-400">
                      {participation.team_detail?.establishment || "No venue"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "establishments":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Venues available for scheduling matches. Managed at the league level.
            </p>
            {venues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 mb-4">No venues configured yet.</p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/seasons/${seasonId}/venues`)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venues
                </button>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="p-3 bg-cream-50 rounded-lg border border-cream-200"
                  >
                    <p className="font-medium text-dark">{venue.name}</p>
                    {venue.address && (
                      <p className="text-sm text-dark-400">{venue.address}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "tables_per_establishment":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Set the number of pool tables at each venue. This affects scheduling capacity.
            </p>

            {venues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 mb-4">No venues configured yet.</p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/seasons/${seasonId}/venues`)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venues
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {venues.map((venue) => {
                  const currentCount = editingVenueTableCounts[venue.id] || venue.table_count || 1;
                  const hasChanged = currentCount !== (venue.table_count || 1);

                  return (
                    <div
                      key={venue.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        hasChanged
                          ? "bg-blue-50 border-blue-200"
                          : "bg-cream-50 border-cream-200"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-dark">{venue.name}</p>
                        {venue.address && (
                          <p className="text-sm text-dark-400">{venue.address}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrementTables(venue.id)}
                          disabled={currentCount <= 1 || isSavingVenues}
                          className="p-2 rounded-lg hover:bg-cream-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-lg">
                          {currentCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrementTables(venue.id)}
                          disabled={currentCount >= 20 || isSavingVenues}
                          className="p-2 rounded-lg hover:bg-cream-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pendingVenueChanges.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {pendingVenueChanges.length} venue(s) have unsaved changes.
                </p>
              </div>
            )}
          </div>
        );

      case "matches_per_week":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Number of matches to schedule each week. Maximum is {Math.floor(teams.length / 2)} based on {teams.length} teams.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max={Math.max(1, Math.floor(teams.length / 2))}
                value={localValue || 1}
                onChange={(e) => setLocalValue(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-dark w-16 text-center">
                {localValue}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                With {teams.length} teams playing each other {config.times_play_each_other || 1} time(s),
                scheduling {localValue} matches per week will require approximately{" "}
                {Math.ceil((teams.length * (teams.length - 1) * (config.times_play_each_other || 1)) / 2 / (localValue || 1))} weeks.
              </p>
            </div>
          </div>
        );

      case "times_play_each_other":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              How many times should each team play every other team during the season?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((times) => (
                <button
                  key={times}
                  type="button"
                  onClick={() => setLocalValue(times)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    localValue === times
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-cream-300 bg-white hover:border-cream-400"
                  }`}
                >
                  <span className="text-lg font-bold">{times}x</span>
                  <p className="text-xs mt-1">
                    {times === 1 ? "Single" : times === 2 ? "Double" : times === 3 ? "Triple" : "Quad"} Round Robin
                  </p>
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                With {teams.length} teams playing {localValue}x, total matches:{" "}
                {(teams.length * (teams.length - 1) * localValue) / 2}
              </p>
            </div>
          </div>
        );

      case "alternating_home_away":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Should teams alternate between home and away each week?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalValue(true)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  localValue === true
                    ? "border-primary-500 bg-primary-50"
                    : "border-cream-300 bg-white hover:border-cream-400"
                }`}
              >
                <span className="font-semibold text-dark">Alternating</span>
                <p className="text-sm text-dark-400 mt-1">
                  Teams switch between home and away each week for fairness.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLocalValue(false)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  localValue === false
                    ? "border-primary-500 bg-primary-50"
                    : "border-cream-300 bg-white hover:border-cream-400"
                }`}
              >
                <span className="font-semibold text-dark">Fixed</span>
                <p className="text-sm text-dark-400 mt-1">
                  Home/away determined by scheduling algorithm without alternation.
                </p>
              </button>
            </div>
          </div>
        );

      case "break_weeks":
        return (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Add break weeks when no matches will be scheduled (holidays, etc.).
            </p>

            {/* Warning if no start date set */}
            {!config.start_date && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Please set a start date first to add break weeks.
                </p>
              </div>
            )}

            {/* List of added break weeks */}
            {(localValue as BreakWeekEntry[])?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-dark">Scheduled Breaks:</p>
                {(localValue as BreakWeekEntry[]).map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                        <Calendar className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <span className="font-medium text-dark">
                          Week {entry.weekNumber}
                        </span>
                        <p className="text-sm text-dark-400">
                          {formatDisplayDate(entry.date)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBreakWeek(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add break week section */}
            {config.start_date && (
              <div className="border-t pt-4">
                {isAddingBreakWeek ? (
                  <div className="space-y-3 p-4 bg-cream-50 rounded-lg border border-cream-200">
                    <label className="block text-sm font-medium text-dark">
                      Select the week's start date:
                    </label>
                    <input
                      type="date"
                      value={newBreakWeekDate}
                      min={config.start_date}
                      onChange={(e) => setNewBreakWeekDate(e.target.value)}
                      className="form-input w-full"
                    />
                    {newBreakWeekDate && (
                      <p className="text-sm text-dark-400">
                        This will be <span className="font-medium">Week {calculateWeekNumber(newBreakWeekDate, config.start_date)}</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddBreakWeek}
                        disabled={!newBreakWeekDate || calculateWeekNumber(newBreakWeekDate, config.start_date) < 1}
                        className="btn btn-primary text-sm disabled:opacity-50"
                      >
                        Add Break
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBreakWeek(false);
                          setNewBreakWeekDate("");
                        }}
                        className="btn btn-outline text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingBreakWeek(true)}
                    className="btn btn-outline w-full flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Break Week
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const isReadOnly = type === "teams" || type === "establishments";

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
          className="relative bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-dark">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{renderContent()}</div>

          {/* Footer */}
          {!isReadOnly && (
            <div className="flex justify-end gap-3 p-6 border-t bg-cream-50">
              <button
                type="button"
                onClick={onClose}
                disabled={isSavingVenues}
                className="btn btn-outline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSavingVenues || (type === "tables_per_establishment" && pendingVenueChanges.length === 0)}
                className="btn btn-primary disabled:opacity-50"
              >
                {isSavingVenues ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleParameterModal;
