/**
 * React Query hooks for League-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaguesApi } from '../api/leagues';
import { League } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

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
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
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
