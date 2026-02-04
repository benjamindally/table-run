/**
 * Authentication-related API calls
 */

import { api } from './client';
import type {
  AuthResponse,
  RegisterData,
  LoginData,
  PasswordResetValidateRequest,
  PasswordResetValidateResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
} from '../types';

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
