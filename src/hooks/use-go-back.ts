import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useAuthStore } from '@/lib/auth-store';

/**
 * Back that always goes somewhere. `router.back()` silently does nothing when
 * there's no history — a screen opened from a notification or link, or after a
 * sign-in replaced the stack — so fall back to the user's home instead.
 */
export function useGoBack(): (fallback?: Href) => void {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);

  return useCallback(
    (fallback?: Href) => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      const home: Href = status !== 'authenticated' ? '/sign-in' : role === 'COURIER' ? '/rider/home' : '/home';
      router.replace(fallback ?? home);
    },
    [role, router, status],
  );
}
