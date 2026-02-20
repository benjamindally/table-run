import { TouchableOpacity, View, Text } from "react-native";
import { User } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileHeaderButton() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, user } = useAuthStore();

  const handlePress = () => {
    if (isAuthenticated) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("Auth");
    }
  };

  // Get user's initial for avatar
  const getInitial = () => {
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mr-3 mb-3"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {isAuthenticated ? (
        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
          <Text className="text-white font-bold text-xs">{getInitial()}</Text>
        </View>
      ) : (
        <View className="w-8 h-8 rounded-full bg-gray-600 items-center justify-center">
          <User color="#fff" size={18} />
        </View>
      )}
    </TouchableOpacity>
  );
}
