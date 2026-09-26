import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PencilIcon, PinIcon, SearchIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { tapFeedback } from '@/lib/haptics';
import { searchAddresses, type AddressSuggestion } from '@/lib/places';

const MIN_QUERY = 3;

export type AddressSearchModalProps = {
  visible: boolean;
  title: string;
  initialQuery: string;
  onClose: () => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  /** The typed text as-is, for addresses the map data doesn't know. */
  onUseTyped: (address: string) => void;
};

/**
 * Full-screen address type-ahead. Results sit directly under the input so the
 * keyboard can never cover them (it did when they rendered inline in a form).
 */
export function AddressSearchModal({
  visible,
  title,
  initialQuery,
  onClose,
  onSelect,
  onUseTyped,
}: AddressSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);

  // Start from the current address each time the search opens.
  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
    }
  }, [visible, initialQuery]);

  const debouncedQuery = useDebouncedValue(query.trim());
  const searchable = debouncedQuery.length >= MIN_QUERY;
  const suggestionsQuery = useQuery({
    queryKey: ['address-search', debouncedQuery],
    queryFn: () => searchAddresses(debouncedQuery),
    enabled: visible && searchable,
    staleTime: 5 * 60_000,
  });
  const suggestions = searchable ? (suggestionsQuery.data ?? []) : [];
  const typed = query.trim();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-lg font-bold text-brand-navy">{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-70">
            <Text className="text-base font-semibold text-brand-blue">Cancel</Text>
          </Pressable>
        </View>

        <View className="mx-4 mt-2 h-14 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
          <SearchIcon size={20} color={Brand.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            placeholder="Street, area or landmark"
            placeholderTextColor={Brand.muted}
            className="flex-1 text-base text-gray-900"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear"
              className="h-6 w-6 items-center justify-center rounded-full bg-gray-300 active:opacity-70"
            >
              <Text className="text-xs font-bold text-white">✕</Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ResultRow
              icon={<PinIcon size={18} color={Brand.blue} />}
              title={item.title}
              subtitle={item.address}
              onPress={() => {
                tapFeedback();
                onSelect(item);
              }}
            />
          )}
          ListHeaderComponent={
            suggestionsQuery.isFetching && searchable ? (
              <View className="flex-row items-center gap-2 px-1 pb-3">
                <ActivityIndicator size="small" color={Brand.muted} />
                <Text className="text-sm text-gray-400">Searching…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            suggestionsQuery.isFetching ? null : (
              <Text className="px-1 py-2 text-sm text-gray-400">
                {typed.length < MIN_QUERY
                  ? 'Type at least 3 characters to search.'
                  : 'No matches. Try a street or area name, or use the address as typed.'}
              </Text>
            )
          }
          ListFooterComponent={
            typed.length >= MIN_QUERY ? (
              <View className="mt-2 border-t border-gray-100 pt-2">
                <ResultRow
                  icon={<PencilIcon size={18} color={Brand.muted} />}
                  title={`Use “${typed}”`}
                  subtitle="Enter this address exactly as typed"
                  onPress={() => {
                    tapFeedback();
                    onUseTyped(typed);
                  }}
                />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl px-1 py-3 active:bg-gray-50"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-surface">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
