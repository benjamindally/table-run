/**
 * React Query hooks for Season-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonsApi } from '../api';
import type { Season, SeasonParticipation, Match, Venue, ScheduleConfiguration, SaveScheduleRequest, PlayoffConfiguration, SavePlayoffsRequest, AdvancePlayoffRequest, RolloverRequest } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { meKeys } from './useMe';

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
  venues: (id: number) => [...seasonKeys.detail(id), 'venues'] as const,
  playoffs: (id: number) => [...seasonKeys.detail(id), 'playoffs'] as const,
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
      // Invalidate the /me endpoint so LeagueSeasonContext gets fresh data
      queryClient.invalidateQueries({ queryKey: meKeys.all });
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
      // Also invalidate /me endpoint so LeagueSeasonContext gets fresh data
      queryClient.invalidateQueries({ queryKey: meKeys.all });
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

/**
 * Get venues available for a season's league
 */
export const useSeasonVenues = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.venues(seasonId),
    queryFn: () => seasonsApi.getVenues(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Generate schedule preview (doesn't save)
 */
export const useGenerateSchedule = () => {
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, config }: { seasonId: number; config: ScheduleConfiguration }) =>
      seasonsApi.generateSchedule(seasonId, config, getAuthToken() || undefined),
  });
};

/**
 * Save the generated/edited schedule
 */
export const useSaveSchedule = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, data }: { seasonId: number; data: SaveScheduleRequest }) =>
      seasonsApi.saveSchedule(seasonId, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate matches to show newly created schedule
      queryClient.invalidateQueries({ queryKey: seasonKeys.matches(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.seasonId) });
    },
  });
};

/**
 * Update a venue (e.g., table_count)
 */
export const useUpdateVenue = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ venueId, data }: { venueId: number; data: Partial<Venue> }) =>
      seasonsApi.updateVenue(venueId, data, getAuthToken() || undefined),
    onSuccess: () => {
      // Invalidate all season venue queries to refresh the data
      queryClient.invalidateQueries({ queryKey: seasonKeys.all });
    },
  });
};

/**
 * Create a new venue
 */
export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (data: { league: number; name: string; address?: string; city?: string; state?: string; zip_code?: string; table_count: number }) =>
      seasonsApi.createVenue(data, getAuthToken() || undefined),
    onSuccess: () => {
      // Invalidate all season venue queries to refresh the data
      queryClient.invalidateQueries({ queryKey: seasonKeys.all });
    },
  });
};

/**
 * Venue data for bulk creation
 */
export interface VenueCreateData {
  league: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  table_count: number;
}

/**
 * Bulk create result for tracking individual venue creation status
 */
export interface BulkVenueCreateResult {
  success: boolean;
  data?: VenueCreateData;
  error?: string;
}

/**
 * Add a team to a season (league operators only)
 */
export const useAddTeamToSeason = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, teamId, venueId }: { seasonId: number; teamId: number; venueId?: number }) =>
      seasonsApi.addTeam(seasonId, { team_id: teamId, venue_id: venueId }, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      // Invalidate season teams to show the newly added team
      queryClient.invalidateQueries({ queryKey: seasonKeys.teams(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.seasonId) });
    },
  });
};

/**
 * Bulk create venues (creates venues sequentially)
 * Returns results for each venue to show success/failure status
 */
export const useBulkCreateVenues = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: async (venues: VenueCreateData[]): Promise<BulkVenueCreateResult[]> => {
      const results: BulkVenueCreateResult[] = [];
      const token = getAuthToken() || undefined;

      for (const venue of venues) {
        try {
          await seasonsApi.createVenue(venue, token);
          results.push({ success: true, data: venue });
        } catch (error) {
          results.push({
            success: false,
            data: venue,
            error: error instanceof Error ? error.message : 'Failed to create venue',
          });
        }
      }

      return results;
    },
    onSuccess: () => {
      // Invalidate all season venue queries to refresh the data
      queryClient.invalidateQueries({ queryKey: seasonKeys.all });
    },
  });
};

/**
 * Toggle favorite status for a season
 * Optimistically updates the UI and invalidates /me endpoint on success
 */
/**
 * Get saved playoff brackets for a season
 */
export const usePlayoffs = (seasonId: number) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: seasonKeys.playoffs(seasonId),
    queryFn: () => seasonsApi.getPlayoffs(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId,
  });
};

/**
 * Generate playoff bracket preview (doesn't save)
 */
export const useGeneratePlayoffs = () => {
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, config }: { seasonId: number; config: PlayoffConfiguration }) =>
      seasonsApi.generatePlayoffs(seasonId, config, getAuthToken() || undefined),
  });
};

/**
 * Save playoff bracket after review/editing
 */
export const useSavePlayoffs = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, data }: { seasonId: number; data: SavePlayoffsRequest }) =>
      seasonsApi.savePlayoffs(seasonId, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.playoffs(variables.seasonId) });
      queryClient.invalidateQueries({ queryKey: seasonKeys.detail(variables.seasonId) });
    },
  });
};

/**
 * Manually advance a winner in a playoff matchup
 */
export const useAdvancePlayoff = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, data }: { seasonId: number; data: AdvancePlayoffRequest }) =>
      seasonsApi.advancePlayoff(seasonId, data, getAuthToken() || undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.playoffs(variables.seasonId) });
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: (seasonId: number) =>
      seasonsApi.toggleFavorite(seasonId, getAuthToken() || undefined),
    onSuccess: () => {
      // Invalidate the /me endpoint to refresh seasons with updated favorite status
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
};

/**
 * Get rollover preview for a season
 */
export const useRolloverPreview = (seasonId: number, enabled: boolean = false) => {
  const { getAuthToken } = useAuth();

  return useQuery({
    queryKey: [...seasonKeys.detail(seasonId), 'rollover-preview'] as const,
    queryFn: () => seasonsApi.rolloverPreview(seasonId, getAuthToken() || undefined),
    enabled: !!seasonId && enabled,
  });
};

/**
 * Roll over a season to create a new one
 */
export const useRolloverSeason = () => {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuth();

  return useMutation({
    mutationFn: ({ seasonId, data }: { seasonId: number; data: RolloverRequest }) =>
      seasonsApi.rollover(seasonId, data, getAuthToken() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seasonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
};
