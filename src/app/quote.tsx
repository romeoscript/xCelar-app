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
import { QuoteResult } from '@/components/ship/quote-result';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useCountUp } from '@/hooks/use-count-up';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  createDraft,
  getQuote,
  getQuoteCountries,
  updateShipment,
  type QuoteInput,
  type QuoteMode,
  type ShipmentUpdate,
} from '@/lib/shipment-api';

const TRACK_OFF = '#D1D5DB';
const EMPTY_ADDRESS: AddressValue = { address: '', lat: null, lng: null };

const MODE_OPTIONS: { label: string; value: QuoteMode }[] = [
  { label: 'Local', value: 'LOCAL' },
  { label: 'From Nigeria', value: 'EXPORT' },
  { label: 'To Nigeria', value: 'IMPORT' },
];

export default function QuoteScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<QuoteMode>('LOCAL');
  const [pickup, setPickup] = useState<AddressValue>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<AddressValue>(EMPTY_ADDRESS);
  const [country, setCountry] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [fragile, setFragile] = useState(false);

  const isIntl = mode !== 'LOCAL';
  const weightKg = Number(weight);
  const hasWeight = Number.isFinite(weightKg) && weightKg > 0;
  const hasRoute =
    pickup.lat != null && pickup.lng != null && delivery.lat != null && delivery.lng != null;

  const changeMode = (next: QuoteMode) => {
    setMode(next);
    setCountry(null);
  };

  const countriesQuery = useQuery({
    queryKey: ['quote-countries', mode],
    queryFn: () => getQuoteCountries(mode === 'EXPORT' ? 'EXPORT' : 'IMPORT'),
    enabled: isIntl,
  });
  const countryOptions = (countriesQuery.data ?? []).map((item) => ({
    value: item.code,
    label: item.name,
  }));
  const countryName = countryOptions.find((option) => option.value === country)?.label ?? null;

  const quoteInput: QuoteInput = isIntl
    ? { mode, weightKg, country: country ?? undefined }
    : {
        mode: 'LOCAL',
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

  const canQuote = hasWeight && (!isIntl || Boolean(country));

  const quoteQuery = useQuery({
    queryKey: ['quote', mode, weightKg, fragile, country, pickup.lat, pickup.lng, delivery.lat, delivery.lng],
    queryFn: () => getQuote(quoteInput),
    enabled: canQuote,
  });

  const breakdown = quoteQuery.data ?? null;
  const animatedAmount = useCountUp(breakdown ? Math.round(breakdown.total * 100) : 0) / 100;

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

  const pickupLabel = labelFor('pickup', mode, pickup.address, countryName);
  const dropoffLabel = labelFor('dropoff', mode, delivery.address, countryName);
  const emptyHint =
    mode === 'LOCAL'
      ? 'Add a weight to see your estimate'
      : 'Pick a country and weight to see your estimate';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Get a quote" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Text className="text-sm text-gray-500">
            Get a free estimate for local, export, or import delivery.
          </Text>

          <SegmentedToggle options={MODE_OPTIONS} value={mode} onChange={changeMode} />

          <View className="gap-5">
            {mode === 'LOCAL' ? (
              <>
                <AddressField label="Pickup address" value={pickup} onChange={setPickup} />
                <AddressField label="Delivery address" value={delivery} onChange={setDelivery} />
              </>
            ) : (
              <SelectField
                label={mode === 'EXPORT' ? 'Destination country' : 'Origin country'}
                value={country}
                options={countryOptions}
                onChange={setCountry}
                placeholder={countriesQuery.isLoading ? 'Loading countries…' : 'Select country'}
              />
            )}

            <TextField
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />

            {mode === 'LOCAL' ? <FragileToggle value={fragile} onChange={setFragile} /> : null}
          </View>

          {quoteQuery.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(quoteQuery.error)}</Text>
          ) : breakdown ? (
            <QuoteResult
              pickupLabel={pickupLabel}
              dropoffLabel={dropoffLabel}
              amount={animatedAmount}
              breakdown={breakdown}
            />
          ) : quoteQuery.isFetching ? (
            <View className="flex-row items-center justify-center gap-2 py-3">
              <ActivityIndicator color={Brand.blue} />
              <Text className="text-sm text-gray-500">Calculating estimate…</Text>
            </View>
          ) : (
            <Text className="py-3 text-center text-sm text-gray-400">{emptyHint}</Text>
          )}

          {mode === 'LOCAL' ? (
            <View className="gap-2">
              <Button
                label="Create shipment"
                loading={booking.isPending}
                disabled={!hasWeight}
                onPress={() => booking.mutate()}
              />
              <Text className="text-center text-xs text-gray-400">
                Final price is confirmed at checkout.
              </Text>
            </View>
          ) : breakdown ? (
            <Text className="text-center text-xs text-gray-400">
              International bookings are arranged by our team — contact support to ship this.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function labelFor(
  end: 'pickup' | 'dropoff',
  mode: QuoteMode,
  address: string,
  countryName: string | null,
): string {
  if (mode === 'LOCAL') {
    return address.trim() || (end === 'pickup' ? 'Pickup' : 'Drop-off');
  }
  const here = 'Nigeria';
  const abroad = countryName ?? 'Select country';
  if (mode === 'EXPORT') {
    return end === 'pickup' ? here : abroad;
  }
  return end === 'pickup' ? abroad : here;
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
