/**
 * Player-related API calls
 */

import { api } from './client';
import { Player, PaginatedResponse, CaptainRequest, Team, PlayerUpdateData } from '../types';

export const playersApi = {
  /**
   * Get all players (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<Player>>('/players/', token),

  /**
   * Get a single player by ID
   */
  getById: (id: number, token?: string) =>
    api.get<Player>(`/players/${id}/`, token),

  /**
   * Get the current logged-in user's player profile
   */
  getCurrentUser: (token?: string) =>
    api.get<Player>('/players/current_user/', token),

  /**
   * Get all teams the current user is on
   */
  getCurrentTeams: (token?: string) =>
    api.get<Team[]>('/players/current_teams/', token),

  /**
   * Get all captain requests made by the current user
   */
  getCurrentUserCaptainRequests: (token?: string) =>
    api.get<CaptainRequest[]>('/players/current_user_captain_requests/', token),

  /**
   * Get teams for a specific player by ID
   */
  getPlayerTeams: (playerId: number, token?: string) =>
    api.get<Team[]>(`/players/${playerId}/teams/`, token),

  /**
   * Create a new player profile
   */
  create: (data: Partial<Player>, token?: string) =>
    api.post<Player>('/players/', data, token),

  /**
   * Update a player profile (including nested user fields)
   */
  update: (id: number, data: PlayerUpdateData, token?: string) =>
    api.patch<Player>(`/players/${id}/`, data, token),

  /**
   * Get all season statistics for a player
   */
  getSeasonStats: (playerId: number, token?: string) =>
    api.get<PlayerSeasonStatsResponse>(`/players/${playerId}/season-stats/`, token),

  /**
   * Update player season statistics (wins, losses, table runs and 8-ball breaks)
   */
  updateSeasonStats: (
    playerId: number,
    statsId: number,
    data: { total_wins?: number; total_losses?: number; table_runs?: number; eight_ball_breaks?: number },
    token?: string
  ) =>
    api.patch(`/players/${playerId}/update-season-stats/${statsId}/`, data, token),

  /**
   * Update player weekly statistics
   */
  updateWeekStats: (
    playerId: number,
    statsId: number,
    weekNumber: number,
    data: { wins?: number; losses?: number },
    token?: string
  ) =>
    api.patch(`/players/${playerId}/update-week-stats/${statsId}/${weekNumber}/`, data, token),
};

export interface PlayerSeasonStatsResponse {
  player_id: number;
  player_name: string;
  career_totals: {
    total_wins: number;
    total_losses: number;
    total_games: number;
    win_percentage: number;
    table_runs: number;
    eight_ball_breaks: number;
    seasons_played: number;
  };
  seasons: PlayerSeasonStatDetail[];
}

export interface PlayerSeasonStatDetail {
  id: number;
  season_id: number;
  season_name: string;
  league_id: number;
  league_name: string;
  team_id: number;
  team_name: string;
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_percentage: number;
  table_runs: number;
  eight_ball_breaks: number;
  weeks: PlayerWeekStatDetail[];
}

export interface PlayerWeekStatDetail {
  week: number;
  wins: number;
  losses: number;
}
