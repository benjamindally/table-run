import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import HeaderRightButtons from "./HeaderRightButtons";

interface AppHeaderProps {
  navigation: any;
  route: any;
  options: { title?: string };
  back?: { title: string | undefined; href?: string | undefined };
}

export default function AppHeader({ navigation, route, options, back }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = options.title ?? route.name;

  return (
    <View style={{ backgroundColor: "#37474F", paddingTop: insets.top }}>
      <View
        style={{
          height: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {back && (
          <TouchableOpacity
            onPress={navigation.goBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ position: "absolute", left: 8, flexDirection: "row", alignItems: "center" }}
          >
            <ChevronLeft color="#fff" size={26} />
          </TouchableOpacity>
        )}
        <Text
          style={{
            color: "#fff",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          {title}
        </Text>
        <View style={{ position: "absolute", right: 0 }}>
          <HeaderRightButtons />
        </View>
      </View>
    </View>
  );
}
