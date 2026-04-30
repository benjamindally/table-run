import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { uid: string; token: string };
};

// Main tabs
export type MainTabParamList = {
  Home: undefined;
  Leagues: undefined;
  Seasons: undefined;
  Matches: undefined;
  Players: undefined;
};

// Home stack (nested in Home tab)
export type HomeStackParamList = {
  HomeScreen: undefined;
  SeasonDetails: { seasonId: number };
  MatchDetails: { matchId: number };
};

// Leagues stack (nested in Leagues tab)
export type LeaguesStackParamList = {
  LeaguesScreen: undefined;
  LeagueDetails: { leagueId: number; leagueName: string };
  CreateLeague: { leagueId?: number } | undefined;
  CreateSeason: { leagueId: number; seasonId?: number };
  VenueManagement: { leagueId: number; leagueName: string };
};

// Seasons stack (nested in Seasons tab)
export type SeasonsStackParamList = {
  SeasonsScreen: { leagueId?: number } | undefined;
  SeasonDetails: { seasonId: number };
  SeasonSchedule: { seasonId: number; seasonName: string; leagueId: number };
  FullStandings: { seasonId: number; seasonName: string };
  FullMatches: { seasonId: number; seasonName: string };
  FullPlayers: { seasonId: number; seasonName: string };
  MatchDetails: { matchId: number };
  CreateSeason: { leagueId: number; seasonId?: number };
  TeamManagement: { seasonId: number; seasonName: string };
  PlayoffBracket: { seasonId: number; seasonName: string; leagueId: number };
  SeasonRollover: { seasonId: number; seasonName: string; leagueId: number };
};

// Matches stack (nested in Matches tab)
export type MatchesStackParamList = {
  MatchesScreen: { seasonId?: number; teamId?: number } | undefined;
  FullMatches: { seasonId: number; seasonName: string };
  MatchDetails: { matchId: number };
  CreateSeason: { leagueId: number; seasonId?: number };
};

// Players stack (nested in Players tab)
export type PlayersStackParamList = {
  PlayersScreen: { seasonId?: number; teamId?: number } | undefined;
  PlayerDetails: { playerId: number };
};

// Root navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  About: undefined;
  Notifications: undefined;
  // SUBSCRIPTIONS_DISABLED: Paywall: { source?: string } | undefined;
  TeamDetails: { teamId: number; teamName: string };
  ClaimPlayer: { token: string };
  ActivatePlayer: { token: string };
  PlayerManagement: { leagueId: number; leagueName: string };
};

// Screen props types
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type LeaguesStackScreenProps<T extends keyof LeaguesStackParamList> =
  NativeStackScreenProps<LeaguesStackParamList, T>;

export type SeasonsStackScreenProps<T extends keyof SeasonsStackParamList> =
  NativeStackScreenProps<SeasonsStackParamList, T>;

export type MatchesStackScreenProps<T extends keyof MatchesStackParamList> =
  NativeStackScreenProps<MatchesStackParamList, T>;

export type PlayersStackScreenProps<T extends keyof PlayersStackParamList> =
  NativeStackScreenProps<PlayersStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
