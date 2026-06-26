import { StorageKeys, getItem, removeItem, setItem } from './storage';

/**
 * Read/write the auth token pair in SecureStore. Centralised here so the API
 * client and the auth store agree on where tokens live.
 */
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setItem(StorageKeys.accessToken, accessToken);
  await setItem(StorageKeys.refreshToken, refreshToken);
}

export function getAccessToken(): Promise<string | null> {
  return getItem(StorageKeys.accessToken);
}

export function getRefreshToken(): Promise<string | null> {
  return getItem(StorageKeys.refreshToken);
}

export async function clearTokens(): Promise<void> {
  await removeItem(StorageKeys.accessToken);
  await removeItem(StorageKeys.refreshToken);
}
