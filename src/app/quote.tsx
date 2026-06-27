import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressField, type AddressValue } from '@/components/ship/address-field';
import { CostBreakdown } from '@/components/ship/cost-breakdown';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useCountUp } from '@/hooks/use-count-up';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import {
  createDraft,
  getQuote,
  updateShipment,
  type QuoteInput,
  type ShipmentUpdate,
} from '@/lib/shipment-api';

const TRACK_OFF = '#D1D5DB';
const EMPTY_ADDRESS: AddressValue = { address: '', lat: null, lng: null };

export default function QuoteScreen() {
  const router = useRouter();

  const [pickup, setPickup] = useState<AddressValue>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<AddressValue>(EMPTY_ADDRESS);
  const [weight, setWeight] = useState('');
  const [fragile, setFragile] = useState(false);

  const weightKg = Number(weight);
  const hasWeight = Number.isFinite(weightKg) && weightKg > 0;
  const hasRoute =
    pickup.lat != null && pickup.lng != null && delivery.lat != null && delivery.lng != null;

  const quoteInput: QuoteInput = {
    weightKg,
    fragile,
    ...(hasRoute
      ? {
          senderLat: pickup.lat ?? undefined,
          senderLng: pickup.lng ?? undefined,
          receiverLat: delivery.lat ?? undefined,
          receiverLng: delivery.lng ?? undefined,
        }
      : {}),
  };

  const quoteQuery = useQuery({
    queryKey: ['quote', weightKg, fragile, pickup.lat, pickup.lng, delivery.lat, delivery.lng],
    queryFn: () => getQuote(quoteInput),
    enabled: hasWeight,
  });

  const breakdown = quoteQuery.data ?? null;
  const animatedKobo = useCountUp(breakdown ? Math.round(breakdown.total * 100) : 0);

  const booking = useMutation({
    mutationFn: async () => {
      const draft = await createDraft('LOCAL');
      const update: ShipmentUpdate = { weightKg, fragile };
      if (pickup.address.trim()) {
        update.senderAddress = pickup.address.trim();
      }
      if (pickup.lat != null && pickup.lng != null) {
        update.senderLat = pickup.lat;
        update.senderLng = pickup.lng;
      }
      if (delivery.address.trim()) {
        update.receiverAddress = delivery.address.trim();
      }
      if (delivery.lat != null && delivery.lng != null) {
        update.receiverLat = delivery.lat;
        update.receiverLng = delivery.lng;
      }
      await updateShipment(draft.id, update);
      return draft.id;
    },
    onSuccess: (id) => router.replace({ pathname: '/ship-local', params: { id } }),
  });

  const heroSubtitle = breakdown
    ? hasRoute
      ? `Distance-based estimate · about ${breakdown.distanceKm} km`
      : 'Add precise pickup and delivery for a distance-based estimate'
    : 'Enter a package weight to see your price';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Get a quote" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View className="rounded-3xl bg-brand-navy p-6">
            <View className="h-5 flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-wider text-white/50">Estimated total</Text>
              {quoteQuery.isFetching ? <ActivityIndicator color={Brand.gold} size="small" /> : null}
            </View>
            {breakdown ? (
              <Text className="mt-2 text-5xl font-extrabold text-brand-gold">
                {formatNaira(animatedKobo / 100)}
              </Text>
            ) : (
              <Text className="mt-2 text-4xl font-extrabold text-white/30">₦ —</Text>
            )}
            <Text className="mt-3 text-sm text-white/60">{heroSubtitle}</Text>
          </View>

          {quoteQuery.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(quoteQuery.error)}</Text>
          ) : null}

          <View className="gap-5">
            <AddressField label="Pickup address" value={pickup} onChange={setPickup} />
            <AddressField label="Delivery address" value={delivery} onChange={setDelivery} />
            <TextField
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />
            <FragileToggle value={fragile} onChange={setFragile} />
          </View>

          {breakdown ? <CostBreakdown breakdown={breakdown} /> : null}

          <View className="gap-2">
            <Button
              label="Book this delivery"
              loading={booking.isPending}
              disabled={!hasWeight}
              onPress={() => booking.mutate()}
            />
            <Text className="text-center text-xs text-gray-400">
              Final price is confirmed at checkout.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FragileToggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-gray-900">Fragile item</Text>
        <Text className="text-sm text-gray-500">Adds a careful-handling surcharge</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: Brand.blue, false: TRACK_OFF }}
        ios_backgroundColor={TRACK_OFF}
        thumbColor="#ffffff"
      />
    </View>
  );
}
