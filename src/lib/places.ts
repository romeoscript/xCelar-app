import { env } from './env';

export type AddressSuggestion = {
  id: string;
  /** A short primary line, e.g. a street or place name. */
  title: string;
  /** The full address line to store. */
  address: string;
  latitude: number;
  longitude: number;
  area: string | null;
  region: string | null;
};

// Bias results toward Nigeria (country centroid) so local searches rank first.
const NIGERIA_CENTER = { lat: 9.08, lon: 8.68 };
const RESULT_LIMIT = 6;

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number;
  };
};

function toSuggestion(feature: PhotonFeature, index: number): AddressSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  const props = feature.properties;
  if (!coordinates || !props) {
    return null;
  }
  const [longitude, latitude] = coordinates;

  const streetLine = [props.housenumber, props.street].filter(Boolean).join(' ');
  const title = props.name || streetLine || props.city || 'Unknown place';
  const parts = [title, props.district, props.city, props.state, props.country].filter(
    (part, position, all): part is string => Boolean(part) && all.indexOf(part) === position,
  );

  return {
    id: props.osm_id ? String(props.osm_id) : `${latitude},${longitude},${index}`,
    title,
    address: parts.join(', '),
    latitude,
    longitude,
    area: props.district ?? props.city ?? props.county ?? null,
    region: props.state ?? null,
  };
}

/**
 * Type-ahead address search. Returns matches with coordinates so the caller
 * doesn't need a second geocode. Degrades to an empty list on any error.
 */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const url =
    `${env.placesApiUrl}?q=${encodeURIComponent(trimmed)}` +
    `&limit=${RESULT_LIMIT}&lang=en&lat=${NIGERIA_CENTER.lat}&lon=${NIGERIA_CENTER.lon}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { features?: PhotonFeature[] };
    const features = data.features ?? [];

    // Prefer Nigerian results when the query also matches places elsewhere.
    const nigerian = features.filter((feature) => feature.properties?.countrycode === 'NG');
    const chosen = nigerian.length > 0 ? nigerian : features;

    return chosen
      .map(toSuggestion)
      .filter((item): item is AddressSuggestion => item !== null);
  } catch {
    return [];
  }
}
