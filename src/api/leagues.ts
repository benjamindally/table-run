/**
 * League-related API calls
 */

import { api } from './client';
import { League, PaginatedResponse } from './types';

export const leaguesApi = {
  /**
   * Get all leagues (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<League>>('/leagues/', token),

  /**
   * Get a single league by ID
   */
  getById: (id: number, token?: string) =>
    api.get<League>(`/leagues/${id}/`, token),

  /**
   * Create a new league
   */
  create: (data: Partial<League>, token?: string) =>
    api.post<League>('/leagues/', data, token),

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
};
