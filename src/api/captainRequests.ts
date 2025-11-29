/**
 * Captain Request-related API calls
 */

import { api } from './client';
import { CaptainRequest, PaginatedResponse } from './types';

export const captainRequestsApi = {
  /**
   * Get all captain requests (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<CaptainRequest>>('/captain-requests/', token),

  /**
   * Get a single captain request by ID
   */
  getById: (id: number, token?: string) =>
    api.get<CaptainRequest>(`/captain-requests/${id}/`, token),

  /**
   * Create a new captain request
   */
  create: (data: { team: number; player: number; message?: string }, token?: string) =>
    api.post<CaptainRequest>('/captain-requests/', data, token),

  /**
   * Approve a captain request (captain only)
   */
  approve: (requestId: number, token?: string) =>
    api.post<CaptainRequest>(`/captain-requests/${requestId}/approve/`, {}, token),

  /**
   * Deny a captain request (captain only)
   */
  deny: (requestId: number, token?: string) =>
    api.post<CaptainRequest>(`/captain-requests/${requestId}/deny/`, {}, token),
};
