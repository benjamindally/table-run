import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { X, Check } from "lucide-react-native";
import {
  playersApi,
  teamsApi,
  seasonsApi,
  type Player,
} from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";

interface TeamOption {
  id: number;
  name: string;
}

export interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leagueId: number;
  teams?: TeamOption[];
  seasonId?: number;
  defaultTeamId?: number;
}

export default function AddPlayerModal({
  visible,
  onClose,
  onSuccess,
  leagueId,
  teams: teamsProp,
  seasonId,
  defaultTeamId,
}: AddPlayerModalProps) {
  const { accessToken } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    defaultTeamId ?? null
  );
  const [saving, setSaving] = useState(false);

  const [teamsList, setTeamsList] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const hideTeamPicker = !!defaultTeamId;

  useEffect(() => {
    if (teamsProp) {
      setTeamsList(teamsProp);
      return;
    }
    if (!seasonId) return;

    setTeamsLoading(true);
    seasonsApi
      .getTeams(seasonId, accessToken ?? undefined)
      .then((participations) => {
        setTeamsList(
          participations
            .filter((p) => p.team_detail)
            .map((p) => ({ id: p.team_detail!.id, name: p.team_detail!.name }))
        );
      })
      .catch(() => setTeamsList([]))
      .finally(() => setTeamsLoading(false));
  }, [teamsProp, seasonId, accessToken]);

  useEffect(() => {
    if (defaultTeamId) setSelectedTeamId(defaultTeamId);
  }, [defaultTeamId]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSkillLevel("");
    setSelectedTeamId(defaultTeamId ?? null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation", "First name and last name are required");
      return;
    }
    if (!selectedTeamId) {
      Alert.alert("Validation", "Please select a team");
      return;
    }

    setSaving(true);
    try {
      const playerData: Partial<Player> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };
      if (email.trim()) playerData.email = email.trim();
      if (phone.trim()) playerData.phone = phone.trim();
      if (skillLevel.trim()) {
        const level = parseInt(skillLevel.trim());
        if (!isNaN(level) && level >= 1 && level <= 10) {
          playerData.skill_level = level;
        }
      }

      const newPlayer = await playersApi.create(
        playerData,
        accessToken ?? undefined
      );

      try {
        await teamsApi.addMember(
          selectedTeamId,
          newPlayer.id,
          accessToken ?? undefined
        );
      } catch (teamErr: any) {
        Alert.alert(
          "Partial Success",
          `Player "${firstName} ${lastName}" was created but couldn't be added to the team: ${
            teamErr?.message || "Unknown error"
          }. You can add them manually.`
        );
        onSuccess();
        handleClose();
        return;
      }

      Alert.alert("Success", `${firstName} ${lastName} added to the team`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create player");
    } finally {
      setSaving(false);
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
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">Add Player</Text>
          <TouchableOpacity onPress={handleClose} className="p-1">
            <X color="#6b7280" size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="space-y-4">
            {/* Name row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  First Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!saving}
                  autoFocus
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Last Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Email
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                placeholder="player@email.com (optional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
            </View>

            {/* Phone + Skill Level row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Phone
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="(optional)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
              <View style={{ width: 100 }}>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Skill Level
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="1-10"
                  value={skillLevel}
                  onChangeText={setSkillLevel}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!saving}
                />
              </View>
            </View>

            {/* Team Selector */}
            {!hideTeamPicker && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Team <Text className="text-red-500">*</Text>
                </Text>
                {teamsLoading ? (
                  <ActivityIndicator
                    color="#26A69A"
                    style={{ marginTop: 8 }}
                  />
                ) : teamsList.length === 0 ? (
                  <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <Text className="text-amber-700 text-sm">
                      No teams found. Create a season and add teams first.
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {teamsList.map((team) => {
                      const isSelected = selectedTeamId === team.id;
                      return (
                        <TouchableOpacity
                          key={team.id}
                          onPress={() => setSelectedTeamId(team.id)}
                          disabled={saving}
                          className={`p-3 rounded-lg border-2 flex-row items-center justify-between ${
                            isSelected
                              ? "border-primary bg-primary-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`font-semibold text-sm ${
                              isSelected ? "text-primary" : "text-gray-800"
                            }`}
                          >
                            {team.name}
                          </Text>
                          {isSelected && <Check size={18} color="#26A69A" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
          <TouchableOpacity
            onPress={handleClose}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || (!selectedTeamId && !hideTeamPicker)}
            className="flex-1 py-3 rounded-lg bg-primary items-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="font-semibold text-white">Add Player</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
