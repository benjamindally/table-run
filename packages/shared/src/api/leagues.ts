/**
 * League-related API calls
 */

import { api } from "./client";
import { League, PaginatedResponse, ScoringConfig, ScoringPreset } from "../types";

export const leaguesApi = {
  /**
   * Get all leagues (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<League>>("/leagues/", token),

  /**
   * Get leagues where the current user is an operator
   */
  getMyLeagues: (token?: string) =>
    api.get<PaginatedResponse<League>>("/league-operators/my_leagues/", token),

  /**
   * Get a single league by ID
   */
  getById: (id: number, token?: string) =>
    api.get<League>(`/leagues/${id}/`, token),

  /**
   * Create a new league
   */
  create: (data: Partial<League>, token?: string) =>
    api.post<League>("/leagues/", data, token),

  /**
   * Update a league
   */
  update: (id: number, data: Partial<League>, token?: string) =>
    api.patch<League>(`/leagues/${id}/`, data, token),

  /**
   * Delete a league
   */
  delete: (id: number, token?: string) =>
    api.delete(`/leagues/${id}/`, token),

  /**
   * Get scoring config for a league
   */
  getScoringConfig: (id: number, token?: string) =>
    api.get<ScoringConfig>(`/leagues/${id}/scoring-config/`, token),

  /**
   * Apply a scoring preset to a league
   */
  applyScoringPreset: (id: number, preset: ScoringPreset, token?: string) =>
    api.post<ScoringConfig>(`/leagues/${id}/scoring-config/apply-preset/`, { preset }, token),

  /**
   * Partially update a league's scoring config (for custom tweaks)
   */
  updateScoringConfig: (id: number, data: Partial<ScoringConfig>, token?: string) =>
    api.patch<ScoringConfig>(`/leagues/${id}/scoring-config/`, data, token),
};
