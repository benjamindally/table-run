/**
 * React Query hooks for Season-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonsApi } from '../api/seasons';
import { Season, SeasonParticipation, Match } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

// Query keys for caching
export const seasonKeys = {
  all: ['seasons'] as const,
  lists: () => [...seasonKeys.all, 'list'] as const,
  list: (filters?: string) => [...seasonKeys.lists(), { filters }] as const,
  details: () => [...seasonKeys.all, 'detail'] as const,
  detail: (id: number) => [...seasonKeys.details(), id] as const,
  teams: (id: number) => [...seasonKeys.detail(id), 'teams'] as const,
  matches: (id: number) => [...seasonKeys.detail(id), 'matches'] as const,
  standings: (id: number) => [...seasonKeys.detail(id), 'standings'] as const,
  players: (id: number) => [...seasonKeys.detail(id), 'players'] as const,
};

/**
 * Get all seasons (paginated)
 */
export const useSeasons = () => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.lists(),
    queryFn: () => seasonsApi.getAll(getAuthToken() || undefined),
  });
};

/**
 * Get a single season by ID
 */
export const useSeason = (id: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.detail(id),
    queryFn: () => seasonsApi.getById(id, getAuthToken() || undefined),
    enabled: !!id,
  });
};

/**
 * Get teams in a season
 */
export const useSeasonTeams = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.teams(seasonId),
    queryFn: () => seasonsApi.getTeams(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Get matches in a season
 */
export const useSeasonMatches = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.matches(seasonId),
    queryFn: () => seasonsApi.getMatches(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Get standings for a season
 */
export const useSeasonStandings = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.standings(seasonId),
    queryFn: () => seasonsApi.getStandings(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Get all players in a season with their stats
 */
export const useSeasonPlayers = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.players(seasonId),
    queryFn: () => seasonsApi.getPlayers(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Create a new season (league operators only)
 */
export const useCreateSeason = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (data: Partial<Season>) =>
      seasonsApi.create(data, getAuthToken() || undefined),
    onSuccess: () => {
      // Invalidate and refetch seasons list
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
      // Also invalidate leagues to update season count
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
    },
  });
};

/**
 * Update a season (league operators only)
 */
export const useUpdateSeason = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Season> }) =>
      seasonsApi.update(id, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate the specific season and the list
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
    },
  });
};

/**
 * Join a season with a team using invite code
 */
export const useJoinSeason = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, inviteCode, teamId }: { seasonId: number; inviteCode: string; teamId: number }) =>
      seasonsApi.joinWithCode(seasonId, { invite_code: inviteCode, team_id: teamId }, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate season teams to show the newly joined team
      queryClient.invalidateQueries({ queryKey: seasonKeys.teams(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.seasonId) });
    },
  });
};

/**
 * Import CSV files to populate a season
 */
export const useImportSeasonCSV = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, files }: { seasonId: number; files: { teamStandings: File; individualStandings: File; weeklyStandings: File } }) =>
      seasonsApi.importCSV(seasonId, files, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate season data to show newly imported teams and players
      queryClient.invalidateQueries({ queryKey: seasonKeys.teams(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.standings(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.players(variables.seasonId) });
    },
  });
};

/**
 * Import schedule and match results from CSV files
 */
export const useImportSchedule = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, files }: { seasonId: number; files: { schedule: File; standings: File } }) =>
      seasonsApi.importSchedule(seasonId, files, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate season data to show newly imported matches
      queryClient.invalidateQueries({ queryKey: seasonKeys.matches(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.teams(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.standings(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.players(variables.seasonId) });
    },
  });
};
