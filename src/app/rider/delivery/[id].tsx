import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircleIcon, ChevronLeftIcon } from '@/components/icons';
import { RouteMap } from '@/components/rider/route-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { useRiderVehicle } from '@/hooks/use-rider-vehicle';
import { getApiErrorMessage } from '@/lib/api-error';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentPosition } from '@/lib/location';
import {
  completeDelivery,
  getDelivery,
  markArrived,
  pickupDelivery,
  reportDeliveryLocation,
  reportDeliveryProblem,
  type DeliveryParty,
  type DeliveryProblemReason,
  type RiderDelivery,
} from '@/lib/rider-api';
import { uploadFile } from '@/lib/uploads';

function callNumber(phone: string | null) {
  if (phone) {
    void Linking.openURL(`tel:${phone}`);
  }
}

export default function RiderDeliveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicleType = useRiderVehicle();

  const [focus, setFocus] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [proofKey, setProofKey] = useState<string | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryQuery = useQuery({
    queryKey: ['rider-delivery', id],
    queryFn: () => getDelivery(id as string),
    enabled: Boolean(id),
  });
  // Live position while on the delivery — keeps "Me" and the directions leg
  // moving with the rider. Coords only; no reverse geocoding per tick.
  const locationQuery = useQuery({
    queryKey: ['rider-position'],
    queryFn: getCurrentPosition,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Push each position tick to the server while the delivery is live, so the
  // customer can watch the rider approach. Best-effort: a dropped ping only
  // means a slightly staler dot, so failures are swallowed. Keyed on the fetch
  // timestamp to send a heartbeat every tick (freshness), not only on movement.
  const deliveryStatus = deliveryQuery.data?.status;
  const isDeliveryActive = deliveryStatus === 'CONFIRMED' || deliveryStatus === 'IN_TRANSIT';
  const position = locationQuery.data;
  const positionUpdatedAt = locationQuery.dataUpdatedAt;
  useEffect(() => {
    if (!id || !isDeliveryActive || !position) {
      return;
    }
    void reportDeliveryLocation(id, position.latitude, position.longitude).catch(() => {});
  }, [id, isDeliveryActive, position, positionUpdatedAt]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rider-delivery', id] });
    queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
  };

  // Arrival is a server-recorded sub-state now (visible to the customer, and
  // restored on app restart) rather than local screen state.
  const arrive = useMutation({
    mutationFn: (stop: 'pickup' | 'dropoff') => markArrived(id as string, stop),
    onSuccess: () => refresh(),
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const pickup = useMutation({
    mutationFn: () => pickupDelivery(id as string),
    onSuccess: () => refresh(),
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const complete = useMutation({
    mutationFn: () => completeDelivery(id as string, proofKey as string),
    onSuccess: () => refresh(),
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const report = useMutation({
    mutationFn: (reason: DeliveryProblemReason) => reportDeliveryProblem(id as string, reason),
    onSuccess: () => {
      setReportOpen(false);
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      router.replace('/rider/deliveries');
    },
    onError: (failure) => {
      setReportOpen(false);
      setError(getApiErrorMessage(failure));
    },
  });

  const takeProof = async () => {
    tapFeedback();
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Allow camera access to capture proof of delivery.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setUploadingProof(true);
    try {
      const key = await uploadFile({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' }, 'proofs');
      setProofKey(key);
      setProofUri(asset.uri);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Upload failed.');
    } finally {
      setUploadingProof(false);
    }
  };

  const navigateTo = (party: DeliveryParty) => {
    tapFeedback();
    if (party.lat != null && party.lng != null) {
      const label = party === deliveryQuery.data?.pickup ? 'pickup' : 'drop-off';
      setFocus({ lat: party.lat, lng: party.lng, label });
      return;
    }
    // No coordinates for this stop — hand the address to the platform maps app
    // instead of leaving the button dead.
    if (party.address) {
      const query = encodeURIComponent(party.address);
      void Linking.openURL(
        Platform.select({ ios: `maps:0,0?q=${query}`, default: `geo:0,0?q=${query}` }),
      );
    }
  };

  if (!id) {
    return <Redirect href="/rider/home" />;
  }

  if (deliveryQuery.isError) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 40 }}>
        <StatusBar style="dark" />
        <QueryError onRetry={() => deliveryQuery.refetch()} />
      </View>
    );
  }

  const delivery = deliveryQuery.data;
  if (deliveryQuery.isLoading || !delivery) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const arrived = Boolean(delivery.arrivedPickupAt);
  const atDropoff = Boolean(delivery.arrivedDropoffAt);

  return (
    <View className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />

      <RouteMap
        pickupLat={delivery.pickup.lat}
        pickupLng={delivery.pickup.lng}
        dropoffLat={delivery.dropoff.lat}
        dropoffLng={delivery.dropoff.lng}
        meLat={locationQuery.data?.latitude}
        meLng={locationQuery.data?.longitude}
        focusTarget={focus}
        focusLabel={focus?.label}
        vehicleType={vehicleType}
        fill
        interactive
      />

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 gap-3 rounded-t-3xl bg-white px-6 pt-4"
      >
        {delivery.paymentMethod && delivery.status !== 'DELIVERED' ? (
          <View className="flex-row items-center gap-2 self-start rounded-full bg-green-50 px-3 py-1.5">
            <CheckCircleIcon size={16} color="#16A34A" />
            <Text className="text-xs font-semibold text-green-700">
              Prepaid · no cash to collect
            </Text>
          </View>
        ) : null}
        <ActionCard
          delivery={delivery}
          arrived={arrived}
          atDropoff={atDropoff}
          proofUri={proofUri}
          proofKey={proofKey}
          uploadingProof={uploadingProof}
          arrivePending={arrive.isPending}
          pickupPending={pickup.isPending}
          completePending={complete.isPending}
          onArrive={() => arrive.mutate('pickup')}
          onStartDelivery={() => pickup.mutate()}
          onStartDropoff={() => arrive.mutate('dropoff')}
          onTakeProof={takeProof}
          onComplete={() => complete.mutate()}
          onDone={() => router.replace('/rider/deliveries')}
          onNavigate={navigateTo}
        />
        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
        {delivery.status === 'CONFIRMED' || delivery.status === 'IN_TRANSIT' ? (
          <Pressable
            onPress={() => {
              tapFeedback();
              setReportOpen(true);
            }}
            hitSlop={6}
            className="items-center pt-1 active:opacity-60"
          >
            <Text className="text-sm font-medium text-gray-400">Report a problem</Text>
          </Pressable>
        ) : null}
      </View>

      <ReportSheet
        visible={reportOpen}
        pickedUp={delivery.status === 'IN_TRANSIT'}
        pending={report.isPending}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => report.mutate(reason)}
      />
    </View>
  );
}

const REPORT_REASONS: { key: DeliveryProblemReason; label: string }[] = [
  { key: 'WRONG_ADDRESS', label: 'Address is wrong or I can’t find it' },
  { key: 'RECIPIENT_UNAVAILABLE', label: 'Recipient isn’t available' },
  { key: 'CANNOT_REACH', label: 'Can’t reach the recipient' },
  { key: 'PACKAGE_ISSUE', label: 'Problem with the package' },
  { key: 'OTHER', label: 'Something else' },
];

function ReportSheet({
  visible,
  pickedUp,
  pending,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  pickedUp: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: DeliveryProblemReason) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-lg font-extrabold text-brand-navy">Report a problem</Text>
      <Text className="mb-4 mt-1 text-sm text-gray-500">
        {pickedUp
          ? 'You’ve already collected this package, so reporting cancels the delivery. Support will follow up.'
          : 'This releases the delivery so another rider can take it.'}
      </Text>
      <View className="gap-2">
        {REPORT_REASONS.map((reason) => (
          <Pressable
            key={reason.key}
            disabled={pending}
            onPress={() => onSubmit(reason.key)}
            className="rounded-2xl bg-brand-surface px-4 py-3.5 active:opacity-70"
          >
            <Text className="text-base font-medium text-brand-navy">{reason.label}</Text>
          </Pressable>
        ))}
      </View>
      {pending ? (
        <View className="items-center pt-4">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

type ActionCardProps = {
  delivery: RiderDelivery;
  arrived: boolean;
  atDropoff: boolean;
  proofUri: string | null;
  proofKey: string | null;
  uploadingProof: boolean;
  arrivePending: boolean;
  pickupPending: boolean;
  completePending: boolean;
  onArrive: () => void;
  onStartDelivery: () => void;
  onStartDropoff: () => void;
  onTakeProof: () => void;
  onComplete: () => void;
  onDone: () => void;
  onNavigate: (party: DeliveryParty) => void;
};

function ActionCard(props: ActionCardProps) {
  const { delivery } = props;

  if (delivery.status === 'DELIVERED') {
    return (
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <CheckCircleIcon size={22} color={Brand.blue} />
          <Text className="text-lg font-extrabold text-brand-navy">Delivery complete</Text>
        </View>
        {delivery.proofUrl ? (
          <Image source={{ uri: delivery.proofUrl }} className="h-28 w-full rounded-xl" resizeMode="cover" />
        ) : null}
        <Button label="Done" onPress={props.onDone} />
      </View>
    );
  }

  if (delivery.status === 'CONFIRMED') {
    if (!props.arrived) {
      return (
        <View className="gap-3">
          <Eyebrow text="You're en route to pickup" />
          <Stop dotClass="bg-green-500" name={delivery.pickup.name} address={delivery.pickup.address} party={delivery.pickup} onNavigate={props.onNavigate} />
          <Button label="Arrive at pickup" loading={props.arrivePending} onPress={props.onArrive} />
        </View>
      );
    }
    return (
      <View className="gap-3">
        <Eyebrow text="At pickup" />
        <Stop dotClass="bg-green-500" name={delivery.pickup.name} address={delivery.pickup.address} party={delivery.pickup} onNavigate={props.onNavigate} />
        <Button label="Start delivery" loading={props.pickupPending} onPress={props.onStartDelivery} />
      </View>
    );
  }

  // IN_TRANSIT
  if (!props.atDropoff) {
    return (
      <View className="gap-3">
        <Eyebrow text="En route to drop-off" />
        <Stop dotClass="bg-red-500" name={delivery.dropoff.name} address={delivery.dropoff.address} party={delivery.dropoff} onNavigate={props.onNavigate} />
        <Button label="Start drop-off" loading={props.arrivePending} onPress={props.onStartDropoff} />
      </View>
    );
  }
  return (
    <View className="gap-3">
      <Eyebrow text="Proof of delivery" />
      <Text className="-mt-2 text-sm text-gray-500">
        A photo is required to complete this delivery.
      </Text>
      {props.proofUri ? (
        <Image source={{ uri: props.proofUri }} className="h-28 w-full rounded-xl" resizeMode="cover" />
      ) : null}
      <Button
        label={props.proofKey ? 'Retake proof photo' : 'Take proof photo'}
        variant="secondary"
        loading={props.uploadingProof}
        onPress={props.onTakeProof}
      />
      <Button
        label="Complete delivery"
        loading={props.completePending}
        disabled={!props.proofKey}
        onPress={props.onComplete}
      />
    </View>
  );
}

function Eyebrow({ text }: { text: string }) {
  return <Text className="text-base font-bold text-brand-navy">{text}</Text>;
}

function Stop({
  dotClass,
  name,
  address,
  party,
  onNavigate,
}: {
  dotClass: string;
  name: string | null;
  address: string | null;
  party: DeliveryParty;
  onNavigate: (party: DeliveryParty) => void;
}) {
  return (
    <View className="gap-2 rounded-2xl bg-brand-surface p-3">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${dotClass}`} />
        <Text className="flex-1 text-sm font-semibold text-brand-navy" numberOfLines={1}>
          {name ?? '—'}
        </Text>
      </View>
      <Text className="text-sm text-gray-500" numberOfLines={1}>
        {address ?? '—'}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => callNumber(party.phone)}
          className="flex-1 items-center rounded-full bg-white py-2.5 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-brand-navy">Call</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate(party)}
          className="flex-1 items-center rounded-full bg-brand-blue py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}
