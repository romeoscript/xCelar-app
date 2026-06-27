import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldLabel } from '@/components/ui/field-label';
import { Brand } from '@/constants/theme';
import { getQuoteCountries, type RateCountry } from '@/lib/shipment-api';

/** Turn an ISO-3166 alpha-2 code into its flag emoji (regional indicators). */
function codeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((char) => String.fromCodePoint(127_397 + char.charCodeAt(0)))
    .join('');
}

export type CountryFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** EXPORT lists destinations; IMPORT lists origins. Defaults to EXPORT. */
  direction?: 'EXPORT' | 'IMPORT';
  /** Selected country ISO-2 code. */
  value: string;
  onChange: (country: RateCountry) => void;
  placeholder?: string;
};

/** Country picker for international shipments: a searchable list of the
 *  countries we ship to/from, sourced from the admin rate table. */
export function CountryField({
  label,
  required,
  error,
  direction = 'EXPORT',
  value,
  onChange,
  placeholder = 'Select country',
}: CountryFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const countriesQuery = useQuery({
    queryKey: ['rate-countries', direction],
    queryFn: () => getQuoteCountries(direction),
  });
  const countries = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? countries.filter((country) => country.name.toLowerCase().includes(term)) : countries;
  }, [countries, search]);

  const selected = countries.find((country) => country.code === value);

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={() => setOpen(true)}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:opacity-70"
      >
        <Text className={`text-base ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? `${codeToFlag(selected.code)}  ${selected.name}` : placeholder}
        </Text>
        <Text className="text-xs text-gray-400">▾</Text>
      </Pressable>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

      <BottomSheet visible={open} onClose={close}>
        <Text className="text-xl font-bold text-brand-navy">{label}</Text>
        {countriesQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={Brand.blue} />
          </View>
        ) : (
          <>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search countries"
              placeholderTextColor={Brand.muted}
              autoCorrect={false}
              className="mt-3 h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
            />
            <FlatList
              data={filtered}
              keyExtractor={(country) => country.code}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              className="mt-2"
              renderItem={({ item }) => {
                const isSelected = item.code === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      close();
                    }}
                    className="flex-row items-center justify-between py-3 active:opacity-60"
                  >
                    <Text
                      className={`text-base ${isSelected ? 'font-semibold text-brand-blue' : 'text-gray-800'}`}
                    >
                      {codeToFlag(item.code)}  {item.name}
                    </Text>
                    {isSelected ? <Text className="text-brand-blue">✓</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="py-8 text-center text-base text-gray-500">No matches.</Text>
              }
            />
          </>
        )}
      </BottomSheet>
    </View>
  );
}
