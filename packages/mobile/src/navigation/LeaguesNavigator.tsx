import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeaguesScreen from "../screens/LeaguesScreen";
import LeagueDetailsScreen from "../screens/LeagueDetailsScreen";
import ProfileHeaderButton from "../components/ProfileHeaderButton";
import type { LeaguesStackParamList } from "./types";

const Stack = createNativeStackNavigator<LeaguesStackParamList>();

export default function LeaguesNavigator() {
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
        name="LeaguesScreen"
        component={LeaguesScreen}
        options={{ title: "Leagues" }}
      />
      <Stack.Screen
        name="LeagueDetails"
        component={LeagueDetailsScreen}
        options={({ route }) => ({ title: route.params.leagueName })}
      />
    </Stack.Navigator>
  );
}
