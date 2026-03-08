import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Building2,
  MapPin,
  Award,
  Users,
  LayoutGrid,
  Layers,
  Globe,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useCreateLeague,
  useUpdateLeague,
  useApplyScoringPreset,
  useUpdateScoringConfig,
} from "../../hooks/useLeagues";
import type { ScoringConfig, ScoringPreset } from "../../api";
import ScoringConfigSection from "../../components/ScoringConfigSection";
import { ParameterBox } from "../../components/scheduling";

const PRESET_DEFAULTS: Record<ScoringPreset, Partial<ScoringConfig>> = {
  bca_8ball: {
    preset: "bca_8ball",
    game_format: "ball_points_8ball",
    ball_value: 1,
    object_ball_value: 1,
    race_to: null,
    players_per_team: 4,
    games_per_round: 2,
    standings_format: "win_loss_pct",
    allow_ties: false,
    match_win_points: 2,
    match_tie_points: 1,
    match_loss_points: 0,
  },
  simple_win_loss: {
    preset: "simple_win_loss",
    game_format: "win_loss",
    ball_value: 1,
    object_ball_value: 1,
    race_to: null,
    players_per_team: 4,
    games_per_round: 1,
    standings_format: "win_loss_pct",
    allow_ties: false,
    match_win_points: 2,
    match_tie_points: 1,
    match_loss_points: 0,
  },
  vnea: {
    preset: "vnea",
    game_format: "ball_points_8ball",
    ball_value: 1,
    object_ball_value: 2,
    race_to: null,
    players_per_team: 4,
    games_per_round: 2,
    standings_format: "win_loss_pct",
    allow_ties: false,
    match_win_points: 2,
    match_tie_points: 1,
    match_loss_points: 0,
  },
  nine_ball: {
    preset: "nine_ball",
    game_format: "ball_points_9ball",
    ball_value: 1,
    object_ball_value: 2,
    race_to: null,
    players_per_team: 4,
    games_per_round: 2,
    standings_format: "win_loss_pct",
    allow_ties: false,
    match_win_points: 2,
    match_tie_points: 1,
    match_loss_points: 0,
  },
  race_to_wins: {
    preset: "race_to_wins",
    game_format: "race_to_wins",
    ball_value: 1,
    object_ball_value: 1,
    race_to: null,
    players_per_team: 4,
    games_per_round: 2,
    standings_format: "win_loss_pct",
    allow_ties: false,
    match_win_points: 2,
    match_tie_points: 1,
    match_loss_points: 0,
  },
  custom: {},
};

const PRESET_LABELS: Record<ScoringPreset, string> = {
  simple_win_loss: "Simple Win/Loss",
  bca_8ball: "BCA 8-Ball",
  vnea: "VNEA / 10-Point",
  nine_ball: "9-Ball Points",
  race_to_wins: "Race to Wins",
  custom: "Custom",
};

// ——————————————————————————————————————
// Modal wrapper
// ——————————————————————————————————————
interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  onClose,
  children,
  footer,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-dark">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
        {footer}
      </div>
    </div>
  </div>
);

// ——————————————————————————————————————
// Page
// ——————————————————————————————————————
interface BasicInfo {
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  sets_per_match: number;
  games_per_set: number;
  is_public: boolean;
}

const INITIAL_BASIC_INFO: BasicInfo = {
  name: "",
  description: "",
  city: "",
  state: "",
  country: "USA",
  sets_per_match: 4,
  games_per_set: 4,
  is_public: true,
};

