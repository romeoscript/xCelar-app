import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Keyboard,
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
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useCountUp } from '@/hooks/use-count-up';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  createDraft,
  getOpenDraft,
  getQuote,
  getQuoteCountries,
  updateShipment,
  type PriceBreakdown,
  type QuoteInput,
  type QuoteMode,
  type ShipmentUpdate,
} from '@/lib/shipment-api';

const TRACK_OFF = '#D1D5DB';
const EMPTY_ADDRESS: AddressValue = { address: '', lat: null, lng: null };

const MODE_OPTIONS: { label: string; value: QuoteMode }[] = [
  { label: 'Local', value: 'LOCAL' },
  { label: 'Send from Nigeria', value: 'EXPORT' },
  { label: 'Send to Nigeria', value: 'IMPORT' },
];

export default function QuoteScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<QuoteMode>('LOCAL');
  const [pickup, setPickup] = useState<AddressValue>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<AddressValue>(EMPTY_ADDRESS);
  const [country, setCountry] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [fragile, setFragile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isIntl = mode !== 'LOCAL';
  const weightKg = Number(weight);
  const hasWeight = Number.isFinite(weightKg) && weightKg > 0;
  const hasRoute =
    pickup.lat != null && pickup.lng != null && delivery.lat != null && delivery.lng != null;

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

  const quoteMutation = useMutation({
    mutationFn: (input: QuoteInput) => getQuote(input),
    onSuccess: () => setSheetOpen(true),
  });
  const breakdown: PriceBreakdown | null = quoteMutation.data ?? null;
  const animatedAmount = useCountUp(breakdown ? Math.round(breakdown.total * 100) : 0) / 100;

  const canGetQuote =
    hasWeight && (isIntl ? Boolean(country) : Boolean(pickup.address.trim() && delivery.address.trim()));

  const handleGetQuote = () => {
    Keyboard.dismiss();
    const input: QuoteInput = isIntl
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
    quoteMutation.mutate(input);
  };

  // Changing inputs invalidates the last estimate so the sheet can't show stale data.
  const resetQuote = () => {
    if (quoteMutation.data || quoteMutation.isError) {
      quoteMutation.reset();
    }
  };

  const changeMode = (next: QuoteMode) => {
    setMode(next);
    setCountry(null);
    resetQuote();
  };

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

  // International handoff: reuse an open draft (or make one), carry over the
  // country + weight, and continue in the export booking flow.
  const intlBooking = useMutation({
    mutationFn: async () => {
      const draft = (await getOpenDraft(mode)) ?? (await createDraft(mode));
      await updateShipment(draft.id, {
        weightKg,
        ...(country ? { destinationCountry: country } : {}),
        ...(countryName ? { destinationCountryName: countryName } : {}),
      });
      return draft.id;
    },
    onSuccess: (id) =>
      router.replace({ pathname: mode === 'IMPORT' ? '/ship-import' : '/ship-export', params: { id } }),
  });

  const pickupLabel = labelFor('pickup', mode, pickup.address, countryName);
  const dropoffLabel = labelFor('dropoff', mode, delivery.address, countryName);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Get a quote" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Text className="text-sm text-gray-500">
            Get a free estimate for local, export, or import delivery.
          </Text>

          <SelectField label="Delivery type" value={mode} options={MODE_OPTIONS} onChange={changeMode} />

          {mode === 'LOCAL' ? (
            <>
              <AddressField
                label="Pickup address"
                value={pickup}
                onChange={(next) => {
                  setPickup(next);
                  resetQuote();
                }}
              />
              <AddressField
                label="Delivery address"
                value={delivery}
                onChange={(next) => {
                  setDelivery(next);
                  resetQuote();
                }}
              />
            </>
          ) : (
            <SelectField
              label={mode === 'EXPORT' ? 'Destination country' : 'Origin country'}
              value={country}
              options={countryOptions}
              onChange={(next) => {
                setCountry(next);
                resetQuote();
              }}
              placeholder={countriesQuery.isLoading ? 'Loading countries…' : 'Select country'}
            />
          )}

          <TextField
            label="Weight (kg)"
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              resetQuote();
            }}
            placeholder="e.g. 2.5"
            keyboardType="decimal-pad"
          />

          {mode === 'LOCAL' ? (
            <FragileToggle
              value={fragile}
              onChange={(next) => {
                setFragile(next);
                resetQuote();
              }}
            />
          ) : null}

          {quoteMutation.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(quoteMutation.error)}</Text>
          ) : null}

          <Button
            label="Get quote"
            loading={quoteMutation.isPending}
            disabled={!canGetQuote}
            onPress={handleGetQuote}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={sheetOpen && breakdown != null} onClose={() => setSheetOpen(false)}>
        <Text className="text-xl font-bold text-brand-navy">Estimated quote</Text>
        {breakdown ? (
          <ScrollView style={{ maxHeight: 460 }} className="mt-3" showsVerticalScrollIndicator={false}>
            <View className="gap-3 pb-1">
              <QuoteResult
                pickupLabel={pickupLabel}
                dropoffLabel={dropoffLabel}
                amount={animatedAmount}
                breakdown={breakdown}
              />
              <View className="gap-2">
                <Button
                  label="Create shipment"
                  loading={mode === 'LOCAL' ? booking.isPending : intlBooking.isPending}
                  onPress={() => (mode === 'LOCAL' ? booking.mutate() : intlBooking.mutate())}
                />
                <Text className="text-center text-xs text-gray-400">
                  Final price is confirmed at checkout.
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : null}
      </BottomSheet>
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
