/**
 * WebSocket message types for real-time match scoring
 */

export type TeamSide = 'home' | 'away';

// Outgoing message types (client → server)
export interface PlayerAssignmentMessage {
  type: 'player_assignment';
  game_id: number;
  player_id: number;
  team_side: TeamSide;
}

export interface ScoreUpdateMessage {
  type: 'score_update';
  home_score: number;
  away_score: number;
}

export interface GameUpdateMessage {
  type: 'game_update';
  game_id: number;
  game_data: {
    winner?: TeamSide | null;
    home_table_run?: boolean;
    away_table_run?: boolean;
    home_8ball_break?: boolean;
    away_8ball_break?: boolean;
  };
}

export interface LineupSubmittedMessage {
  type: 'lineup_submitted';
  team_side: TeamSide;
}

export interface MatchStartMessage {
  type: 'match_start';
}

export interface ScorecardSubmittedMessage {
  type: 'scorecard_submitted';
  submitted_by: TeamSide;
  home_score: number;
  away_score: number;
}

export interface ScorecardConfirmedMessage {
  type: 'scorecard_confirmed';
  home_score: number;
  away_score: number;
}

export type OutgoingMessage =
  | PlayerAssignmentMessage
  | ScoreUpdateMessage
  | GameUpdateMessage
  | LineupSubmittedMessage
  | MatchStartMessage
  | ScorecardSubmittedMessage
  | ScorecardConfirmedMessage;

// Incoming message types (server → client)
export interface PlayerAssignmentBroadcast {
  type: 'player_assignment';
  game_id: number;
  player_id: number;
  team_side: TeamSide;
}

export interface ScoreUpdateBroadcast {
  type: 'score_update';
  home_score: number;
  away_score: number;
}

export interface GameUpdateBroadcast {
  type: 'game_update';
  game_id: number;
  game_data: {
    winner?: TeamSide | null;
    home_table_run?: boolean;
    away_table_run?: boolean;
    home_8ball_break?: boolean;
    away_8ball_break?: boolean;
  };
}

export interface ScorecardSubmittedBroadcast {
  type: 'scorecard_submitted';
  submitted_by: TeamSide;
  home_score: number;
  away_score: number;
}

export interface MatchFinalizedBroadcast {
  type: 'match_finalized';
  success: boolean;
  home_score: number;
  away_score: number;
}

// Lineup workflow broadcasts
export interface CaptainPresenceBroadcast {
  type: 'captain_presence';
  home_captain_present: boolean;
  away_captain_present: boolean;
}

export interface LineupSubmittedBroadcast {
  type: 'away_lineup_submitted' | 'home_lineup_submitted';
  team_side: TeamSide;
}

export interface MatchStartedBroadcast {
  type: 'match_started';
}

// Match state sent on initial connection
export interface MatchStateGame {
  id: number;
  game_number: number;
  set_number: number;
  home_player: { id: number; full_name: string } | null;
  away_player: { id: number; full_name: string } | null;
  winner: 'home' | 'away' | null;
  home_table_run: boolean;
  away_table_run: boolean;
  home_8ball_break: boolean;
  away_8ball_break: boolean;
}

export interface MatchStateBroadcast {
  type: 'match_state';
  data: {
    match_id: number;
    lineup_state: string;
    games: MatchStateGame[];
  };
  is_home_captain: boolean;
  captains_present: CaptainPresence;
}

// Echoed message types (when backend reflects outgoing messages)
export interface LineupSubmittedEcho {
  type: 'lineup_submitted';
  team_side: TeamSide;
}

export interface MatchStartEcho {
  type: 'match_start';
}

export type IncomingMessage =
  | PlayerAssignmentBroadcast
  | ScoreUpdateBroadcast
  | GameUpdateBroadcast
  | ScorecardSubmittedBroadcast
  | MatchFinalizedBroadcast
  | CaptainPresenceBroadcast
  | LineupSubmittedBroadcast
  | MatchStartedBroadcast
  | LineupSubmittedEcho
  | MatchStartEcho
  | MatchStateBroadcast;

// WebSocket connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Captain presence
export interface CaptainPresence {
  home: boolean;
  away: boolean;
}
