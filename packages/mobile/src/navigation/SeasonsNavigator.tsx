import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SeasonsTabScreen from "../screens/SeasonsTabScreen";
import SeasonDetailsScreen from "../screens/SeasonDetailsScreen";
import SeasonScheduleScreen from "../screens/SeasonScheduleScreen";
import FullStandingsScreen from "../screens/FullStandingsScreen";
import FullMatchesScreen from "../screens/FullMatchesScreen";
import FullPlayersScreen from "../screens/FullPlayersScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import AppHeader from "../components/AppHeader";
import type { SeasonsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SeasonsStackParamList>();

export default function SeasonsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ header: (props) => <AppHeader {...props} /> }}>
      <Stack.Screen
        name="SeasonsScreen"
        component={SeasonsTabScreen}
        options={{ title: "Seasons" }}
      />
      <Stack.Screen
        name="SeasonDetails"
        component={SeasonDetailsScreen}
        options={{ title: "Season Details" }}
      />
      <Stack.Screen
        name="SeasonSchedule"
        component={SeasonScheduleScreen}
        options={({ route }) => ({ title: `${route.params.seasonName} - Schedule` })}
      />
      <Stack.Screen
        name="FullStandings"
        component={FullStandingsScreen}
        options={({ route }) => ({ title: `${route.params.seasonName} - Standings` })}
      />
      <Stack.Screen
        name="FullMatches"
        component={FullMatchesScreen}
        options={({ route }) => ({ title: `${route.params.seasonName} - Matches` })}
      />
      <Stack.Screen
        name="FullPlayers"
        component={FullPlayersScreen}
        options={({ route }) => ({ title: `${route.params.seasonName} - Players` })}
      />
      <Stack.Screen
        name="MatchDetails"
        component={MatchDetailsScreen}
        options={{ title: "Match" }}
      />
    </Stack.Navigator>
  );
}
