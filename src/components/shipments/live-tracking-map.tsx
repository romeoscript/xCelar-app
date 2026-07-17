import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  type EdgePadding,
  type LatLng,
  type Region,
} from 'react-native-maps';

import { Brand } from '@/constants/theme';

export type LiveTrackingMapProps = {
  /** The rider's live position, or null before the first report arrives. */
  courier: { lat: number; lng: number } | null;
  pickup: { lat: number | null; lng: number | null };
  dropoff: { lat: number | null; lng: number | null };
  /** The stop the rider is currently heading to — drives the routed line. */
  headingTo: 'pickup' | 'dropoff';
  height?: number;
};

const RouteColor = '#F97316';
const EdgePad: EdgePadding = { top: 48, right: 48, bottom: 48, left: 48 };

type OsrmResponse = { routes?: { geometry?: { coordinates?: [number, number][] } }[] };

async function fetchRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const path = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const response = await fetch(
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${path}?overview=full&geometries=geojson`,
  );
  if (!response.ok) {
    throw new Error(`Route lookup failed (${response.status})`);
  }
  const json = (await response.json()) as OsrmResponse;
  const coordinates = json.routes?.[0]?.geometry?.coordinates;
  if (!coordinates) {
    throw new Error('Route lookup returned no route');
  }
  return coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

/** ~11 m resolution — stops GPS jitter from refetching the route every tick. */
function coordKey(point: LatLng): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

function regionAround(points: LatLng[]): Region {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.01),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.01),
  };
}

export function LiveTrackingMap({
  courier,
  pickup,
  dropoff,
  headingTo,
  height = 240,
}: LiveTrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  const rider = courier ? { latitude: courier.lat, longitude: courier.lng } : null;
  const destination =
    headingTo === 'pickup'
      ? pickup.lat != null && pickup.lng != null
        ? { latitude: pickup.lat, longitude: pickup.lng }
        : null
      : dropoff.lat != null && dropoff.lng != null
        ? { latitude: dropoff.lat, longitude: dropoff.lng }
        : null;

  const routeQuery = useQuery({
    queryKey: ['track-route', rider && coordKey(rider), destination && coordKey(destination)],
    queryFn: () => fetchRoute(rider as LatLng, destination as LatLng),
    enabled: Boolean(rider && destination),
    staleTime: 30_000,
    retry: 1,
  });

  // Keep both the rider and the destination framed as the rider moves.
  useEffect(() => {
    if (rider && destination) {
      mapRef.current?.fitToCoordinates([rider, destination], { edgePadding: EdgePad, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.latitude, rider?.longitude, destination?.latitude, destination?.longitude]);

  const framePoints = [rider, destination].filter(Boolean) as LatLng[];
  if (framePoints.length === 0) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text className="text-sm text-gray-400">Waiting for the rider’s location…</Text>
      </View>
    );
  }

  return (
    // A view-only preview: disabling gestures (and passing touches through to the
    // parent) is what keeps an embedded map from fighting the surrounding
    // ScrollView — the combination otherwise crashes react-native-maps.
    <View style={[styles.container, { height }]} pointerEvents="none">
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={regionAround(framePoints)}
        onMapReady={() =>
          mapRef.current?.fitToCoordinates(framePoints, { edgePadding: EdgePad, animated: false })
        }
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {routeQuery.data ? (
          <Polyline coordinates={routeQuery.data} strokeColor={RouteColor} strokeWidth={5} lineJoin="round" />
        ) : rider && destination ? (
          <Polyline
            coordinates={[rider, destination]}
            strokeColor={RouteColor}
            strokeWidth={4}
            lineDashPattern={[12, 8]}
          />
        ) : null}

        {destination ? (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <Pill label={headingTo === 'pickup' ? 'Pickup' : 'Drop Off'} color={Brand.navy} />
          </Marker>
        ) : null}
        {rider ? (
          <Marker coordinate={rider} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false} zIndex={10}>
            <Pill label="Rider" color={Brand.blue} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.pillWrap}>
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
      <View style={[styles.tip, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: Brand.mist,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Brand.mist,
  },
  map: {
    flex: 1,
  },
  pillWrap: {
    alignItems: 'center',
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
