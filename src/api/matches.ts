/**
 * Match-related API calls
 */

import { api } from './client';
import { Match, PaginatedResponse, MatchScoreSubmission, MatchLineupResponse } from './types';

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

  /**
   * Submit team lineup (captain only)
   * Away team submits first (creates games), home team submits second (updates games)
   */
  submitLineup: (
    matchId: number,
    data: {
      games: Array<{ game_number: number; player_id: number }>;
      team_side?: 'home' | 'away'; // Only needed if captain of both teams
    },
    token?: string
  ) => api.post<Match>(`/matches/${matchId}/submit-lineup/`, data, token),

  /**
   * Start the match (home captain only)
   */
  startMatch: (matchId: number, token?: string) =>
    api.post<Match>(`/matches/${matchId}/start-match/`, {}, token),

  /**
   * Get lineup data for a match (captains and league operators)
   * Used by home team to see away lineup before setting their own
   */
  getLineup: (matchId: number, token?: string) =>
    api.get<MatchLineupResponse>(`/matches/${matchId}/lineup/`, token),
};
