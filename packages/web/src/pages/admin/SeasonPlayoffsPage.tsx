import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Save, Loader2, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import {
  useSeason,
  useSeasonStandings,
  usePlayoffs,
  useGeneratePlayoffs,
  useSavePlayoffs,
} from "../../hooks/useSeasons";
import {
  PlayoffParameterGrid,
  PlayoffParameterModal,
  PlayoffBracketView,
  PlayoffMatchupEditModal,
  type PlayoffParamModalType,
} from "../../components/playoffs";
import type {
  PlayoffConfiguration,
  PlayoffBracketData,
  PlayoffMatchup,
  PlayoffWarning,
  GeneratePlayoffsResponse,
  TeamStanding,
} from "../../api";
import { useAuth } from "../../contexts/AuthContext";

const SeasonPlayoffsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seasonId = parseInt(id || "0");
  const { leagueData } = useAuth();

  // Data hooks
  const { data: season, isLoading: isLoadingSeason } = useSeason(seasonId);
  const { data: standingsResp, isLoading: isLoadingStandings } = useSeasonStandings(seasonId);
  const { data: savedBrackets, isLoading: isLoadingPlayoffs } = usePlayoffs(seasonId);

  // Mutations
  const generatePlayoffsMutation = useGeneratePlayoffs();
  const savePlayoffsMutation = useSavePlayoffs();

  // Determine operator status
  const isOperator = season ? leagueData.isLeagueOperator(season.league) : false;

  // Standings sorted by place
  const standings: TeamStanding[] = (standingsResp?.standings ?? []).sort(
    (a, b) => a.place - b.place
  );

  // Configuration state
  const [config, setConfig] = useState<PlayoffConfiguration>({
    team_count: 6,
    byes_for_top_seeds: 2,
    consolation: false,
    consolation_count: 6,
    consolation_byes: 2,
    start_date: "",
    days_between_rounds: 7,
    default_match_day: 2,
  });
  const [configInitialized, setConfigInitialized] = useState(false);

  // Preview state
  const [previewResponse, setPreviewResponse] = useState<GeneratePlayoffsResponse | null>(null);
  const [warnings, setWarnings] = useState<PlayoffWarning[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<"main" | "consolation">("main");

  // Modal state
  const [activeParamModal, setActiveParamModal] = useState<PlayoffParamModalType | null>(null);
  const [editingMatchup, setEditingMatchup] = useState<{
    roundIdx: number;
    matchupIdx: number;
    bracketType: "main" | "consolation";
  } | null>(null);

  // Initialize config from standings when they load
  React.useEffect(() => {
    if (standings.length > 0 && !configInitialized) {
      const topTeamIds = standings.slice(0, config.team_count).map((s) => s.team_id);
      setConfig((prev) => ({ ...prev, team_ids: topTeamIds }));
      setConfigInitialized(true);
    }
  }, [standings, configInitialized, config.team_count]);

  // Update config
  const handleUpdateConfig = useCallback(
    (updates: Partial<PlayoffConfiguration>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Generate playoffs
  const handleGenerate = async () => {
    if (!config.start_date) {
      toast.error("Please set a start date");
      return;
    }

    try {
      const result = await generatePlayoffsMutation.mutateAsync({
        seasonId,
        config,
      });
      setPreviewResponse(result);
      setWarnings(result.warnings ?? []);
      setActiveTab("main");
      toast.success("Playoff bracket generated! Review and save when ready.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate playoffs");
    }
  };

  // Save playoffs
  const handleSave = async () => {
    if (!previewResponse) return;

    const mainBracket = previewResponse.main_bracket;
    const consolationBracket = previewResponse.consolation_bracket;

    const flattenMatchups = (bracket: PlayoffBracketData): PlayoffMatchup[] => {
      if (bracket.rounds) {
        return bracket.rounds.flatMap((r) => r.matchups);
      }
      return bracket.matchups ?? [];
    };

    try {
      const result = await savePlayoffsMutation.mutateAsync({
        seasonId,
        data: {
          main_bracket: {
            name: mainBracket.name || `${season?.name} Playoffs`,
            seeds: mainBracket.seeds,
            matchups: flattenMatchups(mainBracket),
            start_date: config.start_date,
            days_between_rounds: config.days_between_rounds,
            default_match_day: config.default_match_day,
          },
          consolation_bracket: consolationBracket
            ? {
                name: consolationBracket.name || `${season?.name} Consolation`,
                seeds: consolationBracket.seeds,
                matchups: flattenMatchups(consolationBracket),
                start_date: config.start_date,
                days_between_rounds: config.days_between_rounds,
                default_match_day: config.default_match_day,
              }
            : null,
          replace_existing: false,
        },
      });
      toast.success(result.message ?? "Playoff bracket saved successfully!");
      setPreviewResponse(null);
      setWarnings([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to save playoffs");
    }
  };

  // Edit matchup in preview
  const handleEditMatchup = (roundIdx: number, matchupIdx: number) => {
    setEditingMatchup({ roundIdx, matchupIdx, bracketType: activeTab });
  };

  const handleSaveMatchup = (updated: PlayoffMatchup) => {
    if (!editingMatchup || !previewResponse) return;

    setPreviewResponse((prev) => {
      if (!prev) return prev;
      const bracket =
        editingMatchup.bracketType === "main"
          ? prev.main_bracket
          : prev.consolation_bracket;
      if (!bracket || !bracket.rounds) return prev;

      const newRounds = bracket.rounds.map((round, rIdx) => {
        if (rIdx !== editingMatchup.roundIdx) return round;
        return {
          ...round,
          matchups: round.matchups.map((m, mIdx) =>
            mIdx === editingMatchup.matchupIdx ? updated : m
          ),
        };
      });

      const newBracket = { ...bracket, rounds: newRounds };
      return editingMatchup.bracketType === "main"
        ? { ...prev, main_bracket: newBracket }
        : { ...prev, consolation_bracket: newBracket };
    });

    setEditingMatchup(null);
  };

  // Get current editing matchup data
  const getEditingMatchup = (): PlayoffMatchup | null => {
    if (!editingMatchup || !previewResponse) return null;
    const bracket =
      editingMatchup.bracketType === "main"
        ? previewResponse.main_bracket
        : previewResponse.consolation_bracket;
    if (!bracket?.rounds) return null;
    return bracket.rounds[editingMatchup.roundIdx]?.matchups[editingMatchup.matchupIdx] ?? null;
  };

  const getEditingSeeds = () => {
    if (!editingMatchup || !previewResponse) return [];
    const bracket =
      editingMatchup.bracketType === "main"
        ? previewResponse.main_bracket
        : previewResponse.consolation_bracket;
    return bracket?.seeds ?? [];
  };

  // Determine what to display
  const isPreview = previewResponse !== null;
  const mainBracket = isPreview
    ? previewResponse.main_bracket
    : (savedBrackets ?? []).find((b) => b.bracket_type === "main") ?? null;
  const consolationBracket = isPreview
    ? previewResponse.consolation_bracket
    : (savedBrackets ?? []).find((b) => b.bracket_type === "consolation") ?? null;
  const hasConsolation = consolationBracket !== null;
  const activeBracket = activeTab === "main" ? mainBracket : consolationBracket;
  const activeSeeds = activeBracket?.seeds ?? [];

  // Loading state
  if (isLoadingSeason || isLoadingStandings || isLoadingPlayoffs) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-dark-400">Loading playoff data...</span>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl sm:text-2xl font-bold text-dark">Playoffs</h1>
          <p className="text-dark-400">
            {season?.name} — {season?.league_detail?.name}
          </p>
        </div>
      </div>

      {/* Operator Config Panel */}
      {isOperator && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Playoff Parameters</h2>
          <PlayoffParameterGrid
            config={config}
            standings={standings}
            onOpenModal={setActiveParamModal}
          />

          {/* Generate button */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-cream-200">
            <button
              onClick={handleGenerate}
              disabled={generatePlayoffsMutation.isPending || !config.start_date}
              className="btn btn-primary flex items-center disabled:opacity-50"
            >
              {generatePlayoffsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate Playoffs
            </button>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview banner */}
      {isPreview && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700 font-medium">
            Preview — not saved yet. Review the bracket then click Save.
          </span>
        </div>
      )}

      {/* Seeds summary */}
      {activeBracket && activeSeeds.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-bold text-dark mb-3">Seedings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {activeSeeds.map((seed) => (
              <div
                key={seed.seed_number}
                className="flex items-center justify-between py-1.5 px-2 bg-cream-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">#{seed.seed_number}</span>
                  <span className="text-sm text-dark truncate">{seed.team_name}</span>
                </div>
                <span className="text-xs text-dark-400 ml-2 flex-shrink-0">
                  {seed.wins}-{seed.losses}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      {hasConsolation && (
        <div className="flex bg-white rounded-lg shadow-sm overflow-hidden border border-cream-300">
          <button
            onClick={() => setActiveTab("main")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "main"
                ? "bg-primary text-white"
                : "text-dark-400 hover:bg-cream-50"
            }`}
          >
            Main Bracket
          </button>
          <button
            onClick={() => setActiveTab("consolation")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "consolation"
                ? "bg-primary text-white"
                : "text-dark-400 hover:bg-cream-50"
            }`}
          >
            Consolation
          </button>
        </div>
      )}

      {/* Bracket View */}
      {activeBracket ? (
        <PlayoffBracketView
          bracket={activeBracket}
          seeds={activeSeeds}
          isPreview={isPreview}
          isOperator={isOperator}
          onEditMatchup={handleEditMatchup}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Trophy className="h-12 w-12 text-cream-400 mx-auto mb-4" />
          <p className="text-dark-300">
            {isOperator
              ? "No playoffs yet. Configure parameters above and generate a bracket."
              : "No playoff bracket has been generated yet."}
          </p>
        </div>
      )}

      {/* Save button */}
      {isPreview && isOperator && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={savePlayoffsMutation.isPending}
            className="btn btn-primary flex items-center"
          >
            {savePlayoffsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Playoff Bracket
          </button>
        </div>
      )}

      {/* Parameter Modal */}
      <PlayoffParameterModal
        isOpen={activeParamModal !== null}
        onClose={() => setActiveParamModal(null)}
        type={activeParamModal}
        config={config}
        standings={standings}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Matchup Edit Modal */}
      <PlayoffMatchupEditModal
        isOpen={editingMatchup !== null}
        onClose={() => setEditingMatchup(null)}
        matchup={getEditingMatchup()}
        seeds={getEditingSeeds()}
        onSave={handleSaveMatchup}
      />
    </div>
  );
};

export default SeasonPlayoffsPage;
