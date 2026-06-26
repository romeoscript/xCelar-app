import * as Location from 'expo-location';

export type PickedLocation = {
  address: string;
  latitude: number;
  longitude: number;
};

/** Turn coordinates into a readable address, falling back to the raw coords. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    const parts = [place.name, place.street, place.district, place.city, place.region];
    const address = parts.filter(Boolean).join(', ');
    return address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
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
  const address = await reverseGeocode(latitude, longitude);
  return { address, latitude, longitude };
}
