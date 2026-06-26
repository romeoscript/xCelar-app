import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PhoneField } from '@/components/ui/phone-field';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { login, type LoginInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { toE164 } from '@/lib/phone';

type IdentifierMethod = 'email' | 'phone';

export default function SignInScreen() {
  const router = useRouter();
  const startSession = useAuthStore((state) => state.startSession);

  const [method, setMethod] = useState<IdentifierMethod>('email');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: async (session) => {
      await startSession(session);
      router.replace('/home');
    },
  });

  const handleSubmit = () => {
    const identifier = method === 'email' ? email.trim() : toE164(country, phone);
    signIn.mutate({ identifier, password });
  };

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
              <Text className="text-3xl font-extrabold text-brand-navy">Welcome back</Text>
              <Text className="text-base text-gray-500">
                Sign in with your email or phone number.
              </Text>
            </View>

            <View className="mt-8 gap-4">
              <SegmentedToggle
                options={[
                  { label: 'Email', value: 'email' },
                  { label: 'Phone', value: 'phone' },
                ]}
                value={method}
                onChange={setMethod}
              />

              {method === 'email' ? (
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              ) : (
                <PhoneField
                  label="Phone number"
                  country={country}
                  onSelectCountry={setCountry}
                  value={phone}
                  onChangeText={setPhone}
                />
              )}

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                autoCapitalize="none"
              />

              {signIn.isError ? (
                <Text className="text-sm text-red-500">{getApiErrorMessage(signIn.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button label="Sign in" loading={signIn.isPending} onPress={handleSubmit} />
            </View>

            <Pressable
              onPress={() => router.replace('/sign-up')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-gray-500">New to Xcelar? </Text>
              <Text className="text-base font-semibold text-brand-blue">Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
