import React, { useState, useEffect } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import type { PlayoffMatchup, PlayoffSeed } from "../../api";

interface PlayoffMatchupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchup: PlayoffMatchup | null;
  seeds: PlayoffSeed[];
  onSave: (updated: PlayoffMatchup) => void;
}

const PlayoffMatchupEditModal: React.FC<PlayoffMatchupEditModalProps> = ({
  isOpen,
  onClose,
  matchup,
  seeds,
  onSave,
}) => {
  const [homeSeedNumber, setHomeSeedNumber] = useState<number | null>(null);
  const [awaySeedNumber, setAwaySeedNumber] = useState<number | null>(null);
  const [isBye, setIsBye] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [venueName, setVenueName] = useState("");

  useEffect(() => {
    if (isOpen && matchup) {
      setHomeSeedNumber(matchup.home_seed_number);
      setAwaySeedNumber(matchup.away_seed_number);
      setIsBye(matchup.is_bye);
      setScheduledDate(matchup.scheduled_date || "");
      setVenueName(matchup.venue_name || "");
    }
  }, [isOpen, matchup]);

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

  if (!isOpen || !matchup) return null;

  const handleSwap = () => {
    setHomeSeedNumber(awaySeedNumber);
    setAwaySeedNumber(homeSeedNumber);
  };

  const handleSave = () => {
    onSave({
      ...matchup,
      home_seed_number: homeSeedNumber,
      away_seed_number: isBye ? null : awaySeedNumber,
      is_bye: isBye,
      scheduled_date: scheduledDate,
      venue_name: venueName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-lg transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <h2 className="text-lg font-bold text-dark">Edit Matchup</h2>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Home Seed */}
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">
                Home Seed
              </label>
              <select
                value={homeSeedNumber ?? ""}
                onChange={(e) =>
                  setHomeSeedNumber(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">TBD</option>
                {seeds.map((s) => (
                  <option key={s.seed_number} value={s.seed_number}>
                    #{s.seed_number} {s.team_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary font-medium hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Swap Home/Away
              </button>
            </div>

            {/* Away Seed */}
            {!isBye && (
              <div>
                <label className="block text-sm font-medium text-dark-600 mb-1">
                  Away Seed
                </label>
                <select
                  value={awaySeedNumber ?? ""}
                  onChange={(e) =>
                    setAwaySeedNumber(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">TBD</option>
                  {seeds.map((s) => (
                    <option key={s.seed_number} value={s.seed_number}>
                      #{s.seed_number} {s.team_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bye toggle */}
            <div className="flex items-center gap-3 py-2 border-t border-cream-200">
              <input
                type="checkbox"
                id="bye-toggle"
                checked={isBye}
                onChange={(e) => {
                  setIsBye(e.target.checked);
                  if (e.target.checked) setAwaySeedNumber(null);
                }}
                className="h-4 w-4 text-primary rounded border-cream-300 focus:ring-primary-300"
              />
              <label htmlFor="bye-toggle" className="text-sm text-dark-600">
                Mark as BYE
              </label>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Venue name"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-cream-300 rounded-lg text-dark-600 font-medium hover:bg-cream-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayoffMatchupEditModal;
