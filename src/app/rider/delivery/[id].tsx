import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckCircleIcon } from '@/components/icons';
import { RouteMap } from '@/components/rider/route-map';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
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
} from '@/lib/rider-api';
import { uploadFile } from '@/lib/uploads';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_STYLES } from '../deliveries';

const STEPPER = ['Accepted', 'Picked up', 'Delivered'];

function reachedStep(status: string): number {
  if (status === 'DELIVERED') {
    return 2;
  }
  if (status === 'IN_TRANSIT') {
    return 1;
  }
  return 0;
}

function StatusStepper({ status }: { status: string }) {
  const reached = reachedStep(status);
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4">
      {STEPPER.map((label, index) => {
        const done = index <= reached;
        return (
          <View key={label} className="flex-1 items-center gap-1.5">
            <View
              className={`h-3 w-3 rounded-full ${done ? 'bg-brand-blue' : 'bg-gray-200'}`}
            />
            <Text
              className={`text-xs font-medium ${done ? 'text-brand-navy' : 'text-gray-400'}`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function openDirections(party: DeliveryParty) {
  if (party.lat == null || party.lng == null) {
    return;
  }
  void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${party.lat},${party.lng}`);
}

function callNumber(phone: string | null) {
  if (phone) {
    void Linking.openURL(`tel:${phone}`);
  }
}

export default function RiderDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [arrivedPickup, setArrivedPickup] = useState(false);
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
      setArrivedPickup(false);
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
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Delivery" />
        <QueryError onRetry={() => deliveryQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const delivery = deliveryQuery.data;
  if (deliveryQuery.isLoading || !delivery) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </SafeAreaView>
    );
  }

  const delivered = delivery.status === 'DELIVERED';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delivery" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32, gap: 16 }}>
        <RouteMap
          pickupLat={delivery.pickup.lat}
          pickupLng={delivery.pickup.lng}
          dropoffLat={delivery.dropoff.lat}
          dropoffLng={delivery.dropoff.lng}
          meLat={locationQuery.data?.latitude}
          meLng={locationQuery.data?.longitude}
        />

        <StatusStepper status={delivery.status} />

        <View className="flex-row items-center justify-between">
          <View
            className={`rounded-full px-3 py-1 ${
              (DELIVERY_STATUS_STYLES[delivery.status] ?? { pill: 'bg-brand-surface' }).pill
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                (DELIVERY_STATUS_STYLES[delivery.status] ?? { text: 'text-gray-600' }).text
              }`}
            >
              {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
            </Text>
          </View>
          <View className="rounded-full bg-brand-gold-tint px-3 py-1">
            <Text className="text-base font-extrabold text-brand-navy">
              {delivery.feeNaira != null ? formatNaira(delivery.feeNaira) : '—'}
            </Text>
          </View>
        </View>

        <PartyCard dotClass="bg-green-500" label="Pickup" party={delivery.pickup} />
        <PartyCard dotClass="bg-red-500" label="Drop-off" party={delivery.dropoff} />

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="text-xs uppercase tracking-wider text-gray-400">Package</Text>
          <Text className="mt-1 text-base font-semibold text-gray-900">
            {delivery.packageCategory ?? 'Delivery'}
          </Text>
          {delivery.description ? (
            <Text className="text-sm text-gray-500">{delivery.description}</Text>
          ) : null}
        </View>

        {delivered ? (
          <View className="items-center gap-3 rounded-2xl bg-brand-blue-tint p-6">
            <CheckCircleIcon size={36} color={Brand.blue} />
            <Text className="text-lg font-extrabold text-brand-navy">Delivery complete</Text>
            {delivery.proofUrl ? (
              <Image
                source={{ uri: delivery.proofUrl }}
                className="h-40 w-full rounded-xl"
                resizeMode="cover"
              />
            ) : null}
          </View>
        ) : null}

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
      </ScrollView>

      {delivered ? null : (
        <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-3">
          {delivery.status === 'CONFIRMED' ? (
            arrivedPickup ? (
              <Button label="Confirm pickup" loading={pickup.isPending} onPress={() => pickup.mutate()} />
            ) : (
              <Button label="Arrive at pickup" onPress={() => setArrivedPickup(true)} />
            )
          ) : null}

          {delivery.status === 'IN_TRANSIT' ? (
            atDropoff ? (
              <View className="gap-3">
                {proofUri ? (
                  <Image source={{ uri: proofUri }} className="h-32 w-full rounded-xl" resizeMode="cover" />
                ) : null}
                <Button
                  label={proofKey ? 'Retake proof photo' : 'Take proof photo'}
                  variant="secondary"
                  loading={uploadingProof}
                  onPress={takeProof}
                />
                <Button
                  label="Complete delivery"
                  loading={complete.isPending}
                  onPress={() => complete.mutate()}
                />
              </View>
            ) : (
              <Button label="Start drop-off" onPress={() => setAtDropoff(true)} />
            )
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function PartyCard({
  dotClass,
  label,
  party,
}: {
  dotClass: string;
  label: string;
  party: DeliveryParty;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${dotClass}`} />
        <Text className="text-xs uppercase tracking-wider text-gray-400">{label}</Text>
      </View>
      <View>
        <Text className="text-base font-semibold text-gray-900">{party.name ?? '—'}</Text>
        <Text className="text-sm text-gray-500">{party.address ?? '—'}</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => callNumber(party.phone)}
          className="flex-1 items-center rounded-full bg-brand-surface py-3 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-brand-navy">Call</Text>
        </Pressable>
        <Pressable
          onPress={() => openDirections(party)}
          className="flex-1 items-center rounded-full bg-brand-blue py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}
