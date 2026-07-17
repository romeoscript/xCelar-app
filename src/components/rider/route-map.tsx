import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type ComponentProps } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  type EdgePadding,
  type LatLng,
  type Region,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { type VehicleType } from '@/lib/rider-api';

export type RouteMapProps = {
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  /** The rider's current location ("Me"), if known. */
  meLat?: number | null;
  meLng?: number | null;
  height?: number;
  /** Fill the parent (flex-1) instead of using a fixed height + rounded corners. */
  fill?: boolean;
  /** Allow panning/zooming. Off for previews embedded in scroll views. */
  interactive?: boolean;
  /** In-app "navigate": draw directions from Me to this point and frame that leg. */
  focusTarget?: { lat: number; lng: number } | null;
  /** Name of the focused stop for the directions banner, e.g. "pickup". */
  focusLabel?: string | null;
  /** The rider's vehicle — sets the routing profile and the rider marker icon. */
  vehicleType?: VehicleType;
};

type TravelMode = 'drive' | 'bike' | 'walk';
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Free OSRM instances by FOSSGIS, one per travel profile. The literal
 *  "/driving/" path segment is part of the API and does not pick the profile. */
const ModeProfiles: Record<TravelMode, string> = {
  drive: 'routed-car',
  bike: 'routed-bike',
  walk: 'routed-foot',
};

/** How each vehicle routes. Motorbikes use car routing — they ride on roads,
 *  not cycle paths — so only on-foot couriers get the walking profile. */
const VehicleRouting: Record<VehicleType, TravelMode> = {
  BACKPACK: 'walk',
  BIKE: 'drive',
  CAR: 'drive',
  TRUCK: 'drive',
};

/** The Material glyph drawn for the rider's own marker, per vehicle. */
const VehicleIcon: Record<VehicleType, MciName> = {
  BACKPACK: 'walk',
  BIKE: 'motorbike',
  CAR: 'car',
  TRUCK: 'truck',
};

/** Marker/route accents that aren't part of the brand palette. Red mirrors the
 *  Tailwind pickup dot on the delivery cards; orange is the delivery route. */
const MapColors = {
  pickup: '#EF4444',
  route: '#F97316',
} as const;

/** Extra room when fill mode is on, so the route clears the bottom action card. */
const FillPadding: EdgePadding = { top: 100, right: 60, bottom: 260, left: 60 };
const PreviewPadding: EdgePadding = { top: 40, right: 40, bottom: 40, left: 40 };

type OsrmRoute = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

type OsrmResponse = {
  routes?: {
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: [number, number][] };
  }[];
};

/** Route between two points for the given travel mode. Throws (so the caller
 *  falls back to a straight line) when the free routing service is unavailable
 *  or slow — it has no uptime guarantee, so an 8s cap keeps the map responsive. */
async function fetchRoute(from: LatLng, to: LatLng, mode: TravelMode): Promise<OsrmRoute> {
  const path = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `https://routing.openstreetmap.de/${ModeProfiles[mode]}/route/v1/driving/${path}?overview=full&geometries=geojson`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`Route lookup failed (${response.status})`);
    }
    const json = (await response.json()) as OsrmResponse;
    const route = json.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!coordinates) {
      throw new Error('Route lookup returned no route');
    }
    return {
      coordinates: coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      distanceMeters: route.distance ?? 0,
      durationSeconds: route.duration ?? 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** ~11 m resolution — stops GPS jitter from refetching routes on every tick. */
function coordKey(point: LatLng): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

/** First frame before fitToCoordinates kicks in — a region roughly bounding the stops. */
function regionAround(stops: LatLng[]): Region {
  const lats = stops.map((p) => p.latitude);
  const lngs = stops.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
  };
}

/** Hand off to the platform maps app for real turn-by-turn navigation. */
function openTurnByTurn(target: LatLng, mode: TravelMode) {
  const query = `${target.latitude},${target.longitude}`;
  const url = Platform.select({
    ios: `maps://?daddr=${query}&dirflg=${mode === 'walk' ? 'w' : 'd'}`,
    default: `google.navigation:q=${query}&mode=${mode === 'walk' ? 'w' : mode === 'bike' ? 'b' : 'd'}`,
  });
  Linking.openURL(url).catch(() => Linking.openURL(`geo:0,0?q=${query}`));
}

function formatLeg(leg: OsrmRoute): string {
  const km = (leg.distanceMeters / 1000).toFixed(1);
  const minutes = Math.max(1, Math.round(leg.durationSeconds / 60));
  return `${km} km · ${minutes} min`;
}

