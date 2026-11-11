import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { CourierHeader, HEADER_OVERLAP } from '@/components/auth/courier-header';
import { SocialSignIn } from '@/components/auth/social-sign-in';
import { LockIcon, UserIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DeliveryLoader } from '@/components/ui/delivery-loader';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { register, type AuthSession, type RegisterInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { identifierIcon, isEmailIdentifier } from '@/lib/identifier';

export default function SignUpScreen() {
  const router = useRouter();
  const startSession = useAuthStore((state) => state.startSession);
  const reduceMotion = useReducedMotion();
  /** Each block of the form rises in a beat after the one above it. */
  const rise = (step: number) => (reduceMotion ? undefined : FadeInDown.duration(420).delay(120 + step * 70));

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const enter = async (session: AuthSession) => {
    await startSession(session);
    // Email signups must verify with the code we just emailed them; Google and
    // Apple accounts arrive already verified.
    router.replace(session.user.email && !session.user.emailVerified ? '/verify-email' : '/home');
  };

  const signUp = useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: enter,
  });

  const handleSubmit = () => {
    const base = { fullName: fullName.trim(), password };
    const value = identifier.trim();
    const input: RegisterInput = isEmailIdentifier(value) ? { ...base, email: value } : { ...base, phoneNumber: value };
    signUp.mutate(input);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          // The header pads itself for the status bar; iOS's automatic inset would push it twice.
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Sign-up is often opened in place of sign-in, so Back falls back to sign-in. */}
          <CourierHeader onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} />
          <View className="flex-1 rounded-t-[32px] bg-white px-6 pt-7" style={{ marginTop: -HEADER_OVERLAP }}>
            <Animated.View entering={rise(0)} className="gap-1.5">
              <Text className="text-3xl font-extrabold text-brand-navy">Create your account</Text>
              <Text className="text-base text-gray-500">It takes less than a minute.</Text>
            </Animated.View>

            <Animated.View entering={rise(1)} className="mt-7 gap-4">
              <TextField
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ada Okafor"
                autoCapitalize="words"
                autoComplete="name"
                icon={UserIcon}
              />

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
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                icon={LockIcon}
              />

              {signUp.isError ? (
                <Text className="text-sm text-red-500">{getApiErrorMessage(signUp.error)}</Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={rise(2)} className="mt-7 gap-5">
              <Button label="Create account" loading={signUp.isPending} onPress={handleSubmit} />
              <SocialSignIn onSession={enter} />
            </Animated.View>

            <Pressable
              onPress={() => router.replace('/sign-in')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-gray-500">Already have an account? </Text>
              <Text className="text-base font-semibold text-brand-blue">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DeliveryLoader visible={signUp.isPending} label="Creating your account…" />
    </View>
  );
}
