/**
 * React Query hook for user context (me endpoint)
 */

import { useQuery } from '@tanstack/react-query';
import { meApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Query keys for caching
export const meKeys = {
  all: ['me'] as const,
  detail: () => [...meKeys.all, 'detail'] as const,
};

/**
 * Get comprehensive user context - player, teams, seasons, and leagues
 * This replaces multiple separate API calls with a single efficient call
 */
export const useMe = () => {
  const { getAuthToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: meKeys.detail(),
    queryFn: () => meApi.getMe(getAuthToken() || undefined),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};
