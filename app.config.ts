import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with secrets that stay out of git: the Google Maps SDK keys
 * and the Firebase config Android needs for push. Locally they come from .env
 * and ./google-services.json; EAS builds get them from EAS environment variables.
 */
const LOCAL_GOOGLE_SERVICES = './google-services.json';
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ??
  (existsSync(LOCAL_GOOGLE_SERVICES) ? LOCAL_GOOGLE_SERVICES : undefined);

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
    googleServicesFile,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    },
  },
});
