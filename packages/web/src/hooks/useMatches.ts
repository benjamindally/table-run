/**
 * React Query hooks for Match-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesApi } from '../api';
import { Match } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Query keys for caching
export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters?: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: number) => [...matchKeys.details(), id] as const,
};

/**
 * Get all matches (paginated)
 */
export const useMatches = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: matchKeys.lists(),
    queryFn: () => matchesApi.getAll(getAuthToken() || undefined),
  });
};

/**
 * Get a single match by ID
 */
export const useMatch = (id: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: () => matchesApi.getById(id, getAuthToken() || undefined),
    enabled: !!id,
  });
};

/**
 * Create a new match
 */
export const useCreateMatch = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (data: Partial<Match>) =>
      matchesApi.create(data, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
};

/**
 * Update a match
 */
export const useUpdateMatch = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Match> }) =>
      matchesApi.update(id, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
};
