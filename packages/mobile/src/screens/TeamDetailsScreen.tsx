import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  MapPin,
  Users,
  Calendar,
  Trophy,
  ChevronRight,
  ChevronDown,
  Mail,
  Crown,
  Pencil,
  Plus,
  X,
  Search,
} from "lucide-react-native";
import {
  teamsApi,
  playerClaimsApi,
  type Team,
  type TeamMembership,
  type SeasonParticipation,
  type PlayerSearchResult,
} from "@league-genius/shared";
import type { RootStackScreenProps } from "../navigation/types";
import { useUserContextStore } from "../stores/userContextStore";
import { useAuthStore } from "../stores/authStore";

// ─── Edit Team Modal ────────────────────────────────────────────────────────

interface EditTeamModalProps {
  visible: boolean;
  team: Team;
  onClose: () => void;
  onSaved: (updated: Team) => void;
  accessToken: string;
}

function EditTeamModal({ visible, team, onClose, onSaved, accessToken }: EditTeamModalProps) {
  const [name, setName] = useState(team.name ?? "");
  const [establishment, setEstablishment] = useState(team.establishment ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(team.name ?? "");
    setEstablishment(team.establishment ?? "");
  }, [team.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Team name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await teamsApi.update(
        team.id,
        { name: name.trim(), establishment: establishment.trim() || undefined },
        accessToken
      );
      onSaved(updated);
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save team");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Edit Team</Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <X color="#6b7280" size={22} />
          </TouchableOpacity>
        </View>
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Team Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Location / Establishment
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                placeholder="e.g. The Break Room, Austin TX"
                value={establishment}
                onChangeText={setEstablishment}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
          </View>
        </ScrollView>
        <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
          <TouchableOpacity
            onPress={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="font-semibold text-white">Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Manage Captains Modal ──────────────────────────────────────────────────

interface ManageCaptainsModalProps {
  visible: boolean;
  team: Team;
  roster: TeamMembership[];
  onClose: () => void;
  onSaved: (updated: Team) => void;
  accessToken: string;
}

function ManageCaptainsModal({
  visible,
  team,
  roster,
  onClose,
  onSaved,
  accessToken,
}: ManageCaptainsModalProps) {
  const [currentTeam, setCurrentTeam] = useState(team);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTeam(team);
  }, [team]);

  const currentCaptainIds = currentTeam.captains_detail?.map((c) => c.player) ?? [];

  const handleToggle = async (playerId: number, isCaptain: boolean) => {
    setToggling(playerId);
    try {
      let updated: Team;
      if (isCaptain) {
        updated = await teamsApi.removeCaptain(currentTeam.id, playerId, accessToken);
      } else {
        updated = await teamsApi.addCaptain(currentTeam.id, playerId, accessToken);
      }
      setCurrentTeam(updated);
      onSaved(updated);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update captain");
    } finally {
      setToggling(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Manage Captains</Text>
          <TouchableOpacity onPress={onClose} className="p-1">
            <X color="#6b7280" size={22} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {roster.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-400">No roster members to promote</Text>
            </View>
          ) : (
            roster.map((membership, index) => {
              const isCaptain = currentCaptainIds.includes(membership.player);
              const isLoading = toggling === membership.player;
              return (
                <View
                  key={membership.id}
                  className={`flex-row items-center px-4 py-4 ${
                    index < roster.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-medium text-gray-900">
                        {membership.player_detail?.full_name || `Player #${membership.player}`}
                      </Text>
                      {isCaptain && <Crown color="#d97706" size={14} />}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggle(membership.player, isCaptain)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-full ${
                      isCaptain
                        ? "bg-amber-100 border border-amber-300"
                        : "bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#26A69A" />
                    ) : (
                      <Text
                        className={`text-xs font-semibold ${
                          isCaptain ? "text-amber-700" : "text-gray-600"
                        }`}
                      >
                        {isCaptain ? "Remove" : "Make Captain"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────

interface AddMemberModalProps {
  visible: boolean;
  teamId: number;
  existingPlayerIds: number[];
  onClose: () => void;
  onAdded: () => void;
  accessToken: string;
}

function AddMemberModal({
  visible,
  teamId,
  existingPlayerIds,
  onClose,
  onAdded,
  accessToken,
}: AddMemberModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await playerClaimsApi.searchPlayers(query, 20, accessToken);
        setResults(response.results);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (player: PlayerSearchResult) => {
    setAdding(player.id);
    try {
      await teamsApi.addMember(teamId, player.id, accessToken);
      Alert.alert("Added", `${player.full_name} added to the team`);
      onAdded();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to add player");
    } finally {
      setAdding(null);
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Add Player to Roster</Text>
          <TouchableOpacity onPress={handleClose} className="p-1">
            <X color="#6b7280" size={22} />
          </TouchableOpacity>
        </View>
        <View className="px-4 pt-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-lg px-3 mb-4">
            <Search color="#9ca3af" size={18} />
            <TextInput
              className="flex-1 py-3 ml-2 text-gray-900"
              placeholder="Search players by name…"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X color="#9ca3af" size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {isSearching && <ActivityIndicator color="#26A69A" style={{ marginTop: 16 }} />}
          {!isSearching && query.length >= 2 && results.length === 0 && (
            <Text className="text-gray-400 text-center mt-4">No players found</Text>
          )}
          {!isSearching && query.length < 2 && (
            <Text className="text-gray-400 text-center mt-8">Type to search for players</Text>
          )}
          {results.map((player) => {
            const alreadyOnTeam = existingPlayerIds.includes(player.id);
            return (
              <View
                key={player.id}
                className="bg-white rounded-lg p-4 border border-gray-200 mb-2 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{player.full_name}</Text>
                  {player.leagues.length > 0 && (
                    <Text className="text-xs text-primary mt-0.5">
                      {player.leagues[0].season_name}
                    </Text>
                  )}
                </View>
                {alreadyOnTeam ? (
                  <View className="ml-3 px-3 py-1.5 rounded-full bg-gray-100">
                    <Text className="text-xs text-gray-500 font-medium">On Team</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleAdd(player)}
                    disabled={adding === player.id}
                    className="ml-3 bg-primary px-3 py-1.5 rounded-full"
                  >
                    {adding === player.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white text-xs font-semibold">Add</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TeamDetailsScreen({
  route,
  navigation,
}: RootStackScreenProps<"TeamDetails">) {
  const { teamId } = route.params;
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamMembership[]>([]);
  const [seasons, setSeasons] = useState<SeasonParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [seasonsCollapsed, setSeasonsCollapsed] = useState(false);

  // Management modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);

  const { isCaptain, myLeagues } = useUserContextStore();
  const { accessToken } = useAuthStore();

  const isTeamCaptain = isCaptain(teamId);
  const isAnyOperator = myLeagues.some((l) => l.is_operator);
  const canManage = isTeamCaptain || isAnyOperator;

  const loadTeamData = useCallback(async () => {
    try {
      const [teamResponse, rosterResponse, seasonsResponse] = await Promise.all([
        teamsApi.getById(teamId),
        teamsApi.getRoster(teamId),
        teamsApi.getSeasons(teamId),
      ]);
      setTeam(teamResponse);
      setRoster(rosterResponse);
      setSeasons(seasonsResponse);
    } catch (error) {
      console.error("Failed to load team data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "TBD";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "TBD";
    }
  };

  const captainIds = team?.captains_detail?.map((c) => c.player) ?? [];
  const rosterPlayerIds = roster.map((m) => m.player);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  if (!team) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-red-600 text-center">Failed to load team details</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4 pb-20 space-y-4">
          {/* Team Overview Card */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">{team.name}</Text>
                {team.establishment && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <MapPin color="#6b7280" size={14} />
                    <Text className="text-sm text-gray-600">{team.establishment}</Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center gap-2">
                <View
                  className={`px-3 py-1 rounded-full ${
                    team.active ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      team.active ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {team.active ? "Active" : "Inactive"}
                  </Text>
                </View>
                {canManage && (
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(true)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} color="#4B5563" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row gap-4 pt-3 border-t border-gray-100">
              <View className="flex-row items-center gap-2">
                <Users color="#6b7280" size={16} />
                <Text className="text-sm text-gray-600">
                  {roster.length} {roster.length === 1 ? "Player" : "Players"}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Calendar color="#6b7280" size={16} />
                <Text className="text-sm text-gray-600">
                  Created {formatDate(team.created_at)}
                </Text>
              </View>
            </View>

            {/* Captain Badge for Current User */}
            {isTeamCaptain && (
              <View className="mt-3 bg-amber-50 rounded-lg p-3 flex-row items-center gap-2">
                <Crown color="#d97706" size={16} />
                <Text className="text-sm text-amber-700 font-medium">
                  You are a captain of this team
                </Text>
              </View>
            )}
          </View>

          {/* Team Captains Section */}
          {(team.captains_detail?.length > 0 || canManage) && (
            <View className="bg-white rounded-lg p-4 border border-gray-200 mt-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Crown color="#d97706" size={18} />
                  <Text className="text-base font-bold text-gray-900">Team Leadership</Text>
                </View>
                {canManage && (
                  <TouchableOpacity
                    onPress={() => setCaptainModalVisible(true)}
                    className="flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full"
                  >
                    <Pencil size={14} color="#4B5563" />
                    <Text className="text-xs font-semibold text-gray-700">Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              {team.captains_detail && team.captains_detail.length > 0 ? (
                <View className="space-y-2">
                  {team.captains_detail.map((captain) => (
                    <View
                      key={captain.id}
                      className="flex-row items-center justify-between p-3 bg-amber-50 rounded-lg"
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                          <Text className="text-sm font-bold text-amber-700">
                            {captain.player_detail?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </Text>
                        </View>
                        <View>
                          <Text className="font-medium text-gray-900">
                            {captain.player_detail?.full_name}
                          </Text>
                          <Text className="text-xs text-gray-500">Captain</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500">
                        {formatDate(captain.appointed_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-400">No captains assigned</Text>
              )}
            </View>
          )}

          {/* Team Roster Section */}
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3">
            <TouchableOpacity
              onPress={() => setRosterCollapsed(!rosterCollapsed)}
              className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Users color="#26A69A" size={18} />
                <Text className="text-base font-bold text-gray-900">Team Roster</Text>
                <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-gray-600">{roster.length}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                {canManage && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setAddMemberModalVisible(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-1 bg-primary rounded-full"
                  >
                    <Plus size={14} color="#fff" />
                  </TouchableOpacity>
                )}
                {rosterCollapsed ? (
                  <ChevronRight color="#6b7280" size={20} />
                ) : (
                  <ChevronDown color="#6b7280" size={20} />
                )}
              </View>
            </TouchableOpacity>

            {!rosterCollapsed && (
              <View>
                {roster.length === 0 ? (
                  <View className="p-8">
                    <Text className="text-gray-400 text-center">
                      No players on the roster yet
                    </Text>
                    {canManage && (
                      <TouchableOpacity
                        onPress={() => setAddMemberModalVisible(true)}
                        className="mt-3 items-center"
                      >
                        <Text className="text-primary text-sm font-medium">+ Add a player</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View>
                    {roster.map((membership, index) => {
                      const isMemberCaptain = captainIds.includes(membership.player);
                      return (
                        <View
                          key={membership.id}
                          className={`p-4 flex-row items-center justify-between ${
                            index < roster.length - 1 ? "border-b border-gray-100" : ""
                          }`}
                        >
                          <View className="flex-row items-center gap-3 flex-1">
                            <View
                              className={`w-10 h-10 rounded-full items-center justify-center ${
                                isMemberCaptain ? "bg-amber-100" : "bg-primary-100"
                              }`}
                            >
                              <Text
                                className={`text-sm font-bold ${
                                  isMemberCaptain ? "text-amber-700" : "text-primary"
                                }`}
                              >
                                {membership.player_detail?.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2">
                                <Text className="font-medium text-gray-900">
                                  {membership.player_detail?.full_name}
                                </Text>
                                {isMemberCaptain && <Crown color="#d97706" size={14} />}
                              </View>
                              {membership.player_detail?.email && (
                                <View className="flex-row items-center gap-1 mt-0.5">
                                  <Mail color="#9ca3af" size={12} />
                                  <Text
                                    className="text-xs text-gray-500"
                                    numberOfLines={1}
                                  >
                                    {membership.player_detail.email}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View className="items-end">
                            <View
                              className={`px-2 py-1 rounded-full ${
                                membership.is_active ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  membership.is_active ? "text-green-700" : "text-gray-600"
                                }`}
                              >
                                {membership.is_active ? "Active" : "Inactive"}
                              </Text>
                            </View>
                            <Text className="text-xs text-gray-400 mt-1">
                              Joined {formatDate(membership.joined_at)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Season History Section */}
          <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-3">
            <TouchableOpacity
              onPress={() => setSeasonsCollapsed(!seasonsCollapsed)}
              className="bg-gray-50 p-3 border-b border-gray-200 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <Trophy color="#26A69A" size={18} />
                <Text className="text-base font-bold text-gray-900">Season History</Text>
                <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-gray-600">{seasons.length}</Text>
                </View>
              </View>
              {seasonsCollapsed ? (
                <ChevronRight color="#6b7280" size={20} />
              ) : (
                <ChevronDown color="#6b7280" size={20} />
              )}
            </TouchableOpacity>

            {!seasonsCollapsed && (
              <View>
                {seasons.length === 0 ? (
                  <View className="p-8">
                    <Text className="text-gray-400 text-center">
                      This team hasn't participated in any seasons yet
                    </Text>
                  </View>
                ) : (
                  <View>
                    {seasons.map((participation, index) => (
                      <TouchableOpacity
                        key={participation.id}
                        onPress={() =>
                          navigation.navigate("Main", {
                            screen: "Seasons",
                            params: {
                              screen: "SeasonDetails",
                              params: { seasonId: participation.season },
                            },
                          } as any)
                        }
                        className={`p-4 ${
                          index < seasons.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Calendar color="#6b7280" size={16} />
                              <Text className="font-medium text-gray-900">
                                {participation.season_detail?.name || "Unknown Season"}
                              </Text>
                            </View>
                            {participation.season_detail?.league_name && (
                              <Text className="text-sm text-gray-500 mt-1 ml-6">
                                {participation.season_detail.league_name}
                              </Text>
                            )}
                          </View>
                          <View
                            className={`px-2 py-1 rounded-full ${
                              participation.is_active ? "bg-green-100" : "bg-gray-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                participation.is_active ? "text-green-700" : "text-gray-600"
                              }`}
                            >
                              {participation.is_active ? "Active" : "Completed"}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-3 mt-2">
                          <View className="flex-row gap-4">
                            <View className="items-center">
                              <Text className="text-xs text-gray-500 mb-1">Record</Text>
                              <Text className="text-sm font-bold">
                                <Text className="text-green-600">{participation.wins}</Text>
                                {" - "}
                                <Text className="text-red-600">{participation.losses}</Text>
                              </Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-xs text-gray-500 mb-1">Win %</Text>
                              <Text className="text-sm font-bold text-gray-900">
                                {participation.win_percentage?.toFixed(1) || 0}%
                              </Text>
                            </View>
                          </View>
                          <ChevronRight color="#9ca3af" size={20} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Management Modals */}
      {canManage && accessToken && (
        <>
          <EditTeamModal
            visible={editModalVisible}
            team={team}
            onClose={() => setEditModalVisible(false)}
            onSaved={(updated) => setTeam(updated)}
            accessToken={accessToken}
          />
          <ManageCaptainsModal
            visible={captainModalVisible}
            team={team}
            roster={roster}
            onClose={() => setCaptainModalVisible(false)}
            onSaved={(updated) => setTeam(updated)}
            accessToken={accessToken}
          />
          <AddMemberModal
            visible={addMemberModalVisible}
            teamId={teamId}
            existingPlayerIds={rosterPlayerIds}
            onClose={() => setAddMemberModalVisible(false)}
            onAdded={() => {
              setAddMemberModalVisible(false);
              loadTeamData();
            }}
            accessToken={accessToken}
          />
        </>
      )}
    </>
  );
}
