import { Text, TextInput, View } from 'react-native';

import { type Country } from '@/constants/countries';
import { Brand } from '@/constants/theme';
import { CountryCodePicker } from './country-code-picker';

export type PhoneFieldProps = {
  label: string;
  country: Country;
  onSelectCountry: (country: Country) => void;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
};

export function PhoneField({
  label,
  country,
  onSelectCountry,
  value,
  onChangeText,
  error,
}: PhoneFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <View className="flex-row gap-2">
        <CountryCodePicker value={country} onChange={onSelectCountry} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
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
