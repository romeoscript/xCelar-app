import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { type Country } from '@/constants/countries';
import { Brand } from '@/constants/theme';
import { parseE164, toE164 } from '@/lib/phone';
import { CountryCodePicker } from './country-code-picker';
import { FieldLabel } from './field-label';

export type PhoneInputProps = {
  label?: string;
  required?: boolean;
  /** Stored value in E.164 (e.g. +2348012345678). */
  value: string;
  onChange: (e164: string) => void;
  error?: string;
};

/**
 * Phone entry with a country-code dropdown (default Nigeria). Emits the value
 * in E.164 form. Prefills the country + national number from an existing value.
 */
export function PhoneInput({ label, required, value, onChange, error }: PhoneInputProps) {
  const initial = parseE164(value);
  const [country, setCountry] = useState<Country>(initial.country);
  const [national, setNational] = useState(initial.national);

  const emit = (nextCountry: Country, nextNational: string) => {
    const digits = nextNational.replace(/\D/g, '');
    onChange(digits ? toE164(nextCountry, digits) : '');
  };

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />
      <View className="flex-row gap-2">
        <CountryCodePicker
          value={country}
          onChange={(next) => {
            setCountry(next);
            emit(next, national);
          }}
        />
        <TextInput
          value={national}
          onChangeText={(text) => {
            const digits = text.replace(/[^\d]/g, '');
            setNational(digits);
            emit(country, digits);
          }}
          placeholder="801 234 5678"
          placeholderTextColor={Brand.muted}
          keyboardType="phone-pad"
          autoComplete="tel"
          className="h-14 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
        />
      </View>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
