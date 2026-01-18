/**
 * Main API module - exports all API services
 */

export { api } from './client';
export * from './types';
export { authApi } from './auth';
export type { AuthResponse, RegisterData, LoginData } from './auth';
export { playersApi } from './players';
export { teamsApi } from './teams';
export type { TeamSeasonStats, PlayerSeasonStats, PlayerWeekStats } from './teams';
export { matchesApi } from './matches';
export { seasonsApi } from './seasons';
export type { SeasonStandingsResponse, TeamStanding } from './seasons';
export { leaguesApi } from './leagues';
export { captainRequestsApi } from './captainRequests';
export { statsApi } from './stats';
export type { LeagueStats } from './stats';
export { playerClaimsApi } from './playerClaims';
export type {
  UnclaimedPlayer,
  PlayerNeedingActivation,
  PlayerClaimRequest,
  SendInviteResponse,
  SendActivationResponse,
  ValidateInviteResponse,
  ValidateActivationResponse,
  ClaimedPlayer,
  CreateClaimRequestData,
  PlayerSearchResult,
  PlayerSearchResponse,
  BulkInviteResponse,
  BulkInvitePlayer,
} from './playerClaims';
export { announcementsApi, notificationsApi } from './notifications';
export type {
  Announcement,
  CreateAnnouncementData,
  Notification,
  UnreadCount
} from './notifications';
