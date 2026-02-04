/**
 * Re-export websocket types from @league-genius/shared
 */
export type {
  TeamSide,
  PlayerAssignmentMessage,
  ScoreUpdateMessage,
  GameUpdateMessage,
  LineupSubmittedMessage,
  MatchStartMessage,
  ScorecardSubmittedMessage,
  ScorecardConfirmedMessage,
  OutgoingMessage,
  PlayerAssignmentBroadcast,
  ScoreUpdateBroadcast,
  GameUpdateBroadcast,
  ScorecardSubmittedBroadcast,
  MatchFinalizedBroadcast,
  CaptainPresenceBroadcast,
  LineupSubmittedBroadcast,
  MatchStartedBroadcast,
  MatchStateGame,
  MatchStateBroadcast,
  LineupSubmittedEcho,
  MatchStartEcho,
  IncomingMessage,
  ConnectionStatus,
  CaptainPresence,
} from '@league-genius/shared';
