/**
 * Authentication-related API calls
 */

import { api } from './client';
import { Player } from './types';

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

export const authApi = {
  /**
   * Register a new user
   */
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register/', data),

  /**
   * Login with email and password
   */
  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login/', data),

  /**
   * Logout and blacklist refresh token
   */
  logout: (refreshToken: string, accessToken: string) =>
    api.post('/auth/logout/', { refresh: refreshToken }, accessToken),

  /**
   * Refresh access token using refresh token
   * IMPORTANT: skipRefresh prevents infinite loop if refresh token is also expired
   */
  refreshToken: (refreshToken: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh: refreshToken }, undefined, true),

  /**
   * Validate password reset token before showing form
   */
  validatePasswordReset: (data: PasswordResetValidateRequest) =>
    api.post<PasswordResetValidateResponse>('/auth/password-reset/validate/', data),

  /**
   * Confirm password reset and set new password
   */
  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post<PasswordResetConfirmResponse>('/auth/password-reset/confirm/', data),
};
