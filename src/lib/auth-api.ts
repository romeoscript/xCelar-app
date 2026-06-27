import { api } from './api';
import { getRefreshToken } from './session-tokens';

export type UserRole = 'USER' | 'COURIER';

export type User = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  role: UserRole;
  balanceKobo: number;
  createdAt: string;
};

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RegisterInput = {
  fullName: string;
  password: string;
  email?: string;
  phoneNumber?: string;
};

export type LoginInput = {
  /** Email or phone number — the backend resolves which. */
  identifier: string;
  password: string;
};

export async function register(input: RegisterInput): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/register', input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/login', input);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

/** Best-effort server-side revoke of the stored refresh token. */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return;
  }
  await api.post('/auth/logout', { refreshToken });
}
