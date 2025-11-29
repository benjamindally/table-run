/**
 * React Query hooks for statistics API
 */

import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Query keys for stats
export const statsKeys = {
  all: ['stats'] as const,
  league: () => [...statsKeys.all, 'league'] as const,
};

/**
 * Hook to fetch league statistics
 */
export const useLeagueStats = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: statsKeys.league(),
    queryFn: () => statsApi.getLeagueStats(getAuthToken() || undefined),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
