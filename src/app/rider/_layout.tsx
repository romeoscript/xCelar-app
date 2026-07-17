import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Operational rider screens — reachable only by an authenticated COURIER.
 * The application flow (the `/rider` landing, onboarding, pending, documents)
 * is intentionally left open to any signed-in user, since a user's role only
 * becomes COURIER once they apply.
 */
const COURIER_ONLY = ['home', 'deliveries', 'delivery', 'request', 'account', 'notifications'];

export default function RiderLayout() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const segments = useSegments();
  const screen = segments[1]; // the route under /rider; undefined at the index

  const stack = <Stack screenOptions={{ headerShown: false }} />;

  // Wait for session hydration before routing anywhere.
  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  // The rider entry (/rider) renders its own signed-out landing — let it through.
  if (screen === undefined) {
    return stack;
  }

  // Every other rider screen needs a signed-in user.
  if (status !== 'authenticated') {
    return <Redirect href="/rider" />;
  }

  // A plain customer can't open the courier screens by deep link.
  if (COURIER_ONLY.includes(screen) && role !== 'COURIER') {
    return <Redirect href="/rider" />;
  }

  return stack;
}
