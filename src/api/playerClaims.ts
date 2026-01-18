/**
 * Player Invite & Claim System API calls
 * Handles three flows:
 * 1. Invite Flow - Captain sends invite to unclaimed player
 * 2. Self-Claim Flow - Player requests to claim existing record
 * 3. Activation Flow - Player activates placeholder account
 */

import { api } from "./client";

/**
 * Types
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
  // TODO: Add league and season info from backend
  // leagues?: Array<{ id: number; name: string; season_name: string }>;
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
  status: "pending" | "approved" | "denied";
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
 * API Methods
 */

export const playerClaimsApi = {
  // ===== Player List Endpoints =====

  /**
   * Get list of unclaimed players (no user account)
   */
  getUnclaimedPlayers: (teamId?: number) => {
    const endpoint = teamId
      ? `/players/unclaimed/?team_id=${teamId}`
      : "/players/unclaimed/";
    return api.get<UnclaimedPlayer[]>(endpoint);
  },

  /**
   * Search for players by name (server-side search)
   * @param query - Search query (min 2 chars, max 50 chars)
   * @param limit - Max results (default 50, max 100)
   * @param token - Optional auth token for authenticated search
   */
  searchPlayers: (query: string, limit: number = 50, token?: string) => {
    const endpoint = `/players/search/?q=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    console.log("searchPlayers", query);
    return api.get<PlayerSearchResponse>(endpoint, token);
  },

  /**
   * Get list of players needing activation (placeholder email)
   */
  getPlayersNeedingActivation: (teamId?: number) => {
    const endpoint = teamId
      ? `/players/needs-activation/?team_id=${teamId}`
      : "/players/needs-activation/";
    return api.get<PlayerNeedingActivation[]>(endpoint);
  },

  // ===== Invite Flow Endpoints =====

  /**
   * Send invite to an unclaimed player (Captain/Operator only)
   */
  sendInvite: (playerId: number, token: string) =>
    api.post<SendInviteResponse>(
      `/players/${playerId}/send-invite/`,
      {},
      token
    ),

  /**
   * Send invites to all unclaimed players (Operator only)
   * Backend will only send to players where is_claimed = false
   * @param sendEmail - Whether to send via email (default true)
   */
  sendBulkInvites: (token: string, sendEmail: boolean = true) =>
    api.post<BulkInviteResponse>(
      "/players/send-bulk-invites/",
      { send_email: sendEmail },
      token
    ),

  /**
   * Validate invite token and get player info (Public)
   */
  validateInviteToken: (inviteToken: string) =>
    api.post<ValidateInviteResponse>("/players/claim-with-token/", {
      invite_token: inviteToken,
    }),

  /**
   * Complete claim after user registration (Public)
   */
  completeClaim: (inviteToken: string, userId: number) =>
    api.post<ClaimedPlayer>("/players/complete-claim/", {
      invite_token: inviteToken,
      user_id: userId,
    }),

  // ===== Self-Claim Flow Endpoints =====

  /**
   * Create a claim request for an unclaimed player (Authenticated)
   */
  createClaimRequest: (data: CreateClaimRequestData, token: string) =>
    api.post<PlayerClaimRequest>("/player-claim-requests/", data, token),

  /**
   * Get current user's claim requests (Authenticated)
   */
  getMyClaimRequests: (token: string) =>
    api.get<PlayerClaimRequest[]>("/player-claim-requests/my-requests/", token),

  /**
   * Get pending claim requests for review (Captain/Operator only)
   */
  getPendingReviews: (token: string) =>
    api.get<PlayerClaimRequest[]>(
      "/player-claim-requests/pending-reviews/",
      token
    ),

  /**
   * Approve a claim request (Captain/Operator only)
   */
  approveClaimRequest: (requestId: number, token: string) =>
    api.post<PlayerClaimRequest>(
      `/player-claim-requests/${requestId}/approve/`,
      {},
      token
    ),

  /**
   * Deny a claim request (Captain/Operator only)
   */
  denyClaimRequest: (requestId: number, token: string) =>
    api.post<PlayerClaimRequest>(
      `/player-claim-requests/${requestId}/deny/`,
      {},
      token
    ),

  // ===== Activation Flow Endpoints =====

  /**
   * Send activation link to player with placeholder account (Captain/Operator only)
   */
  sendActivation: (playerId: number, token: string) =>
    api.post<SendActivationResponse>(
      `/players/${playerId}/send-activation/`,
      {},
      token
    ),

  /**
   * Validate activation token and get player/user info (Public)
   */
  validateActivationToken: (inviteToken: string) =>
    api.post<ValidateActivationResponse>("/players/activate-with-token/", {
      invite_token: inviteToken,
    }),

  /**
   * Complete activation with new email and password (Public)
   */
  completeActivation: (inviteToken: string, email: string, password: string) =>
    api.post<ClaimedPlayer>("/players/complete-activation/", {
      invite_token: inviteToken,
      email,
      password,
    }),
};
