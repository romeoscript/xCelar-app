export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8001',
  // Address autocomplete provider (Photon/OSM by default — keyless, returns
  // coordinates). Swap for a Google/Mapbox endpoint via EXPO_PUBLIC_PLACES_API_URL.
  placesApiUrl: process.env.EXPO_PUBLIC_PLACES_API_URL ?? 'https://photon.komoot.io/api',
  // Google sign-in client IDs from Google Cloud Console. Until both are set,
  // the Google button explains that it isn't switched on (it also needs a
  // development build, not Expo Go).
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};
