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

export type OutgoingMessage =
  | PlayerAssignmentMessage
  | ScoreUpdateMessage
  | GameUpdateMessage;

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

export type IncomingMessage =
  | PlayerAssignmentBroadcast
  | ScoreUpdateBroadcast
  | GameUpdateBroadcast
  | ScorecardSubmittedBroadcast
  | MatchFinalizedBroadcast;

// WebSocket connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Captain presence
export interface CaptainPresence {
  home: boolean;
  away: boolean;
}
