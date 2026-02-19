/**
 * React Query hooks for teams API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../api';
import type { TeamRegistrationData } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Query keys for teams
export const teamsKeys = {
  all: ['teams'] as const,
  lists: () => [...teamsKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...teamsKeys.lists(), filters] as const,
  details: () => [...teamsKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamsKeys.details(), id] as const,
  roster: (id: number) => [...teamsKeys.detail(id), 'roster'] as const,
  seasons: (id: number) => [...teamsKeys.detail(id), 'seasons'] as const,
};

/**
 * Hook to fetch all teams
 */
export const useTeams = () => {
  return useQuery({
    queryKey: teamsKeys.list(),
    queryFn: () => teamsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single team by ID
 */
export const useTeam = (id: number) => {
  return useQuery({
    queryKey: teamsKeys.detail(id),
    queryFn: () => teamsApi.getById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};

/**
 * Hook to fetch team roster (active members)
 */
export const useTeamRoster = (teamId: number) => {
  return useQuery({
    queryKey: teamsKeys.roster(teamId),
    queryFn: () => teamsApi.getRoster(teamId),
    staleTime: 1000 * 60 * 5,
    enabled: !!teamId,
  });
};

/**
 * Hook to fetch team season participations
 */
export const useTeamSeasons = (teamId: number) => {
  return useQuery({
    queryKey: teamsKeys.seasons(teamId),
    queryFn: () => teamsApi.getSeasons(teamId),
    staleTime: 1000 * 60 * 5,
    enabled: !!teamId,
  });
};

/**
 * Hook to create a new team
 */
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (data: TeamRegistrationData) =>
      teamsApi.create(data, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
    },
  });
};

/**
 * Bulk create result for tracking individual team creation status
 */
export interface BulkCreateResult {
  success: boolean;
  data?: TeamRegistrationData;
  error?: string;
}

/**
 * Hook to bulk create teams (creates teams sequentially)
 * Returns results for each team to show success/failure status
 */
export const useBulkCreateTeams = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: async (teams: TeamRegistrationData[]): Promise<BulkCreateResult[]> => {
      const results: BulkCreateResult[] = [];
      const token = getAuthToken() || undefined;

      for (const team of teams) {
        try {
          await teamsApi.create(team, token);
          results.push({ success: true, data: team });
        } catch (error) {
          results.push({
            success: false,
            data: team,
            error: error instanceof Error ? error.message : 'Failed to create team',
          });
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() });
    },
  });
};
