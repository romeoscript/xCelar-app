import { AxiosError } from 'axios';

/**
 * Pull a human-readable message out of an API error. The backend always shapes
 * errors as `{ error: { message } }`; anything else falls back to a default.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data?.error;
    const message = apiError?.message;
    if (typeof message === 'string') {
      // Validation errors carry per-field details — surface the first so the
      // user sees what to fix instead of a generic "Validation failed".
      const fieldError = firstFieldError(apiError?.details);
      return fieldError ? `${message}: ${fieldError}` : message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  return fallback;
}

/** Pull the first field message from a zod `fieldErrors` map, if present. */
function firstFieldError(details: unknown): string | null {
  if (!details || typeof details !== 'object') {
    return null;
  }
  for (const value of Object.values(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return null;
}
