/**
 * Match-related API calls
 */

import { api } from './client';
import { Match, PaginatedResponse, MatchScoreSubmission } from './types';

export const matchesApi = {
  /**
   * Get all matches (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<Match>>('/matches/', token),

  /**
   * Get a single match by ID
   */
  getById: (id: number, token?: string) =>
    api.get<Match>(`/matches/${id}/`, token),

  /**
   * Create a new match
   */
  create: (data: Partial<Match>, token?: string) =>
    api.post<Match>('/matches/', data, token),

  /**
   * Update a match
   */
  update: (id: number, data: Partial<Match>, token?: string) =>
    api.patch<Match>(`/matches/${id}/`, data, token),

  /**
   * Submit match score (team staff only)
   */
  submitScore: (matchId: number, scores: MatchScoreSubmission, token?: string) =>
    api.post<Match>(`/matches/${matchId}/submit_score/`, scores, token),

  /**
   * Submit a complete match with all game data
   */
  submitMatch: (data: any, token?: string) =>
    api.post<Match>('/matches/submit_match/', data, token),
};