const AdminCreateLeaguePage: React.FC = () => {
  const navigate = useNavigate();
  const createLeagueMutation = useCreateLeague();
  const updateLeagueMutation = useUpdateLeague();
  const applyPresetMutation = useApplyScoringPreset();
  const updateScoringConfigMutation = useUpdateScoringConfig();

  // Committed state
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(INITIAL_BASIC_INFO);
  const [scoringConfig, setScoringConfig] = useState<Partial<ScoringConfig>>(
    PRESET_DEFAULTS.bca_8ball
  );

  // Active modal
  const [activeModal, setActiveModal] = useState<
    "identity" | "location" | "scoring" | "players" | "games" | "sets" | "visibility" | null
  >(null);

  // Draft state (populated fresh when a modal opens)
  const [draftBasicInfo, setDraftBasicInfo] =
    useState<BasicInfo>(INITIAL_BASIC_INFO);
  const [draftScoringConfig, setDraftScoringConfig] = useState<
    Partial<ScoringConfig>
  >({ ...PRESET_DEFAULTS.bca_8ball });
  const [draftPlayersPerTeam, setDraftPlayersPerTeam] = useState(4);
  const [draftGamesPerSet, setDraftGamesPerSet] = useState(4);
  const [draftSetsPerMatch, setDraftSetsPerMatch] = useState(4);
  const [draftIsPublic, setDraftIsPublic] = useState(true);

  // Submission error
  const [submitError, setSubmitError] = useState("");

  // ——— Modal openers ———
  const openIdentityModal = () => {
    setDraftBasicInfo({ ...basicInfo });
    setActiveModal("identity");
  };

  const openLocationModal = () => {
    setDraftBasicInfo({ ...basicInfo });
    setActiveModal("location");
  };

  const openScoringModal = () => {
    setDraftScoringConfig({ ...scoringConfig });
    setActiveModal("scoring");
  };

  const openPlayersModal = () => {
    setDraftPlayersPerTeam(scoringConfig.players_per_team ?? 4);
    setActiveModal("players");
  };

  const openGamesModal = () => {
    setDraftGamesPerSet(basicInfo.games_per_set);
    setActiveModal("games");
  };

  const openSetsModal = () => {
    setDraftSetsPerMatch(basicInfo.sets_per_match);
    setActiveModal("sets");
  };

  const openVisibilityModal = () => {
    setDraftIsPublic(basicInfo.is_public);
    setActiveModal("visibility");
  };

  // ——— Modal savers ———
  const handleSaveIdentity = () => {
    setBasicInfo((prev) => ({
      ...prev,
      name: draftBasicInfo.name,
      description: draftBasicInfo.description,
    }));
    setActiveModal(null);
  };

  const handleSaveLocation = () => {
    setBasicInfo((prev) => ({
      ...prev,
      city: draftBasicInfo.city,
      state: draftBasicInfo.state,
      country: draftBasicInfo.country,
    }));
    setActiveModal(null);
  };

  const handleSaveScoring = () => {
    setScoringConfig({ ...draftScoringConfig });
    setActiveModal(null);
  };

  const handleSavePlayers = () => {
    setScoringConfig((prev) => ({
      ...prev,
      players_per_team: draftPlayersPerTeam,
    }));
    setActiveModal(null);
  };

  const handleSaveGames = () => {
    setBasicInfo((prev) => ({ ...prev, games_per_set: draftGamesPerSet }));
    setScoringConfig((prev) => ({
      ...prev,
      games_per_round: draftGamesPerSet,
    }));
    setActiveModal(null);
  };

  const handleSaveSets = () => {
    setBasicInfo((prev) => ({ ...prev, sets_per_match: draftSetsPerMatch }));
    setActiveModal(null);
  };

  const handleSaveVisibility = () => {
    setBasicInfo((prev) => ({ ...prev, is_public: draftIsPublic }));
    setActiveModal(null);
  };

  // In the creation flow preset clicks only update draft state (no league ID to hit yet)
  const handleDraftPresetSelect = async (preset: ScoringPreset) => {
    setDraftScoringConfig({ ...PRESET_DEFAULTS[preset] });
  };

  // ——— Derived display values ———
  const identityValue = basicInfo.name || "Name your league...";

  const locationValue =
    basicInfo.city && basicInfo.state
      ? `${basicInfo.city}, ${basicInfo.state}`
      : basicInfo.city || basicInfo.state || "Set location...";

  const scoringValue = PRESET_LABELS[scoringConfig.preset ?? "bca_8ball"];
  const playersValue = `${scoringConfig.players_per_team ?? 4} players`;
  const gamesValue = `${basicInfo.games_per_set} games / set`;
  const setsValue = `${basicInfo.sets_per_match} ${
    basicInfo.sets_per_match === 1 ? "set" : "sets"
  } / match`;
  const visibilityValue = basicInfo.is_public ? "Public" : "Private";

  // ——— Submit ———
  const validate = (): string | null => {
    if (!basicInfo.name.trim())
      return "League name is required — open League Identity to set it";
    if (!basicInfo.city.trim())
      return "City is required — open Location to set it";
    if (!basicInfo.state.trim())
      return "State is required — open Location to set it";
    if (
      scoringConfig.game_format === "race_to_wins" &&
      !scoringConfig.race_to
    ) {
      return '"Race To" value is required for this scoring format — open Scoring Format to set it';
    }
    return null;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      // Step 1: Create the league
      const newLeague = await createLeagueMutation.mutateAsync(basicInfo);

      // Step 2: Apply the chosen preset
      if (scoringConfig.preset && scoringConfig.preset !== "custom") {
        await applyPresetMutation.mutateAsync({
          leagueId: newLeague.id,
          preset: scoringConfig.preset as ScoringPreset,
        });
        // Patch player/game counts — the server preset sets defaults, but the operator may have changed them
        await Promise.all([
          updateScoringConfigMutation.mutateAsync({
            leagueId: newLeague.id,
            data: {
              players_per_team: scoringConfig.players_per_team ?? 3,
              games_per_round: basicInfo.games_per_set,
            },
          }),
          // sets_per_match lives on the League model, not ScoringConfig
          updateLeagueMutation.mutateAsync({
            id: newLeague.id,
            data: { sets_per_match: basicInfo.sets_per_match },
          }),
        ]);
      }

      // Step 3: If custom, patch the full config
      if (scoringConfig.preset === "custom") {
        const { preset: _preset, ...patchData } = scoringConfig;
        await updateScoringConfigMutation.mutateAsync({
          leagueId: newLeague.id,
          data: { ...patchData, preset: "custom" },
        });
      }

      toast.success("League created successfully!");
      navigate(`/admin/leagues/${newLeague.id}`);
    } catch {
      toast.error(
        "Something went wrong while creating your league. Please try again or email contact@leaguegenius.app.",
        { autoClose: 8000 }
      );
    }
  };

  const isSubmitting =
    createLeagueMutation.isPending ||
    applyPresetMutation.isPending ||
    updateScoringConfigMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/admin/leagues")}
          className="btn btn-outline btn-sm flex items-center"
          type="button"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark">
            Create League
          </h1>
          <p className="text-sm text-dark-300 mt-1">
            Configure your league settings before creating
          </p>
        </div>
      </div>

      {/* Tile Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">
          League Settings
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <ParameterBox
            icon={<Building2 className="h-6 w-6" />}
            label="League Name"
            value={identityValue}
            onClick={openIdentityModal}
          />
          <ParameterBox
            icon={<MapPin className="h-6 w-6" />}
            label="Location"
            value={locationValue}
            onClick={openLocationModal}
          />
          <ParameterBox
            icon={<Award className="h-6 w-6" />}
            label="Scoring Format"
            value={scoringValue}
            onClick={openScoringModal}
          />
          <ParameterBox
            icon={<Users className="h-6 w-6" />}
            label="Players per Team"
            value={playersValue}
            onClick={openPlayersModal}
          />
          <ParameterBox
            icon={<LayoutGrid className="h-6 w-6" />}
            label="Games per Set"
            value={gamesValue}
            onClick={openGamesModal}
          />
          <ParameterBox
            icon={<Globe className="h-6 w-6" />}
            label="Visibility"
            value={visibilityValue}
            onClick={openVisibilityModal}
          />
          <ParameterBox
            icon={<Layers className="h-6 w-6" />}
            label="Sets per Match"
            value={setsValue}
            onClick={openSetsModal}
          />
        </div>
      </div>

      {/* Validation error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate("/admin/leagues")}
          className="btn btn-outline"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
              Creating League...
            </div>
          ) : (
            "Create League"
          )}
        </button>
      </div>

      {/* ——— Modals ——— */}

      {/* Identity Modal */}
      {activeModal === "identity" && (
        <ModalWrapper
          title="League Name"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIdentity}
                disabled={!draftBasicInfo.name.trim()}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">League Name *</label>
              <input
                type="text"
                className="form-input"
                value={draftBasicInfo.name}
                onChange={(e) =>
                  setDraftBasicInfo((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g., Downtown Pool League"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={draftBasicInfo.description}
                onChange={(e) =>
                  setDraftBasicInfo((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description of your league"
              />
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Location Modal */}
      {activeModal === "location" && (
        <ModalWrapper
          title="Location"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={
                  !draftBasicInfo.city.trim() || !draftBasicInfo.state.trim()
                }
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input"
                  value={draftBasicInfo.city}
                  onChange={(e) =>
                    setDraftBasicInfo((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="e.g., Portland"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  className="form-input"
                  value={draftBasicInfo.state}
                  onChange={(e) =>
                    setDraftBasicInfo((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder="e.g., OR"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                className="form-input"
                value={draftBasicInfo.country}
                onChange={(e) =>
                  setDraftBasicInfo((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
              >
                <option value="USA">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="UK">United Kingdom</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Players per Team Modal */}
      {activeModal === "players" && (
        <ModalWrapper
          title="Players per Team"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlayers}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Players per Team</label>
            <p className="text-sm text-dark-300 mb-3">
              On a match night, how many players from each team compete? e.g. if
              set to 5, then 5 players from Team A each face a player from Team
              B.
            </p>
            <input
              type="number"
              className="form-input"
              value={draftPlayersPerTeam}
              onChange={(e) =>
                setDraftPlayersPerTeam(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              min="1"
              autoFocus
            />
          </div>
        </ModalWrapper>
      )}

      {/* Games per Set Modal */}
      {activeModal === "games" && (
        <ModalWrapper
          title="Games per Set"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGames}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Games per Set</label>
            <p className="text-sm text-dark-300 mb-3">
              How many games happen in one set. Usually equals the number of
              players per team — if you have 4 players, there are 4 games per
              set (one per player matchup).
            </p>
            <input
              type="number"
              className="form-input"
              value={draftGamesPerSet}
              onChange={(e) =>
                setDraftGamesPerSet(Math.max(1, parseInt(e.target.value) || 1))
              }
              min="1"
              autoFocus
            />
          </div>
        </ModalWrapper>
      )}

      {/* Sets per Match Modal */}
      {activeModal === "sets" && (
        <ModalWrapper
          title="Sets per Match"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSets}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Sets per Match</label>
            <p className="text-sm text-dark-300 mb-3">
              A set is one full rotation of player matchups. If your team has 4
              players and you want everyone to face every opponent, you'd play 4
              sets — one per opposing player.
            </p>
            <input
              type="number"
              className="form-input"
              value={draftSetsPerMatch}
              onChange={(e) =>
                setDraftSetsPerMatch(Math.max(1, parseInt(e.target.value) || 1))
              }
              min="1"
              autoFocus
            />
          </div>
        </ModalWrapper>
      )}

      {/* Visibility Modal */}
      {activeModal === "visibility" && (
        <ModalWrapper
          title="League Visibility"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVisibility}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-dark-300 mb-3">
              Public leagues are discoverable by players. Private leagues are
              invite-only and hidden from search.
            </p>
            {[
              { value: true, label: "Public", description: "Anyone can find and request to join this league" },
              { value: false, label: "Private", description: "Only invited players can see and join this league" },
            ].map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => setDraftIsPublic(option.value)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  draftIsPublic === option.value
                    ? "border-primary-400 bg-primary-50"
                    : "border-cream-300 bg-white hover:border-primary-200"
                }`}
              >
                <span className={`font-semibold text-sm ${draftIsPublic === option.value ? "text-primary-600" : "text-dark"}`}>
                  {option.label}
                </span>
                <p className={`text-xs mt-0.5 ${draftIsPublic === option.value ? "text-primary-500" : "text-dark-300"}`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </ModalWrapper>
      )}

      {/* Scoring Modal */}
      {activeModal === "scoring" && (
        <ModalWrapper
          title="Scoring Format"
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScoring}
                className="btn btn-primary"
              >
                Save
              </button>
            </>
          }
        >
          <ScoringConfigSection
            config={draftScoringConfig}
            onChange={(updates) =>
              setDraftScoringConfig((prev) => ({ ...prev, ...updates }))
            }
            onPresetApply={handleDraftPresetSelect}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default AdminCreateLeaguePage;
