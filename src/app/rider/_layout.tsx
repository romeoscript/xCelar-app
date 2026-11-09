import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Operational rider screens are reachable only by an authenticated COURIER.
 * The `/rider` landing and activation stay open: riders are created by staff
 * and activate their account here before they ever sign in.
 */
const COURIER_ONLY = ['home', 'deliveries', 'delivery', 'account', 'notifications'];
/** Reachable signed out: a staff-created rider sets their password here. */
const PUBLIC = ['activate'];

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
  if (screen === undefined || PUBLIC.includes(screen)) {
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
