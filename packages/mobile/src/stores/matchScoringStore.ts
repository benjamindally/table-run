/**
 * Match Scoring Store - Real-time match scoring state management using Zustand
 * Ported from web MatchScoringContext.tsx
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TeamSide, LineupState } from "@league-genius/shared";

export interface PlayerAttendance {
  playerId: number;
  playerName: string;
  present: boolean;
}

export interface GameState {
  id: number | null; // Actual database ID from backend
  gameNumber: number;
  homePlayerId: number | null;
  awayPlayerId: number | null;
  winner: TeamSide | null;
  homeTableRun: boolean;
  awayTableRun: boolean;
  home8Ball: boolean;
  away8Ball: boolean;
}

export interface MatchState {
  matchId: number;
  homeRoster: PlayerAttendance[];
  awayRoster: PlayerAttendance[];
  games: GameState[];
  submittedBy: TeamSide | null;
  lastUpdated: number;
  lineupState: LineupState;
}

interface MatchScoringStore {
  state: MatchState | null;

  // Initialize/reset
  initializeMatch: (
    matchId: number,
    gamesCount?: number,
    initialLineupState?: LineupState
  ) => Promise<void>;
  clearMatch: () => Promise<void>;

  // Roster management
  setHomeRoster: (roster: PlayerAttendance[]) => void;
  setAwayRoster: (roster: PlayerAttendance[]) => void;
  toggleHomeAttendance: (playerId: number) => void;
  toggleAwayAttendance: (playerId: number) => void;

  // Game management
  updateGame: (gameIndex: number, updates: Partial<GameState>) => void;
  setGamePlayers: (
    gameIndex: number,
    homePlayerId: number,
    awayPlayerId: number
  ) => void;
  setWinner: (gameIndex: number, winner: TeamSide) => void;
  toggleTableRun: (gameIndex: number, team: TeamSide) => void;
  toggle8Ball: (gameIndex: number, team: TeamSide) => void;

  // Submission
  setSubmittedBy: (team: TeamSide | null) => void;

  // Lineup workflow
  setLineupState: (lineupState: LineupState) => void;

  // Computed value getters
  getHomeScore: () => number;
  getAwayScore: () => number;
  getPresentHomePlayers: () => PlayerAttendance[];
  getPresentAwayPlayers: () => PlayerAttendance[];
  getIsAwayLineupComplete: () => boolean;
  getIsHomeLineupComplete: () => boolean;
}

const STORAGE_PREFIX = "match_state_";

function createInitialState(
  matchId: number,
  gamesCount: number,
  lineupState: LineupState = "awaiting_away_lineup"
): MatchState {
  return {
    matchId,
    homeRoster: [],
    awayRoster: [],
    games: Array.from({ length: gamesCount }, (_, i) => ({
      id: null,
      gameNumber: i + 1,
      homePlayerId: null,
      awayPlayerId: null,
      winner: null,
      homeTableRun: false,
      awayTableRun: false,
      home8Ball: false,
      away8Ball: false,
    })),
    submittedBy: null,
    lastUpdated: Date.now(),
    lineupState,
  };
}

// Helper to persist state
async function persistState(state: MatchState): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}${state.matchId}`;
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("[MatchScoringStore] Failed to persist state:", error);
  }
}

export const useMatchScoringStore = create<MatchScoringStore>((set, get) => ({
  state: null,

  initializeMatch: async (
    matchId: number,
    gamesCount = 16,
    initialLineupState?: LineupState
  ) => {
    try {
      const key = `${STORAGE_PREFIX}${matchId}`;
      const stored = await AsyncStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored) as MatchState;
        if (
          parsed.games &&
          Array.isArray(parsed.games) &&
          parsed.matchId === matchId
        ) {
          // If backend provides a different lineup state, use that (it's the source of truth)
          const finalState =
            initialLineupState && parsed.lineupState !== initialLineupState
              ? { ...parsed, lineupState: initialLineupState }
              : parsed;
          set({ state: finalState });
          return;
        }
      }

      const newState = createInitialState(
        matchId,
        gamesCount,
        initialLineupState || "awaiting_away_lineup"
      );
      set({ state: newState });
      await persistState(newState);
    } catch (error) {
      console.error("[MatchScoringStore] Failed to initialize:", error);
      // Create fresh state on error
      const newState = createInitialState(
        matchId,
        gamesCount,
        initialLineupState || "awaiting_away_lineup"
      );
      set({ state: newState });
    }
  },

  clearMatch: async () => {
    const { state } = get();
    if (state) {
      try {
        const key = `${STORAGE_PREFIX}${state.matchId}`;
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error("[MatchScoringStore] Failed to clear:", error);
      }
    }
    set({ state: null });
  },

  setHomeRoster: (roster: PlayerAttendance[]) => {
    const { state } = get();
    if (!state) return;
    const newState = { ...state, homeRoster: roster, lastUpdated: Date.now() };
    set({ state: newState });
    persistState(newState);
  },

  setAwayRoster: (roster: PlayerAttendance[]) => {
    const { state } = get();
    if (!state) return;
    const newState = { ...state, awayRoster: roster, lastUpdated: Date.now() };
    set({ state: newState });
    persistState(newState);
  },

  toggleHomeAttendance: (playerId: number) => {
    const { state } = get();
    if (!state) return;
    const newState = {
      ...state,
      homeRoster: state.homeRoster.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      ),
      lastUpdated: Date.now(),
    };
    set({ state: newState });
    persistState(newState);
  },

  toggleAwayAttendance: (playerId: number) => {
    const { state } = get();
    if (!state) return;
    const newState = {
      ...state,
      awayRoster: state.awayRoster.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      ),
      lastUpdated: Date.now(),
    };
    set({ state: newState });
    persistState(newState);
  },

  updateGame: (gameIndex: number, updates: Partial<GameState>) => {
    const { state } = get();
    if (!state) return;
    const newState = {
      ...state,
      games: state.games.map((game, idx) =>
        idx === gameIndex ? { ...game, ...updates } : game
      ),
      lastUpdated: Date.now(),
    };
    set({ state: newState });
    persistState(newState);
  },

  setGamePlayers: (
    gameIndex: number,
    homePlayerId: number,
    awayPlayerId: number
  ) => {
    get().updateGame(gameIndex, { homePlayerId, awayPlayerId });
  },

  setWinner: (gameIndex: number, winner: TeamSide) => {
    get().updateGame(gameIndex, { winner });
  },

  toggleTableRun: (gameIndex: number, team: TeamSide) => {
    const { state } = get();
    if (!state) return;
    const game = state.games[gameIndex];
    const updates =
      team === "home"
        ? { homeTableRun: !game.homeTableRun }
        : { awayTableRun: !game.awayTableRun };
    get().updateGame(gameIndex, updates);
  },

  toggle8Ball: (gameIndex: number, team: TeamSide) => {
    const { state } = get();
    if (!state) return;
    const game = state.games[gameIndex];
    const updates =
      team === "home"
        ? { home8Ball: !game.home8Ball }
        : { away8Ball: !game.away8Ball };
    get().updateGame(gameIndex, updates);
  },

  setSubmittedBy: (team: TeamSide | null) => {
    const { state } = get();
    if (!state) return;
    const newState = { ...state, submittedBy: team, lastUpdated: Date.now() };
    set({ state: newState });
    persistState(newState);
  },

  setLineupState: (lineupState: LineupState) => {
    const { state } = get();
    if (!state) return;
    const newState = { ...state, lineupState, lastUpdated: Date.now() };
    set({ state: newState });
    persistState(newState);
  },

  // Computed value getters
  getHomeScore: () => {
    const { state } = get();
    return state?.games.filter((g) => g.winner === "home").length ?? 0;
  },

  getAwayScore: () => {
    const { state } = get();
    return state?.games.filter((g) => g.winner === "away").length ?? 0;
  },

  getPresentHomePlayers: () => {
    const { state } = get();
    return state?.homeRoster.filter((p) => p.present) ?? [];
  },

  getPresentAwayPlayers: () => {
    const { state } = get();
    return state?.awayRoster.filter((p) => p.present) ?? [];
  },

  getIsAwayLineupComplete: () => {
    const { state } = get();
    if (!state) return false;
    const presentAway = state.awayRoster.filter((p) => p.present);
    if (presentAway.length < 4) return false;
    return state.games.every((g) => g.awayPlayerId !== null);
  },

  getIsHomeLineupComplete: () => {
    const { state } = get();
    if (!state) return false;
    const presentHome = state.homeRoster.filter((p) => p.present);
    if (presentHome.length < 4) return false;
    return state.games.every((g) => g.homePlayerId !== null);
  },
}));
