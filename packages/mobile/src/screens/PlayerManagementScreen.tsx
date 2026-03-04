import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Search,
  UserCheck,
  Send,
  Users,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
} from "lucide-react-native";
import {
  api,
  playerClaimsApi,
  formatDateDisplay,
  type PlayerNeedingActivation,
  type PlayerClaimRequest,
  type PlayerSearchResult,
  type Season,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { RootStackScreenProps } from "../navigation/types";
import AddPlayerModal from "../components/AddPlayerModal";

type TabKey = "search" | "needsActivation" | "claims";

export default function PlayerManagementScreen({
  route,
}: RootStackScreenProps<"PlayerManagement">) {
  const { leagueId, leagueName } = route.params;
  const { accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[] | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Activation state
  const [playersNeedingActivation, setPlayersNeedingActivation] = useState<
    PlayerNeedingActivation[]
  >([]);
  const [loadingActivation, setLoadingActivation] = useState(false);

  // Claims state
  const [pendingClaims, setPendingClaims] = useState<PlayerClaimRequest[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Bulk invite modal
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  // Add player modal
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);

  const loadActivationList = useCallback(async () => {
    setLoadingActivation(true);
    try {
      const result = await playerClaimsApi.getPlayersNeedingActivation(undefined, leagueId);
      setPlayersNeedingActivation(Array.isArray(result) ? result : []);
    } catch {
      setPlayersNeedingActivation([]);
    } finally {
      setLoadingActivation(false);
    }
  }, [leagueId]);

  const loadPendingClaims = useCallback(async () => {
    if (!accessToken) return;
    setLoadingClaims(true);
    try {
      const result = await playerClaimsApi.getPendingReviews(accessToken, leagueId);
      setPendingClaims(Array.isArray(result) ? result : []);
    } catch {
      setPendingClaims([]);
    } finally {
      setLoadingClaims(false);
    }
  }, [accessToken, leagueId]);

  useEffect(() => {
    loadActivationList();
    loadPendingClaims();
  }, [loadActivationList, loadPendingClaims]);

  // Load active season for the league (needed for AddPlayerModal team picker)
  useEffect(() => {
    api
      .get<{ results: Season[] }>("/seasons/", accessToken ?? undefined)
      .then((res) => {
        const leagueSeasons = res.results
          .filter((s) => s.league === leagueId)
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime()
          );
        if (leagueSeasons.length > 0) {
          setActiveSeasonId(leagueSeasons[0].id);
        }
      })
      .catch(() => {});
  }, [leagueId, accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadActivationList(), loadPendingClaims()]);
    setRefreshing(false);
  };

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.length < 2) {
      setSearchResults(null);
      setSearchCount(0);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await playerClaimsApi.searchPlayers(
          searchQuery,
          50,
          accessToken ?? undefined,
          leagueId
        );
        setSearchResults(response.results);
        setSearchCount(response.count);
      } catch {
        setSearchResults(null);
        setSearchCount(0);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, accessToken]);

  const handleSendInvite = (playerId: number, playerName: string) => {
    if (!accessToken) return;
    Alert.alert("Send Invite", `Send a claim invite email to ${playerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          try {
            await playerClaimsApi.sendInvite(playerId, accessToken);
            Alert.alert("Sent", `Invite sent to ${playerName}`);
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to send invite");
          }
        },
      },
    ]);
  };

  const handleSendActivation = (playerId: number, playerName: string) => {
    if (!accessToken) return;
    Alert.alert(
      "Send Activation",
      `Send an activation email to ${playerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            try {
              await playerClaimsApi.sendActivation(playerId, accessToken);
              Alert.alert("Sent", `Activation email sent to ${playerName}`);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to send activation");
            }
          },
        },
      ]
    );
  };

  const handleApproveClaim = (claimId: number, playerName: string) => {
    if (!accessToken) return;
    Alert.alert("Approve Claim", `Approve ${playerName}'s claim request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            await playerClaimsApi.approveClaimRequest(claimId, accessToken);
            setPendingClaims((prev) => prev.filter((c) => c.id !== claimId));
            Alert.alert("Approved", `Claim approved for ${playerName}`);
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to approve claim");
          }
        },
      },
    ]);
  };

  const handleDenyClaim = (claimId: number, playerName: string) => {
    if (!accessToken) return;
    Alert.alert("Deny Claim", `Deny ${playerName}'s claim request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deny",
        style: "destructive",
        onPress: async () => {
          try {
            await playerClaimsApi.denyClaimRequest(claimId, accessToken);
            setPendingClaims((prev) => prev.filter((c) => c.id !== claimId));
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Failed to deny claim");
          }
        },
      },
    ]);
  };

  const handleBulkInvite = async () => {
    if (!accessToken) return;
    setBulkSending(true);
    try {
      const result = await playerClaimsApi.sendBulkInvites(accessToken, true, leagueId);
      setBulkModalVisible(false);
      Alert.alert("Bulk Invite Sent", `Sent ${result.sent_count} invite(s).`);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send bulk invites");
    } finally {
      setBulkSending(false);
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "search", label: "Search" },
    {
      key: "needsActivation",
      label: "Pending",
      count: playersNeedingActivation.length || undefined,
    },
    {
      key: "claims",
      label: "Claims",
      count: pendingClaims.length || undefined,
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tab Bar */}
      <View className="flex-row bg-white border-b border-gray-200">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 items-center flex-row justify-center gap-1 ${
              activeTab === tab.key ? "border-b-2 border-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? "text-primary" : "text-gray-500"
              }`}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined && (
              <View className="bg-primary rounded-full px-1.5 py-0.5">
                <Text className="text-white text-xs font-bold">
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* SEARCH TAB */}
        {activeTab === "search" && (
          <View>
            <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 mb-4">
              <Search color="#9ca3af" size={18} />
              <TextInput
                className="flex-1 py-3 ml-2 text-gray-900"
                placeholder="Search players by name…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X color="#9ca3af" size={16} />
                </TouchableOpacity>
              )}
            </View>

            {isSearching && (
              <ActivityIndicator color="#26A69A" style={{ marginTop: 16 }} />
            )}

            {!isSearching && searchQuery.length >= 2 && !searchResults?.length && (
              <Text className="text-gray-400 text-center mt-4">
                No results found
              </Text>
            )}

            {!isSearching && searchQuery.length < 2 && (
              <View className="items-center mt-8">
                <Users color="#d1d5db" size={40} />
                <Text className="text-gray-400 mt-2 text-center">
                  Type at least 2 characters to search
                </Text>
              </View>
            )}

            {searchResults && searchResults.length > 0 && (
              <View>
                <Text className="text-xs text-gray-500 mb-2">
                  {searchCount} result{searchCount !== 1 ? "s" : ""}
                </Text>
                {searchResults.map((player) => (
                  <View
                    key={player.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 mb-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {player.full_name}
                        </Text>
                        {player.leagues.length > 0 && (
                          <Text className="text-xs text-primary mt-0.5">
                            {player.leagues[0].season_name}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          handleSendInvite(player.id, player.full_name)
                        }
                        className="ml-3 flex-row items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full"
                      >
                        <Send color="#374151" size={14} />
                        <Text className="text-gray-700 text-xs font-semibold">
                          Invite
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Bulk Invite Button */}
            <TouchableOpacity
              onPress={() => setBulkModalVisible(true)}
              className="mt-6 flex-row items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3"
            >
              <Send color="#26A69A" size={18} />
              <Text className="text-primary font-semibold">
                Bulk Invite Unclaimed Players
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NEEDS ACTIVATION TAB */}
        {activeTab === "needsActivation" && (
          <View>
            {loadingActivation ? (
              <ActivityIndicator color="#26A69A" style={{ marginTop: 32 }} />
            ) : playersNeedingActivation.length === 0 ? (
              <View className="items-center mt-8">
                <UserCheck color="#d1d5db" size={40} />
                <Text className="text-gray-400 mt-2 text-center">
                  No players need activation
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-xs text-gray-500 mb-2">
                  {playersNeedingActivation.length} player
                  {playersNeedingActivation.length !== 1 ? "s" : ""} need
                  {playersNeedingActivation.length === 1 ? "s" : ""} activation
                </Text>
                {playersNeedingActivation.map((player) => (
                  <View
                    key={player.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 mb-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {player.full_name}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Clock color="#9ca3af" size={12} />
                          <Text className="text-xs text-gray-400">
                            Awaiting activation
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          handleSendActivation(player.id, player.full_name)
                        }
                        className="ml-3 flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full"
                      >
                        <Send color="#fff" size={14} />
                        <Text className="text-white text-xs font-semibold">
                          Send
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* CLAIMS TAB */}
        {activeTab === "claims" && (
          <View>
            {loadingClaims ? (
              <ActivityIndicator color="#26A69A" style={{ marginTop: 32 }} />
            ) : pendingClaims.length === 0 ? (
              <View className="items-center mt-8">
                <CheckCircle color="#d1d5db" size={40} />
                <Text className="text-gray-400 mt-2 text-center">
                  No pending claim requests
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-xs text-gray-500 mb-2">
                  {pendingClaims.length} pending claim
                  {pendingClaims.length !== 1 ? "s" : ""}
                </Text>
                {pendingClaims.map((claim) => (
                  <View
                    key={claim.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 mb-2"
                  >
                    <View className="mb-3">
                      <Text className="font-semibold text-gray-900">
                        {claim.player_detail?.full_name || `Player #${claim.player}`}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        Claimed by:{" "}
                        {claim.requesting_user_detail?.email ||
                          `User #${claim.requesting_user}`}
                      </Text>
                      {claim.created_at && (
                        <Text className="text-xs text-gray-400 mt-0.5">
                          Submitted:{" "}
                          {formatDateDisplay(claim.created_at)}
                        </Text>
                      )}
                      {claim.message ? (
                        <Text className="text-xs text-gray-600 mt-1 italic">
                          "{claim.message}"
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() =>
                          handleDenyClaim(
                            claim.id,
                            claim.player_detail?.full_name || "this player"
                          )
                        }
                        className="flex-1 flex-row items-center justify-center gap-1 border border-red-300 rounded-lg py-2"
                      >
                        <XCircle color="#ef4444" size={16} />
                        <Text className="text-red-500 font-semibold text-sm">
                          Deny
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          handleApproveClaim(
                            claim.id,
                            claim.player_detail?.full_name || "this player"
                          )
                        }
                        className="flex-1 flex-row items-center justify-center gap-1 bg-primary rounded-lg py-2"
                      >
                        <CheckCircle color="#fff" size={16} />
                        <Text className="text-white font-semibold text-sm">
                          Approve
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bulk Invite Confirmation Modal */}
      <Modal
        visible={bulkModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBulkModalVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Bulk Invite</Text>
            <TouchableOpacity
              onPress={() => setBulkModalVisible(false)}
              className="p-1"
            >
              <X color="#6b7280" size={22} />
            </TouchableOpacity>
          </View>

          <View className="p-4 flex-1">
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Text className="text-amber-800 font-medium mb-1">
                Send invites to all unclaimed players
              </Text>
              <Text className="text-amber-700 text-sm">
                This will email every player in {leagueName} who doesn't have an
                account yet, inviting them to claim their profile.
              </Text>
            </View>
          </View>

          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setBulkModalVisible(false)}
              disabled={bulkSending}
              className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBulkInvite}
              disabled={bulkSending}
              className="flex-1 py-3 rounded-lg bg-primary items-center"
            >
              {bulkSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="font-semibold text-white">Send All</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Player FAB */}
      <TouchableOpacity
        onPress={() => setAddPlayerVisible(true)}
        className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{ elevation: 4 }}
      >
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* Add Player Modal */}
      <AddPlayerModal
        visible={addPlayerVisible}
        onClose={() => setAddPlayerVisible(false)}
        onSuccess={() => {
          loadActivationList();
          loadPendingClaims();
        }}
        leagueId={leagueId}
        seasonId={activeSeasonId ?? undefined}
      />
    </View>
  );
}
