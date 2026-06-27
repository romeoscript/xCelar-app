import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { tapFeedback } from '@/lib/haptics';
import { getQuoteCountries, type RateCountry } from '@/lib/shipment-api';
import { CountryField } from './country-field';
import { WarehouseCard } from './warehouse-card';

export type ImportSenderValues = {
  senderIsSelf: boolean | null;
  destinationCountry: string;
  destinationCountryName: string;
  senderName: string;
  senderAddress: string;
  vendorName: string;
  vendorTrackingId: string;
};

export type ImportSenderStepProps = {
  values: ImportSenderValues;
  onChange: (partial: Partial<ImportSenderValues>) => void;
  errors: Partial<Record<keyof ImportSenderValues, string>>;
};

/** Import sender step: pick the origin country to reveal our warehouse there
 *  (where the customer ships their purchase), then the vendor + tracking id. */
export function ImportSenderStep({ values, onChange, errors }: ImportSenderStepProps) {
  const countriesQuery = useQuery({
    queryKey: ['rate-countries', 'IMPORT'],
    queryFn: () => getQuoteCountries('IMPORT'),
  });

  const warehouse = useMemo(
    () =>
      countriesQuery.data?.find((country) => country.code === values.destinationCountry)?.warehouse ??
      null,
    [countriesQuery.data, values.destinationCountry],
  );

  // Selecting a country fixes the origin warehouse as the shipment's "sender".
  const chooseCountry = (country: RateCountry) =>
    onChange({
      destinationCountry: country.code,
      destinationCountryName: country.name,
      senderName: country.warehouse ? `Xcelar Warehouse · ${country.name}` : '',
      senderAddress: country.warehouse?.address ?? '',
    });

  return (
    <View className="gap-5">
      <View className="gap-2">
        <View className="flex-row">
          <Text className="text-base font-semibold text-brand-navy">
            I&apos;m placing this order for
          </Text>
          <Text className="text-red-500"> *</Text>
        </View>
        <View className="flex-row gap-3">
          <ChoiceCard
            label="Myself"
            active={values.senderIsSelf === true}
            onPress={() => onChange({ senderIsSelf: true })}
          />
          <ChoiceCard
            label="Someone else"
            active={values.senderIsSelf === false}
            onPress={() => onChange({ senderIsSelf: false })}
          />
        </View>
        {errors.senderIsSelf ? (
          <Text className="text-sm text-red-500">{errors.senderIsSelf}</Text>
        ) : null}
      </View>

      <CountryField
        label="Country"
        required
        direction="IMPORT"
        error={errors.destinationCountry}
        value={values.destinationCountry}
        onChange={chooseCountry}
        placeholder="Select country"
      />

      {warehouse ? <WarehouseCard warehouse={warehouse} /> : null}

      <TextField
        label="Vendor/Business name"
        required
        error={errors.vendorName}
        value={values.vendorName}
        onChangeText={(value) => onChange({ vendorName: value })}
        placeholder="Enter vendor/business name"
      />
      <View className="gap-1">
        <TextField
          label="Tracking ID"
          value={values.vendorTrackingId}
          onChangeText={(value) => onChange({ vendorTrackingId: value })}
          placeholder="Enter tracking ID"
        />
        <Text className="text-xs text-brand-muted">Tracking ID is optional for import shipments.</Text>
      </View>
    </View>
  );
}

function ChoiceCard({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`flex-1 flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${
        active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? 'border-brand-blue' : 'border-gray-300'
        }`}
      >
        {active ? <View className="h-2.5 w-2.5 rounded-full bg-brand-blue" /> : null}
      </View>
      <Text className={`text-base font-semibold ${active ? 'text-brand-blue' : 'text-gray-900'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