export function RouteMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  meLat,
  meLng,
  height = 220,
  fill = false,
  interactive = false,
  focusTarget = null,
  focusLabel = null,
  vehicleType = 'CAR',
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const mode = VehicleRouting[vehicleType];
  const edgePadding = fill ? FillPadding : PreviewPadding;

  const pickup =
    pickupLat != null && pickupLng != null
      ? { latitude: pickupLat, longitude: pickupLng }
      : null;
  const dropoff =
    dropoffLat != null && dropoffLng != null
      ? { latitude: dropoffLat, longitude: dropoffLng }
      : null;
  const me = meLat != null && meLng != null ? { latitude: meLat, longitude: meLng } : null;
  const target = focusTarget ? { latitude: focusTarget.lat, longitude: focusTarget.lng } : null;
  const hasCoords = Boolean(pickup && dropoff);
  const navigating = Boolean(target);
  // Navigating to the pickup re-uses the approach leg instead of a third fetch.
  const focusIsPickup = Boolean(target && pickup && coordKey(target) === coordKey(pickup));

  // The camera effects read the latest position without re-firing on GPS ticks.
  const meRef = useRef<LatLng | null>(null);
  meRef.current = me;

  const stops = useMemo<LatLng[]>(() => {
    if (pickupLat == null || pickupLng == null || dropoffLat == null || dropoffLng == null) {
      return [];
    }
    const route: LatLng[] = [
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: dropoffLat, longitude: dropoffLng },
    ];
    return meLat != null && meLng != null
      ? [{ latitude: meLat, longitude: meLng }, ...route]
      : route;
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, meLat, meLng]);

  // The job itself: Pick Up → Drop Off. Fixed for the life of the screen.
  const deliveryLeg = useQuery({
    queryKey: ['osrm', mode, 'delivery', pickup && coordKey(pickup), dropoff && coordKey(dropoff)],
    queryFn: () => fetchRoute(pickup as LatLng, dropoff as LatLng, mode),
    enabled: hasCoords,
    staleTime: Infinity,
    retry: 1,
  });

  // Getting there: Me → Pick Up. Tracks the rider as they move.
  const approachLeg = useQuery({
    queryKey: ['osrm', mode, 'approach', me && coordKey(me), pickup && coordKey(pickup)],
    queryFn: () => fetchRoute(me as LatLng, pickup as LatLng, mode),
    enabled: Boolean(me && pickup),
    staleTime: 30_000,
    retry: 1,
  });

  // Directions to a focused stop other than the pickup (i.e. the drop-off).
  const focusLegQuery = useQuery({
    queryKey: ['osrm', mode, 'focus', me && coordKey(me), target && coordKey(target)],
    queryFn: () => fetchRoute(me as LatLng, target as LatLng, mode),
    enabled: Boolean(me && target && !focusIsPickup),
    staleTime: 30_000,
    retry: 1,
  });
  const focusLeg = focusIsPickup ? approachLeg : focusLegQuery;

  // Re-frame when the rider's location arrives (2 stops → 3), so "Me" is in view.
  useEffect(() => {
    if (stops.length >= 2 && !focusTarget) {
      mapRef.current?.fitToCoordinates(stops, { edgePadding, animated: true });
    }
    // Only when the number of stops changes — not on every location tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops.length]);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }
    // "Navigate" frames the leg from the rider (Me) to the chosen stop, so it
    // reads from where you are — not jumping straight to the destination.
    const destination = { latitude: focusTarget.lat, longitude: focusTarget.lng };
    const origin = meRef.current;
    if (origin) {
      mapRef.current?.fitToCoordinates([origin, destination], { edgePadding, animated: true });
      return;
    }
    mapRef.current?.animateToRegion(
      { ...destination, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      600,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget]);

  const containerStyle = fill ? undefined : { height };
  const containerClass = fill
    ? 'flex-1 overflow-hidden bg-brand-surface'
    : 'overflow-hidden rounded-2xl bg-brand-surface';

  if (!pickup || !dropoff) {
    return (
      <View style={containerStyle} className={`${containerClass} items-center justify-center`}>
        <Text className="text-sm text-gray-400">Route map unavailable</Text>
      </View>
    );
  }

  const bannerText = !me
    ? 'Waiting for your location…'
    : focusLeg.data
      ? `${formatLeg(focusLeg.data)}${focusLabel ? ` to ${focusLabel}` : ''}`
      : focusLeg.isError
        ? 'Route unavailable'
        : 'Finding route…';
  const topOffset = (fill ? insets.top : 0) + 10;

  return (
    <View
      style={containerStyle}
      className={containerClass}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={regionAround(stops)}
        onMapReady={() => mapRef.current?.fitToCoordinates(stops, { edgePadding, animated: false })}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        toolbarEnabled={false}
      >
        {/* Approach leg: Me → Pick Up. Hidden while it is the focused leg
            (the focus polyline below draws the same route bolder). */}
        {me && !focusIsPickup ? (
          <RouteLine
            leg={approachLeg}
            fallback={[me, pickup]}
            color={navigating ? Brand.muted : Brand.blue}
            width={navigating ? 3 : 4}
          />
        ) : null}

        {/* Delivery leg: Pick Up → Drop Off — the job itself. */}
        <RouteLine
          leg={deliveryLeg}
          fallback={[pickup, dropoff]}
          color={navigating ? Brand.muted : MapColors.route}
          width={navigating ? 3 : 5}
        />

        {/* Focused directions, drawn boldest and on top. */}
        {navigating && me ? (
          <RouteLine
            leg={focusLeg}
            fallback={[me, target as LatLng]}
            color={MapColors.route}
            width={6}
          />
        ) : null}

        <Marker
          coordinate={pickup}
          anchor={{ x: 0.5, y: 1 }}
          centerOffset={{ x: 0, y: -16 }}
          tracksViewChanges={false}
        >
          <CalloutPill label="Pick Up" color={MapColors.pickup} />
        </Marker>
        <Marker
          coordinate={dropoff}
          anchor={{ x: 0.5, y: 1 }}
          centerOffset={{ x: 0, y: -16 }}
          tracksViewChanges={false}
        >
          <CalloutPill label="Drop Off" color={Brand.navy} />
        </Marker>
        {me ? (
          <Marker
            coordinate={me}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={10}
          >
            <RiderMarker icon={VehicleIcon[vehicleType]} />
          </Marker>
        ) : null}
      </MapView>

      {/* Leg summaries, or the focused-leg banner while navigating. */}
      {interactive ? (
        <View pointerEvents="box-none" style={[styles.bannerWrap, { top: topOffset }]}>
          {navigating ? (
            <View style={styles.bannerCard}>
              <Text className="text-sm font-semibold text-brand-navy">{bannerText}</Text>
              <Pressable onPress={() => openTurnByTurn(target as LatLng, mode)} hitSlop={8}>
                <Text className="text-sm font-bold text-brand-blue">Open in Maps</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.chipRow} pointerEvents="none">
              {me && approachLeg.data ? (
                <LegChip color={Brand.blue} text={`Pickup ${formatLeg(approachLeg.data)}`} />
              ) : null}
              {deliveryLeg.data ? (
                <LegChip
                  color={MapColors.route}
                  text={`Delivery ${formatLeg(deliveryLeg.data)}`}
                />
              ) : null}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** One leg of the journey: the routed line, or a dashed straight line while
 *  routing is unavailable. Renders nothing while the route is still loading. */
function RouteLine({
  leg,
  fallback,
  color,
  width,
}: {
  leg: { data?: OsrmRoute; isError: boolean };
  fallback: LatLng[];
  color: string;
  width: number;
}) {
  if (leg.data) {
    return (
      <Polyline
        coordinates={leg.data.coordinates}
        strokeColor={color}
        strokeWidth={width}
        lineJoin="round"
      />
    );
  }
  if (leg.isError) {
    return (
      <Polyline
        coordinates={fallback}
        strokeColor={color}
        strokeWidth={Math.max(2, width - 1)}
        lineDashPattern={[12, 8]}
      />
    );
  }
  return null;
}

function LegChip({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text className="text-xs font-semibold text-brand-navy">{text}</Text>
    </View>
  );
}

/** Labelled pill with a pointer tip, anchored to the marker coordinate. */
function CalloutPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.callout}>
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
      <View style={[styles.tip, { borderTopColor: color }]} />
    </View>
  );
}

/** The rider's own position, drawn as their vehicle in a gold-ringed pin. */
function RiderMarker({ icon }: { icon: MciName }) {
  return (
    <View style={styles.riderPin}>
      <MaterialCommunityIcons name={icon} size={22} color={Brand.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  bannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callout: {
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
  riderPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: Brand.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
