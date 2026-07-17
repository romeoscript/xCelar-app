import { api } from './api';

export type LatLng = { latitude: number; longitude: number };
export type RouteMode = 'drive' | 'bike' | 'walk';

export type Route = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Driving/walking route through the given points, via the backend routing proxy
 * (which talks to the configured OSRM provider). Throws on failure so callers
 * can fall back to a straight line.
 */
export async function fetchRoute(points: LatLng[], mode: RouteMode): Promise<Route> {
  const body = {
    mode,
    points: points.map((point) => ({ lat: point.latitude, lng: point.longitude })),
  };
  const { data } = await api.post<Route>('/routing/route', body);
  return data;
}
