import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Check, ChevronDown, ChevronRight } from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  api,
  type RolloverPreviewResponse,
  type Season,
  type ScoringConfig,
  type ScoringPreset,
  type GameFormat,
  type StandingsFormat,
} from "@league-genius/shared";
import type { SeasonsStackScreenProps } from "../navigation/types";
import { useAuthStore } from "../stores/authStore";

// ── Date helpers (display: MM-DD-YYYY, API: YYYY-MM-DD) ──────────────────────

function displayToApi(display: string): string {
  const m = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function isValidDisplayDate(str: string): boolean {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(str)) return false;
  const d = new Date(displayToApi(str));
  return !isNaN(d.getTime());
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

// ── Scoring config constants ──────────────────────────────────────────────────

const PRESET_OPTIONS: { value: ScoringPreset; label: string; desc: string }[] = [
  { value: "simple_win_loss", label: "Simple Win/Loss", desc: "Track wins and losses only" },
  { value: "bca_8ball", label: "BCA 8-Ball", desc: "Ball points, BCA rules" },
  { value: "vnea", label: "VNEA / 10-Point", desc: "10-point system, handicap-friendly" },
  { value: "nine_ball", label: "9-Ball Points", desc: "Ball points for 9-ball format" },
  { value: "race_to_wins", label: "Race to Wins", desc: "First to N wins the match" },
  { value: "custom", label: "Custom", desc: "Fine-tune individual scoring values" },
];

const GAME_FORMATS: { value: GameFormat; label: string; desc: string }[] = [
  { value: "win_loss", label: "Win/Loss", desc: "Track match wins only" },
  { value: "ball_points_8ball", label: "Ball Points (8-Ball)", desc: "8-ball rack scoring" },
  { value: "ball_points_9ball", label: "Ball Points (9-Ball)", desc: "9-ball rack scoring" },
  { value: "race_to_wins", label: "Race to Wins", desc: "First to reach win count" },
];

const STANDINGS_FORMATS: { value: StandingsFormat; label: string; desc: string }[] = [
  { value: "win_loss_pct", label: "Win/Loss %", desc: "Rank by win percentage" },
  { value: "match_points", label: "Match Points", desc: "Points awarded per result (W/T/L)" },
  { value: "cumulative_points", label: "Cumulative Points", desc: "Total ball points earned" },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SeasonRolloverScreen({
  route,
  navigation,
}: SeasonsStackScreenProps<"SeasonRollover">) {
  const { seasonId, seasonName } = route.params;
  const { accessToken } = useAuthStore();

  const [preview, setPreview] = useState<RolloverPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(""); // MM-DD-YYYY
  const [endDate, setEndDate] = useState("");     // MM-DD-YYYY
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());

  // Scoring config state
  const [scoringConfig, setScoringConfig] = useState<Partial<ScoringConfig>>({});
  const [scoringExpanded, setScoringExpanded] = useState(false);

  const updateScoring = (updates: Partial<ScoringConfig>) =>
    setScoringConfig((prev: Partial<ScoringConfig>) => ({ ...prev, ...updates }));

  const isCustom = scoringConfig.preset === "custom";
  const isBallPoints =
    scoringConfig.game_format === "ball_points_8ball" ||
    scoringConfig.game_format === "ball_points_9ball";
  const isRaceTo = scoringConfig.game_format === "race_to_wins";
  const isMatchPoints = scoringConfig.standings_format === "match_points";

  useEffect(() => {
    loadPreview();
  }, [seasonId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<RolloverPreviewResponse>(
        `/seasons/${seasonId}/rollover-preview/`,
        accessToken ?? undefined
      );
      setPreview(data);
      setSelectedTeamIds(new Set(data.teams.map((t: { team_id: number }) => t.team_id)));
      setScoringConfig({ ...data.scoring_config });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load rollover preview. You may not have permission."
      );
    } finally {
      setLoading(false);
    }
  };

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
      setSelectedTeamIds(new Set(preview.teams.map((t: { team_id: number }) => t.team_id)));
    }
  };

  const deselectAllTeams = () => {
    setSelectedTeamIds(new Set());
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a name for the new season.");
      return;
    }
    if (!startDate || !isValidDisplayDate(startDate)) {
      Alert.alert("Missing Info", "Please enter a valid start date (MM-DD-YYYY).");
      return;
    }
    if (endDate && !isValidDisplayDate(endDate)) {
      Alert.alert("Validation", "End date must be valid (MM-DD-YYYY) or left blank.");
      return;
    }

    // Build partial scoring_config with only changed fields
    const originalConfig = preview?.scoring_config;
    let scoringDiff: Partial<ScoringConfig> | undefined;
    if (originalConfig) {
      const diff: Record<string, unknown> = {};
      const skipKeys = new Set(["id", "created_at", "updated_at"]);
      for (const key of Object.keys(scoringConfig)) {
        if (skipKeys.has(key)) continue;
        if ((scoringConfig as Record<string, unknown>)[key] !== (originalConfig as Record<string, unknown>)[key]) {
          diff[key] = (scoringConfig as Record<string, unknown>)[key];
        }
      }
      if (Object.keys(diff).length > 0) {
        scoringDiff = diff as Partial<ScoringConfig>;
      }
    }

    try {
      setSubmitting(true);
      const result = await api.post<Season>(`/seasons/${seasonId}/rollover/`, {
        name: name.trim(),
        start_date: displayToApi(startDate),
        end_date: endDate ? displayToApi(endDate) : null,
        team_ids: Array.from(selectedTeamIds),
        scoring_config: scoringDiff,
      }, accessToken ?? undefined);
      Alert.alert("Success", `Season "${result.name}" created!`, [
        {
          text: "View Season",
          onPress: () => {
            navigation.replace("SeasonDetails", { seasonId: result.id });
          },
        },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to rollover season"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
        <Text className="text-gray-500 mt-4">Loading rollover preview...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center">{error}</Text>
      </View>
    );
  }

  if (!preview) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 pb-20 space-y-4">
        {/* Header Info */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            Rollover Season
          </Text>
          <Text className="text-sm text-gray-500">
            Create a new season from {seasonName}
          </Text>
        </View>

        {/* Season Name */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            New Season Name *
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900"
            placeholder="e.g., Summer 2026"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Dates */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
          <Text className="text-sm font-medium text-gray-700">Dates</Text>

          <View>
            <Text className="text-xs text-gray-500 mb-1">Start Date * (MM-DD-YYYY)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900"
              placeholder="MM-DD-YYYY"
              value={startDate}
              onChangeText={(v) => setStartDate(formatDateInput(v))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <View>
            <Text className="text-xs text-gray-500 mb-1">End Date (optional, MM-DD-YYYY)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900"
              placeholder="MM-DD-YYYY"
              value={endDate}
              onChangeText={(v) => setEndDate(formatDateInput(v))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Teams */}
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-medium text-gray-700">
              Teams ({selectedTeamIds.size} of {preview.teams.length})
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={selectAllTeams}>
                <Text className="text-xs text-primary font-medium">Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deselectAllTeams}>
                <Text className="text-xs text-primary font-medium">Deselect All</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {preview.teams.map((team: { team_id: number; team_name: string; venue_name: string | null }) => {
              const selected = selectedTeamIds.has(team.team_id);
              return (
                <TouchableOpacity
                  key={team.team_id}
                  onPress={() => toggleTeam(team.team_id)}
                  className={`flex-row items-center gap-2 px-3 py-2.5 rounded-lg border-2 ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      selected ? "border-primary bg-primary" : "border-gray-300"
                    }`}
                  >
                    {selected && <Check color="#fff" size={12} />}
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-900">
                      {team.team_name}
                    </Text>
                    {team.venue_name && (
                      <Text className="text-xs text-gray-500">{team.venue_name}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Scoring Configuration — collapsible */}
        <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <TouchableOpacity
            onPress={() => setScoringExpanded(!scoringExpanded)}
            className="p-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-sm font-medium text-gray-700">
                Scoring Configuration
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {scoringConfig.preset?.replace(/_/g, " ")} · {scoringConfig.games_per_set} games/set · {scoringConfig.sets_per_match} sets/match
              </Text>
            </View>
            {scoringExpanded ? (
              <ChevronDown color="#9ca3af" size={20} />
            ) : (
              <ChevronRight color="#9ca3af" size={20} />
            )}
          </TouchableOpacity>

          {scoringExpanded && (
            <View className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              {/* Preset Selection */}
              <View>
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Scoring Preset
                </Text>
                <View className="space-y-2">
                  {PRESET_OPTIONS.map((p) => {
                    const isActive = scoringConfig.preset === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        onPress={() => updateScoring({ preset: p.value })}
                        disabled={submitting}
                        className={`p-3 rounded-lg border-2 ${
                          isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                          {p.label}
                        </Text>
                        <Text className={`text-xs mt-0.5 ${isActive ? "text-primary" : "text-gray-500"}`}>
                          {p.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Sets per Match */}
              <View>
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sets per Match
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const isActive = scoringConfig.sets_per_match === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => updateScoring({ sets_per_match: n, preset: "custom" })}
                        className={`w-12 h-10 rounded-lg border-2 items-center justify-center ${
                          isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Games per Set */}
              <View>
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Games per Set
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const isActive = scoringConfig.games_per_set === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => updateScoring({ games_per_set: n, preset: "custom" })}
                        className={`w-12 h-10 rounded-lg border-2 items-center justify-center ${
                          isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Game Format — only when Custom */}
              {isCustom && (
                <View>
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Game Format
                  </Text>
                  <View className="space-y-2">
                    {GAME_FORMATS.map((f) => {
                      const isActive = scoringConfig.game_format === f.value;
                      return (
                        <TouchableOpacity
                          key={f.value}
                          onPress={() => updateScoring({ game_format: f.value })}
                          className={`p-3 rounded-lg border-2 ${
                            isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                          }`}
                        >
                          <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                            {f.label}
                          </Text>
                          <Text className={`text-xs mt-0.5 ${isActive ? "text-primary" : "text-gray-500"}`}>
                            {f.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Ball point values */}
              {isBallPoints && (
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Ball Value (pts)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                      keyboardType="number-pad"
                      value={String(scoringConfig.ball_value ?? "")}
                      onChangeText={(v) => updateScoring({ ball_value: parseInt(v) || 0, preset: "custom" })}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-1">8/9-Ball Value (pts)</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                      keyboardType="number-pad"
                      value={String(scoringConfig.object_ball_value ?? "")}
                      onChangeText={(v) => updateScoring({ object_ball_value: parseInt(v) || 0, preset: "custom" })}
                    />
                  </View>
                </View>
              )}

              {/* Race to */}
              {isRaceTo && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">Race To (games)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    keyboardType="number-pad"
                    value={scoringConfig.race_to != null ? String(scoringConfig.race_to) : ""}
                    onChangeText={(v) => updateScoring({ race_to: parseInt(v) || null, preset: "custom" })}
                  />
                </View>
              )}

              {/* Standings Format */}
              <View>
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Standings Format
                </Text>
                <View className="space-y-2">
                  {STANDINGS_FORMATS.map((f) => {
                    const isActive = scoringConfig.standings_format === f.value;
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => updateScoring({ standings_format: f.value, preset: "custom" })}
                        className={`p-3 rounded-lg border-2 ${
                          isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                          {f.label}
                        </Text>
                        <Text className={`text-xs mt-0.5 ${isActive ? "text-primary" : "text-gray-500"}`}>
                          {f.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Match Points W/T/L */}
              {isMatchPoints && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Match Points</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Win</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                        keyboardType="number-pad"
                        value={String(scoringConfig.match_win_points ?? "")}
                        onChangeText={(v) => updateScoring({ match_win_points: parseInt(v) || 0, preset: "custom" })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Tie</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                        keyboardType="number-pad"
                        value={String(scoringConfig.match_tie_points ?? "")}
                        onChangeText={(v) => updateScoring({ match_tie_points: parseInt(v) || 0, preset: "custom" })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Loss</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                        keyboardType="number-pad"
                        value={String(scoringConfig.match_loss_points ?? "")}
                        onChangeText={(v) => updateScoring({ match_loss_points: parseInt(v) || 0, preset: "custom" })}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Allow Ties */}
              <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <Text className="text-sm font-medium text-gray-700">Allow Match Ties</Text>
                <Switch
                  value={scoringConfig.allow_ties ?? false}
                  onValueChange={(v) => updateScoring({ allow_ties: v, preset: "custom" })}
                  trackColor={{ false: "#D1D5DB", true: "#26A69A" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !name.trim() || !startDate}
          className={`rounded-lg p-4 items-center ${
            submitting || !name.trim() || !startDate
              ? "bg-gray-300"
              : "bg-primary"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Create New Season
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
