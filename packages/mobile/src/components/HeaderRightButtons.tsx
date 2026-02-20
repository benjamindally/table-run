import { View } from "react-native";
import NotificationHeaderButton from "./NotificationHeaderButton";
import ProfileHeaderButton from "./ProfileHeaderButton";

export default function HeaderRightButtons() {
  return (
    <View className="flex-row items-center gap-0.5 mr-2">
      <NotificationHeaderButton />
      <ProfileHeaderButton />
    </View>
  );
}
