/**
 * Team-related API calls
 */

import { api } from "./client";
import {
  Team,
  PaginatedResponse,
  TeamRegistrationData,
  TeamMembership,
  CaptainRequest,
  SeasonParticipation,
} from "./types";

export const teamsApi = {
  /**
   * Get all teams (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<Team>>("/teams/", token),

  /**
   * Get a single team by ID
   */
  getById: (id: number, token?: string) =>
    api.get<Team>(`/teams/${id}/`, token),

  /**
   * Create a new team
   */
  create: (data: TeamRegistrationData, token?: string) =>
    api.post<Team>("/teams/", data, token),

  /**
   * Update a team
   */
  update: (id: number, data: Partial<Team>, token?: string) =>
    api.patch<Team>(`/teams/${id}/`, data, token),

  /**
   * Get team roster (active members)
   */
  getRoster: (teamId: number, token?: string) =>
    api.get<TeamMembership[]>(`/teams/${teamId}/roster/`, token),

  /**
   * Add a member to the team
   */
  addMember: (teamId: number, playerId: number, token?: string) =>
    api.post<TeamMembership>(
      `/teams/${teamId}/add_member/`,
      { player_id: playerId },
      token
    ),

  /**
   * Add a captain to the team
   */
  addCaptain: (teamId: number, playerId: number, token?: string) =>
    api.post<Team>(
      `/teams/${teamId}/add_captain/`,
      { player_id: playerId },
      token
    ),

  /**
   * Transfer captaincy to another player
   */
  transferCaptain: (teamId: number, newCaptainId: number, token?: string) =>
    api.post<Team>(
      `/teams/${teamId}/transfer_captain/`,
      { new_captain_id: newCaptainId },
      token
    ),

  /**
   * Remove a captain
   */
  removeCaptain: (teamId: number, playerId: number, token?: string) =>
    api.post<Team>(
      `/teams/${teamId}/remove_captain/`,
      { player_id: playerId },
      token
    ),

  /**
   * Get pending captain requests for a team
   */
  getCaptainRequests: (teamId: number, token?: string) =>
    api.get<CaptainRequest[]>(`/teams/${teamId}/captain_requests/`, token),

  /**
   * Get team season statistics (player-by-player breakdown)
   */
  getSeasonStats: (teamId: number, seasonId: number, token?: string) =>
    api.get<TeamSeasonStats>(`/teams/${teamId}/season_stats/?season_id=${seasonId}`, token),

  /**
   * Get all season participations for a team
   */
  getSeasons: (teamId: number, token?: string) =>
    api.get<SeasonParticipation[]>(`/teams/${teamId}/seasons/`, token),
};

export interface TeamSeasonStats {
  team_id: number;
  team_name: string;
  season_id: number;
  season_name: string;
  players: PlayerSeasonStats[];
}

export interface PlayerSeasonStats {
  player_id: number;
  player_name: string;
  total_wins: number;
  total_losses: number;
  table_runs: number;
  eight_ball_breaks: number;
  weeks: PlayerWeekStats[];
}

export interface PlayerWeekStats {
  week: number;
  wins: number;
  losses: number;
}
