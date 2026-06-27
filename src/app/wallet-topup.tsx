import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { runPaystackCheckout } from '@/lib/checkout';
import { formatNaira } from '@/lib/format';
import { topupWallet } from '@/lib/wallet-api';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export default function WalletTopupScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const topup = useMutation({
    mutationFn: async (naira: number) => {
      const init = await topupWallet(naira);
      return runPaystackCheckout(init.authorizationUrl, init.reference);
    },
    onSuccess: (result) => {
      if (result.success) {
        if (result.balanceKobo != null) {
          updateUser({ balanceKobo: result.balanceKobo });
        }
        setDone(true);
      } else {
        setError('Payment was not completed. If you were charged, it will reflect shortly.');
      }
    },
    onError: (mutationError) => setError(getApiErrorMessage(mutationError)),
  });

  const submit = () => {
    setError(null);
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 100) {
      setError('Enter an amount of at least ₦100.');
      return;
    }
    topup.mutate(naira);
  };

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-blue-tint">
            <Text className="text-4xl">✅</Text>
          </View>
          <Text className="text-2xl font-extrabold text-brand-navy">Wallet topped up</Text>
          <Text className="text-base text-gray-500">
            New balance: {formatNaira((user?.balanceKobo ?? 0) / 100)}
          </Text>
        </View>
        <View className="pb-6">
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pb-8 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
            >
              <ChevronLeftIcon size={22} color={Brand.navy} />
            </Pressable>

            <View className="mt-6 gap-2">
              <Text className="text-3xl font-extrabold text-brand-navy">Top up wallet</Text>
              <Text className="text-base text-gray-500">
                Current balance: {formatNaira((user?.balanceKobo ?? 0) / 100)}
              </Text>
            </View>

            <View className="mt-8 gap-4">
              <TextField
                label="Amount (₦)"
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 5000"
                keyboardType="number-pad"
              />

              <View className="flex-row flex-wrap gap-2">
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

              {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
            </View>

            <View className="mt-8">
              <Button
                label="Continue to payment"
                loading={topup.isPending}
                onPress={submit}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
