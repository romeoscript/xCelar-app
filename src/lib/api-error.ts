import { AxiosError } from 'axios';

/**
 * Pull a human-readable message out of an API error. The backend always shapes
 * errors as `{ error: { message } }`; anything else falls back to a default.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  return fallback;
}
