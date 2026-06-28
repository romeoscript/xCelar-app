import { api } from './api';
import { getRefreshToken } from './session-tokens';

export type UserRole = 'USER' | 'COURIER';

export type Gender = 'male' | 'female' | 'prefer_not_to_say';

export type User = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  fullName: string;
  avatarUrl: string | null;
  gender: Gender | null;
  state: string | null;
  /** ISO date string (YYYY-MM-DD), or null if not set. */
  dateOfBirth: string | null;
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
  /** Sign up directly as a courier (role COURIER) rather than a customer. */
  asRider?: boolean;
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

/** Verify the email with the 6-digit OTP; returns the updated (verified) user. */
export async function verifyEmail(code: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/verify-email', { code });
  return data.user;
}

/** Re-send the email verification code. */
export async function resendOtp(): Promise<void> {
  await api.post('/auth/resend-otp');
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
