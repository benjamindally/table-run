/**
 * Season-related API calls
 */

import { api, getApiBaseUrl } from './client';
import type {
  Season,
  PaginatedResponse,
  SeasonParticipation,
  Match,
  Venue,
  ScheduleConfiguration,
  GeneratedScheduleResponse,
  SaveScheduleRequest,
  SeasonStandingsResponse,
  SeasonPlayersResponse,
} from '../types';

export const seasonsApi = {
  /**
   * Get all seasons (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<Season>>('/seasons/', token),

  /**
   * Get a single season by ID
   */
  getById: (id: number, token?: string) =>
    api.get<Season>(`/seasons/${id}/`, token),

  /**
   * Create a new season (league operators only)
   */
  create: (data: Partial<Season>, token?: string) =>
    api.post<Season>('/seasons/', data, token),

  /**
   * Update a season (league operators only)
   */
  update: (id: number, data: Partial<Season>, token?: string) =>
    api.patch<Season>(`/seasons/${id}/`, data, token),

  /**
   * Get all team participations in a season
   */
  getTeams: (seasonId: number, token?: string) =>
    api.get<SeasonParticipation[]>(`/seasons/${seasonId}/teams/`, token),

  /**
   * Get all matches in a season
   */
  getMatches: (seasonId: number, token?: string) =>
    api.get<Match[]>(`/seasons/${seasonId}/matches/`, token),

  /**
   * Join a season with a team using invite code
   */
  joinWithCode: (seasonId: number, data: { invite_code: string; team_id: number }, token?: string) =>
    api.post<SeasonParticipation>(`/seasons/${seasonId}/join_with_code/`, data, token),

  /**
   * Get season standings
   */
  getStandings: (seasonId: number, token?: string) =>
    api.get<SeasonStandingsResponse>(`/seasons/${seasonId}/standings/`, token),

  /**
   * Get all players in a season with their stats
   */
  getPlayers: (seasonId: number, token?: string) =>
    api.get<SeasonPlayersResponse>(`/seasons/${seasonId}/players/`, token),

  /**
   * Import CSV files to populate season with teams and players
   */
  importCSV: async (
    seasonId: number,
    files: { teamStandings: File; individualStandings: File; weeklyStandings: File },
    token?: string
  ) => {
    const formData = new FormData();
    formData.append('team_standings', files.teamStandings);
    formData.append('individual_standings', files.individualStandings);
    formData.append('weekly_standings', files.weeklyStandings);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/seasons/${seasonId}/import-csv/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Import failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Import schedule and match results from CSV files
   */
  importSchedule: async (
    seasonId: number,
    files: { schedule: File; standings: File },
    token?: string
  ) => {
    const formData = new FormData();
    formData.append('schedule', files.schedule);
    formData.append('standings', files.standings);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/seasons/${seasonId}/import-schedule/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Import failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get venues available for a season's league
   */
  getVenues: (seasonId: number, token?: string) =>
    api.get<Venue[]>(`/seasons/${seasonId}/venues/`, token),

  /**
   * Generate schedule preview (doesn't save)
   */
  generateSchedule: (seasonId: number, config: ScheduleConfiguration, token?: string) =>
    api.post<GeneratedScheduleResponse>(`/seasons/${seasonId}/generate-schedule/`, config, token),

  /**
   * Validate and save the schedule
   */
  saveSchedule: (seasonId: number, data: SaveScheduleRequest, token?: string) =>
    api.post<{ success: boolean; matches_created: number }>(`/seasons/${seasonId}/save-schedule/`, data, token),

  /**
   * Update a venue
   */
  updateVenue: (venueId: number, data: Partial<Venue>, token?: string) =>
    api.patch<Venue>(`/venues/${venueId}/`, data, token),

  /**
   * Create a new venue for a league
   */
  createVenue: (data: { league: number; name: string; address?: string; table_count: number }, token?: string) =>
    api.post<Venue>('/venues/', data, token),
};
