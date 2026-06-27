import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

/**
 * How foreground notifications are presented. Set once on app launch.
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ask the OS for notification permission. Returns whether it was granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Fetch an Expo push token for this device. Returns null when it can't be
 * obtained (e.g. inside Expo Go, which no longer supports remote push) so the
 * caller can degrade gracefully rather than crash.
 */
export async function getPushToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

/** Save this device's push token on the server so it can receive notifications. */
export async function registerPushToken(token: string): Promise<void> {
  await api.post('/notifications/token', { token, platform: Platform.OS });
}

export async function removePushToken(token: string): Promise<void> {
  await api.delete('/notifications/token', { data: { token } });
}

/**
 * Fetch this device's push token and register it on the server. Returns the
 * token, or null when one isn't available (e.g. Expo Go) — a safe no-op.
 */
export async function syncPushToken(): Promise<string | null> {
  const token = await getPushToken();
  if (token) {
    await registerPushToken(token);
  }
  return token;
}

