import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryPins, locatedDeliveries, regionFor, type Located } from '@/components/home/deliveries-map';
import { ChevronLeftIcon, ChevronRightIcon, CrosshairIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { MAP_PROVIDER } from '@/lib/maps';
import { getShipments } from '@/lib/shipment-api';
import { areaName, isBooked, isInProgress, shipmentStatusMeta } from '@/lib/shipment-status';
import { distanceKm } from '@/lib/shipment-stats';
import { useGoBack } from '@/hooks/use-go-back';

const CARD_WIDTH = Dimensions.get('window').width - 72;
const CARD_GAP = 12;
const FIT_PADDING = { top: 140, right: 60, bottom: 60, left: 60 };
/** Room under the map for the delivery cards, so the map's logo and legal link stay visible. */
const CARDS_HEIGHT = 190;

/** Every delivery on the go, full screen: pan and zoom, or pick one to fly to it. */
export default function DeliveriesMapScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const shipmentsQuery = useQuery({ queryKey: ['shipments'], queryFn: getShipments });
  const deliveries = useMemo(
    () => locatedDeliveries((shipmentsQuery.data ?? []).filter((s) => isBooked(s) && isInProgress(s)), Infinity),
    [shipmentsQuery.data],
  );

  const showAll = () => {
    setSelectedId(undefined);
    mapRef.current?.fitToCoordinates(
      deliveries.flatMap((s) => [
        { latitude: s.senderLat, longitude: s.senderLng },
        { latitude: s.receiverLat, longitude: s.receiverLng },
      ]),
      { edgePadding: FIT_PADDING, animated: true },
    );
  };

  const focus = (shipment: Located) => {
    tapFeedback();
    setSelectedId(shipment.id);
    mapRef.current?.fitToCoordinates(
      [
        { latitude: shipment.senderLat, longitude: shipment.senderLng },
        { latitude: shipment.receiverLat, longitude: shipment.receiverLng },
      ],
      { edgePadding: FIT_PADDING, animated: true },
    );
  };

  return (
    <View className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />
      {deliveries.length > 0 ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={MAP_PROVIDER}
          initialRegion={regionFor(deliveries)}
          onMapReady={showAll}
          mapPadding={{ top: 0, right: 0, bottom: CARDS_HEIGHT + insets.bottom, left: 0 }}
          toolbarEnabled={false}
          showsPointsOfInterest={false}
        >
          <DeliveryPins shipments={deliveries} selectedId={selectedId} />
        </MapView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-gray-500">
            {shipmentsQuery.isLoading ? 'Loading your deliveries…' : 'Nothing on the way right now.'}
          </Text>
        </View>
      )}

      <View className="absolute left-4 right-4 flex-row items-center justify-between" style={{ top: insets.top + 8 }}>
        <RoundButton label="Go back" onPress={() => goBack()}>
          <ChevronLeftIcon size={22} color={Brand.navy} />
        </RoundButton>
        <View className="rounded-full bg-white px-4 py-2" style={floatShadow}>
          <Text className="text-sm font-bold text-brand-navy">
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'} on the way
          </Text>
        </View>
        <RoundButton label="Show all deliveries" onPress={showAll}>
          <CrosshairIcon size={20} color={Brand.navy} />
        </RoundButton>
      </View>

      {deliveries.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          className="absolute left-0 right-0"
          style={{ bottom: insets.bottom + 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
        >
          {deliveries.map((shipment, index) => (
            <DeliveryCard
              key={shipment.id}
              shipment={shipment}
              number={index + 1}
              selected={shipment.id === selectedId}
              onFocus={() => focus(shipment)}
              onOpen={() => router.push(`/shipment/${shipment.id}`)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function DeliveryCard({
  shipment,
  number,
  selected,
  onFocus,
  onOpen,
}: {
  shipment: Located;
  number: number;
  selected: boolean;
  onFocus: () => void;
  onOpen: () => void;
}) {
  const status = shipmentStatusMeta(shipment);
  const km = distanceKm(
    { lat: shipment.senderLat, lng: shipment.senderLng },
    { lat: shipment.receiverLat, lng: shipment.receiverLng },
  );

  return (
    <Pressable
      onPress={onFocus}
      accessibilityRole="button"
      accessibilityLabel={`Show delivery ${number} on the map`}
      className={`rounded-3xl bg-white p-4 ${selected ? 'border-2 border-brand-navy' : 'border-2 border-transparent'}`}
      style={[{ width: CARD_WIDTH }, floatShadow]}
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-8 w-8 items-center justify-center rounded-full ${selected ? 'bg-brand-navy' : 'bg-brand-blue'}`}>
          <Text className="text-sm font-bold text-white">{number}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-brand-navy" numberOfLines={1}>
            {shipment.receiverName ?? 'Drop-off'}
          </Text>
          <Text className="text-xs text-gray-500">{shipment.trackingCode}</Text>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${status.bg}`}>
          <Text className={`text-xs font-semibold ${status.text}`}>{status.label}</Text>
        </View>
      </View>
      <Text className="mt-3 text-sm text-brand-navy" numberOfLines={1}>
        {areaName(shipment.pickupZone)} → {areaName(shipment.deliveryZone)} · {km.toFixed(1)} km
      </Text>
      <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
        {shipment.receiverAddress}
      </Text>
      <Pressable onPress={onOpen} hitSlop={8} accessibilityRole="button" className="mt-3 flex-row items-center self-start active:opacity-70">
        <Text className="text-sm font-semibold text-brand-blue">View shipment</Text>
        <ChevronRightIcon size={16} color={Brand.blue} />
      </Pressable>
    </Pressable>
  );
}

function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
      style={floatShadow}
    >
      {children}
    </Pressable>
  );
}

const floatShadow = {
  shadowColor: '#1E1B4B',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
} as const;
