import * as Location from 'expo-location';

export type GeocodeResult = {
  address: string;
  /** Best guess at the local-government area / district. */
  area: string | null;
  /** State / region. */
  region: string | null;
};

export type PickedLocation = GeocodeResult & {
  latitude: number;
  longitude: number;
};

/** Turn coordinates into an address plus area/region, for display and zone matching. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) {
      return { address: fallback, area: null, region: null };
    }
    const parts = [place.name, place.street, place.district, place.city, place.region];
    const address = parts.filter(Boolean).join(', ') || fallback;
    const area = place.subregion ?? place.district ?? place.city ?? null;
    return { address, area, region: place.region ?? null };
  } catch {
    return { address: fallback, area: null, region: null };
  }
}

/**
 * Ask for permission, read the device's current position, and resolve it to an
 * address. Throws a friendly error if permission is denied.
 */
export async function getCurrentLocation(): Promise<PickedLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is needed to use your current location.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;
  const geocode = await reverseGeocode(latitude, longitude);
  return { ...geocode, latitude, longitude };
}
