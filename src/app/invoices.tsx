import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvoiceStatePill } from '@/components/business/invoice-state-pill';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { BusinessQueryKeys, formatShortDate, getMyInvoices, invoicePeriodLabel } from '@/lib/business-api';
import { formatNaira } from '@/lib/format';

export default function InvoicesScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: BusinessQueryKeys.invoices, queryFn: getMyInvoices });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Invoices" />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : query.isError ? (
        <QueryError message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(invoice) => invoice.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={Brand.blue} />}
          ListEmptyComponent={
            <Text className="pt-10 text-center text-sm text-gray-500">
              No invoices yet. Your first one arrives at the start of next month.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/invoice/${item.id}`)}
              className="gap-2 rounded-2xl border border-gray-100 p-4 active:opacity-80"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-base font-bold text-brand-navy">{invoicePeriodLabel(item.periodStart)}</Text>
                  <Text className="text-xs text-gray-400">{item.number}</Text>
                </View>
                <Text className="text-base font-bold text-gray-900">{formatNaira(item.totalNaira)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <InvoiceStatePill state={item.state} />
                <Text className={`text-xs ${item.state === 'OVERDUE' ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                  {item.state === 'PAID' ? `Paid ${formatShortDate(item.paidAt)}` : `Due ${formatShortDate(item.dueAt)}`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
