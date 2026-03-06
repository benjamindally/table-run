import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import type { PlayoffConfiguration, TeamStanding } from "../../api";
import type { PlayoffParamModalType } from "./PlayoffParameterGrid";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface PlayoffParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PlayoffParamModalType | null;
  config: PlayoffConfiguration;
  standings: TeamStanding[];
  onUpdateConfig: (updates: Partial<PlayoffConfiguration>) => void;
}

const PlayoffParameterModal: React.FC<PlayoffParameterModalProps> = ({
  isOpen,
  onClose,
  type,
  config,
  standings,
  onUpdateConfig,
}) => {
  const [localStartDate, setLocalStartDate] = useState("");

  useEffect(() => {
    if (isOpen && type === "start_date") {
      setLocalStartDate(config.start_date || "");
    }
  }, [isOpen, type, config.start_date]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const handleClose = () => {
    if (type === "start_date" && localStartDate && /^\d{4}-\d{2}-\d{2}$/.test(localStartDate)) {
      onUpdateConfig({ start_date: localStartDate });
    }
    onClose();
  };

  const renderContent = () => {
    switch (type) {
      case "team_count":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-6">
              How many teams should be in the playoff bracket?
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => {
                  const newCount = Math.max(2, config.team_count - 1);
                  const newIds = (config.team_ids ?? []).slice(0, newCount);
                  onUpdateConfig({ team_count: newCount, team_ids: newIds });
                }}
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Minus className="h-5 w-5 text-dark" />
              </button>
              <span className="text-4xl font-bold text-dark w-12 text-center">
                {config.team_count}
              </span>
              <button
                onClick={() => {
                  const maxTeams = standings.length || 16;
                  const newCount = Math.min(maxTeams, config.team_count + 1);
                  const currentIds = config.team_ids ?? [];
                  if (currentIds.length < newCount && standings.length >= newCount) {
                    const newIds = standings.slice(0, newCount).map((s) => s.team_id);
                    onUpdateConfig({ team_count: newCount, team_ids: newIds });
                  } else {
                    onUpdateConfig({ team_count: newCount });
                  }
                }}
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Plus className="h-5 w-5 text-dark" />
              </button>
            </div>
          </div>
        );

      case "teams":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-4">
              Select teams for the playoff bracket, ordered by standings.
            </p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {standings.map((ts) => {
                const isSelected = (config.team_ids ?? []).includes(ts.team_id);
                return (
                  <button
                    key={ts.team_id}
                    onClick={() => {
                      const current = config.team_ids ?? [];
                      const newIds = isSelected
                        ? current.filter((id) => id !== ts.team_id)
                        : [...current, ts.team_id];
                      onUpdateConfig({ team_ids: newIds, team_count: newIds.length });
                    }}
                    className={`w-full flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-cream-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-dark-400 w-6">#{ts.place}</span>
                      <div className="text-left">
                        <span className="text-sm font-medium text-dark">{ts.team_name}</span>
                        <span className="text-xs text-dark-400 ml-2">
                          {ts.wins}-{ts.losses} ({ts.win_percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "byes_for_top_seeds":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-6">
              How many top seeds get first round byes?
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() =>
                  onUpdateConfig({
                    byes_for_top_seeds: Math.max(0, config.byes_for_top_seeds - 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Minus className="h-5 w-5 text-dark" />
              </button>
              <span className="text-4xl font-bold text-dark w-12 text-center">
                {config.byes_for_top_seeds}
              </span>
              <button
                onClick={() =>
                  onUpdateConfig({
                    byes_for_top_seeds: Math.min(
                      Math.floor(config.team_count / 2),
                      config.byes_for_top_seeds + 1
                    ),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Plus className="h-5 w-5 text-dark" />
              </button>
            </div>
          </div>
        );

      case "consolation":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-4">
              Include a consolation bracket for teams that don't make the main bracket.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateConfig({ consolation: false })}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  !config.consolation
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-cream-300 text-dark-400 hover:border-dark-200"
                }`}
              >
                No
              </button>
              <button
                onClick={() => onUpdateConfig({ consolation: true })}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  config.consolation
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-cream-300 text-dark-400 hover:border-dark-200"
                }`}
              >
                Yes
              </button>
            </div>
          </div>
        );

      case "consolation_count":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-6">
              How many teams in the consolation bracket?
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() =>
                  onUpdateConfig({
                    consolation_count: Math.max(2, config.consolation_count - 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Minus className="h-5 w-5 text-dark" />
              </button>
              <span className="text-4xl font-bold text-dark w-12 text-center">
                {config.consolation_count}
              </span>
              <button
                onClick={() =>
                  onUpdateConfig({
                    consolation_count: Math.min(16, config.consolation_count + 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Plus className="h-5 w-5 text-dark" />
              </button>
            </div>
          </div>
        );

      case "consolation_byes":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-6">
              How many top seeds in consolation get first round byes?
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() =>
                  onUpdateConfig({
                    consolation_byes: Math.max(0, config.consolation_byes - 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Minus className="h-5 w-5 text-dark" />
              </button>
              <span className="text-4xl font-bold text-dark w-12 text-center">
                {config.consolation_byes}
              </span>
              <button
                onClick={() =>
                  onUpdateConfig({
                    consolation_byes: Math.min(
                      Math.floor(config.consolation_count / 2),
                      config.consolation_byes + 1
                    ),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Plus className="h-5 w-5 text-dark" />
              </button>
            </div>
          </div>
        );

      case "start_date":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-4">Enter the first playoff date.</p>
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        );

      case "days_between_rounds":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-6">
              How many days between each playoff round?
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() =>
                  onUpdateConfig({
                    days_between_rounds: Math.max(1, config.days_between_rounds - 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Minus className="h-5 w-5 text-dark" />
              </button>
              <span className="text-4xl font-bold text-dark w-12 text-center">
                {config.days_between_rounds}
              </span>
              <button
                onClick={() =>
                  onUpdateConfig({
                    days_between_rounds: Math.min(30, config.days_between_rounds + 1),
                  })
                }
                className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200"
              >
                <Plus className="h-5 w-5 text-dark" />
              </button>
            </div>
          </div>
        );

      case "default_match_day":
        return (
          <div>
            <p className="text-sm text-dark-400 mb-4">Select the default match day.</p>
            <div className="grid grid-cols-2 gap-2">
              {DAY_NAMES.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => {
                    onUpdateConfig({ default_match_day: idx });
                    onClose();
                  }}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    config.default_match_day === idx
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-cream-300 text-dark-400 hover:border-dark-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "team_count": return "Team Count";
      case "teams": return "Select Teams";
      case "byes_for_top_seeds": return "First Round Byes";
      case "consolation": return "Consolation Bracket";
      case "consolation_count": return "Consolation Teams";
      case "consolation_byes": return "Consolation Byes";
      case "start_date": return "Start Date";
      case "days_between_rounds": return "Days Between Rounds";
      case "default_match_day": return "Default Match Day";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-dark">{getTitle()}</h2>
            <button
              onClick={handleClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6">{renderContent()}</div>
          <div className="p-4 border-t flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayoffParameterModal;
