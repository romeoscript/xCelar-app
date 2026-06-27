/**
 * Runtime config. Set values in `.env` using the EXPO_PUBLIC_ prefix so they
 * are inlined into the app bundle. See https://docs.expo.dev/guides/environment-variables/
 *
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:8001
 */
export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8001',
  // External customer-care widget (Crisp/Intercom/tawk.to/WhatsApp). Swap the
  // URL here or via EXPO_PUBLIC_SUPPORT_URL when the real one is ready.
  supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL ?? 'https://wa.me/2348000000000',
  // Address autocomplete provider (Photon/OSM by default — keyless, returns
  // coordinates). Swap for a Google/Mapbox endpoint via EXPO_PUBLIC_PLACES_API_URL.
  placesApiUrl: process.env.EXPO_PUBLIC_PLACES_API_URL ?? 'https://photon.komoot.io/api',
  // Cloudinary unsigned upload for invoice/proof documents. Create an unsigned
  // upload preset in the Cloudinary dashboard and set both values in `.env`.
  cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryUploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
};
