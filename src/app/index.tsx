import { Redirect } from 'expo-router';

import { useAuthStore } from '@/lib/auth-store';

/**
 * The app's entry point. There's no separate welcome screen: after the
 * launch animation, signed-out users land straight on sign-in, and signed-in
 * users on their home screen.
 */
export default function EntryScreen() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);

  if (status === 'loading') return null;
  if (status === 'authenticated') {
    return <Redirect href={role === 'COURIER' ? '/rider' : '/home'} />;
  }
  return <Redirect href="/sign-in" />;
}
