import '../global.css';
// Defines the background task Android wakes for new-job alerts; must load before render.
import '@/lib/incoming-job-task';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RiderSplash } from '@/components/splash/rider-splash';
import { Toast } from '@/components/ui/toast';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { useAuthStore } from '@/lib/auth-store';
import { setupNotificationHandler, syncPushToken } from '@/lib/notifications';
import { usePreferencesStore } from '@/lib/preferences-store';
import { queryClient } from '@/lib/query-client';

// Keep the native splash up until the session is restored.
// Hold the native launch screen until we know whether the user is signed in.
// After a reload it's already gone, so neither call has anything to act on.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const pushEnabled = usePreferencesStore((state) => state.pushEnabled);
  const [splashDone, setSplashDone] = useState(false);
  // Stable, so the splash's animation effect doesn't restart when this layout re-renders.
  const finishSplash = useCallback(() => setSplashDone(true), []);

  useNotificationObserver();

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
      SplashScreen.hideAsync().catch(() => undefined);
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
          <Toast />
          {/* Covers the app in the same night colour as the native splash, then plays the launch animation. */}
          {splashDone ? null : <RiderSplash start={status !== 'loading'} onDone={finishSplash} />}
          <StatusBar style={splashDone ? 'auto' : 'light'} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
