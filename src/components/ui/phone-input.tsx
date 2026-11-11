import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { type Country } from '@/constants/countries';
import { Brand } from '@/constants/theme';
import { parseE164, toE164 } from '@/lib/phone';
import { CountryCodePicker } from './country-code-picker';
import { FieldFrame } from './field-frame';
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
  const [focused, setFocused] = useState(false);

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
        <View className="flex-1">
          <FieldFrame focused={focused} error={error}>
            <TextInput
              value={national}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChangeText={(text) => {
                const digits = text.replace(/[^\d]/g, '');
                setNational(digits);
                emit(country, digits);
              }}
              placeholder="801 234 5678"
              placeholderTextColor={Brand.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
              // Stop typing past the country's number length (+1 for an optional
              // trunk 0). Falls back to a generous cap where the length varies.
              maxLength={(country.nationalDigits ?? 14) + 1}
              className="h-12 pr-4 text-base text-gray-900"
            />
          </FieldFrame>
        </View>
      </View>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
