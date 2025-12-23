/**
 * React Query hooks for teams API
 */

import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '../api';

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
