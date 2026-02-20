/**
 * React Query hooks for player-related operations
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi } from '../api';
import { Player, PlayerUpdateData } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Query keys for caching
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (filters?: string) => [...playerKeys.lists(), { filters }] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: number) => [...playerKeys.details(), id] as const,
  teams: (id: number) => [...playerKeys.detail(id), 'teams'] as const,
  currentTeams: () => [...playerKeys.all, 'current-teams'] as const,
  seasonStats: (id: number) => [...playerKeys.detail(id), 'season-stats'] as const,
};

/**
 * Get all players (paginated) - single page
 * @param leagueId - Optional league ID to filter players by league
 */
export const usePlayers = (leagueId?: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: playerKeys.list(leagueId ? `league_${leagueId}` : undefined),
    queryFn: () => playersApi.getAll(getAuthToken() || undefined, { leagueId }),
  });
};

/**
 * Get players with infinite loading (load more)
 * @param leagueId - Optional league ID to filter players by league
 */
export const useInfinitePlayers = (leagueId?: number) => {
  const { getAuthToken } = useAuth();

  return useInfiniteQuery({
    queryKey: [...playerKeys.list(leagueId ? `league_${leagueId}` : undefined), 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      playersApi.getAll(getAuthToken() || undefined, { leagueId, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If there's a next URL, return the next page number
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
  });
};

/**
 * Get a single player by ID
 */
export const usePlayer = (playerId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: playerKeys.detail(playerId),
    queryFn: () => playersApi.getById(playerId, getAuthToken() || undefined),
    enabled: !!playerId,
  });
};

/**
 * Get current user's teams
 */
export const useCurrentTeams = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: playerKeys.currentTeams(),
    queryFn: () => playersApi.getCurrentTeams(getAuthToken() || undefined),
  });
};

/**
 * Get player teams
 */
export const usePlayerTeams = (playerId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: playerKeys.teams(playerId),
    queryFn: () => playersApi.getPlayerTeams(playerId, getAuthToken() || undefined),
    enabled: !!playerId,
  });
};

/**
 * Get player season statistics
 */
export const usePlayerSeasonStats = (playerId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: playerKeys.seasonStats(playerId),
    queryFn: () => playersApi.getSeasonStats(playerId, getAuthToken() || undefined),
    enabled: !!playerId,
  });
};

/**
 * Update a player
 */
export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ playerId, data }: { playerId: number; data: PlayerUpdateData }) =>
      playersApi.update(playerId, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.detail(variables.playerId) });
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
    },
  });
};

/**
 * Update player season stats
 */
export const useUpdatePlayerSeasonStats = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({
      playerId,
      statsId,
      data,
    }: {
      playerId: number;
      statsId: number;
      data: { total_wins?: number; total_losses?: number; table_runs?: number; eight_ball_breaks?: number };
    }) => playersApi.updateSeasonStats(playerId, statsId, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.seasonStats(variables.playerId) });
    },
  });
};

/**
 * Update player week stats
 */
export const useUpdatePlayerWeekStats = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({
      playerId,
      statsId,
      weekNumber,
      data,
    }: {
      playerId: number;
      statsId: number;
      weekNumber: number;
      data: { wins?: number; losses?: number };
    }) =>
      playersApi.updateWeekStats(
        playerId,
        statsId,
        weekNumber,
        data,
        getAuthToken() || undefined
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.seasonStats(variables.playerId) });
    },
  });
};
