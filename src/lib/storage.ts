import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper over expo-secure-store for sensitive values (auth tokens).
 * SecureStore keys must match [A-Za-z0-9._-], so we keep them simple.
 */
export const StorageKeys = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

export async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
