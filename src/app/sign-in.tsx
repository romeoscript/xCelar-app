import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { CourierHeader, HEADER_OVERLAP } from '@/components/auth/courier-header';
import { SocialSignIn } from '@/components/auth/social-sign-in';
import { LockIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DeliveryLoader } from '@/components/ui/delivery-loader';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { login, type AuthSession, type LoginInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { identifierIcon } from '@/lib/identifier';

export default function SignInScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const startSession = useAuthStore((state) => state.startSession);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const reduceMotion = useReducedMotion();
  /** Each block of the form rises in a beat after the one above it. */
  const rise = (step: number) => (reduceMotion ? undefined : FadeInDown.duration(420).delay(120 + step * 70));

  const enter = async (session: AuthSession) => {
    await startSession(session);
    const toRider = session.user.role === 'COURIER' || next === 'rider';
    router.replace(toRider ? '/rider' : '/home');
  };

  const signIn = useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: enter,
  });

  const handleSubmit = () => {
    signIn.mutate({ identifier: identifier.trim(), password });
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          // The header pads itself for the status bar; iOS's automatic inset would push it twice.
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Sign-in is the first screen, so only offer Back when there's somewhere to go. */}
          <CourierHeader onBack={router.canGoBack() ? () => router.back() : undefined} />
          <View className="flex-1 rounded-t-[32px] bg-white px-6 pb-8 pt-7" style={{ marginTop: -HEADER_OVERLAP }}>
            <Animated.View entering={rise(0)} className="gap-2">
              <Text className="text-3xl font-extrabold text-brand-navy">Welcome back</Text>
              <Text className="text-base text-gray-500">
                Sign in with your email or phone number.
              </Text>
            </Animated.View>

            <Animated.View entering={rise(1)} className="mt-7 gap-4">
              <TextField
                label="Email or phone number"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="you@example.com or 0803 000 0000"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                icon={identifierIcon(identifier)}
              />

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                icon={LockIcon}
                secureTextEntry
                autoCapitalize="none"
              />

              {signIn.isError ? (
                <Text className="text-sm text-red-500">{getApiErrorMessage(signIn.error)}</Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={rise(2)} className="mt-7 gap-5">
              <Button label="Sign in" loading={signIn.isPending} onPress={handleSubmit} />
              <SocialSignIn onSession={enter} />
            </Animated.View>

            <Pressable
              onPress={() => router.replace('/sign-up')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-gray-500">New to Xcelar? </Text>
              <Text className="text-base font-semibold text-brand-blue">Create an account</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/rider/activate')}
              hitSlop={8}
              accessibilityRole="link"
              className="mt-4 flex-row justify-center active:opacity-70"
            >
              <Text className="text-sm text-gray-500">Riding for Xcelar? </Text>
              <Text className="text-sm font-semibold text-brand-navy">Activate your account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DeliveryLoader visible={signIn.isPending} label="Signing you in…" />
    </View>
  );
}
