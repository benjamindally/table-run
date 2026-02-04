/**
 * Notifications and Announcements API
 */

import { api } from './client';
import type {
  PaginatedResponse,
  NotificationsPaginatedResponse,
  Announcement,
  CreateAnnouncementData,
  Notification,
  UnreadCount,
} from '../types';

// Announcements API
export const announcementsApi = {
  /**
   * Get all announcements for user's leagues (paginated)
   */
  getAll: (token?: string) =>
    api.get<PaginatedResponse<Announcement>>('/announcements/', token),

  /**
   * Get a single announcement by ID
   */
  getById: (id: number, token?: string) =>
    api.get<Announcement>(`/announcements/${id}/`, token),

  /**
   * Create a new announcement (operators only)
   */
  create: (data: CreateAnnouncementData, token?: string) =>
    api.post<Announcement>('/announcements/', data, token),

  /**
   * Update an announcement
   */
  update: (id: number, data: Partial<CreateAnnouncementData>, token?: string) =>
    api.patch<Announcement>(`/announcements/${id}/`, data, token),

  /**
   * Delete an announcement
   */
  delete: (id: number, token?: string) =>
    api.delete(`/announcements/${id}/`, token),
};

// Notifications API
export const notificationsApi = {
  /**
   * Get all notifications for the current user (paginated)
   */
  getAll: (token?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString();
    return api.get<NotificationsPaginatedResponse<Notification>>(
      `/notifications/${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: (token?: string) =>
    api.get<UnreadCount>('/notifications/unread_count/', token),

  /**
   * Mark a notification as read
   */
  markAsRead: (id: number, token?: string) =>
    api.post(`/notifications/${id}/mark_as_read/`, {}, token),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: (token?: string) =>
    api.post('/notifications/mark_all_as_read/', {}, token),

  /**
   * Delete a notification
   */
  delete: (id: number, token?: string) =>
    api.delete(`/notifications/${id}/`, token),
};
