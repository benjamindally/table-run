import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { X, Megaphone, AlertCircle } from "lucide-react-native";
import {
  announcementsApi,
  seasonsApi,
  api,
  type CreateAnnouncementData,
  type Season,
  type SeasonParticipation,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";

type Priority = CreateAnnouncementData["priority"];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  leagueName: string;
}

export default function CreateAnnouncementModal({ visible, onClose, leagueId, leagueName }: Props) {
  const { accessToken } = useAuthStore();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});

  // Scope state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [teams, setTeams] = useState<SeasonParticipation[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Fetch seasons when modal opens
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const fetchSeasons = async () => {
      setLoadingSeasons(true);
      try {
        const res = await api.get<{ results: Season[] }>(
          "/seasons/",
          accessToken ?? undefined
        );
        if (!cancelled) {
          const leagueSeasons = res.results
            .filter((s) => s.league === leagueId)
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
          setSeasons(leagueSeasons);
        }
      } catch (err) {
        console.error("Failed to fetch seasons:", err);
      } finally {
        if (!cancelled) setLoadingSeasons(false);
      }
    };

    fetchSeasons();
    return () => { cancelled = true; };
  }, [visible, leagueId]);

  // Fetch teams when a season is selected
  useEffect(() => {
    if (selectedSeasonId === null) {
      setTeams([]);
      setSelectedTeamId(null);
      return;
    }

    let cancelled = false;
    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const res = await seasonsApi.getTeams(selectedSeasonId, accessToken ?? undefined);
        if (!cancelled) {
          // Handle both array and paginated responses
          const list = Array.isArray(res) ? res : (res as any).results ?? [];
          setTeams(list);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    };

    fetchTeams();
    return () => { cancelled = true; };
  }, [selectedSeasonId]);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setPriority("normal");
    setErrors({});
    setSelectedSeasonId(null);
    setSelectedTeamId(null);
    setTeams([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectSeason = (seasonId: number | null) => {
    setSelectedSeasonId(seasonId);
    setSelectedTeamId(null);
    setTeams([]);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    else if (title.length > 200) newErrors.title = "Title must be 200 characters or less";
    if (!message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build scope description for the banner
  const scopeDescription = useCallback(() => {
    const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
    const selectedTeam = teams.find((t) => t.team === selectedTeamId);
    const teamName = selectedTeam?.team_detail?.name;

    if (selectedSeasonId && selectedTeamId && teamName) {
      return (
        <>
          <Text className="font-semibold">{teamName}</Text> in{" "}
          <Text className="font-semibold">{selectedSeason?.name}</Text>
        </>
      );
    }
    if (selectedSeasonId && selectedSeason) {
      return (
        <>
          all teams in <Text className="font-semibold">{selectedSeason.name}</Text>
        </>
      );
    }
    return (
      <>
        all members of <Text className="font-semibold">{leagueName}</Text>
      </>
    );
  }, [seasons, teams, selectedSeasonId, selectedTeamId, leagueName]);

  const handleSend = async () => {
    if (!validate()) return;

    setSending(true);
    try {
      const payload: CreateAnnouncementData = {
        league: leagueId,
        title: title.trim(),
        message: message.trim(),
        priority,
        ...(selectedSeasonId ? { season: selectedSeasonId } : {}),
        ...(selectedTeamId ? { team: selectedTeamId } : {}),
      };

      await announcementsApi.create(payload, accessToken ?? undefined);
      Alert.alert("Sent", "Announcement sent successfully.");
      handleClose();
    } catch (err) {
      console.error("Failed to send announcement:", err);
      Alert.alert("Error", "Failed to send announcement. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Send Announcement</Text>
          <Pressable onPress={handleClose} className="p-1">
            <X color="#6b7280" size={22} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          {/* Scope banner */}
          <View className="flex-row items-start bg-teal-50 rounded-lg p-3 mb-5">
            <Megaphone size={18} color="#26A69A" />
            <Text className="text-sm text-gray-700 ml-2 flex-1">
              Sending to {scopeDescription()}
            </Text>
          </View>

          {/* Season pills */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Season</Text>
            {loadingSeasons ? (
              <ActivityIndicator size="small" color="#26A69A" />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: null, name: "All Seasons" }, ...seasons.map((s) => ({ id: s.id, name: s.name }))]}
                keyExtractor={(item) => String(item.id ?? "all")}
                renderItem={({ item }) => {
                  const selected = item.id === selectedSeasonId;
                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectSeason(item.id)}
                      className={`mr-2 px-4 py-2 rounded-full border-2 ${
                        selected ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? "text-teal-700" : "text-gray-600"
                        }`}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Team pills — only when a season is selected */}
          {selectedSeasonId !== null && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Team</Text>
              {loadingTeams ? (
                <ActivityIndicator size="small" color="#26A69A" />
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={[
                    { id: null, name: "All Teams" },
                    ...teams.map((t) => ({ id: t.team, name: t.team_detail?.name ?? `Team ${t.team}` })),
                  ]}
                  keyExtractor={(item) => String(item.id ?? "all")}
                  renderItem={({ item }) => {
                    const selected = item.id === selectedTeamId;
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedTeamId(item.id)}
                        className={`mr-2 px-4 py-2 rounded-full border-2 ${
                          selected ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selected ? "text-teal-700" : "text-gray-600"
                          }`}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* Title */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Title *</Text>
            <TextInput
              className={`border rounded-lg px-3 py-2.5 text-gray-900 ${
                errors.title ? "border-red-400" : "border-gray-300"
              }`}
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
              }}
              placeholder="e.g., Match Schedule Update"
              maxLength={200}
              returnKeyType="next"
            />
            {errors.title && (
              <View className="flex-row items-center mt-1">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-xs text-red-500 ml-1">{errors.title}</Text>
              </View>
            )}
            <Text className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</Text>
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Priority</Text>
            <View className="flex-row gap-2">
              {PRIORITIES.map((p) => {
                const selected = priority === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    className={`flex-1 py-2 rounded-lg border-2 items-center ${
                      selected ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? "text-teal-700" : "text-gray-600"
                      }`}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Message */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Message *</Text>
            <TextInput
              className={`border rounded-lg px-3 py-2.5 text-gray-900 min-h-[120px] ${
                errors.message ? "border-red-400" : "border-gray-300"
              }`}
              value={message}
              onChangeText={(v) => {
                setMessage(v);
                if (errors.message) setErrors((e) => ({ ...e, message: undefined }));
              }}
              placeholder="Enter your announcement message here..."
              multiline
              textAlignVertical="top"
            />
            {errors.message && (
              <View className="flex-row items-center mt-1">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-xs text-red-500 ml-1">{errors.message}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
          <TouchableOpacity
            onPress={handleClose}
            disabled={sending}
            className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            className="flex-1 py-3 rounded-lg bg-teal-500 items-center flex-row justify-center"
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Megaphone size={16} color="#fff" />
                <Text className="font-semibold text-white ml-2">Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
