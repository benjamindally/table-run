import { useState, useEffect, useCallback } from "react";
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
import { Plus, Pencil, X, MapPin } from "lucide-react-native";
import { api, seasonsApi, type Venue } from "@league-genius/shared";
import { useAuthStore } from "../stores/authStore";
import type { LeaguesStackScreenProps } from "../navigation/types";

interface VenueDraft {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  table_count: string;
}

const EMPTY_DRAFT: VenueDraft = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  table_count: "",
};

export default function VenueManagementScreen({
  route,
}: LeaguesStackScreenProps<"VenueManagement">) {
  const { leagueId } = route.params;
  const { accessToken } = useAuthStore();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [draft, setDraft] = useState<VenueDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const loadVenues = useCallback(async () => {
    try {
      const response = await api.get<Venue[]>(
        `/venues/?league=${leagueId}`,
        accessToken ?? undefined
      );
      setVenues(Array.isArray(response) ? response : []);
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leagueId, accessToken]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVenues();
  };

  const openCreate = () => {
    setEditingVenue(null);
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  };

  const openEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setDraft({
      name: venue.name ?? "",
      address: venue.address ?? "",
      city: venue.city ?? "",
      state: venue.state ?? "",
      zip_code: venue.zip_code ?? "",
      table_count: venue.table_count != null ? String(venue.table_count) : "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      Alert.alert("Validation", "Venue name is required");
      return;
    }

    setSaving(true);
    try {
      const data = {
        league: leagueId,
        name: draft.name.trim(),
        address: draft.address.trim() || undefined,
        city: draft.city.trim() || undefined,
        state: draft.state.trim() || undefined,
        zip_code: draft.zip_code.trim() || undefined,
        table_count: draft.table_count ? parseInt(draft.table_count) : 1,
      };

      if (editingVenue) {
        await seasonsApi.updateVenue(editingVenue.id, data, accessToken ?? undefined);
      } else {
        await seasonsApi.createVenue(data, accessToken ?? undefined);
      }

      setModalVisible(false);
      loadVenues();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save venue");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (field: keyof VenueDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#26A69A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {venues.length === 0 ? (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <MapPin color="#9ca3af" size={32} />
            <Text className="text-gray-500 text-center mt-2">
              No venues yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Add venues to use for scheduling matches
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {venues.map((venue) => (
              <View
                key={venue.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {venue.name}
                    </Text>
                    {venue.address && (
                      <Text className="text-sm text-gray-500 mt-0.5">
                        {venue.address}
                      </Text>
                    )}
                    {(venue.city || venue.state) && (
                      <Text className="text-sm text-gray-500">
                        {[venue.city, venue.state, venue.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-400 mt-1">
                      {venue.table_count} table{venue.table_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEdit(venue)}
                    className="ml-3 p-2 bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={openCreate}
        className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{ elevation: 4 }}
      >
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">
              {editingVenue ? "Edit Venue" : "Add Venue"}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="p-1"
            >
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
                  Venue Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="e.g. The Break Room"
                  value={draft.name}
                  onChangeText={(v) => updateDraft("name", v)}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Street Address</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="123 Main St"
                  value={draft.address}
                  onChangeText={(v) => updateDraft("address", v)}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">City</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                    placeholder="Austin"
                    value={draft.city}
                    onChangeText={(v) => updateDraft("city", v)}
                    autoCapitalize="words"
                    editable={!saving}
                  />
                </View>
                <View style={{ width: 80 }}>
                  <Text className="text-sm font-medium text-gray-700 mb-1">State</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                    placeholder="TX"
                    value={draft.state}
                    onChangeText={(v) => updateDraft("state", v)}
                    autoCapitalize="characters"
                    maxLength={2}
                    editable={!saving}
                  />
                </View>
                <View style={{ width: 90 }}>
                  <Text className="text-sm font-medium text-gray-700 mb-1">ZIP</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                    placeholder="78701"
                    value={draft.zip_code}
                    onChangeText={(v) => updateDraft("zip_code", v)}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!saving}
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Number of Tables</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                  placeholder="e.g. 4"
                  value={draft.table_count}
                  onChangeText={(v) => updateDraft("table_count", v)}
                  keyboardType="number-pad"
                  editable={!saving}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
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
                  {editingVenue ? "Save" : "Add Venue"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
