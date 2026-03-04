/**
 * Player Invite & Claim System API calls
 */

import { api } from './client';
import type {
  UnclaimedPlayer,
  PlayerSearchResponse,
  PlayerNeedingActivation,
  SendInviteResponse,
  BulkInviteResponse,
  SendActivationResponse,
  ValidateInviteResponse,
  ValidateActivationResponse,
  ClaimedPlayer,
  PlayerClaimRequest,
  CreateClaimRequestData,
} from '../types';

export const playerClaimsApi = {
  /**
   * Get list of unclaimed players (no user account)
   */
  getUnclaimedPlayers: (teamId?: number) => {
    const endpoint = teamId
      ? `/players/unclaimed/?team_id=${teamId}`
      : '/players/unclaimed/';
    return api.get<UnclaimedPlayer[]>(endpoint);
  },

  /**
   * Search for players by name (server-side search)
   */
  searchPlayers: (query: string, limit: number = 50, token?: string, leagueId?: number) => {
    let endpoint = `/players/search/?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (leagueId) endpoint += `&league_id=${leagueId}`;
    return api.get<PlayerSearchResponse>(endpoint, token);
  },

  /**
   * Get list of players needing activation (placeholder email)
   */
  getPlayersNeedingActivation: (teamId?: number, leagueId?: number) => {
    const params = new URLSearchParams();
    if (teamId) params.append('team_id', teamId.toString());
    if (leagueId) params.append('league_id', leagueId.toString());
    const qs = params.toString();
    return api.get<PlayerNeedingActivation[]>(`/players/needs-activation/${qs ? `?${qs}` : ''}`);
  },

  /**
   * Send invite to an unclaimed player (Captain/Operator only)
   */
  sendInvite: (playerId: number, token: string) =>
    api.post<SendInviteResponse>(`/players/${playerId}/send-invite/`, {}, token),

  /**
   * Send invites to all unclaimed players in a league (Operator only)
   */
  sendBulkInvites: (token: string, sendEmail: boolean = true, leagueId?: number) =>
    api.post<BulkInviteResponse>('/players/send-bulk-invites/', {
      send_email: sendEmail,
      ...(leagueId ? { league_id: leagueId } : {}),
    }, token),

  /**
   * Validate invite token and get player info (Public)
   */
  validateInviteToken: (inviteToken: string) =>
    api.post<ValidateInviteResponse>('/players/claim-with-token/', { invite_token: inviteToken }),

  /**
   * Complete claim after user registration (Public)
   */
  completeClaim: (inviteToken: string, userId: number) =>
    api.post<ClaimedPlayer>('/players/complete-claim/', { invite_token: inviteToken, user_id: userId }),

  /**
   * Create a claim request for an unclaimed player (Authenticated)
   */
  createClaimRequest: (data: CreateClaimRequestData, token: string) =>
    api.post<PlayerClaimRequest>('/player-claim-requests/', data, token),

  /**
   * Get current user's claim requests (Authenticated)
   */
  getMyClaimRequests: (token: string) =>
    api.get<PlayerClaimRequest[]>('/player-claim-requests/my-requests/', token),

  /**
   * Get pending claim requests for review (Captain/Operator only)
   */
  getPendingReviews: (token: string, leagueId?: number) => {
    const endpoint = leagueId
      ? `/player-claim-requests/pending-reviews/?league_id=${leagueId}`
      : '/player-claim-requests/pending-reviews/';
    return api.get<PlayerClaimRequest[]>(endpoint, token);
  },

  /**
   * Approve a claim request (Captain/Operator only)
   */
  approveClaimRequest: (requestId: number, token: string) =>
    api.post<PlayerClaimRequest>(`/player-claim-requests/${requestId}/approve/`, {}, token),

  /**
   * Deny a claim request (Captain/Operator only)
   */
  denyClaimRequest: (requestId: number, token: string) =>
    api.post<PlayerClaimRequest>(`/player-claim-requests/${requestId}/deny/`, {}, token),

  /**
   * Send activation link to player with placeholder account (Captain/Operator only)
   */
  sendActivation: (playerId: number, token: string) =>
    api.post<SendActivationResponse>(`/players/${playerId}/send-activation/`, {}, token),

  /**
   * Validate activation token and get player/user info (Public)
   */
  validateActivationToken: (inviteToken: string) =>
    api.post<ValidateActivationResponse>('/players/activate-with-token/', { invite_token: inviteToken }),

  /**
   * Complete activation with new email and password (Public)
   */
  completeActivation: (inviteToken: string, email: string, password: string) =>
    api.post<ClaimedPlayer>('/players/complete-activation/', { invite_token: inviteToken, email, password }),
};
