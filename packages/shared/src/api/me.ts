/**
 * User context API - fetches comprehensive user data in one call
 */

import { api } from './client';
import type { MeResponse } from '../types';

export const meApi = {
  /**
   * Get comprehensive user context - player, teams, seasons, and leagues
   */
  getMe: (token?: string) =>
    api.get<MeResponse>('/me/', token),
};
