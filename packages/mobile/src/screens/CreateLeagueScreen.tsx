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
import { leaguesApi } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { LeaguesStackScreenProps } from "../navigation/types";

export default function CreateLeagueScreen({
  route,
  navigation,
}: LeaguesStackScreenProps<"CreateLeague">) {
  const leagueId = route.params?.leagueId;
  const isEditMode = !!leagueId;

  const { accessToken } = useAuthStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("US");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Load existing league data in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      try {
        const league = await leaguesApi.getById(leagueId!, accessToken ?? undefined);
        setName(league.name ?? "");
        setDescription(league.description ?? "");
        setCity(league.city ?? "");
        setState(league.state ?? "");
        setCountry(league.country ?? "US");
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

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "US",
      };

      if (isEditMode) {
        const updated = await leaguesApi.update(leagueId!, data, accessToken ?? undefined);
        navigation.navigate("LeagueDetails", {
          leagueId: updated.id,
          leagueName: updated.name,
        });
      } else {
        const created = await leaguesApi.create(data, accessToken ?? undefined);
        // Navigate to the new league's detail page
        navigation.replace("LeagueDetails", {
          leagueId: created.id,
          leagueName: created.name,
        });
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
        <View className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">

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
                {isEditMode ? "Save Changes" : "Create League"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
