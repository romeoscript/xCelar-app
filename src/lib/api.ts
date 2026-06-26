import axios from 'axios';

import { env } from './env';
import { StorageKeys, getItem } from './storage';

/**
 * Shared HTTP client. Points at the Django REST API.
 * The request interceptor attaches the bearer token when present.
 * JWT refresh / 401 retry will be added with the auth flow (Phase 1.3).
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getItem(StorageKeys.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
