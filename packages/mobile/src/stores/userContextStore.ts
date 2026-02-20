import { create } from "zustand";
import {
  meApi,
  type MeResponse,
  type MeLeague,
  type MeTeam,
  type MeSeason,
  type MePlayer,
  type MeMatch,
} from "@league-genius/shared";
import { useAuthStore } from "./authStore";

interface UserContextState {
  player: MePlayer | null;
  myLeagues: MeLeague[];
  myTeams: MeTeam[];
  mySeasons: MeSeason[];
  upcomingMatches: MeMatch[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadUserContext: () => Promise<void>;
  clearUserContext: () => void;

  // Helpers
  getLeagueIds: () => number[];
  getTeamIds: () => number[];
  getSeasonIds: () => number[];
  isOperator: (leagueId: number) => boolean;
  isCaptain: (teamId: number) => boolean;
}

export const useUserContextStore = create<UserContextState>((set, get) => ({
  player: null,
  myLeagues: [],
  myTeams: [],
  mySeasons: [],
  upcomingMatches: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  loadUserContext: async () => {
    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !accessToken) {
      set({ isLoaded: true, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = (await meApi.getMe(accessToken)) as MeResponse;

      set({
        player: response.player,
        myLeagues: response.leagues,
        myTeams: response.teams,
        mySeasons: response.seasons,
        upcomingMatches: response.upcoming_matches || [],
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("[UserContext] Failed:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load user context",
        isLoading: false,
        isLoaded: true,
      });
    }
  },

  clearUserContext: () => {
    set({
      player: null,
      myLeagues: [],
      myTeams: [],
      mySeasons: [],
      upcomingMatches: [],
      isLoaded: false,
      isLoading: false,
      error: null,
    });
  },

  // Helper to get array of league IDs user is part of
  getLeagueIds: () => get().myLeagues.map((l) => l.id),

  // Helper to get array of team IDs user is part of
  getTeamIds: () => get().myTeams.map((t) => t.id),

  // Helper to get array of season IDs user is part of
  getSeasonIds: () => get().mySeasons.map((s) => s.id),

  // Check if user is operator of a specific league
  isOperator: (leagueId: number) =>
    get().myLeagues.some((l) => l.id === leagueId && l.is_operator),

  // Check if user is captain of a specific team
  isCaptain: (teamId: number) =>
    get().myTeams.some((t) => t.id === teamId && t.is_captain),
}));
