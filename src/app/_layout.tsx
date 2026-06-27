import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/auth-store';
import { setupNotificationHandler, syncPushToken } from '@/lib/notifications';
import { usePreferencesStore } from '@/lib/preferences-store';
import { queryClient } from '@/lib/query-client';

// Keep the native splash up until the session is restored.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const pushEnabled = usePreferencesStore((state) => state.pushEnabled);

  useEffect(() => {
    void hydrate();
    void hydratePreferences();
    setupNotificationHandler();
  }, [hydrate, hydratePreferences]);

  // Hide the splash once we know whether the user is signed in. The navigator
  // is always rendered so routes keep their navigation context — auth-gated
  // screens redirect themselves based on `status`.
  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  // Keep the device's push token registered while signed in with push enabled.
  useEffect(() => {
    if (status === 'authenticated' && pushEnabled) {
      void syncPushToken();
    }
  }, [status, pushEnabled]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
