import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with the Google Maps SDK keys, read from the environment so
 * they stay out of git. Locally they come from .env; for EAS builds set them as
 * EAS environment variables.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    },
  },
});
