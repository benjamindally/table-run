import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMe } from '../hooks/useMe';
import { MeLeague, MeSeason, MeTeam } from '../api/me';

const STORAGE_KEY_LEAGUE = 'admin_currentLeagueId';
const STORAGE_KEY_SEASON = 'admin_currentSeasonId';

interface LeagueSeasonContextType {
  // Data from /me endpoint
  leagues: MeLeague[];
  seasons: MeSeason[];
  teams: MeTeam[];
  isLoading: boolean;
  error: Error | null;

  // Current selection state
  currentLeagueId: number | null;
  currentSeasonId: number | null;

  // Selection helpers
  currentLeague: MeLeague | null;
  currentSeason: MeSeason | null;

  // Actions
  setCurrentLeague: (leagueId: number | null) => void;
  setCurrentSeason: (seasonId: number | null) => void;
  setLeagueAndSeason: (leagueId: number, seasonId: number) => void;
  clearSelection: () => void;

  // Refetch data
  refetch: () => void;
}

const LeagueSeasonContext = createContext<LeagueSeasonContextType | undefined>(undefined);

export const LeagueSeasonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLeagueId, setCurrentLeagueId] = useState<number | null>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user data from /me endpoint
  const { data: meData, isPending, isFetching, error, refetch } = useMe();

  // Consider loading if query is pending, fetching, or hasn't returned data yet
  const isLoading = isPending || isFetching;

  const leagues = meData?.leagues || [];
  const seasons = meData?.seasons || [];
  const teams = meData?.teams || [];

  // Derived current league/season objects
  const currentLeague = currentLeagueId
    ? leagues.find(l => l.id === currentLeagueId) || null
    : null;
  const currentSeason = currentSeasonId
    ? seasons.find(s => s.id === currentSeasonId) || null
    : null;

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedLeagueId = localStorage.getItem(STORAGE_KEY_LEAGUE);
      const savedSeasonId = localStorage.getItem(STORAGE_KEY_SEASON);

      if (savedLeagueId) {
        setCurrentLeagueId(parseInt(savedLeagueId, 10));
      }
      if (savedSeasonId) {
        setCurrentSeasonId(parseInt(savedSeasonId, 10));
      }
    } catch (error) {
      console.error('Failed to load saved league/season:', error);
    }
    setIsInitialized(true);
  }, []);

  // Validate saved selection against loaded data
  useEffect(() => {
    if (!isInitialized || isLoading || leagues.length === 0) return;

    // Clear invalid league selection
    if (currentLeagueId && !leagues.find(l => l.id === currentLeagueId)) {
      setCurrentLeagueId(null);
      localStorage.removeItem(STORAGE_KEY_LEAGUE);
    }

    // Clear invalid season selection
    if (currentSeasonId && !seasons.find(s => s.id === currentSeasonId)) {
      setCurrentSeasonId(null);
      localStorage.removeItem(STORAGE_KEY_SEASON);
    }
  }, [isInitialized, isLoading, leagues, seasons, currentLeagueId, currentSeasonId]);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (!isInitialized) return;

    if (currentLeagueId !== null) {
      localStorage.setItem(STORAGE_KEY_LEAGUE, currentLeagueId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LEAGUE);
    }
  }, [currentLeagueId, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    if (currentSeasonId !== null) {
      localStorage.setItem(STORAGE_KEY_SEASON, currentSeasonId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_SEASON);
    }
  }, [currentSeasonId, isInitialized]);

  const setCurrentLeague = (leagueId: number | null) => {
    setCurrentLeagueId(leagueId);
    // Clear season when league changes (may not be valid for new league)
    if (leagueId !== currentLeagueId) {
      setCurrentSeasonId(null);
    }
  };

  const setCurrentSeason = (seasonId: number | null) => {
    setCurrentSeasonId(seasonId);
  };

  const setLeagueAndSeason = (leagueId: number, seasonId: number) => {
    setCurrentLeagueId(leagueId);
    setCurrentSeasonId(seasonId);
  };

  const clearSelection = () => {
    setCurrentLeagueId(null);
    setCurrentSeasonId(null);
  };

  const value: LeagueSeasonContextType = {
    // Data
    leagues,
    seasons,
    teams,
    isLoading,
    error: error as Error | null,

    // Current selection
    currentLeagueId,
    currentSeasonId,
    currentLeague,
    currentSeason,

    // Actions
    setCurrentLeague,
    setCurrentSeason,
    setLeagueAndSeason,
    clearSelection,
    refetch,
  };

  return (
    <LeagueSeasonContext.Provider value={value}>
      {children}
    </LeagueSeasonContext.Provider>
  );
};

// Custom hook to use the context
export const useLeagueSeason = () => {
  const context = useContext(LeagueSeasonContext);
  if (context === undefined) {
    throw new Error('useLeagueSeason must be used within a LeagueSeasonProvider');
  }
  return context;
};
