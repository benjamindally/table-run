/**
 * Player-related API calls
 */

import { api } from './client';
import { Player, PaginatedResponse, CaptainRequest, Team } from './types';

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
   * Update a player profile
   */
  update: (id: number, data: Partial<Player>, token?: string) =>
    api.patch<Player>(`/players/${id}/`, data, token),
};
