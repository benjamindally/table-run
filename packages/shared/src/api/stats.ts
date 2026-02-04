/**
 * Statistics-related API calls
 */

import { api } from './client';
import type { LeagueStats } from '../types';

export const statsApi = {
  /**
   * Get league statistics
   */
  getLeagueStats: (token?: string) =>
    api.get<LeagueStats>('/stats/league/', token),
};
