import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaystackCheckout } from '@/components/paystack-checkout';
import { ChevronLeftIcon } from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getTransactions, topupWallet, type Transaction } from '@/lib/wallet-api';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ authorizationUrl: string; reference: string } | null>(
    null,
  );

  const txQuery = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });

  const startTopup = useMutation({
    mutationFn: (naira: number) => topupWallet(naira),
    onSuccess: (init) => {
      setSheetOpen(false);
      setAmount('');
      setCheckout(init);
    },
    onError: (mutationError) => setError(getApiErrorMessage(mutationError)),
  });

  const proceed = () => {
    setError(null);
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 100) {
      setError('Enter an amount of at least ₦100.');
      return;
    }
    startTopup.mutate(naira);
  };

  const balance = (user?.balanceKobo ?? 0) / 100;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
          >
            <ChevronLeftIcon size={22} color={Brand.navy} />
          </Pressable>

          <View className="mt-4 gap-2">
            <Text className="text-3xl font-extrabold text-brand-navy">Wallet</Text>
            <Text className="text-base text-gray-500">
              Monitor your balance, fund your account, and track transactions.
            </Text>
          </View>
        </View>

        <View className="mt-6 px-6">
          <LinearGradient
            colors={[Brand.navy, Brand.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24 }}
          >
            <View className="p-6">
              <Text className="text-sm text-white/60">Wallet Balance</Text>
              <View className="mt-1 flex-row items-center gap-3">
                <Text className="text-3xl font-extrabold text-white">
                  {hidden ? '₦••••••' : formatNaira(balance)}
                </Text>
                <Pressable onPress={() => setHidden((value) => !value)} hitSlop={8}>
                  <Text className="text-base text-white/70">{hidden ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  setError(null);
                  setSheetOpen(true);
                }}
                className="mt-6 items-center rounded-full bg-brand-gold py-4 active:opacity-90"
              >
                <Text className="text-base font-bold text-brand-navy">+ Fund wallet</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-8 px-6">
          <Text className="mb-3 text-lg font-bold text-brand-navy">Transactions</Text>
          {txQuery.data && txQuery.data.length > 0 ? (
            <View className="gap-2">
              {txQuery.data.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </View>
          ) : (
            <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-10">
              <Text className="text-4xl">📦</Text>
              <Text className="text-center font-semibold text-gray-700">
                Your transaction history will show here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text className="text-xl font-bold text-brand-navy">Top up wallet</Text>
        <Text className="mt-1 text-sm text-gray-500">How much do you want to add?</Text>

        <View className="mt-4 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={Brand.muted}
            keyboardType="number-pad"
            className="h-14 flex-1 text-base text-gray-900"
          />
          <Text className="text-base font-semibold text-gray-500">₦</Text>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              onPress={() => setAmount(String(value))}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-medium text-gray-700">{formatNaira(value)}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text className="mt-3 text-sm text-red-500">{error}</Text> : null}

        <View className="mt-6">
          <Button label="Proceed" loading={startTopup.isPending} onPress={proceed} />
        </View>
      </BottomSheet>

      <PaystackCheckout
        authorizationUrl={checkout?.authorizationUrl ?? null}
        reference={checkout?.reference ?? null}
        onCancel={() => setCheckout(null)}
        onResult={(result) => {
          setCheckout(null);
          if (result.success && result.balanceKobo != null) {
            updateUser({ balanceKobo: result.balanceKobo });
          }
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }}
      />
    </SafeAreaView>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isTopup = tx.purpose === 'WALLET_TOPUP';
  const amount = formatNaira(tx.amountKobo / 100);
  const stateColor =
    tx.state === 'SUCCESS'
      ? 'text-green-600'
      : tx.state === 'FAILED'
        ? 'text-red-500'
        : 'text-amber-600';

  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-gray-900">
          {isTopup ? 'Wallet top-up' : 'Shipment payment'}
        </Text>
        <Text className={`text-xs ${stateColor}`}>{tx.state.toLowerCase()}</Text>
      </View>
      <Text className={`text-base font-bold ${isTopup ? 'text-green-600' : 'text-brand-navy'}`}>
        {isTopup ? '+' : '-'}
        {amount}
      </Text>
    </View>
  );
}
