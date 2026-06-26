import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { env } from './env';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './session-tokens';

/**
 * Shared HTTP client for the Xcelar API.
 * - Request interceptor attaches the access token.
 * - Response interceptor transparently refreshes an expired access token once
 *   and retries the original request; a failed refresh ends the session.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// Endpoints whose own 401 means "bad credentials", not "expired token", so we
// must not try to refresh-and-retry them (and refreshing /refresh would loop).
const NON_REFRESHABLE_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

let onAuthFailure: (() => void) | null = null;

/** Let the auth store react when a background refresh fails. */
export function setOnAuthFailure(handler: () => void): void {
  onAuthFailure = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    // Bare axios call so this request skips the interceptors above.
    const { data } = await axios.post(`${env.apiBaseUrl}/auth/refresh`, { refreshToken });
    await saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await clearTokens();
    onAuthFailure?.();
    return null;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isExpired = error.response?.status === 401;
    const isRefreshable =
      original && !NON_REFRESHABLE_PATHS.some((path) => original.url?.includes(path));

    if (isExpired && isRefreshable && original && !original._retry) {
      original._retry = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);
