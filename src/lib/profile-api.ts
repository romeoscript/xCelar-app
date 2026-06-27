import { api } from './api';
import { type User } from './auth-api';
import { getRefreshToken } from './session-tokens';

export type UpdateProfileInput = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
};

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/auth/me', input);
  return data.user;
}

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Change the password. We pass the current refresh token so the server keeps
 * this device signed in while revoking every other session.
 */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const currentRefreshToken = await getRefreshToken();
  await api.post('/auth/change-password', {
    ...input,
    ...(currentRefreshToken ? { currentRefreshToken } : {}),
  });
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/auth/me', { data: { password } });
}
