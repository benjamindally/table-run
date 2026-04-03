/**
 * User context API - fetches comprehensive user data in one call
 */

import { api } from './client';
import type { MeResponse, Entitlements } from '../types';

export const meApi = {
  /**
   * Get comprehensive user context - player, teams, seasons, and leagues
   */
  getMe: (token?: string) =>
    api.get<MeResponse>('/me/', token),

  /**
   * Get current user's subscription entitlements
   */
  getEntitlements: (token?: string) =>
    api.get<Entitlements>('/entitlements/me/', token),
};
