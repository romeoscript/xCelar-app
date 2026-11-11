import { Fragment, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { ChevronRightIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { MAP_PROVIDER } from '@/lib/maps';
import { type Shipment } from '@/lib/shipment-api';
import { areaName, shipmentStatusMeta } from '@/lib/shipment-status';
import { distanceKm } from '@/lib/shipment-stats';

const MAP_HEIGHT = 190;
const MAX_STOPS = 4;

export type Located = Shipment & { senderLat: number; senderLng: number; receiverLat: number; receiverLng: number };

function isLocated(shipment: Shipment): shipment is Located {
  return (
    shipment.senderLat != null && shipment.senderLng != null && shipment.receiverLat != null && shipment.receiverLng != null
  );
}

/** Deliveries on the go that have both ends pinned, newest first. */
export function locatedDeliveries(shipments: Shipment[], limit = MAX_STOPS): Located[] {
  return shipments.filter(isLocated).slice(0, limit);
}

export function regionFor(shipments: Located[]): Region {
  const lats = shipments.flatMap((s) => [s.senderLat, s.receiverLat]);
  const lngs = shipments.flatMap((s) => [s.senderLng, s.receiverLng]);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.03),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.03),
  };
}

/**
 * Where your parcels are going: each delivery's pickup (small dot) and
 * drop-off (numbered pin) joined by a line, with the same numbers listed
 * underneath. The map is a still preview; rows open the shipment.
 */
export function DeliveriesMap({
  shipments,
  onOpen,
  onOpenMap,
}: {
  shipments: Located[];
  onOpen: (shipment: Shipment) => void;
  onOpenMap: () => void;
}) {
  const region = useMemo(() => regionFor(shipments), [shipments]);

  return (
    <View className="mx-5 overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <Pressable
        onPress={() => {
          tapFeedback();
          onOpenMap();
        }}
        accessibilityRole="button"
        accessibilityLabel="Open the map of your deliveries"
        style={{ height: MAP_HEIGHT }}
      >
        <View style={{ flex: 1 }} pointerEvents="none">
        <MapView
          style={{ flex: 1 }}
          provider={MAP_PROVIDER}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsPointsOfInterest={false}
        >
          <DeliveryPins shipments={shipments} />
        </MapView>
        </View>
        <View className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5" style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
          <Text className="text-xs font-semibold text-brand-navy">
            {shipments.length} {shipments.length === 1 ? 'delivery' : 'deliveries'} on the way
          </Text>
        </View>
        <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-full bg-brand-navy py-1.5 pl-3 pr-2">
          <Text className="text-xs font-bold text-white">Open map</Text>
          <ChevronRightIcon size={14} color="#FFFFFF" />
        </View>
      </Pressable>

      {shipments.map((shipment, index) => (
        <Stop key={shipment.id} shipment={shipment} number={index + 1} onPress={() => onOpen(shipment)} />
      ))}
    </View>
  );
}

/** Each delivery's pickup dot, numbered drop-off pin and the dashed line between. */
export function DeliveryPins({ shipments, selectedId }: { shipments: Located[]; selectedId?: string }) {
  return (
    <>
      {shipments.map((shipment, index) => {
        const selected = shipment.id === selectedId;
        return (
          <Fragment key={shipment.id}>
            <Polyline
              coordinates={[
                { latitude: shipment.senderLat, longitude: shipment.senderLng },
                { latitude: shipment.receiverLat, longitude: shipment.receiverLng },
              ]}
              strokeColor={selected ? Brand.navy : Brand.blue}
              strokeWidth={selected ? 3 : 2}
              lineDashPattern={[6, 6]}
            />
            <Marker coordinate={{ latitude: shipment.senderLat, longitude: shipment.senderLng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View className="h-3 w-3 rounded-full border-2 border-white bg-brand-navy" />
            </Marker>
            <Marker
              coordinate={{ latitude: shipment.receiverLat, longitude: shipment.receiverLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={selected ? 10 : 1}
            >
              <View className={`h-7 w-7 items-center justify-center rounded-full border-2 border-white ${selected ? 'bg-brand-navy' : 'bg-brand-blue'}`}>
                <Text className="text-xs font-bold text-white">{index + 1}</Text>
              </View>
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
}

function Stop({ shipment, number, onPress }: { shipment: Located; number: number; onPress: () => void }) {
  const status = shipmentStatusMeta(shipment);
  const km = distanceKm(
    { lat: shipment.senderLat, lng: shipment.senderLng },
    { lat: shipment.receiverLat, lng: shipment.receiverLng },
  );

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      className="flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 active:bg-brand-surface"
    >
      <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-blue">
        <Text className="text-xs font-bold text-white">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-brand-navy" numberOfLines={1}>
          {shipment.receiverName ?? areaName(shipment.deliveryZone) ?? 'Drop-off'}
        </Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>
          {areaName(shipment.pickupZone)} → {areaName(shipment.deliveryZone)} · <Text className={status.text}>{status.label}</Text>
        </Text>
      </View>
      <Text className="text-sm font-semibold text-brand-navy">{km.toFixed(1)} km</Text>
      <ChevronRightIcon size={16} color={Brand.muted} />
    </Pressable>
  );
}
