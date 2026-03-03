import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Library, Calendar, GanttChartSquare, Users } from "lucide-react-native";
import HomeNavigator from "./HomeNavigator";
import LeaguesNavigator from "./LeaguesNavigator";
import SeasonsNavigator from "./SeasonsNavigator";
import MatchesNavigator from "./MatchesNavigator";
import PlayersNavigator from "./PlayersNavigator";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#26A69A", // primary (turquoise)
        tabBarInactiveTintColor: "#78909C", // dark-400
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Leagues"
        component={LeaguesNavigator}
        options={{
          title: "Leagues",
          tabBarIcon: ({ color, size }) => (
            <Library color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Seasons"
        component={SeasonsNavigator}
        options={{
          title: "Seasons",
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesNavigator}
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => (
            <GanttChartSquare color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersNavigator}
        options={{
          title: "Players",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
