import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MatchesTabScreen from "../screens/MatchesTabScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import FullMatchesScreen from "../screens/FullMatchesScreen";
import CreateSeasonScreen from "../screens/CreateSeasonScreen";
import AppHeader from "../components/AppHeader";
import type { MatchesStackParamList } from "./types";

const Stack = createNativeStackNavigator<MatchesStackParamList>();

export default function MatchesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ header: (props) => <AppHeader {...props} /> }}>
      <Stack.Screen
        name="MatchesScreen"
        component={MatchesTabScreen}
        options={{ title: "Matches" }}
      />
      <Stack.Screen
        name="FullMatches"
        component={FullMatchesScreen}
        options={({ route }) => ({ title: `${route.params.seasonName} - Matches` })}
      />
      <Stack.Screen
        name="MatchDetails"
        component={MatchDetailsScreen}
        options={{ title: "Match" }}
      />
      <Stack.Screen
        name="CreateSeason"
        component={CreateSeasonScreen as any}
        options={({ route }) => ({
          title: (route.params as any)?.seasonId ? "Edit Season" : "Create Season",
        })}
      />
    </Stack.Navigator>
  );
}
