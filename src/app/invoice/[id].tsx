import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvoiceStatePill } from '@/components/business/invoice-state-pill';
import { PaystackCheckout } from '@/components/paystack-checkout';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  BusinessQueryKeys,
  formatShortDate,
  getMyInvoice,
  invoicePeriodLabel,
  payInvoice,
  type InvoiceDetail,
} from '@/lib/business-api';
import { formatNaira } from '@/lib/format';
import { toast } from '@/lib/toast-store';
import type { PaymentInit, VerifyResult } from '@/lib/wallet-api';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: BusinessQueryKeys.invoice(id), queryFn: () => getMyInvoice(id), enabled: Boolean(id) });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Invoice" />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : query.isError || !query.data ? (
        <QueryError message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        <InvoiceBody invoice={query.data} />
      )}
    </SafeAreaView>
  );
}

function InvoiceBody({ invoice }: { invoice: InvoiceDetail }) {
  const queryClient = useQueryClient();
  const [checkout, setCheckout] = useState<PaymentInit | null>(null);
  const payable = invoice.state === 'UNPAID' || invoice.state === 'OVERDUE';
  const { bank } = invoice;

  const startPayment = useMutation({ mutationFn: () => payInvoice(invoice.id), onSuccess: setCheckout });

  const handleResult = (result: VerifyResult) => {
    setCheckout(null);
    void queryClient.invalidateQueries({ queryKey: BusinessQueryKeys.invoice(invoice.id) });
    void queryClient.invalidateQueries({ queryKey: BusinessQueryKeys.invoices });
    void queryClient.invalidateQueries({ queryKey: BusinessQueryKeys.mine });
    if (result.success) {
      toast('Invoice paid');
    } else if (result.status && result.status !== 'abandoned') {
      toast('Payment didn’t go through. Try again anytime.');
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View className="gap-2">
          <InvoiceStatePill state={invoice.state} />
          <Text className="text-3xl font-extrabold text-brand-navy">{formatNaira(invoice.totalNaira)}</Text>
          <Text className="text-sm text-gray-500">
            {invoicePeriodLabel(invoice.periodStart)} · {invoice.deliveryCount} deliver{invoice.deliveryCount === 1 ? 'y' : 'ies'}
          </Text>
          <Text className={`text-sm ${invoice.state === 'OVERDUE' ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
            {invoice.state === 'PAID' ? `Paid ${formatShortDate(invoice.paidAt)}` : `Due ${formatShortDate(invoice.dueAt)}`} ·{' '}
            {invoice.number}
          </Text>
        </View>

        <View className="rounded-3xl border border-gray-100">
          {invoice.lines.map((line, index) => (
            <View
              key={line.shipmentId}
              className={`flex-row items-center justify-between gap-3 px-4 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">{line.trackingCode ?? '—'}</Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {formatShortDate(line.bookedAt)} · {line.recipientName ?? 'Recipient'}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-gray-900">{formatNaira(line.feeNaira)}</Text>
            </View>
          ))}
        </View>

        {payable && bank.bankName && bank.accountNumber ? (
          <View className="gap-1 rounded-2xl bg-brand-surface p-4">
            <Text className="text-sm font-semibold text-brand-navy">Or pay by bank transfer</Text>
            <Text className="text-sm text-gray-600">
              {bank.bankName} · {bank.accountNumber}
              {bank.accountName ? ` · ${bank.accountName}` : ''}
            </Text>
            <Text className="text-xs text-gray-500">Use {invoice.number} as the reference. We’ll mark it paid once it arrives.</Text>
          </View>
        ) : null}

        {startPayment.isError ? <Text className="text-sm text-red-500">{getApiErrorMessage(startPayment.error)}</Text> : null}
      </ScrollView>

      {payable ? (
        <View className="px-6 pb-2">
          <Button
            label={`Pay ${formatNaira(invoice.totalNaira)}`}
            loading={startPayment.isPending || checkout != null}
            onPress={() => startPayment.mutate()}
          />
        </View>
      ) : null}

      <PaystackCheckout
        authorizationUrl={checkout?.authorizationUrl ?? null}
        reference={checkout?.reference ?? null}
        onCancel={() => setCheckout(null)}
        onResult={handleResult}
      />
    </>
  );
}
