/**
 * React Query hooks for League-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaguesApi } from '../api';
import { League } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { meKeys } from './useMe';

// Query keys for caching
export const leagueKeys = {
  all: ['leagues'] as const,
  lists: () => [...leagueKeys.all, 'list'] as const,
  list: (filters?: string) => [...leagueKeys.lists(), { filters }] as const,
  details: () => [...leagueKeys.all, 'detail'] as const,
  detail: (id: number) => [...leagueKeys.details(), id] as const,
};

/**
 * Get all leagues (paginated)
 */
export const useLeagues = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: leagueKeys.lists(),
    queryFn: () => leaguesApi.getAll(getAuthToken() || undefined),
  });
};

/**
 * Get leagues where the current user is an operator
 */
export const useMyLeagues = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: [...leagueKeys.all, 'my-leagues'] as const,
    queryFn: () => leaguesApi.getMyLeagues(getAuthToken() || undefined),
  });
};

/**
 * Get a single league by ID
 */
export const useLeague = (id: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: leagueKeys.detail(id),
    queryFn: () => leaguesApi.getById(id, getAuthToken() || undefined),
    enabled: !!id,
  });
};

/**
 * Create a new league
 */
export const useCreateLeague = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (data: Partial<League>) =>
      leaguesApi.create(data, getAuthToken() || undefined),
    onSuccess: () => {
      // Invalidate both general league list and user's leagues
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...leagueKeys.all, 'my-leagues'] });
      // Invalidate the /me endpoint so LeagueSeasonContext gets fresh data
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
};

/**
 * Update a league
 */
export const useUpdateLeague = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<League> }) =>
      leaguesApi.update(id, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...leagueKeys.all, 'my-leagues'] });
    },
  });
};

/**
 * Delete a league
 */
export const useDeleteLeague = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (id: number) =>
      leaguesApi.delete(id, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
    },
  });
};
