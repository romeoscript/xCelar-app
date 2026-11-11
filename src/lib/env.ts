
export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8001',
  // External customer-care widget (Crisp/Intercom/tawk.to/WhatsApp). Swap the
  // URL here or via EXPO_PUBLIC_SUPPORT_URL when the real one is ready.
  supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL ?? 'https://wa.me/2348000000000',
  // Address autocomplete provider (Photon/OSM by default — keyless, returns
  // coordinates). Swap for a Google/Mapbox endpoint via EXPO_PUBLIC_PLACES_API_URL.
  // Google sign-in client IDs from Google Cloud Console. The Google button
  // stays hidden until both are set (and it needs a development build).
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  placesApiUrl: process.env.EXPO_PUBLIC_PLACES_API_URL ?? 'https://photon.komoot.io/api',
};
