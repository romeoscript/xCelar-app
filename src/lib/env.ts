/**
 * Runtime config. Set values in `.env` using the EXPO_PUBLIC_ prefix so they
 * are inlined into the app bundle. See https://docs.expo.dev/guides/environment-variables/
 *
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:8001
 */
export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8001',
};
