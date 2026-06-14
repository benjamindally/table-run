import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { Check, ChevronDown, Search, X } from "lucide-react-native";

export type SearchableOption = {
  value: number;
  label: string;
  sublabel?: string;
};

type Props = {
  label?: string;
  options: SearchableOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

/**
 * Tappable field that opens a modal with a search box and a filtered list of
 * options. Mirrors the web SearchableSelect API so the mobile Add Match form
 * can pick teams/venues the same way. Opens as its own modal layer (rather than
 * an inline dropdown) to avoid nested-scroll issues inside a parent modal.
 */
export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No matches",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (val: number) => {
    onChange(val);
    close();
  };

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`flex-row items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <View className="flex-1 pr-2">
          <Text
            className={selected ? "text-gray-900 text-base" : "text-gray-400 text-base"}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </Text>
          {selected?.sublabel ? (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              {selected.sublabel}
            </Text>
          ) : null}
        </View>
        <ChevronDown color="#9ca3af" size={18} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={close}>
          <Pressable className="bg-white rounded-t-2xl max-h-3/4">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-base font-bold text-gray-900">
                {label ?? "Select"}
              </Text>
              <TouchableOpacity onPress={close}>
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            {/* Search box */}
            <View className="px-4 pt-3">
              <View className="flex-row items-center border border-gray-300 rounded-lg px-3">
                <Search color="#9ca3af" size={16} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#9ca3af"
                  autoCorrect={false}
                  className="flex-1 py-2.5 px-2 text-base text-gray-900"
                />
              </View>
            </View>

            {/* Options */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              className="px-4 py-2"
              style={{ maxHeight: 320 }}
              ListEmptyComponent={
                <Text className="text-sm text-gray-400 text-center py-6">
                  {emptyText}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-base text-gray-900" numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.sublabel ? (
                        <Text className="text-xs text-gray-400" numberOfLines={1}>
                          {item.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && <Check color="#26A69A" size={18} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
