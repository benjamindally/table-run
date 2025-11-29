/**
 * Base API client configuration and utilities
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * Base fetch wrapper with common configuration
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `API Error: ${response.status}`);
  }

  // Return parsed JSON
  return response.json();
}

/**
 * HTTP method helpers
 */
export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, data: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  put: <T>(endpoint: string, data: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  patch: <T>(endpoint: string, data: any, token?: string) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token }),
};
