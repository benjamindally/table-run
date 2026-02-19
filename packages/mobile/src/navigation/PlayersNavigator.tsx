import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlayersTabScreen from "../screens/PlayersTabScreen";
import PlayerDetailsScreen from "../screens/PlayerDetailsScreen";
import ProfileHeaderButton from "../components/ProfileHeaderButton";
import type { PlayersStackParamList } from "./types";

const Stack = createNativeStackNavigator<PlayersStackParamList>();

export default function PlayersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#37474F",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontFamily: "Antonio_600SemiBold",
          fontSize: 18,
        },
        headerRight: () => <ProfileHeaderButton />,
      }}
    >
      <Stack.Screen
        name="PlayersScreen"
        component={PlayersTabScreen}
        options={{ title: "Players" }}
      />
      <Stack.Screen
        name="PlayerDetails"
        component={PlayerDetailsScreen}
        options={{ title: "Player Profile" }}
      />
    </Stack.Navigator>
  );
}
