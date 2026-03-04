import { View, Text, TouchableOpacity, Linking, Platform, ScrollView } from "react-native";
import { ChevronRight, Mail, Star, Shield, FileText } from "lucide-react-native";

// TODO: Update these URLs after first App Store / Play Store submission
const IOS_APP_STORE_URL = "https://apps.apple.com/app/idPLACEHOLDER";
const ANDROID_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.leaguegenius.app";

const ITEMS = [
  {
    label: "Contact League Genius",
    icon: Mail,
    onPress: () =>
      Linking.openURL("mailto:contact@leaguegenius.app?subject=League%20Genius%20Support"),
  },
  {
    label: "Rate League Genius",
    icon: Star,
    onPress: () =>
      Linking.openURL(Platform.OS === "ios" ? IOS_APP_STORE_URL : ANDROID_PLAY_STORE_URL),
  },
  {
    label: "Privacy Policy",
    icon: Shield,
    onPress: () => Linking.openURL("https://leaguegenius.app/privacy"),
  },
  {
    label: "Terms of Service",
    icon: FileText,
    onPress: () => Linking.openURL("https://leaguegenius.app/terms"),
  },
];

export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="mt-4">
        <View className="bg-white">
          {ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                className={`flex-row items-center px-4 py-4 ${isLast ? "" : "border-b border-gray-100"}`}
              >
                <Icon color="#26A69A" size={20} />
                <Text className="flex-1 text-gray-900 ml-3">{item.label}</Text>
                <ChevronRight color="#9ca3af" size={20} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mt-auto pt-10 pb-6 items-center">
        <Text className="text-gray-400 text-sm">League Genius v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
