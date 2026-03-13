import { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Modal, Pressable } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

type Props = {
  label: string;
  /** Date value in YYYY-MM-DD format (API format) */
  value: string;
  /** Called with YYYY-MM-DD string or "" when cleared */
  onChange: (dateStr: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

/** Format a Date to YYYY-MM-DD */
function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format YYYY-MM-DD to a user-friendly display string */
function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Parse YYYY-MM-DD string to Date, or return today */
function parseToDate(dateStr: string): Date {
  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  disabled = false,
}: Props) {
  const [show, setShow] = useState(false);
  // On Android, we need a temp date since the picker is a one-shot dialog
  const [tempDate, setTempDate] = useState<Date>(parseToDate(value));

  const handlePress = () => {
    if (disabled) return;
    setTempDate(parseToDate(value));
    setShow(true);
  };

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (_event.type === "set" && selectedDate) {
        onChange(toApiDate(selectedDate));
      }
    } else {
      // iOS: picker stays open, update temp date
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSDone = () => {
    onChange(toApiDate(tempDate));
    setShow(false);
  };

  const handleIOSClear = () => {
    onChange("");
    setShow(false);
  };

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        className={`border border-gray-300 rounded-lg px-3 py-2.5 ${disabled ? "opacity-50" : ""}`}
      >
        <Text className={value ? "text-gray-900 text-base" : "text-gray-400 text-base"}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Android: inline picker dialog */}
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {/* iOS: modal with spinner picker */}
      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShow(false)}>
            <Pressable className="bg-white rounded-t-2xl">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <TouchableOpacity onPress={handleIOSClear}>
                  <Text className="text-gray-500 text-base">Clear</Text>
                </TouchableOpacity>
                <Text className="text-base font-bold text-gray-900">{label}</Text>
                <TouchableOpacity onPress={handleIOSDone}>
                  <Text className="text-primary text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={{ height: 200, alignSelf: "center", width: "100%" }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
