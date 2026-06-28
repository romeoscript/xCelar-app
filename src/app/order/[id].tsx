import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckCircleIcon } from '@/components/icons';
import { PaymentOptions, type PaymentMethod } from '@/components/ship/payment-options';
import { PaystackCheckout } from '@/components/paystack-checkout';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import { successFeedback } from '@/lib/haptics';
import { getOrder, initPaystackForOrder, payOrderWithBalance } from '@/lib/marketplace-api';
import { toast } from '@/lib/toast-store';
import { getWalletBalance, type VerifyResult } from '@/lib/wallet-api';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  PREPARING: 'Being prepared',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [method, setMethod] = useState<PaymentMethod>('balance');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkout, setCheckout] = useState<{ authorizationUrl: string; reference: string } | null>(
    null,
  );
  const [payError, setPayError] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });

  const refreshAfterPayment = async () => {
    successFeedback();
    try {
      updateUser({ balanceKobo: await getWalletBalance() });
    } catch {
      // Balance refreshes on next load.
    }
    await orderQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    toast('Order placed 🎉');
  };

  const payBalance = useMutation({
    mutationFn: () => payOrderWithBalance(id as string),
    onSuccess: refreshAfterPayment,
    onError: (failure) => setPayError(getApiErrorMessage(failure)),
  });

  const initPaystack = useMutation({
    mutationFn: () => initPaystackForOrder(id as string),
    onSuccess: (init) => setCheckout(init),
    onError: (failure) => setPayError(getApiErrorMessage(failure)),
  });

  const handlePay = () => {
    setPayError(null);
    if (method === 'balance') {
      payBalance.mutate();
    } else {
      initPaystack.mutate();
    }
  };

  const handleCheckoutResult = async (result: VerifyResult) => {
    setCheckout(null);
    if (result.success) {
      await refreshAfterPayment();
      return;
    }
    if (result.status && result.status !== 'abandoned') {
      toast('Payment didn’t go through — your order is saved.', 'error');
    }
  };

  if (!id) {
    return <Redirect href="/marketplace" />;
  }

  if (orderQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <ScreenHeader title="Order" />
        <QueryError message="Couldn’t load this order." onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  if (orderQuery.isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </SafeAreaView>
    );
  }

  const payPending = payBalance.isPending || initPaystack.isPending || checkout != null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Order" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-brand-navy">{order.vendorName}</Text>
          <View className="rounded-full bg-brand-blue-tint px-3 py-1">
            <Text className="text-xs font-semibold text-brand-blue">
              {STATUS_LABELS[order.status] ?? order.status}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          {order.items.map((item) => (
            <View key={item.id} className="flex-row items-center justify-between py-1">
              <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                {item.quantity} × {item.name}
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                {formatNaira(item.lineTotalKobo / 100)}
              </Text>
            </View>
          ))}
          <View className="my-3 h-px bg-gray-100" />
          <Row label="Items subtotal" value={order.subtotalKobo} />
          <Row label="Delivery fee" value={order.deliveryFeeKobo} />
          <View className="my-3 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-brand-navy">Total</Text>
            <Text className="text-lg font-extrabold text-brand-navy">
              {formatNaira(order.totalKobo / 100)}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="text-xs uppercase tracking-wider text-gray-400">Deliver to</Text>
          <Text className="mt-1 text-base font-semibold text-gray-900">{order.receiverName}</Text>
          <Text className="text-sm text-gray-500">{order.receiverPhone}</Text>
          <Text className="text-sm text-gray-500">{order.deliveryAddress}</Text>
        </View>

        {order.paid ? (
          <>
            <View className="flex-row items-center gap-2 rounded-2xl bg-brand-blue-tint px-4 py-3">
              <CheckCircleIcon size={20} color={Brand.blue} />
              <Text className="flex-1 text-sm font-medium text-brand-navy">
                Payment received. Your order is on its way.
              </Text>
            </View>
            {order.shipmentId ? (
              <Button
                label="Track delivery"
                onPress={() => router.push(`/shipment/${order.shipmentId}`)}
              />
            ) : null}
          </>
        ) : (
          <>
            <PaymentOptions
              price={order.totalKobo / 100}
              balanceKobo={user?.balanceKobo ?? 0}
              method={method}
              onMethodChange={setMethod}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onOpenTerms={() => router.push('/terms')}
            />
            {payError ? <Text className="text-sm text-red-500">{payError}</Text> : null}
            <Button
              label={`Pay ${formatNaira(order.totalKobo / 100)}`}
              loading={payPending}
              disabled={!termsAccepted}
              onPress={handlePay}
            />
          </>
        )}
      </ScrollView>

      <PaystackCheckout
        authorizationUrl={checkout?.authorizationUrl ?? null}
        reference={checkout?.reference ?? null}
        onCancel={() => setCheckout(null)}
        onResult={handleCheckoutResult}
      />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{formatNaira(value / 100)}</Text>
    </View>
  );
}
