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
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { useCountUp } from '@/hooks/use-count-up';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatMoney } from '@/lib/format';
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
  const animatedMinor = useCountUp(breakdown ? Math.round(breakdown.total * 100) : 0);
  const currency = breakdown?.currency ?? (mode === 'IMPORT' ? 'USD' : 'NGN');

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Get a quote" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <SegmentedToggle options={MODE_OPTIONS} value={mode} onChange={changeMode} />

          <QuoteHero
            breakdown={breakdown}
            animatedAmount={animatedMinor / 100}
            currency={currency}
            isFetching={quoteQuery.isFetching}
            mode={mode}
            hasRoute={hasRoute}
          />

          {quoteQuery.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(quoteQuery.error)}</Text>
          ) : null}

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

          {breakdown ? <CostBreakdown breakdown={breakdown} /> : null}

          {mode === 'LOCAL' ? (
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

function QuoteHero({
  breakdown,
  animatedAmount,
  currency,
  isFetching,
  mode,
  hasRoute,
}: {
  breakdown: { minDays: number; maxDays: number; distanceKm: number } | null;
  animatedAmount: number;
  currency: string;
  isFetching: boolean;
  mode: QuoteMode;
  hasRoute: boolean;
}) {
  const emptyHint =
    mode === 'LOCAL'
      ? 'Enter a package weight to see your price'
      : 'Pick a country and weight to see your price';

  return (
    <View className="rounded-3xl bg-brand-navy p-6">
      <View className="h-5 flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-wider text-white/50">Estimated total</Text>
        {isFetching ? <ActivityIndicator color={Brand.gold} size="small" /> : null}
      </View>

      {breakdown ? (
        <Text className="mt-2 text-5xl font-extrabold text-brand-gold">
          {formatMoney(animatedAmount, currency)}
        </Text>
      ) : (
        <Text className="mt-2 text-4xl font-extrabold text-white/30">
          {currency === 'USD' ? '$' : '₦'} —
        </Text>
      )}

      {breakdown ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          <HeroChip label={`Delivery in ${breakdown.minDays}–${breakdown.maxDays} days`} />
          {mode === 'LOCAL' && hasRoute ? (
            <HeroChip label={`About ${breakdown.distanceKm} km`} />
          ) : null}
        </View>
      ) : (
        <Text className="mt-3 text-sm text-white/60">{emptyHint}</Text>
      )}
    </View>
  );
}

function HeroChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-white/10 px-3 py-1.5">
      <Text className="text-xs font-semibold text-white">{label}</Text>
    </View>
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
