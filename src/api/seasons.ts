/**
 * Season-related API calls
 */

import { api } from './client';
import { Season, PaginatedResponse, SeasonParticipation, Match } from './types';

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
   * Get all team participations in a season (returns SeasonParticipation objects with team details)
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
};

export interface SeasonStandingsResponse {
  league_id: number;
  league_name: string;
  season_id: number;
  season_name: string;
  standings: TeamStanding[];
}

export interface TeamStanding {
  place: number;
  team_id: number;
  team_name: string;
  establishment: string;
  wins: number;
  losses: number;
  total_games: number;
  win_percentage: number;
  games_behind: number;
}
