import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainNavigator from "./MainNavigator";
import AuthNavigator from "./AuthNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import TeamDetailsScreen from "../screens/TeamDetailsScreen";
import ClaimPlayerScreen from "../screens/auth/ClaimPlayerScreen";
import ActivatePlayerScreen from "../screens/auth/ActivatePlayerScreen";
import PlayerManagementScreen from "../screens/PlayerManagementScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="TeamDetails"
        component={TeamDetailsScreen}
        options={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: route.params.teamName,
        })}
      />
      <Stack.Screen
        name="ClaimPlayer"
        component={ClaimPlayerScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: "Claim Player Profile",
        }}
      />
      <Stack.Screen
        name="ActivatePlayer"
        component={ActivatePlayerScreen}
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: "Activate Account",
        }}
      />
      <Stack.Screen
        name="PlayerManagement"
        component={PlayerManagementScreen}
        options={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: "#37474F" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontFamily: "Antonio_600SemiBold",
            fontSize: 18,
          },
          title: `${route.params.leagueName} — Players`,
        })}
      />
    </Stack.Navigator>
  );
}
