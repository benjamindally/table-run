import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Dimensions } from "react-native";
import { Home, Library, Calendar, GanttChartSquare, Users } from "lucide-react-native";
import HomeScreen from "../screens/HomeScreen";
import LeaguesNavigator from "./LeaguesNavigator";
import SeasonsNavigator from "./SeasonsNavigator";
import MatchesNavigator from "./MatchesNavigator";
import PlayersNavigator from "./PlayersNavigator";
import HeaderRightButtons from "../components/HeaderRightButtons";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#26A69A", // primary (turquoise)
        tabBarInactiveTintColor: "#78909C", // dark-400
        headerStyle: {
          backgroundColor: "#37474F", // dark charcoal grey
          height: SCREEN_HEIGHT * 0.1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontFamily: "Antonio_600SemiBold",
          fontSize: 18,
        },
        headerTitleContainerStyle: {
          bottom: 10,
        },
        headerRight: () => <HeaderRightButtons />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
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
          headerShown: false,
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
          headerShown: false,
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
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersNavigator}
        options={{
          title: "Players",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
