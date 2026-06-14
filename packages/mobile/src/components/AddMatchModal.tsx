import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import { ArrowLeftRight, X } from "lucide-react-native";
import type { SeasonParticipation, Venue } from "@league-genius/shared";
import DatePickerField from "./DatePickerField";
import SearchableSelect from "./SearchableSelect";

/** Result handed to the parent when the operator confirms an add. */
export type AddMatchSubmission =
  | {
      is_bye: false;
      week_number: number;
      date: string;
      home_team_id: number;
      away_team_id: number;
      location?: string;
    }
  | {
      is_bye: true;
      week_number: number;
      date: string;
      team_id: number;
    };

type Props = {
  visible: boolean;
  onClose: () => void;
  teams: SeasonParticipation[];
  venues: Venue[];
  /** Season start date (YYYY-MM-DD); used to derive the week from the date. */
  seasonStartDate: string;
  /** Persist the match. Parent shows errors; modal closes on resolve. */
  onSubmit: (submission: AddMatchSubmission) => Promise<void>;
  saving?: boolean;
};

/** Derive a 1-based week number from a date relative to the season start. */
function weekFromDate(dateStr: string, startDate: string): number | null {
  if (!dateStr || !startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(target.getTime())) return null;
  const diffDays = Math.floor(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/**
 * Add a single match (or bye) to an existing schedule, one at a time. The date
 * leads the form and derives the week — picking any date drops the match into
 * that week. Mirrors the web ScheduleMatchEditModal "Add Match" flow.
 */
export default function AddMatchModal({
  visible,
  onClose,
  teams,
  venues,
  seasonStartDate,
  onSubmit,
  saving = false,
}: Props) {
  const [date, setDate] = useState("");
  const [isBye, setIsBye] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [venueTouched, setVenueTouched] = useState(false);
  const [byeTeamId, setByeTeamId] = useState<number | null>(null);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (visible) {
      setDate(seasonStartDate || "");
      setIsBye(false);
      setHomeTeamId(null);
      setAwayTeamId(null);
      setVenueId(null);
      setVenueTouched(false);
      setByeTeamId(null);
    }
  }, [visible, seasonStartDate]);

  const selectedWeek =
    (seasonStartDate && date && weekFromDate(date, seasonStartDate)) || null;

  // The home team hosts, so default the venue to that team's home venue until
  // the operator explicitly picks one.
  const handleHomeTeamChange = (id: number | null) => {
    setHomeTeamId(id);
    if (!venueTouched && id != null) {
      const participation = teams.find((t) => t.team === id);
      if (participation?.venue != null) setVenueId(participation.venue);
    }
  };

  const handleSwap = () => {
    setHomeTeamId(awayTeamId);
    setAwayTeamId(homeTeamId);
  };

  const teamOptions = (excludeId: number | null) =>
    teams
      .filter((t) => t.team !== excludeId)
      .map((t) => ({
        value: t.team,
        label: t.team_detail?.name ?? `Team ${t.team}`,
        sublabel: t.team_detail?.establishment,
      }));

  const venueOptions = venues.map((v) => ({
    value: v.id,
    label: v.name,
    sublabel: v.address,
  }));

  const isValid = isBye
    ? !!byeTeamId && !!date && selectedWeek != null
    : !!homeTeamId &&
      !!awayTeamId &&
      homeTeamId !== awayTeamId &&
      !!date &&
      selectedWeek != null;

  const handleSubmit = async () => {
    if (!isValid || selectedWeek == null) return;
    if (isBye) {
      await onSubmit({
        is_bye: true,
        week_number: selectedWeek,
        date,
        team_id: byeTeamId!,
      });
    } else {
      const venue = venues.find((v) => v.id === venueId);
      await onSubmit({
        is_bye: false,
        week_number: selectedWeek,
        date,
        home_team_id: homeTeamId!,
        away_team_id: awayTeamId!,
        location: venue?.name,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-2xl max-h-3/4">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-base font-bold text-gray-900">
              Add Match{selectedWeek != null ? ` — Week ${selectedWeek}` : ""}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 py-4" keyboardShouldPersistTaps="handled">
            {/* Date (leads the form; derives the week) */}
            <View className="mb-4">
              <DatePickerField
                label="Match Date"
                value={date}
                onChange={setDate}
                minimumDate={seasonStartDate || undefined}
                required
              />
              {selectedWeek != null && (
                <View className="mt-2 self-start rounded-full bg-teal-100 px-3 py-1">
                  <Text className="text-xs font-semibold text-teal-700">
                    Week {selectedWeek}
                  </Text>
                </View>
              )}
            </View>

            {/* Bye toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-medium text-gray-700 flex-1 pr-3">
                Mark as Bye (team not playing this week)
              </Text>
              <Switch value={isBye} onValueChange={setIsBye} />
            </View>

            {isBye ? (
              <View className="mb-2">
                <SearchableSelect
                  label="Team with Bye"
                  options={teamOptions(null)}
                  value={byeTeamId}
                  onChange={setByeTeamId}
                  placeholder="Select team..."
                  searchPlaceholder="Search teams..."
                />
              </View>
            ) : (
              <>
                {/* Swap */}
                {homeTeamId != null && awayTeamId != null && (
                  <TouchableOpacity
                    onPress={handleSwap}
                    className="flex-row items-center justify-center gap-2 self-center mb-3 px-3 py-2 rounded-full bg-gray-100"
                  >
                    <ArrowLeftRight color="#6b7280" size={16} />
                    <Text className="text-sm text-gray-600">Swap Home / Away</Text>
                  </TouchableOpacity>
                )}

                {/* Away team (listed first — "away at home") */}
                <View className="mb-4">
                  <SearchableSelect
                    label="Away Team"
                    options={teamOptions(homeTeamId)}
                    value={awayTeamId}
                    onChange={setAwayTeamId}
                    placeholder="Select away team..."
                    searchPlaceholder="Search teams..."
                  />
                </View>

                {/* Home team (hosts) */}
                <View className="mb-4">
                  <SearchableSelect
                    label="Home Team"
                    options={teamOptions(awayTeamId)}
                    value={homeTeamId}
                    onChange={handleHomeTeamChange}
                    placeholder="Select home team..."
                    searchPlaceholder="Search teams..."
                  />
                </View>

                {/* Venue (defaults to home team's venue) */}
                <View className="mb-2">
                  {venues.length === 0 ? (
                    <>
                      <Text className="text-sm font-medium text-gray-700 mb-1">
                        Venue
                      </Text>
                      <Text className="text-sm text-gray-400">
                        No venues available.
                      </Text>
                    </>
                  ) : (
                    <SearchableSelect
                      label="Venue"
                      options={venueOptions}
                      value={venueId}
                      onChange={(v) => {
                        setVenueId(v);
                        setVenueTouched(true);
                      }}
                      placeholder="Select venue..."
                      searchPlaceholder="Search venues..."
                    />
                  )}
                </View>

                {homeTeamId != null &&
                  awayTeamId != null &&
                  homeTeamId === awayTeamId && (
                    <Text className="text-red-500 text-sm mb-2">
                      Home and away teams must be different.
                    </Text>
                  )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="flex-row gap-3 p-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isValid || saving}
              className={`flex-1 rounded-lg py-3 items-center ${
                !isValid || saving ? "bg-gray-300" : "bg-primary"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Add Match</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
