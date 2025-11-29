/**
 * Statistics-related API calls
 */

import { api } from './client';

export interface LeagueStats {
  active_teams: number;
  active_players: number;
  venues: number;
  matches_played: number;
}

export const statsApi = {
  /**
   * Get league statistics
   */
  getLeagueStats: (token?: string) =>
    api.get<LeagueStats>('/stats/league/', token),
};
