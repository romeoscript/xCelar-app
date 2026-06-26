import { create } from 'zustand';

import { setOnAuthFailure } from './api';
import { getMe, type AuthSession, type User } from './auth-api';
import { clearTokens, getAccessToken, saveTokens } from './session-tokens';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  user: User | null;
  status: AuthStatus;
  /** Persist tokens and mark the user signed in (after login/register). */
  startSession: (session: AuthSession) => Promise<void>;
  /** Clear tokens and mark the user signed out. */
  endSession: () => Promise<void>;
  /** Restore a session on app launch by validating the stored access token. */
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  startSession: async (session) => {
    await saveTokens(session.accessToken, session.refreshToken);
    set({ user: session.user, status: 'authenticated' });
  },

  endSession: async () => {
    await clearTokens();
    set({ user: null, status: 'unauthenticated' });
  },

  hydrate: async () => {
    const token = await getAccessToken();
    if (!token) {
      set({ user: null, status: 'unauthenticated' });
      return;
    }

    try {
      const user = await getMe();
      set({ user, status: 'authenticated' });
    } catch {
      await clearTokens();
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));

// A failed background token refresh means the session is gone — reflect it.
setOnAuthFailure(() => {
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
