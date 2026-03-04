import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { seasonsApi } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";

// Generic props so this screen works in both LeaguesNavigator and MatchesNavigator
type Props = {
  route: { params: { leagueId: number; seasonId?: number } };
  navigation: { goBack: () => void };
};

// ── Date helpers (display format: MM-DD-YYYY, API format: YYYY-MM-DD) ─────────

/** YYYY-MM-DD → MM-DD-YYYY for display */
function apiToDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[2]}-${m[3]}-${m[1]}`;
}

/** MM-DD-YYYY → YYYY-MM-DD for the API */
function displayToApi(display: string): string {
  const m = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[1]}-${m[2]}`;
}

/** Validate MM-DD-YYYY display string */
function isValidDisplayDate(str: string): boolean {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(str)) return false;
  const api = displayToApi(str);
  const d = new Date(api);
  return !isNaN(d.getTime());
}

/** Auto-insert dashes as the user types digits (MM-DD-YYYY) */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CreateSeasonScreen({
  route,
  navigation,
}: Props) {
  const { leagueId, seasonId } = route.params;
  const isEditMode = !!seasonId;

  const { accessToken } = useAuthStore();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(""); // stored in MM-DD-YYYY
  const [endDate, setEndDate] = useState("");     // stored in MM-DD-YYYY
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      try {
        const season = await seasonsApi.getById(seasonId!, accessToken ?? undefined);
        setName(season.name ?? "");
        setStartDate(apiToDisplay(season.start_date));
        setEndDate(apiToDisplay(season.end_date));
      } catch {
        Alert.alert("Error", "Failed to load season data");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seasonId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Season name is required");
      return;
    }
    if (!startDate || !isValidDisplayDate(startDate)) {
      Alert.alert("Validation", "Please enter a valid start date (MM-DD-YYYY)");
      return;
    }
    if (endDate && !isValidDisplayDate(endDate)) {
      Alert.alert("Validation", "Please enter a valid end date (MM-DD-YYYY) or leave blank");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        league: leagueId,
        start_date: displayToApi(startDate),
        end_date: endDate ? displayToApi(endDate) : null,
      };

      if (isEditMode) {
        await seasonsApi.update(seasonId!, data, accessToken ?? undefined);
      } else {
        await seasonsApi.create(data, accessToken ?? undefined);
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save season");
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
        <View className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Season Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="e.g. Spring 2026"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Start Date <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="MM-DD-YYYY"
              value={startDate}
              onChangeText={(v) => setStartDate(formatDateInput(v))}
              keyboardType="number-pad"
              maxLength={10}
              editable={!saving}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">End Date</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="MM-DD-YYYY (optional)"
              value={endDate}
              onChangeText={(v) => setEndDate(formatDateInput(v))}
              keyboardType="number-pad"
              maxLength={10}
              editable={!saving}
            />
            <Text className="text-xs text-gray-400 mt-1">Leave blank if end date is not yet set</Text>
          </View>

        </View>

        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
              <Text className="font-semibold text-white">
                {isEditMode ? "Save Changes" : "Create Season"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
