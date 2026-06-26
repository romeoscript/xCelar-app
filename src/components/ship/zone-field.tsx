import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Brand } from '@/constants/theme';
import { getZones } from '@/lib/zone-api';

export type ZoneFieldProps = {
  label: string;
  value: string;
  onChange: (zone: string) => void;
  placeholder?: string;
};

export function ZoneField({ label, value, onChange, placeholder = 'Select zone' }: ZoneFieldProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: getZones });
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? zones.filter((zone) => zone.name.toLowerCase().includes(term)) : zones;
  }, [zones, search]);

  const close = () => {
    setSheetOpen(false);
    setSearch('');
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <Pressable
        onPress={() => setSheetOpen(true)}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:opacity-70"
      >
        <Text className={value ? 'text-base text-gray-900' : 'text-base text-brand-muted'}>
          {value || placeholder}
        </Text>
        <Text className="text-xs text-gray-400">▾</Text>
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={close}>
        <Text className="text-xl font-bold text-brand-navy">{label}</Text>
        {zonesQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={Brand.blue} />
          </View>
        ) : zones.length > 0 ? (
          <>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search area or state"
              placeholderTextColor={Brand.muted}
              autoCorrect={false}
              className="mt-3 h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
            />
            <FlatList
              data={filtered}
              keyExtractor={(zone) => zone.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              className="mt-2"
              renderItem={({ item }) => {
                const selected = item.name === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.name);
                      close();
                    }}
                    className="flex-row items-center justify-between py-3 active:opacity-60"
                  >
                    <Text
                      className={`text-base ${selected ? 'font-semibold text-brand-blue' : 'text-gray-800'}`}
                    >
                      {item.name}
                    </Text>
                    {selected ? <Text className="text-brand-blue">✓</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="py-8 text-center text-base text-gray-500">No matches.</Text>
              }
            />
          </>
        ) : (
          <Text className="py-8 text-center text-base text-gray-500">
            No zones available right now.
          </Text>
        )}
      </BottomSheet>
    </View>
  );
}
