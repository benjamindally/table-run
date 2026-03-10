import React, { useState, useEffect } from "react";
import { X, RefreshCw, Info, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useRolloverPreview, useRolloverSeason } from "../../hooks/useSeasons";
import { toast } from "react-toastify";
import type { ScoringConfig } from "../../api";
import ScoringConfigSection from "../ScoringConfigSection";

interface SeasonRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: number;
  seasonName: string;
  onSuccess: (newSeasonId: number) => void;
}

const SeasonRolloverModal: React.FC<SeasonRolloverModalProps> = ({
  isOpen,
  onClose,
  seasonId,
  seasonName,
  onSuccess,
}) => {
  const { data: preview, isLoading: previewLoading, error: previewError } = useRolloverPreview(seasonId, isOpen);
  const rolloverMutation = useRolloverSeason();

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
  const [scoringConfig, setScoringConfig] = useState<Partial<ScoringConfig>>({});
  const [scoringExpanded, setScoringExpanded] = useState(false);

  // Initialize form when preview loads
  useEffect(() => {
    if (preview) {
      setSelectedTeamIds(new Set(preview.teams.map((t) => t.team_id)));
      setScoringConfig({ ...preview.scoring_config });
      setScoringExpanded(false);
      setName("");
      setStartDate("");
      setEndDate("");
    }
  }, [preview]);

  // Close on escape
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

  const toggleTeam = (teamId: number) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const selectAllTeams = () => {
    if (preview) {
      setSelectedTeamIds(new Set(preview.teams.map((t) => t.team_id)));
    }
  };

  const deselectAllTeams = () => {
    setSelectedTeamIds(new Set());
  };

  const handleSubmit = async () => {
    if (!name.trim() || !startDate) {
      toast.error("Please enter a season name and start date.");
      return;
    }

    try {
      // Build partial scoring_config with only changed fields
      const originalConfig = preview?.scoring_config;
      let scoringDiff: Partial<ScoringConfig> | undefined;
      if (originalConfig) {
        const diff: Record<string, unknown> = {};
        for (const key of Object.keys(scoringConfig) as (keyof ScoringConfig)[]) {
          if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
          if (scoringConfig[key] !== originalConfig[key]) {
            diff[key] = scoringConfig[key];
          }
        }
        if (Object.keys(diff).length > 0) {
          scoringDiff = diff as Partial<ScoringConfig>;
        }
      }

      const result = await rolloverMutation.mutateAsync({
        seasonId,
        data: {
          name: name.trim(),
          start_date: startDate,
          end_date: endDate || null,
          team_ids: Array.from(selectedTeamIds),
          scoring_config: scoringDiff,
        },
      });
      toast.success(`Season "${result.name}" created successfully!`);
      onClose();
      onSuccess(result.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rollover season"
      );
    }
  };

  const config = preview?.scoring_config;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-dark">Rollover Season</h2>
              <p className="text-sm text-dark-300 mt-1">
                Create a new season from {seasonName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {previewLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-dark-300">Loading rollover preview...</p>
              </div>
            )}

            {previewError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {previewError instanceof Error
                  ? previewError.message
                  : "Failed to load rollover preview. You may not have permission."}
              </div>
            )}

            {preview && (
              <>
                {/* Season Name */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    New Season Name *
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer 2026"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      className="form-input w-full"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-input w-full"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Teams */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-dark">
                      Teams ({selectedTeamIds.size} of {preview.teams.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllTeams}
                        className="text-xs text-primary hover:text-primary-700"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-dark-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllTeams}
                        className="text-xs text-primary hover:text-primary-700"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-52 overflow-y-auto">
                    {preview.teams.map((team) => (
                      <button
                        key={team.team_id}
                        type="button"
                        onClick={() => toggleTeam(team.team_id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedTeamIds.has(team.team_id)
                            ? "border-primary bg-primary-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedTeamIds.has(team.team_id)
                                ? "border-primary bg-primary"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedTeamIds.has(team.team_id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-dark text-sm truncate">
                              {team.team_name}
                            </p>
                            {team.venue_name && (
                              <p className="text-xs text-dark-300 truncate">
                                {team.venue_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedTeamIds.size === 0 && preview.teams.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mt-2">
                      <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">
                        No teams selected. All teams from the source season will be rolled over.
                      </p>
                    </div>
                  )}
                </div>

                {/* Scoring Configuration */}
                {config && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setScoringExpanded(!scoringExpanded)}
                      className="flex items-center justify-between w-full text-left mb-2"
                    >
                      <label className="block text-sm font-medium text-dark cursor-pointer">
                        Scoring Configuration
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-300">
                          {scoringConfig.preset?.replace(/_/g, " ") || config.preset.replace(/_/g, " ")} · {scoringConfig.games_per_set ?? config.games_per_set} games/set
                        </span>
                        {scoringExpanded ? (
                          <ChevronDown className="h-4 w-4 text-dark-300" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-dark-300" />
                        )}
                      </div>
                    </button>
                    {scoringExpanded ? (
                      <div className="border border-cream-200 rounded-lg p-4">
                        <ScoringConfigSection
                          config={scoringConfig}
                          onChange={(updates) =>
                            setScoringConfig((prev) => ({ ...prev, ...updates }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="bg-cream-50 border border-cream-200 rounded-lg p-3 flex items-start gap-2">
                        <Info className="h-4 w-4 text-dark-300 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-dark-300">
                          Scoring config will carry over from {seasonName}. Click to expand and adjust.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {preview && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 border-t bg-cream-50">
              <button
                type="button"
                onClick={onClose}
                disabled={rolloverMutation.isPending}
                className="btn btn-outline w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  rolloverMutation.isPending ||
                  !name.trim() ||
                  !startDate
                }
                className="btn btn-primary flex items-center justify-center w-full sm:w-auto disabled:opacity-50"
              >
                {rolloverMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating Season...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create New Season
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonRolloverModal;
