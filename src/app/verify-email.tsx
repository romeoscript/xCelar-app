import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { resendOtp, verifyEmail } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from '@/lib/toast-store';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const email = useAuthStore((state) => state.user?.email);
  const updateUser = useAuthStore((state) => state.updateUser);
  const destination = next === 'rider' ? '/rider' : '/home';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const verify = useMutation({
    mutationFn: (value: string) => verifyEmail(value),
    onSuccess: (user) => {
      updateUser(user);
      toast('Email verified 🎉');
      router.replace(destination);
    },
    onError: (failure) => {
      setError(getApiErrorMessage(failure));
      setCode('');
    },
  });

  const resend = useMutation({
    mutationFn: () => resendOtp(),
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast('A new code is on the way');
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  // Auto-submit once all digits are in. Depend on stable primitives (not the
  // mutation object, which is recreated every render) so this fires only when
  // the code changes — not on every cooldown-timer tick.
  const { mutate: verifyMutate, isPending: verifyPending } = verify;
  useEffect(() => {
    if (code.length === CODE_LENGTH && !verifyPending) {
      verifyMutate(code);
    }
  }, [code, verifyPending, verifyMutate]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 gap-6 px-6 pt-8">
        <View className="gap-2">
          <Text className="text-2xl font-extrabold text-brand-navy">Verify your email</Text>
          <Text className="text-base text-gray-500">
            Enter the 6-digit code we sent to{' '}
            <Text className="font-semibold text-gray-700">{email ?? 'your email'}</Text>.
          </Text>
        </View>

        <Pressable className="flex-row justify-between" onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => {
            const active = code.length === index;
            return (
              <View
                key={index}
                className={`h-14 w-12 items-center justify-center rounded-xl border bg-brand-surface ${
                  active ? 'border-brand-blue' : 'border-gray-200'
                }`}
              >
                <Text className="text-2xl font-bold text-brand-navy">{code[index] ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => {
              setError(null);
              setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
            }}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            className="absolute h-px w-px opacity-0"
          />
        </Pressable>

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <Button
          label="Verify"
          loading={verify.isPending}
          disabled={code.length !== CODE_LENGTH}
          onPress={() => verify.mutate(code)}
        />

        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-sm text-gray-500">Didn’t get the code?</Text>
          <Pressable
            disabled={cooldown > 0 || resend.isPending}
            onPress={() => resend.mutate()}
            hitSlop={8}
          >
            <Text
              className={`text-sm font-semibold ${cooldown > 0 ? 'text-gray-300' : 'text-brand-blue'}`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
            </Text>
          </Pressable>
        </View>

        <Pressable className="items-center" onPress={() => router.replace(destination)} hitSlop={8}>
          <Text className="text-sm text-gray-400">I’ll do this later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
