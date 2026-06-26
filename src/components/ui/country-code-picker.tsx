import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COUNTRIES, type Country } from '@/constants/countries';
import { Brand } from '@/constants/theme';

export type CountryCodePickerProps = {
  value: Country;
  onChange: (country: Country) => void;
};

export function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return COUNTRIES;
    }
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(term) || country.dialCode.includes(term),
    );
  }, [query]);

  const select = (country: Country) => {
    onChange(country);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="h-14 flex-row items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 active:opacity-70"
      >
        <Text className="text-base">{value.flag}</Text>
        <Text className="text-base font-medium text-gray-900">{value.dialCode}</Text>
        <Text className="text-xs text-gray-400">▾</Text>
      </Pressable>

      <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 pb-2 pt-2">
            <Text className="text-xl font-bold text-brand-navy">Select country</Text>
            <Pressable onPress={() => setIsOpen(false)} className="active:opacity-70">
              <Text className="text-base font-semibold text-brand-blue">Close</Text>
            </Pressable>
          </View>

          <View className="px-6 pb-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={Brand.muted}
              autoCorrect={false}
              className="h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(country) => country.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.code === value.code;
              return (
                <Pressable
                  onPress={() => select(item)}
                  className={`flex-row items-center gap-3 px-6 py-3 active:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
                >
                  <Text className="text-xl">{item.flag}</Text>
                  <Text className="flex-1 text-base text-gray-900">{item.name}</Text>
                  <Text className="text-base text-gray-500">{item.dialCode}</Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
