import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeaguesScreen from "../screens/LeaguesScreen";
import LeagueDetailsScreen from "../screens/LeagueDetailsScreen";
import CreateLeagueScreen from "../screens/CreateLeagueScreen";
import CreateSeasonScreen from "../screens/CreateSeasonScreen";
import VenueManagementScreen from "../screens/VenueManagementScreen";
import TeamManagementScreen from "../screens/TeamManagementScreen";
import AppHeader from "../components/AppHeader";
import type { LeaguesStackParamList } from "./types";

const Stack = createNativeStackNavigator<LeaguesStackParamList>();

export default function LeaguesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ header: (props) => <AppHeader {...props} /> }}>
      <Stack.Screen
        name="LeaguesScreen"
        component={LeaguesScreen}
        options={{ title: "Leagues" }}
      />
      <Stack.Screen
        name="LeagueDetails"
        component={LeagueDetailsScreen}
        options={({ route }) => ({ title: route.params.leagueName })}
      />
      <Stack.Screen
        name="CreateLeague"
        component={CreateLeagueScreen}
        options={({ route }) => ({
          title: route.params?.leagueId ? "Edit League" : "Create League",
        })}
      />
      <Stack.Screen
        name="CreateSeason"
        component={CreateSeasonScreen}
        options={({ route }) => ({
          title: route.params?.seasonId ? "Edit Season" : "Create Season",
        })}
      />
      <Stack.Screen
        name="VenueManagement"
        component={VenueManagementScreen}
        options={({ route }) => ({
          title: `${route.params.leagueName} — Venues`,
        })}
      />
      <Stack.Screen
        name="TeamManagement"
        component={TeamManagementScreen}
        options={({ route }) => ({
          title: `${route.params.leagueName} — Teams`,
        })}
      />
    </Stack.Navigator>
  );
}
