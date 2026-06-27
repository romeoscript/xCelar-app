import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronRightIcon, StorefrontIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { getOrders, type Order } from '@/lib/marketplace-api';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  PREPARING: 'Being prepared',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersScreen() {
  const router = useRouter();
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: getOrders });
  const orders = ordersQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="My orders" />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        ListEmptyComponent={
          ordersQuery.isLoading ? null : (
            <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
              <StorefrontIcon size={32} color={Brand.muted} />
              <Text className="font-semibold text-gray-700">No orders yet</Text>
              <Text className="text-center text-sm text-gray-500">
                Order from a partner and it’ll show up here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />}
      />
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-navy" numberOfLines={1}>
          {order.vendorName}
        </Text>
        <Text className="text-xs text-gray-500">
          {itemCount} item{itemCount === 1 ? '' : 's'} · {STATUS_LABELS[order.status] ?? order.status}
        </Text>
      </View>
      <Text className="text-sm font-bold text-brand-navy">{formatNaira(order.totalKobo / 100)}</Text>
      <ChevronRightIcon size={20} color={Brand.muted} />
    </Pressable>
  );
}
