import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SeasonsTabScreen from "../screens/SeasonsTabScreen";
import SeasonDetailsScreen from "../screens/SeasonDetailsScreen";
import FullStandingsScreen from "../screens/FullStandingsScreen";
import FullMatchesScreen from "../screens/FullMatchesScreen";
import FullPlayersScreen from "../screens/FullPlayersScreen";
import MatchScoreScreen from "../screens/MatchScoreScreen";
import ProfileHeaderButton from "../components/ProfileHeaderButton";
import type { SeasonsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SeasonsStackParamList>();

export default function SeasonsNavigator() {
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
        name="MatchScore"
        component={MatchScoreScreen}
        options={{ title: "Match Scoring" }}
      />
    </Stack.Navigator>
  );
}
