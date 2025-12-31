/**
 * Base API client configuration and utilities
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  token?: string;
  skipRefresh?: boolean; // Flag to prevent infinite refresh loops
}

// Global reference to refresh token function (set by AuthContext)
let refreshTokenCallback: (() => Promise<string | null>) | null = null;

export function setRefreshTokenCallback(callback: () => Promise<string | null>) {
  refreshTokenCallback = callback;
}

/**
 * Base fetch wrapper with common configuration
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipRefresh, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with any additional headers from fetchOptions
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && !skipRefresh && refreshTokenCallback) {
    try {
      const newToken = await refreshTokenCallback();

      if (newToken) {
        // Retry the request with the new token
        return apiRequest<T>(endpoint, {
          ...options,
          token: newToken,
          skipRefresh: true // Prevent infinite loop
        });
      }
    } catch (refreshError) {
      console.error('Token refresh failed during API request:', refreshError);
      // Fall through to throw the original 401 error
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `API Error: ${response.status}`);
  }

  // Handle empty responses (e.g., 204 No Content from DELETE requests)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  // Return parsed JSON
  return response.json();
}

/**
 * HTTP method helpers
 */
export const api = {
  get: <T>(endpoint: string, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, { method: 'GET', token, skipRefresh }),

  post: <T>(endpoint: string, data: any, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  put: <T>(endpoint: string, data: any, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  patch: <T>(endpoint: string, data: any, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  delete: <T>(endpoint: string, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token, skipRefresh }),
};
