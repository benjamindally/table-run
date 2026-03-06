import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Switch,
  Alert,
  RefreshControl,
} from "react-native";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Minus,
  Users,
  Trophy,
  Shield,
  AlertTriangle,
  Check,
  ArrowLeftRight,
  Clock,
} from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import {
  seasonsApi,
  formatDateDisplay,
  type PlayoffConfiguration,
  type PlayoffBracketData,
  type PlayoffRound,
  type PlayoffMatchup,
  type PlayoffSeed,
  type PlayoffWarning,
  type GeneratePlayoffsResponse,
  type TeamStanding,
  type SeasonParticipation,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { SeasonsStackScreenProps } from "../navigation/types";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ────────────────────────────────────────────────────────────
// Parameter row (tap to open modal)
// ────────────────────────────────────────────────────────────
function ParamRow({
  icon,
  label,
  value,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between p-3 border-b border-gray-100 ${disabled ? "opacity-40" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm text-gray-700">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-primary font-medium">{value}</Text>
        <ChevronRight color="#9ca3af" size={16} />
      </View>
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────
// Generic modal shell
// ────────────────────────────────────────────────────────────
function ParamModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-2xl max-h-3/4">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-base font-bold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-4">{children}</ScrollView>
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// Warning banner
// ────────────────────────────────────────────────────────────
function WarningBanner({ warning }: { warning: PlayoffWarning }) {
  return (
    <View className="flex-row items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
      <AlertTriangle color="#d97706" size={16} style={{ marginTop: 1 }} />
      <Text className="text-sm text-yellow-800 flex-1">{warning.message}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Bracket matchup card
// ────────────────────────────────────────────────────────────
function BracketMatchupCard({
  matchup,
  seeds,
  isOperator,
  isPreview,
  onPress,
}: {
  matchup: PlayoffMatchup;
  seeds: PlayoffSeed[];
  isOperator: boolean;
  isPreview: boolean;
  onPress?: () => void;
}) {
  const getSeedInfo = (seedNum: number | null) => {
    if (seedNum == null) return null;
    return seeds.find((s) => s.seed_number === seedNum);
  };

  const homeSeed = getSeedInfo(matchup.home_seed_number ?? matchup.home_seed ?? null);
  const awaySeed = getSeedInfo(matchup.away_seed_number ?? matchup.away_seed ?? null);

  // For saved brackets, use detail objects if available
  const homeDetail = matchup.home_seed_detail;
  const awayDetail = matchup.away_seed_detail;

  const homeName = homeDetail?.team_name ?? homeSeed?.team_name ?? matchup.home_team_name;
  const awayName = awayDetail?.team_name ?? awaySeed?.team_name ?? matchup.away_team_name;
  const homeSeedNum = homeDetail?.seed_number ?? homeSeed?.seed_number ?? matchup.home_seed_number;
  const awaySeedNum = awayDetail?.seed_number ?? awaySeed?.seed_number ?? matchup.away_seed_number;

  // Check if match is completed (saved bracket)
  const matchDetail = matchup.match_detail;
  const isCompleted = matchDetail?.status === "completed";

  if (matchup.is_bye) {
    return (
      <TouchableOpacity
        onPress={isOperator && isPreview ? onPress : undefined}
        disabled={!isOperator || !isPreview}
        className="bg-gray-50 rounded-lg p-3 mb-2 border border-dashed border-gray-300"
        style={{ width: 260 }}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xs font-bold text-primary">#{homeSeedNum}</Text>
          <Text className="text-sm font-semibold text-gray-700" numberOfLines={1}>
            {homeName ?? "TBD"}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 italic">BYE — Advances automatically</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={isOperator && isPreview ? onPress : undefined}
      disabled={!isOperator || !isPreview}
      className={`rounded-lg p-3 mb-2 border ${
        isPreview ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"
      }`}
      style={{ width: 260 }}
    >
      {/* Home seed */}
      <View className="flex-row items-center gap-2 mb-1">
        {homeSeedNum != null ? (
          <Text className="text-xs font-bold text-primary">#{homeSeedNum}</Text>
        ) : null}
        <Text
          className={`text-sm font-semibold flex-1 ${isCompleted && matchDetail?.winner_team_id === homeSeed?.team_id ? "text-green-700" : "text-gray-900"}`}
          numberOfLines={1}
        >
          {homeName ?? "TBD"}
        </Text>
        {isCompleted && matchDetail?.home_score != null && (
          <Text className="text-sm font-bold text-gray-700">{matchDetail.home_score}</Text>
        )}
      </View>

      {/* Away seed */}
      <View className="flex-row items-center gap-2 mb-2">
        {awaySeedNum != null ? (
          <Text className="text-xs font-bold text-primary">#{awaySeedNum}</Text>
        ) : null}
        <Text
          className={`text-sm font-semibold flex-1 ${isCompleted && matchDetail?.winner_team_id === awaySeed?.team_id ? "text-green-700" : "text-gray-900"}`}
          numberOfLines={1}
        >
          {awayName ?? "TBD"}
        </Text>
        {isCompleted && matchDetail?.away_score != null && (
          <Text className="text-sm font-bold text-gray-700">{matchDetail.away_score}</Text>
        )}
      </View>

      {/* Date + Venue */}
      <View className="flex-row items-center gap-2">
        {matchup.scheduled_date ? (
          <Text className="text-xs text-gray-400">
            {formatDateDisplay(matchup.scheduled_date)}
          </Text>
        ) : null}
        {matchup.venue_name ? (
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {matchup.venue_name}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────
// Bracket view (horizontal scroll of round columns)
// ────────────────────────────────────────────────────────────
function BracketView({
  bracket,
  seeds,
  isOperator,
  isPreview,
  onEditMatchup,
}: {
  bracket: PlayoffBracketData;
  seeds: PlayoffSeed[];
  isOperator: boolean;
  isPreview: boolean;
  onEditMatchup?: (roundIdx: number, matchupIdx: number) => void;
}) {
  // Group matchups into rounds
  const rounds: PlayoffRound[] = bracket.rounds ?? [];

  // If no rounds but we have matchups, build rounds from flat matchups
  const displayRounds: PlayoffRound[] =
    rounds.length > 0
      ? rounds
      : buildRoundsFromMatchups(bracket.matchups ?? [], bracket.total_rounds);

  if (displayRounds.length === 0) {
    return (
      <View className="bg-white rounded-lg border border-gray-200 p-8 items-center">
        <Trophy color="#d1d5db" size={40} />
        <Text className="text-gray-400 text-center mt-3">No bracket data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row p-2">
        {displayRounds.map((round, roundIdx) => (
          <View key={round.round_number} style={{ width: 280, marginRight: 12 }}>
            {/* Round header */}
            <View className="bg-gray-100 rounded-t-lg py-2 px-3 border border-gray-200">
              <Text className="text-sm font-bold text-gray-900 text-center">
                {round.round_name}
              </Text>
            </View>

            {/* Matchups */}
            <View className="pt-2">
              {round.matchups.map((matchup, matchupIdx) => (
                <BracketMatchupCard
                  key={`${round.round_number}-${matchup.position}`}
                  matchup={matchup}
                  seeds={seeds}
                  isOperator={isOperator}
                  isPreview={isPreview}
                  onPress={() => onEditMatchup?.(roundIdx, matchupIdx)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function buildRoundsFromMatchups(matchups: PlayoffMatchup[], totalRounds: number): PlayoffRound[] {
  const roundMap: Record<number, PlayoffMatchup[]> = {};
  for (const m of matchups) {
    if (!roundMap[m.round_number]) roundMap[m.round_number] = [];
    roundMap[m.round_number].push(m);
  }
  const rounds: PlayoffRound[] = [];
  for (const [rn, rMatchups] of Object.entries(roundMap)) {
    const roundNum = Number(rn);
    rounds.push({
      round_number: roundNum,
      round_name: getRoundName(roundNum, totalRounds),
      matchups: rMatchups.sort((a, b) => a.position - b.position),
    });
  }
  return rounds.sort((a, b) => a.round_number - b.round_number);
}

function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) return "Finals";
  if (roundNumber === totalRounds - 1) return "Semifinals";
  if (roundNumber === totalRounds - 2) return "Quarterfinals";
  return `Round ${roundNumber}`;
}

// ────────────────────────────────────────────────────────────
// Matchup Edit Modal
// ────────────────────────────────────────────────────────────
function MatchupEditModal({
  visible,
  onClose,
  matchup,
  seeds,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  matchup: PlayoffMatchup | null;
  seeds: PlayoffSeed[];
  onSave: (updated: PlayoffMatchup) => void;
}) {
  const [draft, setDraft] = useState<PlayoffMatchup | null>(null);

  useEffect(() => {
    if (matchup) setDraft({ ...matchup });
  }, [matchup]);

  if (!draft) return null;

  const handleSwapSeeds = () => {
    setDraft((d) =>
      d
        ? {
            ...d,
            home_seed_number: d.away_seed_number,
            away_seed_number: d.home_seed_number,
          }
        : d
    );
  };

  const handleSave = () => {
    if (draft) onSave(draft);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-2xl">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-base font-bold text-gray-900">Edit Matchup</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Home Seed */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Home Seed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {seeds.map((s) => (
                  <TouchableOpacity
                    key={s.seed_number}
                    onPress={() => setDraft((d) => d ? { ...d, home_seed_number: s.seed_number } : d)}
                    className={`px-3 py-2 rounded-lg border ${
                      draft.home_seed_number === s.seed_number
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        draft.home_seed_number === s.seed_number ? "text-white" : "text-gray-700"
                      }`}
                      numberOfLines={1}
                    >
                      #{s.seed_number} {s.team_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setDraft((d) => d ? { ...d, home_seed_number: null } : d)}
                  className={`px-3 py-2 rounded-lg border ${
                    draft.home_seed_number == null
                      ? "bg-gray-600 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      draft.home_seed_number == null ? "text-white" : "text-gray-700"
                    }`}
                  >
                    TBD
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Swap button */}
            <TouchableOpacity
              onPress={handleSwapSeeds}
              className="flex-row items-center justify-center gap-2 py-2 mb-3"
            >
              <ArrowLeftRight color="#26A69A" size={16} />
              <Text className="text-sm text-primary font-medium">Swap Home/Away</Text>
            </TouchableOpacity>

            {/* Away Seed */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Away Seed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {seeds.map((s) => (
                  <TouchableOpacity
                    key={s.seed_number}
                    onPress={() => setDraft((d) => d ? { ...d, away_seed_number: s.seed_number } : d)}
                    className={`px-3 py-2 rounded-lg border ${
                      draft.away_seed_number === s.seed_number
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        draft.away_seed_number === s.seed_number ? "text-white" : "text-gray-700"
                      }`}
                      numberOfLines={1}
                    >
                      #{s.seed_number} {s.team_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setDraft((d) => d ? { ...d, away_seed_number: null } : d)}
                  className={`px-3 py-2 rounded-lg border ${
                    draft.away_seed_number == null
                      ? "bg-gray-600 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      draft.away_seed_number == null ? "text-white" : "text-gray-700"
                    }`}
                  >
                    TBD
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bye toggle */}
            <View className="flex-row items-center justify-between py-3 border-t border-gray-100">
              <Text className="text-sm text-gray-700">Mark as BYE</Text>
              <Switch
                value={draft.is_bye}
                onValueChange={(v) => setDraft((d) => d ? { ...d, is_bye: v, away_seed_number: v ? null : d.away_seed_number } : d)}
                trackColor={{ true: "#26A69A" }}
              />
            </View>

            {/* Date */}
            <Text className="text-sm font-medium text-gray-700 mb-1 mt-2">Date</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 mb-3"
              value={draft.scheduled_date}
              onChangeText={(v) => setDraft((d) => d ? { ...d, scheduled_date: v } : d)}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            {/* Venue */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Venue</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 mb-3"
              value={draft.venue_name}
              onChangeText={(v) => setDraft((d) => d ? { ...d, venue_name: v } : d)}
              placeholder="Venue name"
            />
          </ScrollView>

          <View className="p-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────
export default function PlayoffBracketScreen({
  route,
}: SeasonsStackScreenProps<"PlayoffBracket">) {
  const { seasonId, leagueId } = route.params;
  const { accessToken } = useAuthStore();
  const isOperatorFn = useUserContextStore((s) => s.isOperator);
  const isOperator = isOperatorFn(leagueId);

  // ── Saved brackets ──
  const [savedBrackets, setSavedBrackets] = useState<PlayoffBracketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Generator state (operator only) ──
  const [configOpen, setConfigOpen] = useState(false);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [teams, setTeams] = useState<SeasonParticipation[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

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

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewResponse, setPreviewResponse] = useState<GeneratePlayoffsResponse | null>(null);
  const [warnings, setWarnings] = useState<PlayoffWarning[]>([]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"main" | "consolation">("main");

  // ── Param modals ──
  type ModalType =
    | "team_count"
    | "teams"
    | "byes"
    | "consolation"
    | "consolation_count"
    | "consolation_byes"
    | "start_date"
    | "days_between"
    | "match_day";
  const [openModal, setOpenModal] = useState<ModalType | null>(null);
  const [draftStartDate, setDraftStartDate] = useState("");

  // ── Matchup editing ──
  const [editingMatchup, setEditingMatchup] = useState<{
    roundIdx: number;
    matchupIdx: number;
    bracketType: "main" | "consolation";
  } | null>(null);

  // ── Load saved brackets ──
  const loadPlayoffs = useCallback(async () => {
    try {
      const resp = await seasonsApi.getPlayoffs(seasonId, accessToken ?? undefined);
      setSavedBrackets(resp);
    } catch (err) {
      console.error("Failed to load playoffs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seasonId, accessToken]);

  useEffect(() => {
    loadPlayoffs();
  }, [loadPlayoffs]);

  // ── Load resources when operator opens config ──
  const loadResources = useCallback(async () => {
    if (resourcesLoaded) return;
    try {
      const [teamsResp, standingsResp] = await Promise.all([
        seasonsApi.getTeams(seasonId, accessToken ?? undefined),
        seasonsApi.getStandings(seasonId, accessToken ?? undefined),
      ]);
      setTeams(teamsResp);
      const sortedStandings = (standingsResp.standings ?? []).sort(
        (a, b) => a.place - b.place
      );
      setStandings(sortedStandings);

      // Pre-select top N teams by standings
      const topTeamIds = sortedStandings
        .slice(0, config.team_count)
        .map((s) => s.team_id);
      setConfig((c) => ({ ...c, team_ids: topTeamIds }));
      setResourcesLoaded(true);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  }, [seasonId, accessToken, resourcesLoaded, config.team_count]);

  const handleToggleConfig = () => {
    if (!configOpen) loadResources();
    setConfigOpen((v) => !v);
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!config.start_date) {
      Alert.alert("Missing Start Date", "Please set a start date before generating.");
      return;
    }
    setGenerating(true);
    try {
      const resp = await seasonsApi.generatePlayoffs(seasonId, config, accessToken ?? undefined);
      setPreviewResponse(resp);
      setWarnings(resp.warnings ?? []);
      setActiveTab("main");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate playoffs.";
      Alert.alert("Error", msg);
    } finally {
      setGenerating(false);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!previewResponse) return;
    setSaving(true);
    try {
      const mainBracket = previewResponse.main_bracket;
      const consolationBracket = previewResponse.consolation_bracket;

      const flattenMatchups = (bracket: PlayoffBracketData): PlayoffMatchup[] => {
        if (bracket.rounds) {
          return bracket.rounds.flatMap((r) => r.matchups);
        }
        return bracket.matchups ?? [];
      };

      const result = await seasonsApi.savePlayoffs(
        seasonId,
        {
          main_bracket: {
            name: mainBracket.name || `${route.params.seasonName} Playoffs`,
            seeds: mainBracket.seeds,
            matchups: flattenMatchups(mainBracket),
            start_date: config.start_date,
            days_between_rounds: config.days_between_rounds,
            default_match_day: config.default_match_day,
          },
          consolation_bracket: consolationBracket
            ? {
                name: consolationBracket.name || `${route.params.seasonName} Consolation`,
                seeds: consolationBracket.seeds,
                matchups: flattenMatchups(consolationBracket),
                start_date: config.start_date,
                days_between_rounds: config.days_between_rounds,
                default_match_day: config.default_match_day,
              }
            : null,
          replace_existing: false,
        },
        accessToken ?? undefined
      );
      Alert.alert("Playoffs Saved", result.message ?? "Playoff bracket saved successfully.", [
        { text: "OK" },
      ]);
      setPreviewResponse(null);
      setWarnings([]);
      setRefreshing(true);
      await loadPlayoffs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save playoffs.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Edit matchup in preview ──
  const handleEditMatchup = (
    roundIdx: number,
    matchupIdx: number,
    bracketType: "main" | "consolation"
  ) => {
    setEditingMatchup({ roundIdx, matchupIdx, bracketType });
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

  // ── Get current editing matchup ──
  const getEditingMatchup = (): PlayoffMatchup | null => {
    if (!editingMatchup || !previewResponse) return null;
    const bracket =
      editingMatchup.bracketType === "main"
        ? previewResponse.main_bracket
        : previewResponse.consolation_bracket;
    if (!bracket?.rounds) return null;
    return bracket.rounds[editingMatchup.roundIdx]?.matchups[editingMatchup.matchupIdx] ?? null;
  };

  const getEditingSeeds = (): PlayoffSeed[] => {
    if (!editingMatchup || !previewResponse) return [];
    const bracket =
      editingMatchup.bracketType === "main"
        ? previewResponse.main_bracket
        : previewResponse.consolation_bracket;
    return bracket?.seeds ?? [];
  };

  // ── Determine what to display ──
  const isPreview = previewResponse !== null;
  const mainBracket = isPreview
    ? previewResponse.main_bracket
    : savedBrackets.find((b) => b.bracket_type === "main") ?? null;
  const consolationBracket = isPreview
    ? previewResponse.consolation_bracket
    : savedBrackets.find((b) => b.bracket_type === "consolation") ?? null;
  const hasConsolation = consolationBracket !== null;
  const activeBracket = activeTab === "main" ? mainBracket : consolationBracket;
  const activeSeeds = activeBracket?.seeds ?? [];

  // ── Config display helpers ──
  const selectedTeamCount = config.team_ids?.length ?? config.team_count;

  // ── Render ──
  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadPlayoffs();
          }}
        />
      }
    >
      <View className="p-4 pb-28 space-y-4">
        {/* ── Operator Config Panel ── */}
        {isOperator && (
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TouchableOpacity
              onPress={handleToggleConfig}
              className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
            >
              <Text className="text-base font-bold text-gray-900">Playoff Generator</Text>
              {configOpen ? (
                <ChevronDown color="#6b7280" size={20} />
              ) : (
                <ChevronRight color="#6b7280" size={20} />
              )}
            </TouchableOpacity>

            {configOpen && (
              <View>
                {/* Team Count */}
                <ParamRow
                  icon={<Users color="#6b7280" size={18} />}
                  label="Team Count"
                  value={`${config.team_count}`}
                  onPress={() => setOpenModal("team_count")}
                />

                {/* Select Teams */}
                <ParamRow
                  icon={<Users color="#6b7280" size={18} />}
                  label="Select Teams"
                  value={
                    standings.length === 0
                      ? "Loading..."
                      : `${selectedTeamCount} team${selectedTeamCount === 1 ? "" : "s"}`
                  }
                  onPress={() => setOpenModal("teams")}
                  disabled={standings.length === 0}
                />

                {/* Byes for Top Seeds */}
                <ParamRow
                  icon={<Shield color="#6b7280" size={18} />}
                  label="First Round Byes"
                  value={`Top ${config.byes_for_top_seeds} seeds`}
                  onPress={() => setOpenModal("byes")}
                />

                {/* Consolation Toggle */}
                <ParamRow
                  icon={<Trophy color="#6b7280" size={18} />}
                  label="Consolation Bracket"
                  value={config.consolation ? "Yes" : "No"}
                  onPress={() => setOpenModal("consolation")}
                />

                {/* Consolation Count */}
                {config.consolation && (
                  <ParamRow
                    icon={<Users color="#6b7280" size={18} />}
                    label="Consolation Teams"
                    value={`${config.consolation_count}`}
                    onPress={() => setOpenModal("consolation_count")}
                  />
                )}

                {/* Consolation Byes */}
                {config.consolation && (
                  <ParamRow
                    icon={<Shield color="#6b7280" size={18} />}
                    label="Consolation Byes"
                    value={`Top ${config.consolation_byes}`}
                    onPress={() => setOpenModal("consolation_byes")}
                  />
                )}

                {/* Start Date */}
                <ParamRow
                  icon={<CalendarDays color="#6b7280" size={18} />}
                  label="Start Date"
                  value={config.start_date || "Not set"}
                  onPress={() => {
                    setDraftStartDate(config.start_date);
                    setOpenModal("start_date");
                  }}
                />

                {/* Days Between Rounds */}
                <ParamRow
                  icon={<Clock color="#6b7280" size={18} />}
                  label="Days Between Rounds"
                  value={`${config.days_between_rounds} days`}
                  onPress={() => setOpenModal("days_between")}
                />

                {/* Match Day */}
                <ParamRow
                  icon={<CalendarDays color="#6b7280" size={18} />}
                  label="Match Day"
                  value={DAY_NAMES[config.default_match_day]}
                  onPress={() => setOpenModal("match_day")}
                />

                {/* Generate button */}
                <View className="p-3 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={handleGenerate}
                    disabled={generating}
                    className="bg-primary rounded-lg py-3 items-center"
                  >
                    {generating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">Generate Preview</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Warnings ── */}
        {warnings.length > 0 && (
          <View>
            {warnings.map((w, i) => (
              <WarningBanner key={i} warning={w} />
            ))}
          </View>
        )}

        {/* ── Preview banner ── */}
        {isPreview && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-row items-center gap-2">
            <AlertTriangle color="#2563eb" size={16} />
            <Text className="text-sm text-blue-700 flex-1 font-medium">
              Preview — not saved yet. Review the bracket then tap Save.
            </Text>
          </View>
        )}

        {/* ── Seeds summary ── */}
        {activeBracket && activeSeeds.length > 0 && (
          <View className="bg-white rounded-lg border border-gray-200 p-3">
            <Text className="text-sm font-bold text-gray-900 mb-2">Seedings</Text>
            {activeSeeds.map((seed) => (
              <View
                key={seed.seed_number}
                className="flex-row items-center justify-between py-1.5 border-b border-gray-50"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-bold text-primary w-6">#{seed.seed_number}</Text>
                  <Text className="text-sm text-gray-800" numberOfLines={1}>
                    {seed.team_name}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">
                  {seed.wins}-{seed.losses} ({seed.win_percentage.toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Tab bar (main / consolation) ── */}
        {hasConsolation && (
          <View className="flex-row bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TouchableOpacity
              onPress={() => setActiveTab("main")}
              className={`flex-1 py-3 items-center ${
                activeTab === "main" ? "bg-primary" : "bg-white"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "main" ? "text-white" : "text-gray-600"
                }`}
              >
                Main Bracket
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("consolation")}
              className={`flex-1 py-3 items-center ${
                activeTab === "consolation" ? "bg-primary" : "bg-white"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "consolation" ? "text-white" : "text-gray-600"
                }`}
              >
                Consolation
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bracket View ── */}
        {activeBracket ? (
          <BracketView
            bracket={activeBracket}
            seeds={activeSeeds}
            isOperator={isOperator}
            isPreview={isPreview}
            onEditMatchup={(roundIdx, matchupIdx) =>
              handleEditMatchup(roundIdx, matchupIdx, activeTab)
            }
          />
        ) : (
          <View className="bg-white rounded-lg border border-gray-200 p-8 items-center">
            <Trophy color="#d1d5db" size={40} />
            <Text className="text-gray-400 text-center mt-3">
              {isOperator
                ? "No playoffs yet. Open the Playoff Generator above to create a bracket."
                : "No playoff bracket has been generated yet."}
            </Text>
          </View>
        )}

        {/* ── Save button (preview mode) ── */}
        {isPreview && isOperator && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-green-600 rounded-lg py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Save Playoff Bracket</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ════════════════════════════════════════
          PARAMETER MODALS
         ════════════════════════════════════════ */}

      {/* Team Count */}
      <ParamModal
        visible={openModal === "team_count"}
        title="Team Count"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many teams should be in the playoff bracket?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => {
                const newCount = Math.max(2, c.team_count - 1);
                const newIds = (c.team_ids ?? []).slice(0, newCount);
                return { ...c, team_count: newCount, team_ids: newIds };
              })
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.team_count}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => {
                const maxTeams = standings.length || 16;
                const newCount = Math.min(maxTeams, c.team_count + 1);
                // Auto-add next team from standings if available
                const currentIds = c.team_ids ?? [];
                if (currentIds.length < newCount && standings.length >= newCount) {
                  const newIds = standings.slice(0, newCount).map((s) => s.team_id);
                  return { ...c, team_count: newCount, team_ids: newIds };
                }
                return { ...c, team_count: newCount };
              })
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Select Teams */}
      <ParamModal
        visible={openModal === "teams"}
        title="Select Teams"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-3">
          Select teams for the playoff bracket. Teams are ordered by standings.
        </Text>
        {standings.map((ts) => {
          const isSelected = (config.team_ids ?? []).includes(ts.team_id);
          return (
            <TouchableOpacity
              key={ts.team_id}
              onPress={() =>
                setConfig((c) => {
                  const current = c.team_ids ?? [];
                  const newIds = isSelected
                    ? current.filter((id) => id !== ts.team_id)
                    : [...current, ts.team_id];
                  return { ...c, team_ids: newIds, team_count: newIds.length };
                })
              }
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xs font-bold text-gray-400 w-6">#{ts.place}</Text>
                <View>
                  <Text className="text-base text-gray-800">{ts.team_name}</Text>
                  <Text className="text-xs text-gray-500">
                    {ts.wins}-{ts.losses} ({ts.win_percentage.toFixed(1)}%)
                  </Text>
                </View>
              </View>
              {isSelected && <Check color="#26A69A" size={18} />}
            </TouchableOpacity>
          );
        })}
      </ParamModal>

      {/* Byes for Top Seeds */}
      <ParamModal
        visible={openModal === "byes"}
        title="First Round Byes"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many top seeds get first round byes?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                byes_for_top_seeds: Math.max(0, c.byes_for_top_seeds - 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.byes_for_top_seeds}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                byes_for_top_seeds: Math.min(
                  Math.floor(c.team_count / 2),
                  c.byes_for_top_seeds + 1
                ),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Consolation Toggle */}
      <ParamModal
        visible={openModal === "consolation"}
        title="Consolation Bracket"
        onClose={() => setOpenModal(null)}
      >
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 mr-4">
            <Text className="text-base text-gray-800 font-medium">Enable Consolation Bracket</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Include a consolation bracket for teams that don't make the main bracket.
            </Text>
          </View>
          <Switch
            value={config.consolation}
            onValueChange={(v) => setConfig((c) => ({ ...c, consolation: v }))}
            trackColor={{ true: "#26A69A" }}
          />
        </View>
      </ParamModal>

      {/* Consolation Count */}
      <ParamModal
        visible={openModal === "consolation_count"}
        title="Consolation Teams"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many teams in the consolation bracket?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                consolation_count: Math.max(2, c.consolation_count - 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.consolation_count}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                consolation_count: Math.min(16, c.consolation_count + 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Consolation Byes */}
      <ParamModal
        visible={openModal === "consolation_byes"}
        title="Consolation Byes"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many top seeds in consolation get first round byes?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                consolation_byes: Math.max(0, c.consolation_byes - 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.consolation_byes}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                consolation_byes: Math.min(
                  Math.floor(c.consolation_count / 2),
                  c.consolation_byes + 1
                ),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Start Date */}
      <ParamModal
        visible={openModal === "start_date"}
        title="Start Date"
        onClose={() => {
          if (draftStartDate && /^\d{4}-\d{2}-\d{2}$/.test(draftStartDate)) {
            setConfig((c) => ({ ...c, start_date: draftStartDate }));
          }
          setOpenModal(null);
        }}
      >
        <Text className="text-sm text-gray-600 mb-2">Enter the first playoff date (YYYY-MM-DD)</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900"
          value={draftStartDate}
          onChangeText={setDraftStartDate}
          placeholder="2026-04-15"
          keyboardType="numbers-and-punctuation"
          autoFocus
        />
      </ParamModal>

      {/* Days Between Rounds */}
      <ParamModal
        visible={openModal === "days_between"}
        title="Days Between Rounds"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many days between each playoff round?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                days_between_rounds: Math.max(1, c.days_between_rounds - 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.days_between_rounds}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                days_between_rounds: Math.min(30, c.days_between_rounds + 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Match Day */}
      <ParamModal
        visible={openModal === "match_day"}
        title="Default Match Day"
        onClose={() => setOpenModal(null)}
      >
        {DAY_NAMES.map((day, idx) => (
          <TouchableOpacity
            key={day}
            onPress={() => {
              setConfig((c) => ({ ...c, default_match_day: idx }));
              setOpenModal(null);
            }}
            className="flex-row items-center justify-between py-3 border-b border-gray-100"
          >
            <Text className="text-base text-gray-800">{day}</Text>
            {config.default_match_day === idx && <Check color="#26A69A" size={18} />}
          </TouchableOpacity>
        ))}
      </ParamModal>

      {/* Matchup Edit Modal */}
      <MatchupEditModal
        visible={editingMatchup !== null}
        onClose={() => setEditingMatchup(null)}
        matchup={getEditingMatchup()}
        seeds={getEditingSeeds()}
        onSave={handleSaveMatchup}
      />
    </ScrollView>
  );
}
