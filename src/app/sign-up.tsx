import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { register, type RegisterInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

type IdentifierMethod = 'email' | 'phone';

export default function SignUpScreen() {
  const router = useRouter();
  const startSession = useAuthStore((state) => state.startSession);

  const [fullName, setFullName] = useState('');
  const [method, setMethod] = useState<IdentifierMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const signUp = useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: async (session) => {
      await startSession(session);
      router.replace('/home');
    },
  });

  const handleSubmit = () => {
    const base = { fullName: fullName.trim(), password };
    const input: RegisterInput =
      method === 'email' ? { ...base, email: email.trim() } : { ...base, phoneNumber: phone };
    signUp.mutate(input);
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
              <Text className="text-3xl font-extrabold text-brand-navy">Create your account</Text>
              <Text className="text-base text-gray-500">
                Sign up with your email or phone number.
              </Text>
            </View>

            <View className="mt-8 gap-4">
              <TextField
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ada Lovelace"
                autoCapitalize="words"
                autoComplete="name"
              />

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
                <PhoneInput label="Phone number" value={phone} onChange={setPhone} />
              )}

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
              />

              {signUp.isError ? (
                <Text className="text-sm text-red-500">{getApiErrorMessage(signUp.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button label="Create account" loading={signUp.isPending} onPress={handleSubmit} />
            </View>

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
    </SafeAreaView>
  );
}
