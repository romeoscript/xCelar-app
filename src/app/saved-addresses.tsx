import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { deleteSavedAddress, getSavedAddresses, type SavedAddress } from '@/lib/address-api';
import { toast } from '@/lib/toast-store';

export default function SavedAddressesScreen() {
  const queryClient = useQueryClient();
  const savedQuery = useQuery({ queryKey: ['saved-addresses'], queryFn: getSavedAddresses });
  const saved = savedQuery.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      toast('Address removed');
    },
  });

  const confirmRemove = (entry: SavedAddress) => {
    Alert.alert('Remove address', `Remove ${entry.contactName} from your saved addresses?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(entry.id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Saved addresses" />
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          savedQuery.isLoading ? null : (
            <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
              <PinIcon size={32} color={Brand.muted} />
              <Text className="font-semibold text-gray-700">No saved addresses</Text>
              <Text className="text-center text-sm text-gray-500">
                Addresses you save while booking a shipment show up here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue-tint">
              <PinIcon size={20} color={Brand.blue} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">{item.contactName}</Text>
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {item.contactPhone} · {item.address}
              </Text>
            </View>
            <Pressable onPress={() => confirmRemove(item)} hitSlop={8} className="active:opacity-60">
              <Text className="text-sm font-medium text-red-500">Remove</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
