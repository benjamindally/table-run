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

export type ScoringPreset = 'simple_win_loss' | 'bca_8ball' | 'vnea' | 'nine_ball' | 'race_to_wins' | 'custom';
export type GameFormat = 'win_loss' | 'ball_points_8ball' | 'ball_points_9ball' | 'race_to_wins';
export type StandingsFormat = 'win_loss_pct' | 'match_points' | 'cumulative_points';

export interface ScoringConfig {
  id: number;
  preset: ScoringPreset;
  game_format: GameFormat;
  ball_value: number;
  object_ball_value: number;
  race_to: number | null;
  players_per_team: number;
  games_per_round: number;
  standings_format: StandingsFormat;
  allow_ties: boolean;
  match_win_points: number;
  match_tie_points: number;
  match_loss_points: number;
  max_points_per_game: number | null;
  created_at: string;
  updated_at: string;
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
  scoring_config?: ScoringConfig;
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

export interface ScheduleBye {
  id: number;
  week_number: number;
  date: string;
  team: number;
  team_name?: string;
}

export interface SeasonMatchesResponse {
  matches: Match[];
  byes: ScheduleBye[];
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
  id?: number;
  game_number: number;
  set_number: number;
  away_player: { id: number; full_name: string } | null;
  home_player: { id: number; full_name: string } | null;
  winner?: 'home' | 'away' | null;
  home_table_run?: boolean;
  away_table_run?: boolean;
  home_8ball_break?: boolean;
  away_8ball_break?: boolean;
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

/**
 * Scheduling Types
 */

// Venue model from backend
export interface Venue {
  id: number;
  league: number;
  league_name?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  table_count: number;
  is_active?: boolean;
  created_at?: string;
}

// Schedule configuration for generation
export interface ScheduleConfiguration {
  start_date: string;
  break_weeks?: number[];           // Holiday/break weeks (no matches for anyone)
  bye_weeks?: number[];             // Weeks with reduced matches (some teams have byes)
  alternating_home_away: boolean;   // Whether to alternate home/away for teams
  times_play_each_other: number;    // 1 = single round robin, 2 = double, etc.
  tables_per_establishment?: Record<number, number>; // venue_id -> table count
  selected_venue_ids?: number[];    // Venues to use for scheduling (if not set, use all)
  selected_team_ids?: number[];     // Teams to include in scheduling (if not set, use all)
  default_match_day?: number;       // Day of week for matches: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun (default: 2)
}

// API response from generate-schedule
export interface GeneratedScheduleResponse {
  schedule: ScheduleWeek[];
  warnings: ScheduleWarning[];
  configuration: ScheduleConfiguration;
}

export interface ScheduleWeek {
  week_number: number;
  date: string;
  matches: ScheduleMatch[];
  is_break_week?: boolean;
}

export interface ScheduleMatch {
  temp_id?: string;              // For new matches (not yet saved)
  id?: number;                   // For existing matches
  home_team_id: number | null;
  home_team_name?: string;
  away_team_id: number | null;
  away_team_name?: string;
  venue_id?: number | null;
  venue_name?: string;
  date: string;
  is_bye?: boolean;
  bye_team_id?: number;         // Team with bye this week
  bye_team_name?: string;
}

export interface ScheduleWarning {
  type: 'venue_conflict' | 'season_overflow' | 'team_conflict' | 'missing_venue' | 'date_conflict';
  message: string;
  week_number?: number;
}

// Request to save schedule
export interface SaveScheduleRequest {
  schedule: ScheduleWeek[];
  configuration?: ScheduleConfiguration;
  is_manual?: boolean;
}

/**
 * Playoff Types
 */
export interface PlayoffSeed {
  id?: number;
  seed_number: number;
  team_id: number;
  team_name: string;
  team_establishment?: string;
  establishment?: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  win_percentage: number;
}

export interface PlayoffMatchup {
  id?: number;
  round_number: number;
  position: number;
  home_seed_number: number | null;
  away_seed_number: number | null;
  home_team_name?: string;
  away_team_name?: string;
  next_matchup_round: number | null;
  next_matchup_position: number | null;
  next_matchup?: number | null;
  next_matchup_id?: number | null;
  is_bye: boolean;
  scheduled_date: string;
  venue_name: string;
  // Post-save fields
  home_seed?: number | null;
  away_seed?: number | null;
  home_seed_detail?: PlayoffSeed | null;
  away_seed_detail?: PlayoffSeed | null;
  match?: number | null;
  match_detail?: Match | null;
}

export interface PlayoffRound {
  round_number: number;
  round_name: string;
  matchups: PlayoffMatchup[];
}

export interface PlayoffBracketData {
  id?: number;
  season?: number;
  bracket_type: 'main' | 'consolation';
  name: string;
  status?: string;
  team_count: number;
  bracket_size: number;
  total_rounds: number;
  byes_count: number;
  start_date?: string;
  days_between_rounds?: number;
  default_match_day?: number;
  created_at?: string;
  created_by?: number;
  seeds: PlayoffSeed[];
  rounds?: PlayoffRound[];
  matchups?: PlayoffMatchup[];
}

export interface PlayoffConfiguration {
  team_ids?: number[];
  team_count: number;
  byes_for_top_seeds: number;
  consolation: boolean;
  consolation_count: number;
  consolation_byes: number;
  start_date: string;
  days_between_rounds: number;
  default_match_day: number;
}

export interface PlayoffWarning {
  type: string;
  message: string;
}

export interface GeneratePlayoffsResponse {
  season_id: number;
  season_name: string;
  league_id: number;
  league_name: string;
  configuration: PlayoffConfiguration;
  main_bracket: PlayoffBracketData;
  consolation_bracket: PlayoffBracketData | null;
  warnings: PlayoffWarning[];
}

export interface SavePlayoffsRequest {
  main_bracket: {
    name: string;
    seeds: PlayoffSeed[];
    matchups: PlayoffMatchup[];
    start_date: string;
    days_between_rounds: number;
    default_match_day: number;
  };
  consolation_bracket: {
    name: string;
    seeds: PlayoffSeed[];
    matchups: PlayoffMatchup[];
    start_date: string;
    days_between_rounds: number;
    default_match_day: number;
  } | null;
  replace_existing: boolean;
}

export interface SavePlayoffsResponse {
  message: string;
  main_bracket_id: number;
  main_matches_created: number;
  main_matchups_created: number;
  season_id: number;
  consolation_bracket_id?: number;
  consolation_matches_created?: number;
  consolation_matchups_created?: number;
}

export interface AdvancePlayoffRequest {
  matchup_id: number;
  winner_team_id: number;
}

export interface AdvancePlayoffResponse {
  message: string;
  matchup_id: number;
  winner_team_id: number;
  next_matchup_id: number | null;
  next_match_created: boolean;
}

/**
 * Authentication Types
 */
export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  player: Player;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PasswordResetValidateRequest {
  uid: string;
  token: string;
}

export interface PasswordResetValidateResponse {
  valid: boolean;
  email: string;
}

export interface PasswordResetConfirmRequest {
  uid: string;
  token: string;
  password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

/**
 * Me API Types
 */
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
  is_favorite?: boolean;  // Optional until backend supports it
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

export interface MeMatch {
  id: number;
  date: string;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  season_id: number;
  season_name: string;
  league_name: string;
  venue_name: string | null;
  status: 'scheduled' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';
}

export interface MeBye {
  id: number;
  date: string;
  week_number: number;
  team_id: number;
  team_name: string;
  season_id: number;
  season_name: string;
}

export interface MeResponse {
  player: MePlayer | null;
  teams: MeTeam[];
  seasons: MeSeason[];
  leagues: MeLeague[];
  upcoming_matches: MeMatch[];
  upcoming_byes: MeBye[];
}

/**
 * Player Claims Types
 */
export interface UnclaimedPlayer {
  id: number;
  user: null;
  full_name: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_claimed: boolean;
  needs_activation: boolean;
  invite_token: string | null;
  invite_sent_at: string | null;
}

export interface PlayerSearchResult {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  leagues: Array<{
    league_id: number;
    league_name: string;
    season_id: number;
    season_name: string;
  }>;
}

export interface PlayerSearchResponse {
  count: number;
  results: PlayerSearchResult[];
}

export interface PlayerNeedingActivation {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  full_name: string;
  is_claimed: boolean;
  needs_activation: boolean;
  invite_token: string | null;
  invite_sent_at: string | null;
}

export interface SendInviteResponse {
  reset_link: string;
  player_id: number;
  player_name: string;
  email: string;
  email_sent: boolean;
  expires_in: string;
  message: string;
}

export interface BulkInvitePlayer {
  player_id: number;
  player_name: string;
  email: string;
  reset_link: string;
  email_sent: boolean;
}

export interface BulkInviteResponse {
  message: string;
  count: number;
  sent_count: number;
  failed_count: number;
  expires_in: string;
  players: BulkInvitePlayer[];
}

export interface SendActivationResponse {
  invite_token: string;
  activation_url: string;
  player_id: number;
  player_name: string;
  current_email: string;
  invite_sent_at: string;
}

export interface ValidateInviteResponse {
  player_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ValidateActivationResponse {
  player_id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  current_email: string;
  phone: string;
}

export interface ClaimedPlayer {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  full_name: string;
  is_claimed: boolean;
  needs_activation: boolean;
}

export interface PlayerClaimRequest {
  id: number;
  player: number;
  player_detail: {
    id: number;
    full_name: string;
    email_display: string;
    is_claimed: boolean;
  };
  requesting_user: number;
  requesting_user_detail: {
    id: number;
    username: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'denied';
  message: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_detail: {
    id: number;
    full_name: string;
  } | null;
}

export interface CreateClaimRequestData {
  player: number;
  message: string;
}

/**
 * Stats Types
 */
export interface LeagueStats {
  active_teams: number;
  active_players: number;
  venues: number;
  matches_played: number;
}

/**
 * Season Standings Types
 */
export interface SeasonStandingsResponse {
  league_id: number;
  league_name: string;
  season_id: number;
  season_name: string;
  standings: TeamStanding[];
}

export interface TeamStanding {
  place: number;
  team_id: number;
  team_name: string;
  establishment: string;
  wins: number;
  losses: number;
  total_games: number;
  win_percentage: number;
  games_behind: number;
}

export interface SeasonPlayersResponse {
  league_id: number;
  league_name: string;
  season_id: number;
  season_name: string;
  player_count: number;
  players: PlayerSeasonStat[];
}

export interface PlayerSeasonStat {
  player_id: number;
  player_name: string;
  team_id: number;
  team_name: string;
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_percentage: number;
  table_runs: number;
  eight_ball_breaks: number;
  weeks: PlayerWeekStat[];
}

export interface PlayerWeekStat {
  week: number;
  wins: number;
  losses: number;
}

/**
 * Team Stats Types
 */
export interface TeamSeasonStats {
  team_id: number;
  team_name: string;
  season_id: number;
  season_name: string;
  players: TeamPlayerSeasonStats[];
}

export interface TeamPlayerSeasonStats {
  player_id: number;
  player_name: string;
  total_wins: number;
  total_losses: number;
  table_runs: number;
  eight_ball_breaks: number;
  weeks: TeamPlayerWeekStats[];
}

export interface TeamPlayerWeekStats {
  week: number;
  wins: number;
  losses: number;
}

/**
 * Notification Types
 */
export interface Announcement {
  id: number;
  league: number;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: number;
  created_at: string;
}

export interface CreateAnnouncementData {
  league: number;
  season?: number | null;
  team?: number | null;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface Notification {
  id: number;
  recipient: number;
  actor: number | null;
  verb: string;
  description: string;
  target_content_type: number | null;
  target_object_id: string | null;
  action_object_content_type: number | null;
  action_object_id: string | null;
  timestamp: string;
  unread: boolean;
  deleted: boolean;
  public: boolean;
  data: unknown;
}

export interface UnreadCount {
  unread_count: number;
}

// Re-export websocket types
export * from './websocket';
