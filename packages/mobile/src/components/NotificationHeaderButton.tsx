import { TouchableOpacity, View, Text } from "react-native";
import { Bell } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../stores/authStore";
import { useNotificationsStore } from "../stores/notificationsStore";
import type { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationHeaderButton() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate("Notifications");
  };

  // Format badge text (show 99+ for large counts)
  const getBadgeText = () => {
    if (unreadCount > 99) return "99+";
    return unreadCount.toString();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mr-2 mb-3"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Bell color="#fff" size={22} />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-2 bg-accent rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-[10px] font-bold">
            {getBadgeText()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
