import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  type EdgePadding,
  type LatLng,
  type Region,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrosshairIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { MAP_PROVIDER } from '@/lib/maps';
import { fetchRoute, type Route } from '@/lib/routing';

export type LiveTrackingMapProps = {
  /** The rider's live position, or null before the first report arrives. */
  courier: { lat: number; lng: number } | null;
  pickup: { lat: number | null; lng: number | null };
  dropoff: { lat: number | null; lng: number | null };
  /** The stop the rider is currently heading to — drives the routed line. */
  headingTo: 'pickup' | 'dropoff';
  height?: number;
  /** Fill the parent instead of using a fixed height (full-screen tracking). */
  fill?: boolean;
  /** Allow pan/zoom, with a distance/ETA banner and a re-centre button. */
  interactive?: boolean;
};

const RouteColor = '#F97316';
const PreviewPadding: EdgePadding = { top: 48, right: 48, bottom: 48, left: 48 };
// Leaves room for the ETA banner above and the screen's status sheet below.
const FillPadding: EdgePadding = { top: 120, right: 60, bottom: 260, left: 60 };

/** ~11 m resolution — stops GPS jitter from refetching the route every tick. */
function coordKey(point: LatLng): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

function formatLeg(route: Route): string {
  const km = (route.distanceMeters / 1000).toFixed(1);
  const minutes = Math.max(1, Math.round(route.durationSeconds / 60));
  return `${km} km · ${minutes} min`;
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
  fill = false,
  interactive = false,
}: LiveTrackingMapProps) {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const edgePadding = fill ? FillPadding : PreviewPadding;
  // While the user is exploring the map, stop re-framing it on every rider update.
  const [following, setFollowing] = useState(true);

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
    queryFn: () => fetchRoute([rider as LatLng, destination as LatLng], 'drive'),
    enabled: Boolean(rider && destination),
    staleTime: 30_000,
    retry: 1,
  });

  // Keep both the rider and the destination framed as the rider moves.
  useEffect(() => {
    if (following && rider && destination) {
      mapRef.current?.fitToCoordinates([rider, destination], { edgePadding, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [following, rider?.latitude, rider?.longitude, destination?.latitude, destination?.longitude]);

  const framePoints = [rider, destination].filter(Boolean) as LatLng[];
  const sizeStyle = fill ? styles.fill : { height };
  if (framePoints.length === 0) {
    return (
      <View style={[styles.placeholder, sizeStyle, fill && styles.square]}>
        <Text className="text-sm text-gray-400">Waiting for the rider’s location…</Text>
      </View>
    );
  }

  const destinationLabel = headingTo === 'pickup' ? 'Pickup' : 'Drop Off';

  return (
    // The embedded preview is view-only: disabling gestures (and passing touches
    // through to the parent) is what keeps it from fighting the surrounding
    // ScrollView — the combination otherwise crashes react-native-maps. The
    // full-screen map has no ScrollView around it, so it can be interactive.
    <View
      style={[styles.container, sizeStyle, fill && styles.square]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <MapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={styles.map}
        initialRegion={regionAround(framePoints)}
        onMapReady={() =>
          mapRef.current?.fitToCoordinates(framePoints, { edgePadding, animated: false })
        }
        onPanDrag={interactive ? () => setFollowing(false) : undefined}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        toolbarEnabled={false}
      >
        {routeQuery.data ? (
          <Polyline
            coordinates={routeQuery.data.coordinates}
            strokeColor={RouteColor}
            strokeWidth={5}
            lineJoin="round"
          />
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
            <Pill label={destinationLabel} color={Brand.navy} />
          </Marker>
        ) : null}
        {rider ? (
          <Marker coordinate={rider} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false} zIndex={10}>
            <Pill label="Rider" color={Brand.blue} />
          </Marker>
        ) : null}
      </MapView>

      {interactive && routeQuery.data ? (
        <View pointerEvents="none" style={[styles.bannerWrap, { top: insets.top + 12 }]}>
          <View style={styles.bannerCard}>
            <Text className="text-sm font-semibold text-brand-navy">
              {`${formatLeg(routeQuery.data)} to ${destinationLabel}`}
            </Text>
          </View>
        </View>
      ) : null}

      {interactive && !following ? (
        <Pressable
          onPress={() => setFollowing(true)}
          hitSlop={8}
          accessibilityLabel="Re-centre on the rider"
          style={[styles.recenter, { top: insets.top + 8 }]}
          className="active:opacity-80"
        >
          <CrosshairIcon size={20} color={Brand.navy} />
        </Pressable>
      ) : null}
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
  fill: {
    flex: 1,
  },
  square: {
    borderRadius: 0,
  },
  map: {
    flex: 1,
  },
  bannerWrap: {
    position: 'absolute',
    left: 64,
    right: 64,
    alignItems: 'center',
  },
  bannerCard: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  recenter: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
