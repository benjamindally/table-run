import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import {
  leaguesApi,
  type ScoringPreset,
  type GameFormat,
  type StandingsFormat,
  type ScoringConfig,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import type { LeaguesStackScreenProps } from "../navigation/types";

// ── Scoring config constants ──────────────────────────────────────────────────

const PRESET_LABELS: Record<ScoringPreset, string> = {
  simple_win_loss: "Simple Win/Loss",
  bca_8ball: "BCA 8-Ball",
  vnea: "VNEA / 10-Point",
  nine_ball: "9-Ball Points",
  race_to_wins: "Race to Wins",
  custom: "Custom",
};

const PRESET_DESCRIPTIONS: Record<ScoringPreset, string> = {
  simple_win_loss: "Track wins and losses only",
  bca_8ball: "Ball points, BCA rules",
  vnea: "10-point system, handicap-friendly",
  nine_ball: "Ball points for 9-ball format",
  race_to_wins: "First to N wins the match",
  custom: "Fine-tune individual scoring values",
};

const PRESET_OPTIONS: ScoringPreset[] = [
  "simple_win_loss",
  "bca_8ball",
  "vnea",
  "nine_ball",
  "race_to_wins",
  "custom",
];

const GAME_FORMATS: { value: GameFormat; label: string; description: string }[] = [
  { value: "win_loss", label: "Win/Loss", description: "Track match wins only" },
  { value: "ball_points_8ball", label: "Ball Points (8-Ball)", description: "8-ball rack scoring" },
  { value: "ball_points_9ball", label: "Ball Points (9-Ball)", description: "9-ball rack scoring" },
  { value: "race_to_wins", label: "Race to Wins", description: "First to reach win count" },
];

const STANDINGS_FORMATS: { value: StandingsFormat; label: string; description: string }[] = [
  { value: "win_loss_pct", label: "Win/Loss %", description: "Rank by win percentage" },
  { value: "match_points", label: "Match Points", description: "Points awarded per result (W/T/L)" },
  { value: "cumulative_points", label: "Cumulative Points", description: "Total ball points earned" },
];

const DEFAULT_CONFIG: Partial<ScoringConfig> = {
  preset: "bca_8ball",
  game_format: "ball_points_8ball",
  ball_value: 1,
  object_ball_value: 2,
  race_to: null,
  standings_format: "win_loss_pct",
  allow_ties: false,
  match_win_points: 3,
  match_tie_points: 1,
  match_loss_points: 0,
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CreateLeagueScreen({
  route,
  navigation,
}: LeaguesStackScreenProps<"CreateLeague">) {
  const leagueId = route.params?.leagueId;
  const isEditMode = !!leagueId;

  const { accessToken } = useAuthStore();

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [isPublic, setIsPublic] = useState(true);

  // Scoring config
  const [draftConfig, setDraftConfig] = useState<Partial<ScoringConfig>>(DEFAULT_CONFIG);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const updateDraft = (updates: Partial<ScoringConfig>) =>
    setDraftConfig((prev) => ({ ...prev, ...updates }));

  const isCustom = draftConfig.preset === "custom";
  const isBallPoints =
    draftConfig.game_format === "ball_points_8ball" ||
    draftConfig.game_format === "ball_points_9ball";
  const isRaceTo = draftConfig.game_format === "race_to_wins";
  const isMatchPoints = draftConfig.standings_format === "match_points";

  // Load existing league + scoring config in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      try {
        const [league] = await Promise.all([
          leaguesApi.getById(leagueId!, accessToken ?? undefined),
        ]);
        setName(league.name ?? "");
        setDescription(league.description ?? "");
        setCity(league.city ?? "");
        setState(league.state ?? "");
        setCountry(league.country ?? "US");
        setIsPublic(league.is_public ?? true);

        try {
          const config = await leaguesApi.getScoringConfig(leagueId!, accessToken ?? undefined);
          setDraftConfig(config);
        } catch {
          // Scoring config may not exist yet — leave defaults
        }
      } catch {
        Alert.alert("Error", "Failed to load league data");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leagueId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "League name is required");
      return;
    }

    // Gate: require subscription to create a new league
    if (!isEditMode) {
      const { isPro } = useSubscriptionStore.getState();
      if (!isPro()) {
        (navigation as any).navigate("Paywall", { source: "create_league" });
        return;
      }
    }

    setSaving(true);
    try {
      const leagueData = {
        name: name.trim(),
        description: description.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "US",
        is_public: isPublic,
      };

      let savedLeagueId: number;

      if (isEditMode) {
        const updated = await leaguesApi.update(leagueId!, leagueData, accessToken ?? undefined);
        savedLeagueId = updated.id;
      } else {
        const created = await leaguesApi.create(leagueData, accessToken ?? undefined);
        savedLeagueId = created.id;
      }

      // Apply scoring config
      try {
        if (draftConfig.preset === "custom") {
          await leaguesApi.updateScoringConfig(savedLeagueId, draftConfig, accessToken ?? undefined);
        } else {
          await leaguesApi.applyScoringPreset(
            savedLeagueId,
            draftConfig.preset as ScoringPreset,
            accessToken ?? undefined
          );
        }
      } catch {
        // Don't block navigation if scoring config fails — operator can fix in league details
      }

      if (isEditMode) {
        navigation.navigate("LeagueDetails", { leagueId: savedLeagueId, leagueName: name.trim() });
      } else {
        navigation.replace("LeagueDetails", { leagueId: savedLeagueId, leagueName: name.trim() });
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save league");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Basic Info ── */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          League Info
        </Text>
        <View className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 mb-6">

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              League Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="e.g. Tuesday Night Pool League"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="Optional description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">City</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                placeholder="e.g. Austin"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">State</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                placeholder="e.g. TX"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
                editable={!saving}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Country</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="US"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="characters"
              maxLength={2}
              editable={!saving}
            />
          </View>

          <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
            <View>
              <Text className="text-sm font-medium text-gray-700">Public League</Text>
              <Text className="text-xs text-gray-500">Discoverable by players in search</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ true: "#26A69A" }}
              thumbColor="#FFFFFF"
              disabled={saving}
            />
          </View>

        </View>

        {/* ── Scoring Format ── */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Scoring Format
        </Text>
        <View className="mb-6 space-y-2">
          {PRESET_OPTIONS.map((preset) => {
            const isSelected = draftConfig.preset === preset;
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => updateDraft({ preset })}
                disabled={saving}
                className={`p-4 rounded-lg border-2 ${
                  isSelected ? "border-primary bg-primary-50" : "border-gray-200 bg-white"
                }`}
              >
                <Text className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-gray-800"}`}>
                  {PRESET_LABELS[preset]}
                </Text>
                <Text className={`text-xs mt-0.5 ${isSelected ? "text-primary-700" : "text-gray-500"}`}>
                  {PRESET_DESCRIPTIONS[preset]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Custom config (only when Custom preset selected) ── */}
        {isCustom && (
          <View className="mb-6 space-y-4">

            {/* Game Format */}
            <View>
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Game Format
              </Text>
              <View className="space-y-2">
                {GAME_FORMATS.map((f) => {
                  const isActive = draftConfig.game_format === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => updateDraft({ game_format: f.value })}
                      disabled={saving}
                      className={`p-3 rounded-lg border-2 bg-white ${
                        isActive ? "border-primary" : "border-gray-200"
                      }`}
                    >
                      <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                        {f.label}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${isActive ? "text-primary-700" : "text-gray-500"}`}>
                        {f.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ball point values */}
            {isBallPoints && (
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Ball Value (pts)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    keyboardType="number-pad"
                    value={String(draftConfig.ball_value ?? "")}
                    onChangeText={(v) => updateDraft({ ball_value: parseInt(v) || 0 })}
                    editable={!saving}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">8/9-Ball Value (pts)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    keyboardType="number-pad"
                    value={String(draftConfig.object_ball_value ?? "")}
                    onChangeText={(v) => updateDraft({ object_ball_value: parseInt(v) || 0 })}
                    editable={!saving}
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
                  value={draftConfig.race_to != null ? String(draftConfig.race_to) : ""}
                  onChangeText={(v) => updateDraft({ race_to: parseInt(v) || null })}
                  editable={!saving}
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
                  const isActive = draftConfig.standings_format === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => updateDraft({ standings_format: f.value })}
                      disabled={saving}
                      className={`p-3 rounded-lg border-2 bg-white ${
                        isActive ? "border-primary" : "border-gray-200"
                      }`}
                    >
                      <Text className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-800"}`}>
                        {f.label}
                      </Text>
                      <Text className={`text-xs mt-0.5 ${isActive ? "text-primary-700" : "text-gray-500"}`}>
                        {f.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Match points W/T/L */}
            {isMatchPoints && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Match Points</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Win</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                      keyboardType="number-pad"
                      value={String(draftConfig.match_win_points ?? "")}
                      onChangeText={(v) => updateDraft({ match_win_points: parseInt(v) || 0 })}
                      editable={!saving}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Tie</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                      keyboardType="number-pad"
                      value={String(draftConfig.match_tie_points ?? "")}
                      onChangeText={(v) => updateDraft({ match_tie_points: parseInt(v) || 0 })}
                      editable={!saving}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Loss</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                      keyboardType="number-pad"
                      value={String(draftConfig.match_loss_points ?? "")}
                      onChangeText={(v) => updateDraft({ match_loss_points: parseInt(v) || 0 })}
                      editable={!saving}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Allow Ties */}
            <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
              <Text className="text-sm font-medium text-gray-700">Allow Match Ties</Text>
              <Switch
                value={draftConfig.allow_ties ?? false}
                onValueChange={(v) => updateDraft({ allow_ties: v })}
                trackColor={{ true: "#26A69A" }}
                thumbColor="#FFFFFF"
                disabled={saving}
              />
            </View>

          </View>
        )}

        {/* ── Actions ── */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </Pressable>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="font-semibold text-white">
                {isEditMode ? "Save Changes" : "Create League"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
