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
  Building2,
  LayoutGrid,
  Repeat,
  Home,
  TreePine,
  AlertTriangle,
  Check,
} from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import {
  seasonsApi,
  formatDateDisplay,
  type ScheduleConfiguration,
  type ScheduleWeek,
  type ScheduleWarning,
  type Venue,
  type SeasonParticipation,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import { useUserContextStore } from "../stores/userContextStore";
import type { SeasonsStackScreenProps } from "../navigation/types";
import DatePickerField from "../components/DatePickerField";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatMatchDate(dateString: string) {
  try {
    return formatDateDisplay(dateString);
  } catch {
    return dateString;
  }
}

function formatWeekDate(dateString: string) {
  try {
    return formatDateDisplay(dateString);
  } catch {
    return "";
  }
}

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
function WarningBanner({ warning }: { warning: ScheduleWarning }) {
  return (
    <View className="flex-row items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
      <AlertTriangle color="#d97706" size={16} style={{ marginTop: 1 }} />
      <Text className="text-sm text-yellow-800 flex-1">{warning.message}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────
export default function SeasonScheduleScreen({
  route,
  navigation: _navigation,
}: SeasonsStackScreenProps<"SeasonSchedule">) {
  const { seasonId, leagueId } = route.params;
  const { accessToken } = useAuthStore();
  const isOperatorFn = useUserContextStore((s) => s.isOperator);
  const canGenerate = isOperatorFn(leagueId);

  // ── Live schedule state ──
  const [liveWeeks, setLiveWeeks] = useState<ScheduleWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Generator state (operator only) ──
  const [configOpen, setConfigOpen] = useState(false);
  const [teams, setTeams] = useState<SeasonParticipation[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  const [config, setConfig] = useState<ScheduleConfiguration>({
    start_date: "",
    break_weeks: [],
    bye_weeks: [],
    alternating_home_away: true,
    times_play_each_other: 1,
    tables_per_establishment: {},
    selected_venue_ids: [],
    selected_team_ids: [],
    default_match_day: 2,
  });

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewWeeks, setPreviewWeeks] = useState<ScheduleWeek[] | null>(null);
  const [warnings, setWarnings] = useState<ScheduleWarning[]>([]);

  // ── Week collapse state ──
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());

  // ── Param modals ──
  type ModalType = "start_date" | "match_day" | "times" | "home_away" | "teams" | "venues" | "tables" | "break_weeks";
  const [openModal, setOpenModal] = useState<ModalType | null>(null);

  // local modal draft state
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftBreakWeekInput, setDraftBreakWeekInput] = useState("");
  const [tableInputs, setTableInputs] = useState<Record<number, string>>({});

  // ── Load live schedule ──
  const loadSchedule = useCallback(async () => {
    try {
      const resp = await seasonsApi.getMatches(seasonId, accessToken ?? undefined);
      // Build ScheduleWeek[] from flat match list
      const byWeek: Record<number, ScheduleWeek> = {};
      for (const m of resp.matches) {
        const wn = m.week_number ?? 0;
        if (!byWeek[wn]) {
          byWeek[wn] = { week_number: wn, date: m.date, matches: [] };
        }
        byWeek[wn].matches.push({
          id: m.id,
          home_team_id: m.home_team ?? null,
          home_team_name: m.home_team_detail?.name,
          away_team_id: m.away_team ?? null,
          away_team_name: m.away_team_detail?.name,
          date: m.date,
        });
      }
      // Include byes
      for (const b of resp.byes ?? []) {
        const wn = b.week_number ?? 0;
        if (!byWeek[wn]) {
          byWeek[wn] = { week_number: wn, date: b.date, matches: [] };
        }
        byWeek[wn].matches.push({
          home_team_id: null,
          away_team_id: null,
          date: b.date,
          is_bye: true,
          bye_team_name: b.team_name,
        });
      }
      const sorted = Object.values(byWeek).sort((a, b) => a.week_number - b.week_number);

      // Collapse past weeks by default
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const initialCollapsed = new Set<number>();
      for (const w of sorted) {
        const weekDate = new Date(w.date);
        if (weekDate < today) initialCollapsed.add(w.week_number);
      }
      setCollapsedWeeks(initialCollapsed);
      setLiveWeeks(sorted);
    } catch (err) {
      console.error("Failed to load schedule:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seasonId, accessToken]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // ── Load teams + venues when operator opens config ──
  const loadResources = useCallback(async () => {
    if (resourcesLoaded) return;
    try {
      const [teamsResp, venuesResp] = await Promise.all([
        seasonsApi.getTeams(seasonId, accessToken ?? undefined),
        seasonsApi.getVenues(seasonId, accessToken ?? undefined),
      ]);
      setTeams(teamsResp);
      setVenues(venuesResp);
      // Pre-select all
      const allTeamIds = teamsResp.map((t) => t.team);
      const allVenueIds = venuesResp.map((v) => v.id);
      const tablesMap: Record<number, number> = {};
      for (const v of venuesResp) tablesMap[v.id] = v.table_count;
      setConfig((c) => ({
        ...c,
        selected_team_ids: allTeamIds,
        selected_venue_ids: allVenueIds,
        tables_per_establishment: tablesMap,
      }));
      const inputs: Record<number, string> = {};
      for (const v of venuesResp) inputs[v.id] = String(v.table_count);
      setTableInputs(inputs);
      setResourcesLoaded(true);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  }, [seasonId, accessToken, resourcesLoaded]);

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
      const resp = await seasonsApi.generateSchedule(seasonId, config, accessToken ?? undefined);
      setPreviewWeeks(resp.schedule);
      setWarnings(resp.warnings ?? []);
      // Expand all preview weeks
      setCollapsedWeeks(new Set());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate schedule.";
      Alert.alert("Error", msg);
    } finally {
      setGenerating(false);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!previewWeeks) return;
    setSaving(true);
    try {
      const result = await seasonsApi.saveSchedule(
        seasonId,
        { schedule: previewWeeks, configuration: config },
        accessToken ?? undefined
      );
      Alert.alert(
        "Schedule Saved",
        `${result.matches_created} match${result.matches_created === 1 ? "" : "es"} created.`,
        [{ text: "OK" }]
      );
      setPreviewWeeks(null);
      setWarnings([]);
      setRefreshing(true);
      await loadSchedule();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save schedule.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Week collapse ──
  const toggleWeek = (weekNum: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  };

  // ── Display weeks (preview takes precedence) ──
  const displayWeeks = previewWeeks ?? liveWeeks;
  const isPreview = previewWeeks !== null;

  // ── Config display helpers ──
  const selectedTeamCount = config.selected_team_ids?.length ?? 0;
  const selectedVenueCount = config.selected_venue_ids?.length ?? 0;
  const totalTables = Object.values(config.tables_per_establishment ?? {}).reduce((a, b) => a + b, 0);
  const breakWeekCount = config.break_weeks?.length ?? 0;

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSchedule(); }} />}
    >
      <View className="p-4 pb-28 space-y-4">

        {/* ── Operator Config Panel ── */}
        {canGenerate && (
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TouchableOpacity
              onPress={handleToggleConfig}
              className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
            >
              <Text className="text-base font-bold text-gray-900">Schedule Generator</Text>
              {configOpen ? (
                <ChevronDown color="#6b7280" size={20} />
              ) : (
                <ChevronRight color="#6b7280" size={20} />
              )}
            </TouchableOpacity>

            {configOpen && (
              <View>
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

                {/* Match Day */}
                <ParamRow
                  icon={<CalendarDays color="#6b7280" size={18} />}
                  label="Match Day"
                  value={DAY_NAMES[config.default_match_day ?? 2]}
                  onPress={() => setOpenModal("match_day")}
                />

                {/* Times Play Each Other */}
                <ParamRow
                  icon={<Repeat color="#6b7280" size={18} />}
                  label="Play Each Other"
                  value={`${config.times_play_each_other} time${config.times_play_each_other === 1 ? "" : "s"}`}
                  onPress={() => setOpenModal("times")}
                />

                {/* Alternating Home/Away */}
                <ParamRow
                  icon={<Home color="#6b7280" size={18} />}
                  label="Home/Away"
                  value={config.alternating_home_away ? "Alternating" : "Fixed"}
                  onPress={() => setOpenModal("home_away")}
                />

                {/* Teams */}
                <ParamRow
                  icon={<Users color="#6b7280" size={18} />}
                  label="Teams"
                  value={
                    teams.length === 0
                      ? "Loading…"
                      : selectedTeamCount === teams.length
                      ? `${teams.length} teams`
                      : `${selectedTeamCount} of ${teams.length}`
                  }
                  onPress={() => setOpenModal("teams")}
                  disabled={teams.length === 0}
                />

                {/* Venues */}
                <ParamRow
                  icon={<Building2 color="#6b7280" size={18} />}
                  label="Venues"
                  value={
                    venues.length === 0
                      ? "Loading…"
                      : selectedVenueCount === venues.length
                      ? `${venues.length} venues`
                      : `${selectedVenueCount} of ${venues.length}`
                  }
                  onPress={() => setOpenModal("venues")}
                  disabled={venues.length === 0}
                />

                {/* Tables per Venue */}
                <ParamRow
                  icon={<LayoutGrid color="#6b7280" size={18} />}
                  label="Tables"
                  value={`${totalTables} total`}
                  onPress={() => setOpenModal("tables")}
                  disabled={venues.length === 0}
                />

                {/* Break Weeks */}
                <ParamRow
                  icon={<TreePine color="#6b7280" size={18} />}
                  label="Break Weeks"
                  value={
                    breakWeekCount === 0
                      ? "None set"
                      : breakWeekCount === 1
                      ? `Week ${config.break_weeks![0]}`
                      : `${breakWeekCount} weeks`
                  }
                  onPress={() => {
                    setDraftBreakWeekInput("");
                    setOpenModal("break_weeks");
                  }}
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
              Preview — not saved yet. Review the schedule then tap Save.
            </Text>
          </View>
        )}

        {/* ── Schedule weeks ── */}
        {displayWeeks.length === 0 ? (
          <View className="bg-white rounded-lg border border-gray-200 p-8 items-center">
            <CalendarDays color="#d1d5db" size={40} />
            <Text className="text-gray-400 text-center mt-3">
              {canGenerate
                ? "No schedule yet. Open Schedule Generator above to create one."
                : "No schedule has been generated yet."}
            </Text>
          </View>
        ) : (
          displayWeeks.map((week) => {
            const isCollapsed = collapsedWeeks.has(week.week_number);
            return (
              <View
                key={`week-${week.week_number}`}
                className={`bg-white rounded-lg border overflow-hidden ${
                  isPreview ? "border-blue-200" : "border-gray-200"
                }`}
              >
                <TouchableOpacity
                  onPress={() => toggleWeek(week.week_number)}
                  className={`p-3 flex-row items-center justify-between ${
                    isPreview ? "bg-blue-50" : "bg-gray-50"
                  } border-b ${isPreview ? "border-blue-100" : "border-gray-200"}`}
                >
                  <View>
                    <Text className="text-sm font-bold text-gray-900">
                      Week {week.week_number}
                      {week.is_break_week ? "  (Break)" : ""}
                    </Text>
                    {week.date && (
                      <Text className="text-xs text-gray-500">{formatWeekDate(week.date)}</Text>
                    )}
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-gray-400">
                      {week.matches.length} match{week.matches.length === 1 ? "" : "es"}
                    </Text>
                    {isCollapsed ? (
                      <ChevronRight color="#9ca3af" size={18} />
                    ) : (
                      <ChevronDown color="#9ca3af" size={18} />
                    )}
                  </View>
                </TouchableOpacity>

                {!isCollapsed && (
                  <View className="p-2">
                    {week.matches.map((match, idx) => {
                      if (match.is_bye) {
                        return (
                          <View
                            key={`bye-${idx}`}
                            className="bg-gray-50 rounded-lg p-3 mb-2 border border-dashed border-gray-200"
                          >
                            <Text className="text-xs text-gray-400 italic">
                              Bye — {match.bye_team_name ?? "Unknown team"}
                            </Text>
                          </View>
                        );
                      }
                      return (
                        <View
                          key={`match-${match.id ?? idx}`}
                          className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200"
                        >
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-gray-500">{formatMatchDate(match.date)}</Text>
                            {match.venue_name && (
                              <Text className="text-xs text-gray-400">{match.venue_name}</Text>
                            )}
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                              {match.home_team_name ?? "TBD"}
                            </Text>
                            <Text className="text-xs text-gray-400 mx-2">vs</Text>
                            <Text
                              className="text-sm font-semibold text-gray-900 flex-1 text-right"
                              numberOfLines={1}
                            >
                              {match.away_team_name ?? "TBD"}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ── Save button (preview mode) ── */}
        {isPreview && canGenerate && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-green-600 rounded-lg py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Save Schedule</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ════════════════════════════════════════
          PARAMETER MODALS
         ════════════════════════════════════════ */}

      {/* Start Date */}
      <ParamModal
        visible={openModal === "start_date"}
        title="Start Date"
        onClose={() => {
          if (draftStartDate) {
            setConfig((c) => ({ ...c, start_date: draftStartDate }));
          }
          setOpenModal(null);
        }}
      >
        <Text className="text-sm text-gray-600 mb-2">Select the first match day</Text>
        <DatePickerField
          label="Start Date"
          value={draftStartDate}
          onChange={setDraftStartDate}
          placeholder="Select start date"
          required
        />
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
            {(config.default_match_day ?? 2) === idx && (
              <Check color="#26A69A" size={18} />
            )}
          </TouchableOpacity>
        ))}
      </ParamModal>

      {/* Times Play Each Other */}
      <ParamModal
        visible={openModal === "times"}
        title="Play Each Other"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-4">
          How many times should each pair of teams play each other?
        </Text>
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                times_play_each_other: Math.max(1, (c.times_play_each_other ?? 1) - 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Minus color="#374151" size={20} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900 w-12 text-center">
            {config.times_play_each_other ?? 1}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setConfig((c) => ({
                ...c,
                times_play_each_other: Math.min(8, (c.times_play_each_other ?? 1) + 1),
              }))
            }
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
          >
            <Plus color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </ParamModal>

      {/* Alternating Home/Away */}
      <ParamModal
        visible={openModal === "home_away"}
        title="Home/Away"
        onClose={() => setOpenModal(null)}
      >
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-1 mr-4">
            <Text className="text-base text-gray-800 font-medium">Alternating Home/Away</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Teams alternate home and away games each week. Turn off for fixed home/away assignments.
            </Text>
          </View>
          <Switch
            value={config.alternating_home_away ?? true}
            onValueChange={(v) => setConfig((c) => ({ ...c, alternating_home_away: v }))}
            trackColor={{ true: "#26A69A" }}
          />
        </View>
      </ParamModal>

      {/* Teams */}
      <ParamModal
        visible={openModal === "teams"}
        title="Select Teams"
        onClose={() => setOpenModal(null)}
      >
        {teams.map((tp) => {
          const isSelected = (config.selected_team_ids ?? []).includes(tp.team);
          return (
            <TouchableOpacity
              key={tp.id}
              onPress={() =>
                setConfig((c) => {
                  const current = c.selected_team_ids ?? [];
                  return {
                    ...c,
                    selected_team_ids: isSelected
                      ? current.filter((id) => id !== tp.team)
                      : [...current, tp.team],
                  };
                })
              }
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <Text className="text-base text-gray-800">
                {tp.team_detail?.name ?? `Team ${tp.team}`}
              </Text>
              {isSelected && <Check color="#26A69A" size={18} />}
            </TouchableOpacity>
          );
        })}
      </ParamModal>

      {/* Venues */}
      <ParamModal
        visible={openModal === "venues"}
        title="Select Venues"
        onClose={() => setOpenModal(null)}
      >
        {venues.map((v) => {
          const isSelected = (config.selected_venue_ids ?? []).includes(v.id);
          return (
            <TouchableOpacity
              key={v.id}
              onPress={() =>
                setConfig((c) => {
                  const current = c.selected_venue_ids ?? [];
                  return {
                    ...c,
                    selected_venue_ids: isSelected
                      ? current.filter((id) => id !== v.id)
                      : [...current, v.id],
                  };
                })
              }
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <Text className="text-base text-gray-800">{v.name}</Text>
              {isSelected && <Check color="#26A69A" size={18} />}
            </TouchableOpacity>
          );
        })}
      </ParamModal>

      {/* Tables per Venue */}
      <ParamModal
        visible={openModal === "tables"}
        title="Tables per Venue"
        onClose={() => {
          // Commit text inputs to config
          const updated: Record<number, number> = {};
          for (const [id, val] of Object.entries(tableInputs)) {
            const n = parseInt(val, 10);
            if (!isNaN(n) && n > 0) updated[Number(id)] = n;
          }
          setConfig((c) => ({ ...c, tables_per_establishment: updated }));
          setOpenModal(null);
        }}
      >
        {venues.map((v) => (
          <View key={v.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-base text-gray-800 flex-1 mr-3">{v.name}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-1 text-base text-gray-900 w-20 text-center"
              value={tableInputs[v.id] ?? String(v.table_count)}
              onChangeText={(t) => setTableInputs((prev) => ({ ...prev, [v.id]: t }))}
              keyboardType="number-pad"
            />
          </View>
        ))}
      </ParamModal>

      {/* Break Weeks */}
      <ParamModal
        visible={openModal === "break_weeks"}
        title="Break Weeks"
        onClose={() => setOpenModal(null)}
      >
        <Text className="text-sm text-gray-600 mb-3">
          Enter week numbers where no matches should be scheduled (holidays, etc.).
        </Text>
        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-base text-gray-900 flex-1"
            value={draftBreakWeekInput}
            onChangeText={setDraftBreakWeekInput}
            placeholder="Week number"
            keyboardType="number-pad"
          />
          <TouchableOpacity
            onPress={() => {
              const n = parseInt(draftBreakWeekInput, 10);
              if (!isNaN(n) && n > 0) {
                setConfig((c) => ({
                  ...c,
                  break_weeks: [...new Set([...(c.break_weeks ?? []), n])].sort((a, b) => a - b),
                }));
                setDraftBreakWeekInput("");
              }
            }}
            className="bg-primary rounded-lg px-4 items-center justify-center"
          >
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        </View>
        {(config.break_weeks ?? []).length === 0 ? (
          <Text className="text-sm text-gray-400 text-center py-2">No break weeks set</Text>
        ) : (
          (config.break_weeks ?? []).map((wn) => (
            <View
              key={wn}
              className="flex-row items-center justify-between py-2 border-b border-gray-100"
            >
              <Text className="text-base text-gray-800">Week {wn}</Text>
              <TouchableOpacity
                onPress={() =>
                  setConfig((c) => ({
                    ...c,
                    break_weeks: (c.break_weeks ?? []).filter((w) => w !== wn),
                  }))
                }
              >
                <X color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ParamModal>
    </ScrollView>
  );
}
