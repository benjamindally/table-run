/**
 * TypeScript types matching Django backend models
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Player {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  user_id?: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  skill_level: number | null;
  is_claimed: boolean;
  needs_activation: boolean;
  invite_token: string | null;
  invite_sent_at: string | null;
  created_at: string;
  updated_at: string;
  captain_of_teams: {
    team_id: number;
    team_name: string;
    appointed_at: string;
  }[];
}

export interface PlayerList {
  id: number;
  full_name: string;
  email: string;
}

export interface League {
  id: number;
  name: string;
  description: string | null;
  city: string;
  state: string;
  country: string;
  sets_per_match: number;
  games_per_set: number;
  points_per_win: number;
  is_active: boolean;
  created_at: string;
  season_count?: number;
  total_games?: number;
}

export interface LeagueList {
  id: number;
  name: string;
  city: string;
  state: string;
  sets_per_match: number;
  games_per_set: number;
}

export interface LeagueOperator {
  id: number;
  league: number;
  league_detail?: LeagueList;
  player: number;
  player_detail?: PlayerList;
  role: string;
  appointed_at: string;
}

export interface Season {
  id: number;
  league: number;
  league_detail?: LeagueList;
  name: string;
  invite_code: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  team_count?: number;
}

export interface SeasonList {
  id: number;
  name: string;
  league_name: string;
  invite_code: string;
  is_active: boolean;
}

/**
 * Team captain relationship - tracks who is a captain of a team
 */
export interface TeamCaptain {
  id: number;
  player: number;
  player_detail?: PlayerList;
  appointed_at: string;
}

/**
 * Team - independent entity that can participate in multiple seasons
 * Captains are tracked separately via TeamCaptain relationship
 */
export interface Team {
  id: number;
  name: string;
  establishment: string;
  captains_detail?: TeamCaptain[];
  player_count?: number;
  active: boolean;
  created_at: string;
}

/**
 * Minimal team info for nested use in lists and related objects
 */
export interface TeamList {
  id: number;
  name: string;
  establishment: string;
  captains?: {
    id: number;
    name: string;
  }[];
}

/**
 * Season Participation - tracks a team's participation in a specific season
 * This is where wins/losses are stored (not on the Team model)
 * A team can participate in multiple seasons, so each season has its own record
 */
export interface SeasonParticipation {
  id: number;
  season: number;
  season_detail?: SeasonList;
  team: number;
  team_detail?: TeamList;
  wins: number;
  losses: number;
  win_percentage?: number;
  joined_at: string;
  is_active: boolean;
}

export type LineupState =
  | 'not_started'
  | 'awaiting_away_lineup'
  | 'awaiting_home_lineup'
  | 'ready_to_start'
  | 'match_live'
  | 'awaiting_confirmation'
  | 'completed';

export interface Match {
  id: number;
  season: number;
  week_number: number | null;
  home_team: number;
  home_team_detail?: TeamList;
  away_team: number;
  away_team_detail?: TeamList;
  date: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';
  lineup_state?: LineupState;
  away_lineup_submitted?: boolean;
  home_lineup_submitted?: boolean;
  match_started?: boolean;
}

export interface TeamMembership {
  id: number;
  team: number;
  team_detail?: TeamList;
  player: number;
  player_detail?: PlayerList;
  joined_at: string;
  is_active: boolean;
  left_at: string | null;
}

export interface CaptainRequest {
  id: number;
  team: number;
  team_detail?: TeamList;
  player: number;
  player_detail?: PlayerList;
  status: 'pending' | 'approved' | 'denied';
  message: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_detail?: PlayerList;
}

/**
 * API request/response types
 */

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NotificationsPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  notifications: T[];
}

export interface TeamRegistrationData {
  name: string;
  establishment: string;
  // Note: Captain will be added separately via Team.add_captain() after team creation
}

export interface MatchScoreSubmission {
  home_score: number;
  away_score: number;
}

export interface MatchLineupGame {
  game_number: number;
  set_number: number;
  away_player: { id: number; full_name: string } | null;
  home_player: { id: number; full_name: string } | null;
}

export interface MatchLineupResponse {
  away_lineup_submitted: boolean;
  home_lineup_submitted: boolean;
  match_started: boolean;
  games: MatchLineupGame[];
}

export interface PlayerUpdateData {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  skill_level?: number | null;
}
