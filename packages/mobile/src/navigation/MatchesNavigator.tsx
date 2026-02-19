import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MatchesTabScreen from "../screens/MatchesTabScreen";
import MatchDetailsScreen from "../screens/MatchDetailsScreen";
import MatchScoreScreen from "../screens/MatchScoreScreen";
import ProfileHeaderButton from "../components/ProfileHeaderButton";
import type { MatchesStackParamList } from "./types";

const Stack = createNativeStackNavigator<MatchesStackParamList>();

export default function MatchesNavigator() {
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
        name="MatchesScreen"
        component={MatchesTabScreen}
        options={{ title: "Matches" }}
      />
      <Stack.Screen
        name="MatchDetails"
        component={MatchDetailsScreen}
        options={{ title: "Match Details" }}
      />
      <Stack.Screen
        name="MatchScore"
        component={MatchScoreScreen}
        options={{ title: "Match Scoring" }}
      />
    </Stack.Navigator>
  );
}
