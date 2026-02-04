/**
 * Base API client configuration and utilities
 * Platform-agnostic - works in web and React Native
 */

// Configuration that must be set before using the API
let apiBaseUrl: string = '';

export function configureApi(config: { baseUrl: string }) {
  apiBaseUrl = config.baseUrl;
}

export function getApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new Error('API not configured. Call configureApi({ baseUrl }) first.');
  }
  return apiBaseUrl;
}

interface RequestOptions extends RequestInit {
  token?: string;
  skipRefresh?: boolean;
}

// Global reference to refresh token function (set by auth provider)
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
  const baseUrl = getApiBaseUrl();
  const { token, skipRefresh, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && !skipRefresh && refreshTokenCallback) {
    try {
      const newToken = await refreshTokenCallback();

      if (newToken) {
        return apiRequest<T>(endpoint, {
          ...options,
          token: newToken,
          skipRefresh: true,
        });
      }
    } catch (refreshError) {
      console.error('Token refresh failed during API request:', refreshError);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || `API Error: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

/**
 * HTTP method helpers
 */
export const api = {
  get: <T>(endpoint: string, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, { method: 'GET', token, skipRefresh }),

  post: <T>(endpoint: string, data: unknown, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  put: <T>(endpoint: string, data: unknown, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  patch: <T>(endpoint: string, data: unknown, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      skipRefresh,
    }),

  delete: <T>(endpoint: string, token?: string, skipRefresh?: boolean) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token, skipRefresh }),
};
