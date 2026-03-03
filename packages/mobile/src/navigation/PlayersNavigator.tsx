import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlayersTabScreen from "../screens/PlayersTabScreen";
import PlayerDetailsScreen from "../screens/PlayerDetailsScreen";
import AppHeader from "../components/AppHeader";
import type { PlayersStackParamList } from "./types";

const Stack = createNativeStackNavigator<PlayersStackParamList>();

export default function PlayersNavigator() {
  return (
    <Stack.Navigator screenOptions={{ header: (props) => <AppHeader {...props} /> }}>
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
