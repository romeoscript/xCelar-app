import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircleIcon, ChevronLeftIcon } from '@/components/icons';
import { RouteMap } from '@/components/rider/route-map';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentLocation } from '@/lib/location';
import {
  completeDelivery,
  getDelivery,
  pickupDelivery,
  type DeliveryParty,
  type RiderDelivery,
} from '@/lib/rider-api';
import { uploadFile } from '@/lib/uploads';

function openDirections(party: DeliveryParty) {
  if (party.lat != null && party.lng != null) {
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${party.lat},${party.lng}`);
  }
}

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

  const [arrived, setArrived] = useState(false);
  const [atDropoff, setAtDropoff] = useState(false);
  const [proofKey, setProofKey] = useState<string | null>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryQuery = useQuery({
    queryKey: ['rider-delivery', id],
    queryFn: () => getDelivery(id as string),
    enabled: Boolean(id),
  });
  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rider-delivery', id] });
    queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
  };

  const pickup = useMutation({
    mutationFn: () => pickupDelivery(id as string),
    onSuccess: () => {
      setArrived(false);
      refresh();
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const complete = useMutation({
    mutationFn: () => completeDelivery(id as string, proofKey ?? undefined),
    onSuccess: () => {
      setAtDropoff(false);
      refresh();
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
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
        <ActionCard
          delivery={delivery}
          arrived={arrived}
          atDropoff={atDropoff}
          proofUri={proofUri}
          proofKey={proofKey}
          uploadingProof={uploadingProof}
          pickupPending={pickup.isPending}
          completePending={complete.isPending}
          onArrive={() => setArrived(true)}
          onStartDelivery={() => pickup.mutate()}
          onStartDropoff={() => setAtDropoff(true)}
          onTakeProof={takeProof}
          onComplete={() => complete.mutate()}
          onDone={() => router.replace('/rider/deliveries')}
        />
        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
      </View>
    </View>
  );
}

type ActionCardProps = {
  delivery: RiderDelivery;
  arrived: boolean;
  atDropoff: boolean;
  proofUri: string | null;
  proofKey: string | null;
  uploadingProof: boolean;
  pickupPending: boolean;
  completePending: boolean;
  onArrive: () => void;
  onStartDelivery: () => void;
  onStartDropoff: () => void;
  onTakeProof: () => void;
  onComplete: () => void;
  onDone: () => void;
};

function ActionCard(props: ActionCardProps) {
  const { delivery } = props;
  const fee = delivery.feeNaira != null ? formatNaira(delivery.feeNaira) : '—';

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
          <Eyebrow text="You're en route to pickup" fee={fee} />
          <Stop dotClass="bg-green-500" name={delivery.pickup.name} address={delivery.pickup.address} party={delivery.pickup} />
          <Button label="Arrive at pickup" onPress={props.onArrive} />
        </View>
      );
    }
    return (
      <View className="gap-3">
        <Eyebrow text="At pickup" fee={fee} />
        <Stop dotClass="bg-green-500" name={delivery.pickup.name} address={delivery.pickup.address} party={delivery.pickup} />
        <Button label="Start delivery" loading={props.pickupPending} onPress={props.onStartDelivery} />
      </View>
    );
  }

  // IN_TRANSIT
  if (!props.atDropoff) {
    return (
      <View className="gap-3">
        <Eyebrow text="En route to drop-off" fee={fee} />
        <Stop dotClass="bg-red-500" name={delivery.dropoff.name} address={delivery.dropoff.address} party={delivery.dropoff} />
        <Button label="Start drop-off" onPress={props.onStartDropoff} />
      </View>
    );
  }
  return (
    <View className="gap-3">
      <Eyebrow text="Proof of delivery" fee={fee} />
      {props.proofUri ? (
        <Image source={{ uri: props.proofUri }} className="h-28 w-full rounded-xl" resizeMode="cover" />
      ) : null}
      <Button
        label={props.proofKey ? 'Retake proof photo' : 'Take proof photo'}
        variant="secondary"
        loading={props.uploadingProof}
        onPress={props.onTakeProof}
      />
      <Button label="Complete delivery" loading={props.completePending} onPress={props.onComplete} />
    </View>
  );
}

function Eyebrow({ text, fee }: { text: string; fee: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base font-bold text-brand-navy">{text}</Text>
      <View className="rounded-full bg-brand-gold-tint px-3 py-1">
        <Text className="text-sm font-extrabold text-brand-navy">{fee}</Text>
      </View>
    </View>
  );
}

function Stop({
  dotClass,
  name,
  address,
  party,
}: {
  dotClass: string;
  name: string | null;
  address: string | null;
  party: DeliveryParty;
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
          onPress={() => openDirections(party)}
          className="flex-1 items-center rounded-full bg-brand-blue py-2.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}
