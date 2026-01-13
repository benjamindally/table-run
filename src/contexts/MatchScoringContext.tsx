/**
 * Match Scoring Context - Real-time match scoring state management
 * Uses React Context for state with localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { TeamSide } from '../types/websocket';

export interface PlayerAttendance {
  playerId: number;
  playerName: string;
  present: boolean;
}

export interface GameState {
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
  submittedBy: TeamSide | null; // null = not submitted, 'away' = awaiting home confirmation
  lastUpdated: number;
}

interface MatchScoringContextType {
  state: MatchState | null;
  // Initialize/reset
  initializeMatch: (matchId: number, gamesCount?: number) => void;
  clearMatch: () => void;
  // Roster management
  setHomeRoster: (roster: PlayerAttendance[]) => void;
  setAwayRoster: (roster: PlayerAttendance[]) => void;
  toggleHomeAttendance: (playerId: number) => void;
  toggleAwayAttendance: (playerId: number) => void;
  // Game management
  updateGame: (gameIndex: number, updates: Partial<GameState>) => void;
  setGamePlayers: (gameIndex: number, homePlayerId: number, awayPlayerId: number) => void;
  setWinner: (gameIndex: number, winner: TeamSide) => void;
  toggleTableRun: (gameIndex: number, team: TeamSide) => void;
  toggle8Ball: (gameIndex: number, team: TeamSide) => void;
  // Submission
  setSubmittedBy: (team: TeamSide | null) => void;
  // Computed values
  homeScore: number;
  awayScore: number;
  presentHomePlayers: PlayerAttendance[];
  presentAwayPlayers: PlayerAttendance[];
}

const MatchScoringContext = createContext<MatchScoringContextType | undefined>(undefined);

const STORAGE_PREFIX = 'match_state_';

function getStoredState(matchId: number): MatchState | null {
  const storageKey = `${STORAGE_PREFIX}${matchId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate the stored state has the correct structure
      if (parsed.games && Array.isArray(parsed.games) && parsed.matchId === matchId) {
        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse stored match state:', error);
    }
  }

  return null;
}

function createInitialState(matchId: number, gamesCount: number): MatchState {
  return {
    matchId,
    homeRoster: [],
    awayRoster: [],
    games: Array.from({ length: gamesCount }, (_, i) => ({
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
  };
}

export const MatchScoringProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MatchState | null>(null);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (state) {
      const storageKey = `${STORAGE_PREFIX}${state.matchId}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state]);

  // Initialize match (try to load from localStorage first)
  const initializeMatch = useCallback((matchId: number, gamesCount = 16) => {
    const stored = getStoredState(matchId);
    if (stored) {
      console.log('Loaded match state from localStorage:', matchId);
      setState(stored);
    } else {
      console.log('Creating new match state:', matchId);
      setState(createInitialState(matchId, gamesCount));
    }
  }, []);

  // Clear match state
  const clearMatch = useCallback(() => {
    if (state) {
      const storageKey = `${STORAGE_PREFIX}${state.matchId}`;
      localStorage.removeItem(storageKey);
    }
    setState(null);
  }, [state]);

  // Roster management
  const setHomeRoster = useCallback((roster: PlayerAttendance[]) => {
    setState((prev) => prev ? {
      ...prev,
      homeRoster: roster,
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  const setAwayRoster = useCallback((roster: PlayerAttendance[]) => {
    setState((prev) => prev ? {
      ...prev,
      awayRoster: roster,
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  const toggleHomeAttendance = useCallback((playerId: number) => {
    setState((prev) => prev ? {
      ...prev,
      homeRoster: prev.homeRoster.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      ),
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  const toggleAwayAttendance = useCallback((playerId: number) => {
    setState((prev) => prev ? {
      ...prev,
      awayRoster: prev.awayRoster.map((p) =>
        p.playerId === playerId ? { ...p, present: !p.present } : p
      ),
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  // Game management
  const updateGame = useCallback((gameIndex: number, updates: Partial<GameState>) => {
    setState((prev) => prev ? {
      ...prev,
      games: prev.games.map((game, idx) =>
        idx === gameIndex ? { ...game, ...updates } : game
      ),
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  const setGamePlayers = useCallback(
    (gameIndex: number, homePlayerId: number, awayPlayerId: number) => {
      updateGame(gameIndex, { homePlayerId, awayPlayerId });
    },
    [updateGame]
  );

  const setWinner = useCallback(
    (gameIndex: number, winner: TeamSide) => {
      updateGame(gameIndex, { winner });
    },
    [updateGame]
  );

  const toggleTableRun = useCallback((gameIndex: number, team: TeamSide) => {
    setState((prev) => {
      if (!prev) return prev;
      const game = prev.games[gameIndex];
      return {
        ...prev,
        games: prev.games.map((g, idx) =>
          idx === gameIndex
            ? {
                ...g,
                homeTableRun: team === 'home' ? !game.homeTableRun : game.homeTableRun,
                awayTableRun: team === 'away' ? !game.awayTableRun : game.awayTableRun,
              }
            : g
        ),
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const toggle8Ball = useCallback((gameIndex: number, team: TeamSide) => {
    setState((prev) => {
      if (!prev) return prev;
      const game = prev.games[gameIndex];
      return {
        ...prev,
        games: prev.games.map((g, idx) =>
          idx === gameIndex
            ? {
                ...g,
                home8Ball: team === 'home' ? !game.home8Ball : game.home8Ball,
                away8Ball: team === 'away' ? !game.away8Ball : game.away8Ball,
              }
            : g
        ),
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Submission
  const setSubmittedBy = useCallback((team: TeamSide | null) => {
    setState((prev) => prev ? {
      ...prev,
      submittedBy: team,
      lastUpdated: Date.now(),
    } : prev);
  }, []);

  // Computed values
  const homeScore = state?.games.filter((g) => g.winner === 'home').length ?? 0;
  const awayScore = state?.games.filter((g) => g.winner === 'away').length ?? 0;
  const presentHomePlayers = state?.homeRoster.filter((p) => p.present) ?? [];
  const presentAwayPlayers = state?.awayRoster.filter((p) => p.present) ?? [];

  const value: MatchScoringContextType = {
    state,
    initializeMatch,
    clearMatch,
    setHomeRoster,
    setAwayRoster,
    toggleHomeAttendance,
    toggleAwayAttendance,
    updateGame,
    setGamePlayers,
    setWinner,
    toggleTableRun,
    toggle8Ball,
    setSubmittedBy,
    homeScore,
    awayScore,
    presentHomePlayers,
    presentAwayPlayers,
  };

  return (
    <MatchScoringContext.Provider value={value}>
      {children}
    </MatchScoringContext.Provider>
  );
};

// Custom hook for using match scoring context
export const useMatchScoring = () => {
  const context = useContext(MatchScoringContext);
  if (context === undefined) {
    throw new Error('useMatchScoring must be used within a MatchScoringProvider');
  }
  return context;
};
