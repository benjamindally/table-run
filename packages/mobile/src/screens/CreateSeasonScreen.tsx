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
import type { LeaguesStackScreenProps } from "../navigation/types";

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function CreateSeasonScreen({
  route,
  navigation,
}: LeaguesStackScreenProps<"CreateSeason">) {
  const { leagueId, seasonId } = route.params;
  const isEditMode = !!seasonId;

  const { accessToken } = useAuthStore();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      try {
        const season = await seasonsApi.getById(seasonId!, accessToken ?? undefined);
        setName(season.name ?? "");
        setStartDate(formatDateForInput(season.start_date));
        setEndDate(formatDateForInput(season.end_date));
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
    if (!startDate || !isValidDate(startDate)) {
      Alert.alert("Validation", "Please enter a valid start date (YYYY-MM-DD)");
      return;
    }
    if (endDate && !isValidDate(endDate)) {
      Alert.alert("Validation", "Please enter a valid end date (YYYY-MM-DD) or leave blank");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        league: leagueId,
        start_date: startDate,
        end_date: endDate || null,
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
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
              keyboardType="numeric"
              maxLength={10}
              editable={!saving}
            />
            <Text className="text-xs text-gray-400 mt-1">Format: YYYY-MM-DD</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">End Date</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
              placeholder="YYYY-MM-DD (optional)"
              value={endDate}
              onChangeText={setEndDate}
              keyboardType="numeric"
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
