/**
 * User context API - fetches comprehensive user data in one call
 */

import { api } from './client';

export interface MeTeam {
  id: number;
  name: string;
  establishment: string;
  is_captain: boolean;
  active: boolean;
}

export interface MeSeason {
  id: number;
  name: string;
  league_id: number;
  league_name: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface MeLeague {
  id: number;
  name: string;
  city: string;
  state: string;
  is_operator: boolean;
  role: string | null;
}

export interface MePlayer {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skill_level: number | null;
}

export interface MeResponse {
  player: MePlayer | null;
  teams: MeTeam[];
  seasons: MeSeason[];
  leagues: MeLeague[];
}

export const meApi = {
  /**
   * Get comprehensive user context - player, teams, seasons, and leagues
   */
  getMe: (token?: string) =>
    api.get<MeResponse>('/me/', token),
};
